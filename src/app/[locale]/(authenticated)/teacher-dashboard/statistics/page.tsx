"use client";

import Image from "next/image";
import { Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getTeacherCourses, getCourseEnrolledStudents } from "@/entities/course";
import type { CourseListItem } from "@/entities/course";
import { getTeacherOrders } from "@/entities/payment";
import type { TeacherOrderRow, TeacherOrderStatus } from "@/entities/payment";
import { Dropdown, GrowthCard } from "@/widgets/dashboard/GrowthCard";
import { StudentAvatar } from "@/shared/ui/StudentAvatar";
import { PageShell } from "@/shared/ui/PageShell";

const ALL_COURSES = "__all__";

function amountsLabel(rows: { amount: string; currency: string }[]): string {
  const byCurrency = new Map<string, number>();
  rows.forEach((r) => byCurrency.set(r.currency, (byCurrency.get(r.currency) ?? 0) + Number(r.amount)));
  if (byCurrency.size === 0) return "0";
  return Array.from(byCurrency.entries()).map(([currency, amount]) => `${amount.toFixed(0)} ${currency}`).join(" + ");
}

/**
 * Teacher's cross-course statistics: course/student/rating/revenue counters
 * (each individually filterable by course), new-enrollment trend (reuses the
 * dashboard's GrowthCard), a top-courses leaderboard, and a recent-payments feed.
 */
