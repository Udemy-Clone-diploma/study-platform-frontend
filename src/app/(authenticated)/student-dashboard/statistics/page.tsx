"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { getAssignedHomework } from "@/entities/homework";
import type { HomeworkAssignment } from "@/entities/homework";
import { getEnrolledCourses, getStudentCompletions } from "@/entities/course";
import type { CourseCompletion, EnrolledCourseListItem } from "@/entities/course";
import { Dropdown, GrowthCard } from "@/widgets/dashboard/GrowthCard";
import { PageShell } from "@/shared/ui/PageShell";

const ALL_COURSES = "__all__";

function courseOptionsFrom(items: HomeworkAssignment[]) {
  const map = new Map<string, string>();
  items.forEach((a) => map.set(a.course_slug, a.course_title));
  return [
    { value: ALL_COURSES, label: "All courses" },
    ...Array.from(map.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([value, label]) => ({ value, label })),
  ];
}

function countsFor(items: HomeworkAssignment[], courseFilter: string) {
  const filtered =
    courseFilter === ALL_COURSES ? items : items.filter((a) => a.course_slug === courseFilter);
  const done = filtered.filter((a) => a.my_submission != null).length;
  return { total: filtered.length, done };
}

/**
 * Student's cross-course statistics: homework/test completion counters,
 * average-score trend (reuses the dashboard's GrowthCard), and progress
 * lists for active vs. completed courses.
 */
