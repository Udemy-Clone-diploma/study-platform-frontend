"use client";

import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import { Check, ChevronDown, PartyPopper, TriangleAlert } from "lucide-react";
import type { ApiError } from "@/shared/api/base";
import { GradientButton } from "@/shared/ui/GradientButton";
import type { CourseDetail, CourseProgress } from "@/entities/course";
import { byOrder, completeCourse, useCompletionRedirect, useCourseProgress } from "@/entities/course";
import { CompleteCourseReviewModal } from "@/features/courses";
import { LearnPageDecor } from "./LearnPageDecor";
import { LearnTabs } from "./LearnTabs";

type Props = {
  course: CourseDetail;
  initialProgress?: CourseProgress | null;
  /** Dev-mock course: progress comes from localStorage instead of the API. */
  isMock?: boolean;
};

/** Nearest scrollable ancestor (the app-shell content scroller), falling back to the document. */
function getScrollParent(node: HTMLElement | null): HTMLElement {
  let el = node?.parentElement ?? null;
  while (el) {
    const overflowY = getComputedStyle(el).overflowY;
    if (overflowY === "auto" || overflowY === "scroll") return el;
    el = el.parentElement;
  }
  return document.scrollingElement instanceof HTMLElement
    ? document.scrollingElement
    : document.documentElement;
}

/**
 * Progress tab of the lesson player. Hero shows the completion donut, score bar
 * and certificate/ratings cards; a down arrow scrolls to the per-module list.
 */
