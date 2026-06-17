"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Check, ChevronDown, TriangleAlert } from "lucide-react";
import type { CourseDetail, CourseProgress } from "@/entities/course";
import { byOrder, useCourseProgress } from "@/entities/course";
import { LearnPageDecor } from "./LearnPageDecor";
import { LearnTabs } from "./LearnTabs";

type Props = {
  course: CourseDetail;
  initialProgress?: CourseProgress | null;
  /** Dev-mock course: progress comes from localStorage instead of the API. */
  isMock?: boolean;
};

/** Required passing grade. Hardcoded until the backend exposes it (see BACKEND_CHANGES.md). */
const PASSING_SCORE = 80;

/**
 * Progress tab of the lesson player. Hero shows the completion donut, score bar
 * and certificate/ratings cards; a down arrow scrolls to the per-module list.
 * Only the completion percentage is live data; the rest is placeholder copy.
 */
export function CourseProgressView({ course, initialProgress = null, isMock = false }: Props) {
  const { progress, error } = useCourseProgress(course.slug, initialProgress, isMock);
  const detailRef = useRef<HTMLDivElement>(null);

  // Scope vertical scroll-snap to this view: the hero fills the screen and a
  // scroll past it lands on the lesson-completion section. Restored on unmount.
  useEffect(() => {
    const html = document.documentElement;
    const previous = html.style.scrollSnapType;
    html.style.scrollSnapType = "y proximity";
    return () => {
      html.style.scrollSnapType = previous;
    };
  }, []);

  const sortedModules = byOrder(course.modules);
  const completed = new Set(progress?.completed_lesson_ids ?? []);
  const total = Math.max(1, progress?.lessons_count ?? course.lessons_count);
  const completedCount = progress?.lessons_completed_count ?? 0;
  const lessonsTotal = progress?.lessons_count ?? course.lessons_count;
  const percent = progress ? Math.round((completedCount * 100) / total) : 0;

  // overflow-clip (not overflow-hidden) clips the decor without becoming a scroll
  // container, so the document stays the scroll-snap container.
  return (
    <section className="relative isolate overflow-clip bg-white">
      <LearnPageDecor />

      <div className="relative z-10 flex w-full flex-col gap-10 px-5 py-6 lg:gap-14 lg:px-12 lg:py-12 xl:px-[90px]">
        {/* Hero fills the first screen; scrolling past it snaps to lesson completion. */}
        <div className="flex min-h-[calc(100dvh-124px)] flex-col gap-10 lg:gap-14">
          <LearnTabs slug={course.slug} active="progress" />

          <div className="grid max-w-[1660px] gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,630px)] xl:gap-[50px]">
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

              <ScoreBar percent={percent} passing={PASSING_SCORE} />
              {error && (
                <p role="status" className="text-(--color-pink-dark)">
                  {error}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-6">
              <CertificateCard />
              <RatingsCard />
            </div>
          </div>

          <PassingAlert passing={PASSING_SCORE} />

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
                          className="group flex items-center gap-3 rounded-md px-2 py-1 hover:bg-(--color-brand-lavender)/15"
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

/** 980px score bar with a yellow current-score marker and a black passing-score marker. */
function ScoreBar({ percent, passing }: { percent: number; passing: number }) {
  return (
    <div className="relative w-full max-w-[980px] py-16">
      <div className="relative w-full">
        <div
          className="absolute bottom-full mb-2 flex -translate-x-1/2 flex-col items-center"
          style={{ left: `${percent}%` }}
        >
          <span className="relative rounded-md bg-(--color-brand-yellow) px-3 py-1 font-(family-name:--font-accent) text-2xl text-(--color-text-primary)">
            {percent}%
            <span
              aria-hidden="true"
              className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-(--color-brand-yellow)"
            />
          </span>
          <span className="mt-2 whitespace-nowrap font-(family-name:--font-base) text-base text-(--color-text-primary)">
            Your current score
          </span>
        </div>

        <div className="h-1.5 w-full rounded-full bg-(--color-brand-lavender-soft)">
          <div
            className="h-full rounded-full bg-(--color-blue) transition-[width]"
            style={{ width: `${percent}%` }}
          />
        </div>

        <div
          className="absolute top-full mt-2 flex -translate-x-1/2 flex-col items-center"
          style={{ left: `${passing}%` }}
        >
          <span className="whitespace-nowrap font-(family-name:--font-base) text-base text-(--color-text-primary)">
            Passing score
          </span>
          <span className="relative mt-1 rounded-md bg-(--color-text-primary) px-3 py-1 font-(family-name:--font-accent) text-2xl text-white">
            <span
              aria-hidden="true"
              className="absolute bottom-full left-1/2 h-2 w-2 -translate-x-1/2 translate-y-1/2 rotate-45 bg-(--color-text-primary)"
            />
            {passing}%
          </span>
        </div>
      </div>
    </div>
  );
}

/** Glass "passing grade required" alert. */
function PassingAlert({ passing }: { passing: number }) {
  return (
    <div className="mx-auto flex w-fit items-center gap-2 rounded-[20px] bg-(--color-white-20) px-6 py-4 shadow-[inset_0_2px_4px_0_var(--color-white-85)] backdrop-blur-sm">
      <TriangleAlert aria-hidden="true" className="h-6 w-6 shrink-0 text-(--color-text-primary)" />
      <p className="font-(family-name:--font-base) text-base uppercase text-(--color-text-primary)">
        A passing grade of {passing}% is required to complete this course
      </p>
    </div>
  );
}

/** White "Certificate status" card with a lavender glow. */
function CertificateCard() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-[20px] bg-white p-8 text-center shadow-[0_0_11px_var(--color-brand-lavender)] lg:p-10">
      <h2 className="font-(family-name:--font-base) text-2xl font-medium text-(--color-text-primary) lg:text-4xl">
        Certificate status
      </h2>
      <p className="font-(family-name:--font-base) text-base text-(--color-text-primary)">
        To receive a certificate for this course, you must achieve a passing grade
      </p>
    </div>
  );
}

/** Pink "Ratings" card. */
function RatingsCard() {
  return (
    <div className="flex flex-col gap-2 rounded-[20px] bg-(--color-brand-pink) p-5">
      <h2 className="font-(family-name:--font-base) text-2xl text-(--color-text-primary) lg:text-4xl">
        Ratings
      </h2>
      <p className="font-(family-name:--font-base) text-base text-(--color-text-primary) lg:text-2xl">
        This corresponds to your weighted average grade compared to the grade required to pass this
        course.
      </p>
    </div>
  );
}
