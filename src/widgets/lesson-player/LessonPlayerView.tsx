"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import { CalendarDays, Check, ChevronLeft, ChevronRight, Download, Video } from "lucide-react";
import {
  byOrder,
  getCourseBySlug,
  getCourseProgress,
  getLesson,
  getLessonSessions,
  markLessonComplete,
  readMockProgress,
  recordLessonOpened,
  recordMockOpen,
  toggleMockLessonComplete,
  unmarkLessonComplete,
} from "@/entities/course";
import type {
  CourseDetail,
  CourseLesson,
  CourseProgress,
  LessonDocument,
  LessonItem,
  LessonSession,
} from "@/entities/course";
import type { ApiError } from "@/shared/api/base";
import { GradientButton } from "@/shared/ui/GradientButton";
import { QuizPlayer } from "@/features/quiz";
import { CourseDescription } from "@/widgets/course-detail/CourseDescription";
import { LearnPageDecor } from "./LearnPageDecor";
import { LearnTabs } from "./LearnTabs";
import { LessonBreadcrumb } from "./LessonBreadcrumb";
import { buildLessonTabs, LessonContentTabs, type LessonTab } from "./LessonContentTabs";
import { LessonNotesPanel } from "./LessonNotesPanel";

type Props = {
  slug: string;
  lessonId: number;
  /** Optional pre-fetched payloads (used by the dev-mock route). */
  initialCourse?: CourseDetail;
  initialLesson?: CourseLesson;
  initialProgress?: CourseProgress | null;
  /** Dev-mock course: progress is persisted to localStorage instead of the API. */
  isMock?: boolean;
};

/**
 * Lesson viewer at `/learn/<slug>/<lessonId>`. Top panel: a Course/Progress
 * switch, a breadcrumb, prev/next lesson steppers and a content-part tab strip
 * (Video / Reading). Body: the active part beside a per-lesson notes panel,
 * a completion checkbox and a "Next lesson" CTA, then the live-session link.
 */