export function CourseProgressView({ course, initialProgress = null, isMock = false }: Props) {
  const router = useRouter();
  const { progress, error } = useCourseProgress(course.slug, initialProgress, isMock);
  const detailRef = useRef<HTMLDivElement>(null);
  const [completing, setCompleting] = useState(false);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);

  useCompletionRedirect(progress?.is_course_completed);

  async function finishCompletion() {
    setShowReviewPrompt(false);
    setCompleting(true);
    setCompletionError(null);
    try {
      await completeCourse(course.slug);
      router.replace("/student-dashboard/courses");
    } catch (err) {
      const apiError = err as Partial<ApiError>;
      setCompletionError(apiError.message ?? "Could not complete the course.");
      setCompleting(false);
    }
  }

  // Scope vertical scroll-snap to this view: the hero fills the screen and a
  // scroll past it lands on the lesson-completion section. The app shell scrolls
  // an inner element (not the document), so snap on the nearest scroll parent.
  useEffect(() => {
    const scroller = getScrollParent(detailRef.current);
    const previous = scroller.style.scrollSnapType;
    scroller.style.scrollSnapType = "y proximity";
    return () => {
      scroller.style.scrollSnapType = previous;
    };
  }, []);

  const sortedModules = byOrder(course.modules);
  const completed = new Set(progress?.completed_lesson_ids ?? []);
  const total = Math.max(1, progress?.lessons_count ?? course.lessons_count);
  const completedCount = progress?.lessons_completed_count ?? 0;
  const lessonsTotal = progress?.lessons_count ?? course.lessons_count;
  const percent = progress ? Math.round((completedCount * 100) / total) : 0;
  const passingScore = course.passing_score;

  // overflow-clip (not overflow-hidden) clips the decor without becoming a scroll
  // container, so the document stays the scroll-snap container.
  return (
    <section className="relative isolate overflow-clip bg-white">
      <LearnPageDecor />

      <div className="relative z-10 flex w-full flex-col gap-10 px-5 py-6 lg:gap-14 lg:px-12 lg:py-12 xl:px-[90px]">
        {/* Hero fills the first screen; scrolling past it snaps to lesson completion. */}
        <div className="flex min-h-[calc(100dvh-76px-3rem)] flex-col gap-10 lg:min-h-[calc(100dvh-76px-6rem)] lg:gap-14">
          <LearnTabs slug={course.slug} active="progress" />

          <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,630px)] xl:gap-[50px] min-[1920px]:grid-cols-[minmax(0,980px)_minmax(0,1fr)]">
            <div className="flex max-w-[980px] flex-col gap-10">
              <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                <div className="flex max-w-[680px] flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <h1 className="font-(family-name:--font-base) text-3xl leading-tight text-(--color-text-primary) lg:text-5xl">
                      Your Progress
                    </h1>
                    <p className="font-(family-name:--font-base) text-2xl text-(--color-text-secondary) lg:text-[2rem]">
                      Course completion
                    </p>
                  </div>
                  <p className="font-(family-name:--font-base) text-base leading-snug text-(--color-text-primary) lg:text-2xl">
                    This shows how much of the course content you have completed. Please note that
                    some materials may not have been published yet.
                  </p>
                </div>
                <ProgressDonut percent={percent} />
              </div>

              <ScoreBar percent={percent} passing={passingScore} />
              {error && (
                <p role="status" className="text-(--color-pink-dark)">
                  {error}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-6">
              <CertificateCard passing={passingScore} />
              <TestsStatsCard
                average={progress?.test_average ?? null}
                passed={progress?.tests_passed ?? 0}
                failed={progress?.tests_failed ?? 0}
                skipped={progress?.tests_skipped ?? 0}
                total={progress?.tests_total ?? 0}
              />
              {progress?.is_with_teacher && (
                <HomeworkStatsCard
                  average={progress?.homework_average ?? null}
                  graded={progress?.homework_graded ?? 0}
                  ungraded={progress?.homework_ungraded ?? 0}
                  total={progress?.homework_total ?? 0}
                />
              )}
            </div>
          </div>

          {progress?.can_complete_course ? (
            <CompleteCourseCta
              loading={completing}
              error={completionError}
              onComplete={() => setShowReviewPrompt(true)}
            />
          ) : progress?.is_with_teacher ? (
            <TeacherCompletionAlert />
          ) : (
            <PassingAlert passing={passingScore} />
          )}

          {showReviewPrompt && (
            <CompleteCourseReviewModal slug={course.slug} onDone={finishCompletion} />
          )}

          <div className="mt-auto flex justify-center">
            <button
              type="button"
              onClick={() =>
                detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
              className="group flex flex-col items-center gap-1 rounded-2xl px-6 py-3 font-(family-name:--font-accent) text-sm uppercase text-(--color-text-primary) transition-colors hover:bg-(--color-brand-lavender)/20"
            >
              See lesson completion
              <ChevronDown
                aria-hidden="true"
                className="h-6 w-6 transition-transform group-hover:animate-bounce"
              />
            </button>
          </div>
        </div>

        <div ref={detailRef} className="flex scroll-mt-24 snap-start flex-col gap-6">
          <header className="flex flex-col gap-1">
            <h2 className="font-(family-name:--font-base) text-2xl font-semibold text-(--color-text-primary) lg:text-3xl">
              Lesson completion
            </h2>
            <p className="font-(family-name:--font-base) text-base text-(--color-text-secondary)">
              {completedCount} of {lessonsTotal} lessons completed ({percent}%)
            </p>
          </header>

          {sortedModules.map((mod) => {
            const lessons = byOrder(mod.lessons);
            const doneInModule = lessons.filter((l) => completed.has(l.id)).length;
            return (
              <article
                key={mod.id}
                className="flex flex-col gap-3 rounded-2xl border border-(--color-border-light) bg-white p-5"
              >
                <header className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center justify-center rounded-[20px] bg-(--color-brand-lavender-soft) px-3 py-0.5 font-(family-name:--font-base) font-semibold text-(--color-blue)">
                    Module {mod.order}
                  </span>
                  <h3 className="text-xl font-semibold text-(--color-text-primary)">{mod.title}</h3>
                  <span className="ml-auto text-sm text-(--color-text-secondary)">
                    {doneInModule} / {lessons.length} done
                  </span>
                </header>
                <ul className="flex flex-col gap-1">
                  {lessons.map((l) => {
                    const isDone = completed.has(l.id);
                    return (
                      <li key={l.id}>
                        <Link
                          href={`/learn/${course.slug}/${l.id}`}
                          className="group flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md px-2 py-1 hover:bg-(--color-brand-lavender)/15"
                        >
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                              isDone
                                ? "border-(--color-blue) bg-(--color-blue) text-white"
                                : "border-(--color-text-secondary) bg-white text-transparent"
                            }`}
                            aria-hidden="true"
                          >
                            <Check className="h-3 w-3" />
                          </span>
                          <span className="text-(--color-text-primary) group-hover:underline">
                            Lesson {l.order}: {l.title}
                          </span>
                          {l.is_mandatory && (
                            <span className="flex-shrink-0 rounded-full bg-(--color-brand-yellow) px-3 py-0.5 font-(family-name:--font-accent) text-xs uppercase text-(--color-text-primary)">
                              Mandatory
                            </span>
                          )}
                          {isDone && <span className="sr-only">Completed</span>}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/** Completion donut: gray track + blue arc, "{percent}% compiled" centered. */
function ProgressDonut({ percent }: { percent: number }) {
  const radius = 88;
  const circumference = 2 * Math.PI * radius;
  const filled = (percent / 100) * circumference;
  return (
    <div
      className="relative h-[200px] w-[200px] shrink-0 self-center"
      role="img"
      aria-label={`${percent}% of the course completed`}
    >
      <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
        <circle
          cx={100}
          cy={100}
          r={radius}
          fill="none"
          stroke="var(--color-placeholder)"
          strokeWidth={20}
        />
        <circle
          cx={100}
          cy={100}
          r={radius}
          fill="none"
          stroke="var(--color-blue)"
          strokeWidth={20}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference - filled}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-(--color-text-primary)">
        <span className="font-(family-name:--font-accent) text-5xl leading-none">{percent}%</span>
        <span className="font-(family-name:--font-base) text-base lg:text-xl">compiled</span>
      </div>
    </div>
  );
}

/** 980px score bar: yellow current-score marker (lesson-completion %), black passing-score marker, and a passing-threshold tick inside the bar. */
function ScoreBar({ percent, passing }: { percent: number; passing: number }) {
  return (
    <div className="relative w-full max-w-[980px] py-16">
      <div className="relative w-full">
        {/* Current-score marker above the bar: label on top, pill pointing down at the bar. */}
        <div
          className="absolute bottom-full mb-2 flex -translate-x-1/2 flex-col items-center"
          style={{ left: `${percent}%` }}
        >
          <span className="whitespace-nowrap font-(family-name:--font-base) text-base text-(--color-text-primary)">
            Your current score
          </span>
          <span className="relative mt-2 rounded-md bg-(--color-brand-yellow) px-3 py-1 font-(family-name:--font-accent) text-2xl text-(--color-text-primary)">
            {percent}%
            <span
              aria-hidden="true"
              className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-(--color-brand-yellow)"
            />
          </span>
        </div>

        <div className="relative h-1.5 w-full rounded-full bg-(--color-brand-lavender-soft)">
          <div
            className="h-full rounded-full bg-(--color-blue) transition-[width]"
            style={{ width: `${percent}%` }}
          />
          {/* Passing-score threshold tick. */}
          <span
            aria-hidden="true"
            className="absolute top-1/2 h-3 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-(--color-text-primary)"
            style={{ left: `${passing}%` }}
          />
        </div>

        {/* Passing-score marker below the bar: pill pointing up at the bar, label underneath. */}
        <div
          className="absolute top-full mt-2 flex -translate-x-1/2 flex-col items-center"
          style={{ left: `${passing}%` }}
        >
          <span className="relative rounded-md bg-(--color-text-primary) px-3 py-1 font-(family-name:--font-accent) text-2xl text-white">
            <span
              aria-hidden="true"
              className="absolute bottom-full left-1/2 h-2 w-2 -translate-x-1/2 translate-y-1/2 rotate-45 bg-(--color-text-primary)"
            />
            {passing}%
          </span>
          <span className="mt-2 whitespace-nowrap font-(family-name:--font-base) text-base text-(--color-text-primary)">
            Passing score
          </span>
        </div>
      </div>
    </div>
  );
}

/** Glass alert shown for group/individual enrollments: completion is the teacher's call, not a self-service action. */
function TeacherCompletionAlert() {
  return (
    <div className="mx-auto flex w-fit items-center gap-2 rounded-[20px] bg-(--color-white-20) px-6 py-4 shadow-[inset_0_2px_4px_0_var(--color-white-85)] backdrop-blur-sm">
      <TriangleAlert aria-hidden="true" className="h-6 w-6 shrink-0 text-(--color-text-primary)" />
      <p className="font-(family-name:--font-base) text-base uppercase text-(--color-text-primary)">
        Your teacher will mark this course as completed
      </p>
    </div>
  );
}

/** Glass "passing grade required" alert. */
function PassingAlert({ passing }: { passing: number }) {
  return (
    <div className="mx-auto flex w-fit items-center gap-2 rounded-[20px] bg-(--color-white-20) px-6 py-4 shadow-[inset_0_2px_4px_0_var(--color-white-85)] backdrop-blur-sm">
      <TriangleAlert aria-hidden="true" className="h-6 w-6 shrink-0 text-(--color-text-primary)" />
      <p className="font-(family-name:--font-base) text-base uppercase text-(--color-text-primary)">
        A passing grade of {passing}% and all mandatory lessons completed are required to
        complete this course
      </p>
    </div>
  );
}

/** Glass alert shown once the passing score is reached and all mandatory lessons are done. */
function CompleteCourseCta({
  loading,
  error,
  onComplete,
}: {
  loading: boolean;
  error: string | null;
  onComplete: () => void;
}) {
  return (
    <div className="mx-auto flex w-fit flex-col items-center gap-3 rounded-[20px] bg-(--color-white-20) px-6 py-4 shadow-[inset_0_2px_4px_0_var(--color-white-85)] backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <PartyPopper aria-hidden="true" className="h-6 w-6 shrink-0 text-(--color-text-primary)" />
        <p className="font-(family-name:--font-base) text-base uppercase text-(--color-text-primary)">
          You have met this course&apos;s completion requirements
        </p>
      </div>
      <GradientButton type="button" onClick={onComplete} disabled={loading}>
        {loading ? "Completing…" : "Complete course"}
      </GradientButton>
      {error && (
        <p role="status" className="text-sm text-(--color-pink-dark)">
          {error}
        </p>
      )}
    </div>
  );
}

/** White "Certificate status" card with a lavender glow. */
function CertificateCard({ passing }: { passing: number }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-[20px] bg-white p-8 text-center shadow-[0_0_11px_var(--color-brand-lavender)] lg:p-10">
      <h2 className="font-(family-name:--font-base) text-2xl font-medium text-(--color-text-primary) lg:text-4xl">
        Certificate status
      </h2>
      <p className="font-(family-name:--font-base) text-base text-(--color-text-primary)">
        To receive a certificate for this course, you must achieve a passing grade of {passing}%
        and complete all mandatory lessons
      </p>
    </div>
  );
}

type StatsRowProps = {
  average: number | null;
  /** "percent" for tests (e.g. "72%"); "raw" for homework, on its own grading scale (e.g. "4.3"). */
  averageFormat: "percent" | "raw";
  stats: { label: string; value: number }[];
};

/** Shared "average + counts" body used by the tests and homework cards. */
function StatsRow({ average, averageFormat, stats }: StatsRowProps) {
  const averageLabel =
    average == null ? "—" : averageFormat === "percent" ? `${average}%` : average.toFixed(1);
  return (
    <>
      <p className="font-(family-name:--font-base) text-base text-(--color-text-primary) lg:text-2xl">
        Average score: {averageLabel}
      </p>
      <ul className="flex flex-wrap gap-x-6 gap-y-1">
        {stats.map((s) => (
          <li
            key={s.label}
            className="font-(family-name:--font-base) text-sm text-(--color-text-primary)"
          >
            {s.label}: {s.value}
          </li>
        ))}
      </ul>
    </>
  );
}

/** Pink "Tests" card. Informational only — doesn't affect course completion. */
function TestsStatsCard({
  average,
  passed,
  failed,
  skipped,
  total,
}: {
  average: number | null;
  passed: number;
  failed: number;
  skipped: number;
  total: number;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-[20px] bg-(--color-brand-pink) p-5">
      <h2 className="font-(family-name:--font-base) text-2xl text-(--color-text-primary) lg:text-4xl">
        Tests
      </h2>
      {total === 0 ? (
        <p className="font-(family-name:--font-base) text-base text-(--color-text-primary) lg:text-2xl">
          This course has no tests yet.
        </p>
      ) : (
        <StatsRow
          average={average}
          averageFormat="percent"
          stats={[
            { label: "Passed", value: passed },
            { label: "Failed", value: failed },
            { label: "Not taken", value: skipped },
            { label: "Total", value: total },
          ]}
        />
      )}
    </div>
  );
}

/** Lavender "Homework" card — shown only for courses taught with a teacher. Informational only. */
function HomeworkStatsCard({
  average,
  graded,
  ungraded,
  total,
}: {
  average: number | null;
  graded: number;
  ungraded: number;
  total: number;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-[20px] bg-(--color-brand-lavender-soft) p-5">
      <h2 className="font-(family-name:--font-base) text-2xl text-(--color-text-primary) lg:text-4xl">
        Homework
      </h2>
      {total === 0 ? (
        <p className="font-(family-name:--font-base) text-base text-(--color-text-primary) lg:text-2xl">
          No homework assigned yet.
        </p>
      ) : (
        <StatsRow
          average={average}
          averageFormat="raw"
          stats={[
            { label: "Graded", value: graded },
            { label: "Not graded", value: ungraded },
            { label: "Total", value: total },
          ]}
        />
      )}
    </div>
  );
}