export default function TeacherStatisticsPage() {
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [studentsByCourse, setStudentsByCourse] = useState<Record<string, number>>({});
  const [totalStudents, setTotalStudents] = useState(0);
  const [orders, setOrders] = useState<TeacherOrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [studentsCourseFilter, setStudentsCourseFilter] = useState(ALL_COURSES);
  const [ratingCourseFilter, setRatingCourseFilter] = useState(ALL_COURSES);
  const [revenueCourseFilter, setRevenueCourseFilter] = useState(ALL_COURSES);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const coursesPromise = getTeacherCourses()
      .then(async (res) => {
        if (cancelled) return;
        setCourses(res.results);
        // No dedicated "distinct students across all courses" endpoint, so this
        // mirrors the same per-course fetch + dedupe the dashboard widget uses.
        const perCourse = await Promise.all(
          res.results.map((c) => getCourseEnrolledStudents(c.slug).catch(() => [])),
        );
        if (!cancelled) {
          setTotalStudents(new Set(perCourse.flat().map((s) => s.student_id)).size);
          setStudentsByCourse(
            Object.fromEntries(res.results.map((c, i) => [c.slug, perCourse[i].length])),
          );
        }
      })
      .catch(() => {});

    const ordersPromise = getTeacherOrders({})
      .then((res) => { if (!cancelled) setOrders(res.results); })
      .catch(() => {});

    Promise.all([coursesPromise, ordersPromise]).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const courseOptions = useMemo(() => [
    { value: ALL_COURSES, label: "All courses" },
    ...courses.map((c) => ({ value: c.slug, label: c.title })),
  ], [courses]);

  const publishedCount = useMemo(() => courses.filter((c) => c.status === "published").length, [courses]);

  const studentsValue =
    studentsCourseFilter === ALL_COURSES ? totalStudents : studentsByCourse[studentsCourseFilter] ?? 0;

  const averageRating = useMemo(() => {
    if (ratingCourseFilter !== ALL_COURSES) {
      const course = courses.find((c) => c.slug === ratingCourseFilter);
      return course && course.rating_count > 0 ? Number(course.rating_avg).toFixed(1) : null;
    }
    const rated = courses.filter((c) => c.rating_count > 0);
    if (rated.length === 0) return null;
    return (rated.reduce((sum, c) => sum + Number(c.rating_avg), 0) / rated.length).toFixed(1);
  }, [courses, ratingCourseFilter]);

  const revenueLabel = useMemo(() => {
    const paid = orders.filter((o) => o.status === "paid");
    const scoped = revenueCourseFilter === ALL_COURSES ? paid : paid.filter((o) => o.course_slug === revenueCourseFilter);
    return amountsLabel(scoped);
  }, [orders, revenueCourseFilter]);

  // Backend already orders these -created_at.
  const recentPayments = useMemo(() => orders.slice(0, 6), [orders]);
  const topCourses = useMemo(
    () => [...courses].sort((a, b) => b.students_count - a.students_count).slice(0, 6),
    [courses],
  );

  return (
    <PageShell className="bg-my-courses">
      <div style={{ maxWidth: "1648px", margin: "0 auto" }}>
        <h1 className="mb-6 text-[28px] leading-none font-normal text-(--color-text-primary)">Statistics</h1>

        {loading ? (
          <p className="text-center text-lg text-(--color-text-secondary)">Loading...</p>
        ) : (
          <div style={{ position: "relative" }}>
            <Image
              src="/backgrounds/cube.svg"
              alt=""
              aria-hidden="true"
              width={499}
              height={505}
              className="pointer-events-none absolute hidden select-none lg:block"
              style={{ left: "clamp(-80px, -4vw, -20px)", bottom: "clamp(-120px, -11vw, -60px)", width: "clamp(280px, 26vw, 500px)", height: "auto", transform: "rotate(-29.44deg)", zIndex: 1 }}
            />
            <Image
              src="/backgrounds/crystal.svg"
              alt=""
              aria-hidden="true"
              width={696}
              height={702}
              className="pointer-events-none absolute hidden select-none lg:block"
              style={{ right: "clamp(-70px, -1vw, 10px)", bottom: "clamp(-160px, -14vw, -100px)", width: "clamp(300px, 28vw, 560px)", height: "auto", transform: "rotate(31.1deg)", zIndex: 1 }}
            />

            <div className="grid" style={{ position: "relative", zIndex: 3, gridTemplateColumns: "minmax(360px, 1fr) minmax(320px, 1fr)", gap: "clamp(12px, 1.11vw, 20px)", alignItems: "start" }}>
              {/* Left: 2x2 stat blocks, with the enrollment-growth chart below them */}
              <div className="flex flex-col" style={{ gap: "clamp(12px, 1.11vw, 20px)" }}>
                <div className="grid grid-cols-2" style={{ gap: "clamp(12px, 1.11vw, 20px)" }}>
                  <StatCard title="Total courses" value={courses.length} caption={`${publishedCount} published`} />
                  <StatCard
                    title="Total students"
                    value={studentsValue}
                    courseFilter={studentsCourseFilter}
                    courseOptions={courseOptions}
                    onCourseChange={setStudentsCourseFilter}
                  />
                  <StatCard
                    title="Average rating"
                    value={averageRating ?? "—"}
                    caption={averageRating ? "/ 5" : undefined}
                    courseFilter={ratingCourseFilter}
                    courseOptions={courseOptions}
                    onCourseChange={setRatingCourseFilter}
                  />
                  <StatCard
                    title="Revenue"
                    value={revenueLabel}
                    courseFilter={revenueCourseFilter}
                    courseOptions={courseOptions}
                    onCourseChange={setRevenueCourseFilter}
                  />
                </div>

                <GrowthCard metric="enrollments" chartHeightClassName="h-[180px]" />
              </div>

              {/* Right: Top courses / Recent payments, stacked */}
              <div className="flex flex-col" style={{ gap: "clamp(12px, 1.11vw, 20px)" }}>
                <ListPanel title="Top courses" emptyText="No courses yet.">
                  {topCourses.map((course) => (
                    <CoursePerformanceRow key={course.id} course={course} />
                  ))}
                </ListPanel>

                <ListPanel title="Recent payments" emptyText="No payments yet.">
                  {recentPayments.map((row) => (
                    <PaymentRow key={`${row.order_id}-${row.course_slug}`} row={row} />
                  ))}
                </ListPanel>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}

function StatCard({ title, value, caption, courseFilter, courseOptions, onCourseChange }: {
  title: string;
  value: number | string;
  caption?: string;
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
        <span className="min-w-0 truncate font-(family-name:--font-base) text-(--color-text-primary)" style={{ fontSize: "clamp(14px, 1.11vw, 20px)" }}>
          {title}
        </span>
        {courseOptions && onCourseChange && courseFilter !== undefined && (
          <Dropdown value={courseFilter} options={courseOptions} onChange={onCourseChange} />
        )}
      </div>
      <div
        className="flex items-baseline gap-2 rounded-lg"
        style={{ background: "linear-gradient(90deg, rgba(167, 186, 250, 0.32) 0%, rgba(167, 186, 250, 0) 100%)", padding: "clamp(8px, 0.83vw, 12px)" }}
      >
        <span className="font-(family-name:--font-base) font-medium text-(--color-blue)" style={{ fontSize: "clamp(24px, 2.33vw, 32px)" }}>
          {value}
        </span>
        {caption && (
          <span className="font-(family-name:--font-base) text-(--color-text-secondary)" style={{ fontSize: "clamp(13px, 1vw, 16px)" }}>
            {caption}
          </span>
        )}
      </div>
    </div>
  );
}

function ListPanel({ title, children, emptyText }: {
  title: string;
  emptyText: string;
  children: React.ReactNode;
}) {
  const hasItems = Array.isArray(children) ? children.length > 0 : !!children;
  return (
    <div
      className="flex flex-col rounded-2xl bg-(--color-bg-surface) p-5"
      style={{ boxShadow: "var(--shadow-dashboard-card)", gap: "clamp(12px, 1.11vw, 16px)", height: "clamp(240px, 22vw, 300px)" }}
    >
      <div className="flex shrink-0 items-center gap-2">
        <span className="font-(family-name:--font-base) text-(--color-text-primary)" style={{ fontSize: "clamp(14px, 1.11vw, 20px)" }}>
          {title}
        </span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto" style={{ gap: "clamp(8px, 0.69vw, 12px)" }}>
        {hasItems ? children : (
          <p className="font-(family-name:--font-base) text-(--color-text-secondary)" style={{ fontSize: "clamp(12px, 0.83vw, 14px)" }}>
            {emptyText}
          </p>
        )}
      </div>
    </div>
  );
}

function CoursePerformanceRow({ course }: { course: CourseListItem }) {
  return (
    <div
      className="flex items-center rounded-xl bg-white"
      style={{ boxShadow: "var(--shadow-card)", padding: "clamp(8px, 0.69vw, 12px)", gap: "clamp(10px, 0.83vw, 16px)" }}
    >
      {course.image ? (
        <Image src={course.image} alt="" width={48} height={48} unoptimized className="h-12 w-12 shrink-0 rounded-md object-cover" />
      ) : (
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-[#fff3dc] to-[#ffe7ef]">
          <Image src="/icons/curses.svg" alt="" width={26} height={26} className="h-6 w-6" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-(family-name:--font-base) font-medium text-(--color-text-primary)" style={{ fontSize: "clamp(13px, 1vw, 16px)" }}>
          {course.title}
        </p>
        <p className="font-(family-name:--font-base) text-(--color-text-secondary)" style={{ fontSize: "clamp(11px, 0.73vw, 13px)" }}>
          {course.students_count} student{course.students_count === 1 ? "" : "s"}
        </p>
      </div>
      <span className="flex shrink-0 items-center gap-1 font-(family-name:--font-base) text-(--color-text-primary)" style={{ fontSize: "clamp(12px, 0.9vw, 14px)" }}>
        <Star size={14} fill="var(--color-brand-yellow)" color="var(--color-brand-yellow)" />
        {course.rating_count > 0 ? Number(course.rating_avg).toFixed(1) : "—"}
      </span>
    </div>
  );
}

function PaymentStatusDot({ status }: { status: TeacherOrderStatus }) {
  const color =
    status === "paid" ? "var(--color-blue)" : status === "unpaid" ? "var(--color-yellow-dark)" : "var(--color-rejected)";
  const label = status === "paid" ? "Paid" : status === "unpaid" ? "Unpaid" : "Overdue";
  return (
    <span className="flex shrink-0 items-center gap-1 font-(family-name:--font-base)" style={{ fontSize: "clamp(11px, 0.83vw, 13px)", color }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
      {label}
    </span>
  );
}

function PaymentRow({ row }: { row: TeacherOrderRow }) {
  return (
    <div
      className="flex items-center rounded-xl bg-white"
      style={{ boxShadow: "var(--shadow-card)", padding: "clamp(8px, 0.69vw, 12px)", gap: "clamp(10px, 0.83vw, 16px)" }}
    >
      <StudentAvatar name={row.student_name} avatar={row.student_avatar} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-(family-name:--font-base) font-medium text-(--color-text-primary)" style={{ fontSize: "clamp(13px, 1vw, 16px)" }}>
          {row.student_name}
        </p>
        <p className="truncate font-(family-name:--font-base) text-(--color-text-secondary)" style={{ fontSize: "clamp(11px, 0.73vw, 13px)" }}>
          {row.course_title}
        </p>
      </div>
      <span className="shrink-0 font-(family-name:--font-base) text-(--color-text-primary)" style={{ fontSize: "clamp(12px, 0.9vw, 14px)" }}>
        {row.amount} {row.currency}
      </span>
      <PaymentStatusDot status={row.status} />
    </div>
  );
}