export function LessonPlayerView({
  slug,
  lessonId,
  initialCourse,
  initialLesson,
  initialProgress = null,
  isMock = false,
}: Props) {
  const t = useTranslations("LessonPlayer");
  const tContentTabs = useTranslations("LessonContentTabs");
  const router = useRouter();
  const [course, setCourse] = useState<CourseDetail | null>(initialCourse ?? null);
  const [lesson, setLesson] = useState<CourseLesson | null>(initialLesson ?? null);
  const [progress, setProgress] = useState<CourseProgress | null>(initialProgress);
  const [sessions, setSessions] = useState<LessonSession[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!(initialCourse && initialLesson));
  // The page's actual scroll container is an ancestor `overflow-y-auto` div in
  // AppShell, not the window — scrollIntoView on this root finds it regardless.
  const contentRef = useRef<HTMLElement>(null);

  // Load course + lesson (+ progress + scheduled sessions for real courses).
  // Mock routes pass course/lesson/progress in; sessions are not mocked.
  useEffect(() => {
    if (initialCourse && initialLesson) {
      setCourse(initialCourse);
      setLesson(initialLesson);
      setSessions([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const [courseRes, lessonRes, progressRes, sessionsRes] = await Promise.all([
          getCourseBySlug(slug),
          getLesson(slug, lessonId),
          getCourseProgress(slug).catch((err: Partial<ApiError>) => {
            if (err.status === 403 || err.status === 401) return null;
            throw err;
          }),
          getLessonSessions(slug, lessonId).catch(() => []),
        ]);
        if (cancelled) return;
        // Learn is done once the course is completed — send the student back to
        // My Courses, where the completed card (with the certificate) now lives.
        if (progressRes?.is_course_completed) {
          router.replace("/student-dashboard/courses");
          return;
        }
        setCourse(courseRes);
        setLesson(lessonRes);
        setProgress(progressRes);
        setSessions(sessionsRes);
      } catch (err) {
        if (cancelled) return;
        const apiError = err as Partial<ApiError>;
        if (apiError.status === 404 || apiError.status === 403) {
          router.replace(`/courses/${slug}`);
          return;
        }
        setError(apiError.message ?? t("errorLoadLesson"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug, lessonId, router, initialCourse, initialLesson, t]);

  // Record "last opened" so the resume CTA points here. Mock seeds from storage.
  useEffect(() => {
    if (isMock) {
      setProgress((p) => {
        const base = readMockProgress(slug, p ?? initialProgress);
        return base ? recordMockOpen(slug, lessonId, base) : base;
      });
      return;
    }
    recordLessonOpened(slug, lessonId).catch(() => {
      /* fire-and-forget: a failed open-record must not block playback */
    });
  }, [slug, lessonId, isMock, initialProgress]);

  const isCompleted = progress?.completed_lesson_ids.includes(lessonId) ?? false;
  const [completeError, setCompleteError] = useState<string | null>(null);
  useEffect(() => {
    setCompleteError(null);
  }, [lessonId]);

  const handleToggleComplete = () => {
    if (!progress) return;
    setCompleteError(null);

    // Dev-mock course: persist locally; there is no backend to call.
    if (isMock) {
      setProgress(toggleMockLessonComplete(slug, lessonId, progress));
      return;
    }

    const optimistic: CourseProgress = isCompleted
      ? {
          ...progress,
          completed_lesson_ids: progress.completed_lesson_ids.filter((id) => id !== lessonId),
          lessons_completed_count: Math.max(0, progress.lessons_completed_count - 1),
        }
      : {
          ...progress,
          completed_lesson_ids: [...progress.completed_lesson_ids, lessonId].sort((a, b) => a - b),
          lessons_completed_count: progress.lessons_completed_count + 1,
        };
    const previous = progress;
    setProgress(optimistic);

    const fn = isCompleted ? unmarkLessonComplete : markLessonComplete;
    fn(slug, lessonId)
      .then((result) =>
        setProgress((p) =>
          p ? { ...p, lessons_completed_count: result.lessons_completed_count } : p,
        ),
      )
      .catch((err: Partial<ApiError>) => {
        setProgress(previous);
        setCompleteError(err.message ?? t("errorUpdateCompletion"));
      });
  };

  const flatLessons = useMemo(() => {
    if (!course) return [];
    return byOrder(course.modules).flatMap((m) => byOrder(m.lessons));
  }, [course]);

  const currentModule = useMemo(
    () => course?.modules.find((m) => m.lessons.some((l) => l.id === lessonId)) ?? null,
    [course, lessonId],
  );

  const currentIndex = flatLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? flatLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex >= 0 && currentIndex < flatLessons.length - 1
      ? flatLessons[currentIndex + 1]
      : null;

  // One tab per renderable content block (video / reading / test), in order.
  const tabs = useMemo(
    () =>
      buildLessonTabs(lesson?.items ?? [], {
        video: tContentTabs("video"),
        text: tContentTabs("reading"),
        test: tContentTabs("test"),
      }),
    [lesson, tContentTabs],
  );

  // User's tab choice; reset on lesson change so each lesson opens at its first block.
  const [selectedTabId, setSelectedTabId] = useState<number | null>(null);
  useEffect(() => {
    setSelectedTabId(null);
  }, [lessonId]);

  const activeTab: LessonTab | null = tabs.find((t) => t.id === selectedTabId) ?? tabs[0] ?? null;
  const activeIndex = activeTab ? tabs.findIndex((t) => t.id === activeTab.id) : -1;
  const isLastTab = activeIndex >= 0 && activeIndex === tabs.length - 1;
  // The block after the active one, if any: drives the "Go to {next}" advance CTA.
  const nextTab = activeIndex >= 0 && activeIndex < tabs.length - 1 ? tabs[activeIndex + 1] : null;
  const activeItem = lesson?.items?.find((i) => i.id === activeTab?.id) ?? null;

  if (loading) {
    return (
      <p role="status" className="p-8 text-center text-lg text-(--color-text-secondary)">
        {t("loadingLesson")}
      </p>
    );
  }
  if (error) {
    return (
      <p role="status" className="p-8 text-center text-lg text-(--color-pink-dark)">
        {error}
      </p>
    );
  }
  if (!course || !lesson) {
    return null;
  }

  const activeTest = activeItem?.item_type === "test" && activeItem.test ? activeItem.test : null;

  return (
    <section
      ref={contentRef}
      className="relative isolate min-h-[calc(100vh-76px)] overflow-hidden bg-white"
    >
      <LearnPageDecor showPlanet={false} />

      <div className="relative z-10 flex w-full flex-col gap-6 px-5 py-6 lg:gap-8 lg:px-12 lg:py-10 xl:px-[90px]">
        <LearnTabs slug={slug} active="course" />

        <div className="relative z-20 flex items-center gap-4">
          <LessonNavLink
            href={prevLesson ? `/learn/${slug}/${prevLesson.id}` : undefined}
            direction="prev"
          />
          <div className="min-w-0 flex-1">
            <LessonBreadcrumb
              slug={slug}
              courseTitle={course.title}
              modules={course.modules}
              currentModule={currentModule}
              currentLessonId={lessonId}
              lessonOrder={lesson.order}
              lessonTitle={lesson.title}
              completedLessonIds={progress?.completed_lesson_ids ?? []}
            />
          </div>
          <LessonNavLink
            href={nextLesson ? `/learn/${slug}/${nextLesson.id}` : undefined}
            direction="next"
          />
        </div>

        {activeTab && (
          <div className="flex justify-center">
            <LessonContentTabs tabs={tabs} activeId={activeTab.id} onSelect={setSelectedTabId} />
          </div>
        )}

        {/* Title + content + notes share one centered column so the title's left
            edge aligns with the video / reading content below it. */}
        <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-6">
          <h1 className="font-(family-name:--font-base) text-[2rem] font-medium leading-normal text-(--color-text-primary)">
            {lesson.title}
          </h1>

          {activeItem?.item_type !== "test" ? (
            <>
              <div className="grid gap-5 lg:grid-cols-[minmax(0,820px)_minmax(320px,400px)] lg:items-stretch">
                <div className="min-w-0">
                  <LessonContent item={activeItem} />
                </div>
                <LessonNotesPanel
                  key={lessonId}
                  slug={slug}
                  lessonId={lessonId}
                  isMock={isMock}
                  courseTitle={course.title}
                  courseLevel={course.level}
                  lessonTitle={lesson.title}
                  lessonOrder={lesson.order}
                />
              </div>

              <div className="flex max-w-[820px] flex-col gap-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  {/* Completion is a single lesson-level state, so the checkbox lives only
                      on the last content tab; earlier tabs advance to the next one instead. */}
                  {nextTab ? (
                    <GradientButton onClick={() => setSelectedTabId(nextTab.id)}>
                      {t("goTo", { label: nextTab.label })}
                    </GradientButton>
                  ) : (
                    <CompleteCheckbox
                      checked={isCompleted}
                      disabled={!progress}
                      label={t("markAsComplete")}
                      onToggle={handleToggleComplete}
                    />
                  )}
                  {nextLesson && isLastTab && (
                    <GradientButton href={`/learn/${slug}/${nextLesson.id}`}>
                      {t("nextLesson")}
                    </GradientButton>
                  )}
                </div>

                {completeError && (
                  <p role="alert" className="text-sm text-(--color-pink-dark)">
                    {completeError}
                  </p>
                )}

                {sessions.length > 0 && <LessonSessionsList sessions={sessions} />}

                {lesson.documents && lesson.documents.length > 0 && (
                  <LessonDocuments documents={lesson.documents} />
                )}
              </div>
            </>
          ) : activeTest ? (
            <QuizPlayer
              slug={slug}
              test={activeTest}
              isMock={isMock}
              onPassed={() => {
                if (!isCompleted) handleToggleComplete();
              }}
              nextLessonHref={isLastTab && nextLesson ? `/learn/${slug}/${nextLesson.id}` : undefined}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}

/** "Previous" / "Next" lesson stepper; renders muted and inert at the course ends. */
function LessonNavLink({ href, direction }: { href?: string; direction: "prev" | "next" }) {
  const t = useTranslations("LessonPlayer");
  const isPrev = direction === "prev";
  const content = (
    <>
      {isPrev && <ChevronLeft className="h-5 w-5" aria-hidden="true" />}
      {isPrev ? t("previous") : t("next")}
      {!isPrev && <ChevronRight className="h-5 w-5" aria-hidden="true" />}
    </>
  );
  const base =
    "inline-flex shrink-0 items-center gap-1 font-(family-name:--font-base) text-base font-medium";

  if (!href) {
    return (
      <span aria-disabled="true" className={`${base} cursor-not-allowed text-(--color-text-muted)`}>
        {content}
      </span>
    );
  }
  return (
    <Link href={href} className={`${base} text-(--color-text-primary) transition hover:opacity-70`}>
      {content}
    </Link>
  );
}

/** Renders the active content block: a video, a reading body, or a test summary. */
function LessonContent({ item }: { item: LessonItem | null }) {
  const t = useTranslations("LessonPlayer");
  if (item?.item_type === "video" && item.video_url) {
    return (
      <div className="overflow-hidden rounded-2xl bg-black">
        <video controls src={item.video_url} className="aspect-video w-full" preload="metadata" />
      </div>
    );
  }
  if (item?.item_type === "text" && item.body_html) {
    return <CourseDescription html={item.body_html} />;
  }
  return <p className="text-(--color-text-secondary)">{t("noContentYet")}</p>;
}

/** Custom checkbox that toggles lesson completion. */
function CompleteCheckbox({
  checked,
  disabled,
  label,
  onToggle,
}: {
  checked: boolean;
  disabled: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={onToggle}
      className="inline-flex items-center gap-3 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span
        aria-hidden="true"
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[2px] border transition-colors ${
          checked
            ? "border-(--color-blue) bg-(--color-catalog-category-active) text-(--color-blue)"
            : "border-(--color-text-secondary) bg-white text-transparent"
        }`}
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
      <span className="font-(family-name:--font-base) text-base text-(--color-text-primary)">
        {label}
      </span>
    </button>
  );
}

/** Live sessions the teacher has scheduled for this lesson (via the calendar). */
function LessonSessionsList({ sessions }: { sessions: LessonSession[] }) {
  const t = useTranslations("LessonPlayer");
  return (
    <div className="flex flex-col gap-4 border-t border-(--color-text-primary)/10 pt-6">
      <h2 className="font-(family-name:--font-base) text-lg font-semibold text-(--color-text-primary)">
        {t("liveSessions")}
      </h2>
      <ul className="flex flex-col gap-3">
        {sessions.map((session) => (
          <li key={session.id}>
            <LessonSessionCard session={session} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function LessonSessionCard({ session }: { session: LessonSession }) {
  const t = useTranslations("LessonPlayer");
  const locale = useLocale();
  const date = new Date(`${session.date}T00:00:00`);
  const dateLabel = date.toLocaleDateString(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const now = new Date();
  const todayISO = now.toISOString().slice(0, 10);
  const nowHM = now.toTimeString().slice(0, 5);
  const isPast = session.date < todayISO || (session.date === todayISO && session.end_time <= nowHM);

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-(--color-brand-lavender-soft) px-5 py-4 ${
        isPast ? "opacity-50 grayscale" : ""
      }`}
    >
      <div className="flex items-center gap-2 font-(family-name:--font-base) text-base text-(--color-text-primary)">
        <CalendarDays className="h-5 w-5 shrink-0" aria-hidden="true" />
        <span>
          {dateLabel}, {session.start_time}–{session.end_time}
        </span>
      </div>
      {session.meeting_link ? (
        <a
          href={session.meeting_link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-fit items-center gap-2 rounded-full px-5 py-2.5 font-(family-name:--font-accent) text-sm font-medium uppercase text-(--color-text-primary) transition hover:opacity-90"
          style={{ background: "var(--gradient-brand)" }}
        >
          <Video className="h-4 w-4" aria-hidden="true" />
          {t("joinLiveSession")}
        </a>
      ) : (
        <span className="text-sm text-(--color-text-secondary)">{t("meetingLinkNotShared")}</span>
      )}
    </div>
  );
}

/** "Materials" download list for a lesson's attached documents. */
function LessonDocuments({ documents }: { documents: LessonDocument[] }) {
  const t = useTranslations("LessonPlayer");
  return (
    <div className="flex flex-col gap-3 border-t border-(--color-text-primary)/10 pt-6">
      <h2 className="font-(family-name:--font-base) text-lg font-semibold text-(--color-text-primary)">
        {t("materials")}
      </h2>
      <ul className="flex flex-col gap-2">
        {documents.map((doc) => (
          <li key={doc.id}>
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="group inline-flex items-center gap-2 font-(family-name:--font-base) text-base text-(--color-text-primary) transition-colors hover:text-(--color-blue)"
            >
              <Download className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="group-hover:underline">{doc.original_name}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