export default function StudentStatisticsPage() {
  const [assignments, setAssignments] = useState<HomeworkAssignment[]>([]);
  const [activeCourses, setActiveCourses] = useState<EnrolledCourseListItem[]>([]);
  const [completions, setCompletions] = useState<CourseCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [hwCourseFilter, setHwCourseFilter] = useState(ALL_COURSES);
  const [testCourseFilter, setTestCourseFilter] = useState(ALL_COURSES);
  const [progressCourseFilter, setProgressCourseFilter] = useState(ALL_COURSES);

  useEffect(() => {
    Promise.all([
      getAssignedHomework(),
      getEnrolledCourses(),
      getStudentCompletions({ page_size: 100 }),
    ])
      .then(([homework, enrolled, completed]) => {
        setAssignments(homework);
        const completedCourseIds = new Set(
          completed.results.map((c) => c.course).filter((id): id is number => id != null),
        );
        setActiveCourses(enrolled.results.filter((c) => !completedCourseIds.has(c.id)));
        setCompletions(completed.results);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const homeworkOnly = useMemo(() => assignments.filter((a) => !a.test_detail), [assignments]);
  const testsOnly = useMemo(() => assignments.filter((a) => !!a.test_detail), [assignments]);

  const hwOptions = useMemo(() => courseOptionsFrom(homeworkOnly), [homeworkOnly]);
  const testOptions = useMemo(() => courseOptionsFrom(testsOnly), [testsOnly]);

  const hwCounts = countsFor(homeworkOnly, hwCourseFilter);
  const testCounts = countsFor(testsOnly, testCourseFilter);

  const certificatesCount = completions.filter((c) => c.certificate_url).length;

  const progressOptions = useMemo(() => {
    const map = new Map<string, string>();
    activeCourses.forEach((c) => map.set(c.slug, c.title));
    completions.forEach((c) => {
      if (c.slug) map.set(c.slug, c.title);
    });
    return [
      { value: ALL_COURSES, label: "All courses" },
      ...Array.from(map.entries())
        .sort((a, b) => a[1].localeCompare(b[1]))
        .map(([value, label]) => ({ value, label })),
    ];
  }, [activeCourses, completions]);

  const overallProgress = useMemo(() => {
    if (progressCourseFilter === ALL_COURSES) {
      const totalCourseCount = activeCourses.length + completions.length;
      if (totalCourseCount === 0) return 0;
      return Math.round(
        (activeCourses.reduce((sum, c) => sum + (c.progress_percent ?? 0), 0) +
          completions.length * 100) /
          totalCourseCount,
      );
    }
    const activeMatch = activeCourses.find((c) => c.slug === progressCourseFilter);
    if (activeMatch) return Math.round(activeMatch.progress_percent ?? 0);
    const isCompleted = completions.some((c) => c.slug === progressCourseFilter);
    return isCompleted ? 100 : 0;
  }, [progressCourseFilter, activeCourses, completions]);

  return (
    <PageShell className="bg-wishlist">
      <div style={{ maxWidth: "1648px", margin: "0 auto" }}>
        <h1 className="mb-6 text-[28px] leading-none font-normal text-(--color-text-primary)">
          Statistics
        </h1>

        {loading ? (
          <p className="text-center text-lg text-(--color-text-secondary)">Loading...</p>
        ) : (
          <div style={{ position: "relative" }}>
            {/* Decorative crystals -- anchored to this content block (not the
                full page), so they scale/reposition with the actual card
                layout instead of drifting to the bottom of the viewport. */}
            <Image
              src="/backgrounds/cube.svg"
              alt=""
              aria-hidden="true"
              width={499}
              height={505}
              className="pointer-events-none absolute hidden select-none lg:block"
              style={{
                left: "clamp(-80px, -4vw, -20px)",
                bottom: "clamp(-120px, -11vw, -60px)",
                width: "clamp(280px, 26vw, 500px)",
                height: "auto",
                transform: "rotate(-29.44deg)",
                zIndex: 1,
              }}
            />
            <Image
              src="/backgrounds/crystal.svg"
              alt=""
              aria-hidden="true"
              width={696}
              height={702}
              className="pointer-events-none absolute hidden select-none lg:block"
              style={{
                right: "clamp(-70px, -1vw, 10px)",
                bottom: "clamp(-160px, -14vw, -100px)",
                width: "clamp(300px, 28vw, 560px)",
                height: "auto",
                transform: "rotate(31.1deg)",
                zIndex: 1,
              }}
            />

            <div
              className="grid"
              style={{
                position: "relative",
                zIndex: 3,
                gridTemplateColumns: "minmax(360px, 1fr) minmax(320px, 1fr)",
                gap: "clamp(12px, 1.11vw, 20px)",
                alignItems: "start",
              }}
            >
              {/* Left: 2x2 stat blocks, with the average-score chart below them */}
              <div className="flex flex-col" style={{ gap: "clamp(12px, 1.11vw, 20px)" }}>
                <div className="grid grid-cols-2" style={{ gap: "clamp(12px, 1.11vw, 20px)" }}>
                  <StatCard
                    title="Homeworks done"
                    value={hwCounts.done}
                    total={hwCounts.total}
                    courseFilter={hwCourseFilter}
                    courseOptions={hwOptions}
                    onCourseChange={setHwCourseFilter}
                  />
                  <StatCard
                    title="Tests done"
                    value={testCounts.done}
                    total={testCounts.total}
                    courseFilter={testCourseFilter}
                    courseOptions={testOptions}
                    onCourseChange={setTestCourseFilter}
                  />
                  <StatCard
                    title="Certificates earned"
                    value={certificatesCount}
                    total={completions.length}
                  />
                  <StatCard
                    title="Overall progress"
                    value={`${overallProgress}%`}
                    courseFilter={progressCourseFilter}
                    courseOptions={progressOptions}
                    onCourseChange={setProgressCourseFilter}
                  />
                </div>

                <GrowthCard metric="score" chartHeightClassName="h-[180px]" />
              </div>

              {/* Right: Active / Completed course lists, stacked */}
              <div className="flex flex-col" style={{ gap: "clamp(12px, 1.11vw, 20px)" }}>
                <CourseListPanel
                  title="Active courses"
                  count={activeCourses.length}
                  emptyText="No active courses."
                >
                  {activeCourses.map((course) => {
                    const percent = course.progress_percent ?? 0;
                    const hoursTotal = course.duration_hours ?? 0;
                    const hoursDone = Math.round((percent / 100) * hoursTotal * 10) / 10;
                    return (
                      <CourseRow
                        key={course.id}
                        title={course.title}
                        imageSrc={course.image}
                        progressPercent={percent}
                        hoursDone={hoursDone}
                        hoursTotal={hoursTotal}
                      />
                    );
                  })}
                </CourseListPanel>

                <CourseListPanel
                  title="Completed courses"
                  count={completions.length}
                  subtitle={
                    completions.length > 0 ? `${certificatesCount} with certificate` : undefined
                  }
                  emptyText="No completed courses yet."
                >
                  {completions.map((completion) => (
                    <CourseRow
                      key={completion.id}
                      title={completion.title}
                      imageSrc={completion.image_url}
                      progressPercent={100}
                      hoursDone={completion.duration_hours ?? 0}
                      hoursTotal={completion.duration_hours ?? 0}
                    />
                  ))}
                </CourseListPanel>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}

function StatCard({
  title,
  value,
  total,
  courseFilter,
  courseOptions,
  onCourseChange,
}: {
  title: string;
  value: number | string;
  total?: number;
  courseFilter?: string;
  courseOptions?: { value: string; label: string }[];
  onCourseChange?: (value: string) => void;
}) {
  return (
    <div
      className="flex flex-col rounded-2xl bg-(--color-bg-surface) p-5"
      style={{ boxShadow: "var(--shadow-dashboard-card)", gap: "clamp(12px, 1.11vw, 20px)" }}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className="min-w-0 truncate font-(family-name:--font-base) text-(--color-text-primary)"
          style={{ fontSize: "clamp(14px, 1.11vw, 20px)" }}
        >
          {title}
        </span>
        {courseOptions && onCourseChange && courseFilter !== undefined && (
          <Dropdown value={courseFilter} options={courseOptions} onChange={onCourseChange} />
        )}
      </div>
      <div
        className="flex items-baseline gap-2 rounded-lg"
        style={{
          background:
            "linear-gradient(90deg, rgba(167, 186, 250, 0.32) 0%, rgba(167, 186, 250, 0) 100%)",
          padding: "clamp(8px, 0.83vw, 12px)",
        }}
      >
        <span
          className="font-(family-name:--font-base) font-medium text-(--color-blue)"
          style={{ fontSize: "clamp(24px, 2.33vw, 32px)" }}
        >
          {value}
        </span>
        {total != null && (
          <span
            className="font-(family-name:--font-base) text-(--color-text-secondary)"
            style={{ fontSize: "clamp(13px, 1vw, 16px)" }}
          >
            / {total}
          </span>
        )}
      </div>
    </div>
  );
}

function CourseListPanel({
  title,
  count,
  subtitle,
  emptyText,
  children,
}: {
  title: string;
  count: number;
  subtitle?: string;
  emptyText: string;
  children: React.ReactNode;
}) {
  const hasItems = Array.isArray(children) ? children.length > 0 : !!children;
  return (
    <div
      className="flex flex-col rounded-2xl bg-(--color-bg-surface) p-5"
      style={{
        boxShadow: "var(--shadow-dashboard-card)",
        gap: "clamp(12px, 1.11vw, 16px)",
        height: "clamp(240px, 22vw, 300px)",
      }}
    >
      <div className="flex shrink-0 items-center justify-between gap-2">
        <span
          className="flex items-center gap-2 font-(family-name:--font-base) text-(--color-text-primary)"
          style={{ fontSize: "clamp(14px, 1.11vw, 20px)" }}
        >
          {title}
          <span
            className="inline-flex items-center justify-center rounded-full font-(family-name:--font-base) font-semibold text-(--color-blue)"
            style={{
              background: "rgba(167, 186, 250, 0.32)",
              minWidth: "1.6em",
              height: "1.6em",
              padding: "0 6px",
              fontSize: "clamp(11px, 0.83vw, 13px)",
            }}
          >
            {count}
          </span>
        </span>
        {subtitle && (
          <span
            className="font-(family-name:--font-base) text-(--color-text-secondary)"
            style={{ fontSize: "clamp(11px, 0.83vw, 13px)" }}
          >
            {subtitle}
          </span>
        )}
      </div>
      <div
        className="flex min-h-0 flex-1 flex-col overflow-y-auto"
        style={{ gap: "clamp(8px, 0.69vw, 12px)" }}
      >
        {hasItems ? (
          children
        ) : (
          <p
            className="font-(family-name:--font-base) text-(--color-text-secondary)"
            style={{ fontSize: "clamp(12px, 0.83vw, 14px)" }}
          >
            {emptyText}
          </p>
        )}
      </div>
    </div>
  );
}

function CourseRow({
  title,
  imageSrc,
  progressPercent,
  hoursDone,
  hoursTotal,
}: {
  title: string;
  imageSrc?: string | null;
  progressPercent: number;
  hoursDone: number;
  hoursTotal: number;
}) {
  return (
    <div
      className="flex items-center rounded-xl bg-white"
      style={{
        boxShadow: "var(--shadow-card)",
        padding: "clamp(8px, 0.69vw, 12px)",
        gap: "clamp(10px, 0.83vw, 16px)",
      }}
    >
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt=""
          width={48}
          height={48}
          unoptimized
          className="h-12 w-12 shrink-0 rounded-md object-cover"
        />
      ) : (
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-[#fff3dc] to-[#ffe7ef]">
          <Image src="/icons/curses.svg" alt="" width={26} height={26} className="h-6 w-6" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p
          className="truncate font-(family-name:--font-base) font-medium text-(--color-text-primary)"
          style={{ fontSize: "clamp(13px, 1vw, 16px)" }}
        >
          {title}
        </p>
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-(--color-brand-lavender)">
          <div
            className="h-full rounded-full bg-(--color-blue)"
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
          />
        </div>
      </div>
      <span
        className="shrink-0 whitespace-nowrap font-(family-name:--font-base) text-(--color-text-secondary)"
        style={{ fontSize: "clamp(11px, 0.73vw, 13px)" }}
      >
        {hoursDone}h / {hoursTotal}h
      </span>
    </div>
  );
}
