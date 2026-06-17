"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Download } from "lucide-react";
import {
  byOrder,
  getCourseBySlug,
  getCourseProgress,
  getLesson,
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
} from "@/entities/course";
import type { ApiError } from "@/shared/api/base";
import { GradientButton } from "@/shared/ui/GradientButton";
import { CourseDescription } from "@/widgets/course-detail/CourseDescription";
import { LearnPageDecor } from "./LearnPageDecor";
import { LearnTabs } from "./LearnTabs";
import { LessonBreadcrumb } from "./LessonBreadcrumb";
import { LessonContentTabs, PART_LABELS, type LessonContentPart } from "./LessonContentTabs";
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
  const router = useRouter();
  const [course, setCourse] = useState<CourseDetail | null>(initialCourse ?? null);
  const [lesson, setLesson] = useState<CourseLesson | null>(initialLesson ?? null);
  const [progress, setProgress] = useState<CourseProgress | null>(initialProgress);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!(initialCourse && initialLesson));

  // Load course + lesson (+ progress for real courses). Mock routes pass them in.
  useEffect(() => {
    if (initialCourse && initialLesson) {
      setCourse(initialCourse);
      setLesson(initialLesson);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const [courseRes, lessonRes, progressRes] = await Promise.all([
          getCourseBySlug(slug),
          getLesson(slug, lessonId),
          getCourseProgress(slug).catch((err: Partial<ApiError>) => {
            if (err.status === 403 || err.status === 401) return null;
            throw err;
          }),
        ]);
        if (cancelled) return;
        setCourse(courseRes);
        setLesson(lessonRes);
        setProgress(progressRes);
      } catch (err) {
        if (cancelled) return;
        const apiError = err as Partial<ApiError>;
        if (apiError.status === 404 || apiError.status === 403) {
          router.replace(`/courses/${slug}`);
          return;
        }
        setError(apiError.message ?? "Could not load this lesson.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug, lessonId, router, initialCourse, initialLesson]);

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

  const handleToggleComplete = () => {
    if (!progress) return;

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
      .catch(() => setProgress(previous));
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

  // Lesson content blocks split into the player's two tabs. A lesson may carry
  // several blocks (text/video/test); all videos group under "Video", all text
  // under "Reading". Test blocks are not surfaced yet.
  const videoItems = useMemo<LessonItem[]>(
    () => byOrder((lesson?.items ?? []).filter((i) => i.item_type === "video" && !!i.video_url)),
    [lesson],
  );
  const textItems = useMemo<LessonItem[]>(
    () =>
      byOrder(
        (lesson?.items ?? []).filter((i) => i.item_type === "text" && !!(i.body_html ?? i.content)),
      ),
    [lesson],
  );
  const parts = useMemo<LessonContentPart[]>(() => {
    const p: LessonContentPart[] = [];
    if (videoItems.length) p.push("video");
    if (textItems.length) p.push("reading");
    return p;
  }, [videoItems, textItems]);

  // The tab of the first content block in order; drives the default open tab.
  const firstContentPart = useMemo<LessonContentPart | null>(() => {
    for (const item of byOrder(lesson?.items ?? [])) {
      if (item.item_type === "video" && item.video_url) return "video";
      if (item.item_type === "text" && (item.body_html ?? item.content)) return "reading";
    }
    return null;
  }, [lesson]);

  // User's tab choice; reset on lesson change so each lesson opens at its default.
  const [selectedPart, setSelectedPart] = useState<LessonContentPart | null>(null);
  useEffect(() => {
    setSelectedPart(null);
  }, [lessonId]);

  const defaultPart: LessonContentPart | null =
    parts.length === 0 ? null : (firstContentPart ?? parts[0]);
  const activePart = selectedPart && parts.includes(selectedPart) ? selectedPart : defaultPart;
  const isLastPart = activePart != null && parts[parts.length - 1] === activePart;
  // The part after the active one, if any: drives the "Go to {next}" advance CTA.
  const activeIndex = activePart ? parts.indexOf(activePart) : -1;
  const nextPart =
    activeIndex >= 0 && activeIndex < parts.length - 1 ? parts[activeIndex + 1] : null;

  if (loading) {
    return (
      <p role="status" className="p-8 text-center text-lg text-(--color-text-secondary)">
        Loading lesson...
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

  return (
    <section className="relative isolate min-h-full overflow-hidden bg-white">
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

        {activePart && (
          <div className="flex justify-center">
            <LessonContentTabs parts={parts} active={activePart} onSelect={setSelectedPart} />
          </div>
        )}

        {/* Title + content + notes share one centered column so the title's left
            edge aligns with the video / reading content below it. */}
        <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-6">
          <h1 className="font-(family-name:--font-base) text-[2rem] font-medium leading-normal text-(--color-text-primary)">
            {lesson.title}
          </h1>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,820px)_minmax(320px,400px)] lg:items-stretch">
            <div className="min-w-0">
              <LessonContent part={activePart} videoItems={videoItems} textItems={textItems} />
            </div>
            <LessonNotesPanel key={lessonId} slug={slug} lessonId={lessonId} />
          </div>

          <div className="flex max-w-[820px] flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Completion is a single lesson-level state, so the checkbox lives only
                  on the last content tab; earlier tabs advance to the next one instead. */}
              {nextPart ? (
                <GradientButton onClick={() => setSelectedPart(nextPart)}>
                  Go to {PART_LABELS[nextPart]}
                </GradientButton>
              ) : (
                <CompleteCheckbox
                  checked={isCompleted}
                  disabled={!progress}
                  label="Mark as complete"
                  onToggle={handleToggleComplete}
                />
              )}
              {nextLesson && isLastPart && (
                <GradientButton href={`/learn/${slug}/${nextLesson.id}`}>
                  Next lesson
                </GradientButton>
              )}
            </div>

            {lesson.documents && lesson.documents.length > 0 && (
              <LessonDocuments documents={lesson.documents} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/** "Previous" / "Next" lesson stepper; renders muted and inert at the course ends. */
function LessonNavLink({ href, direction }: { href?: string; direction: "prev" | "next" }) {
  const isPrev = direction === "prev";
  const content = (
    <>
      {isPrev && <ChevronLeft className="h-5 w-5" aria-hidden="true" />}
      {isPrev ? "Previous" : "Next"}
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

/** Renders the active content part: the lesson's video block(s) or reading block(s). */
function LessonContent({
  part,
  videoItems,
  textItems,
}: {
  part: LessonContentPart | null;
  videoItems: LessonItem[];
  textItems: LessonItem[];
}) {
  if (part === "video" && videoItems.length > 0) {
    return (
      <div className="flex flex-col gap-5">
        {videoItems.map((item) => (
          <div key={item.id} className="overflow-hidden rounded-2xl bg-black">
            <video
              controls
              src={item.video_url ?? undefined}
              className="aspect-video w-full"
              preload="metadata"
            />
          </div>
        ))}
      </div>
    );
  }
  if (part === "reading" && textItems.length > 0) {
    return (
      <div className="flex flex-col gap-6">
        {textItems.map((item) => (
          <CourseDescription key={item.id} html={item.body_html ?? item.content ?? ""} />
        ))}
      </div>
    );
  }
  return <p className="text-(--color-text-secondary)">No content available for this lesson yet.</p>;
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

/** "Materials" download list for a lesson's attached documents. */
function LessonDocuments({ documents }: { documents: LessonDocument[] }) {
  return (
    <div className="flex flex-col gap-3 border-t border-(--color-text-primary)/10 pt-6">
      <h2 className="font-(family-name:--font-base) text-lg font-semibold text-(--color-text-primary)">
        Materials
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
