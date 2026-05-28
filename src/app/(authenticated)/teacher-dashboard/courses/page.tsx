"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { TeacherCourseCard, type TeacherCourseStatus } from "@/features/courses";
import { Pagination } from "@/shared/ui/Pagination";
import { getTeacherCourses } from "@/entities/course";
import type { CourseListItem, CourseLevel, CourseStatus } from "@/entities/course";
import type { ApiError } from "@/shared/api/base";
import { useViewportPageSize } from "@/shared/lib/useViewportPageSize";

const TABS = [
  "All",
  "Active",
  "Drafts",
  "Pending moderation",
  "For review",
  "Completed",
] as const;
type Tab = (typeof TABS)[number];

const TAB_STATUSES: Partial<Record<Tab, CourseStatus[]>> = {
  Active: ["published"],
  Drafts: ["draft"],
  "Pending moderation": ["review"],
  "For review": ["needs_revision"],
  Completed: ["archived"],
};

const BACKEND_TO_UI: Record<CourseStatus, TeacherCourseStatus> = {
  draft: "draft",
  review: "pending_moderation",
  needs_revision: "needs_revision",
  published: "active",
  archived: "completed",
};

const LEVEL_ICON: Record<CourseLevel, string> = {
  beginner: "/icons/curses.svg",
  intermediate: "/icons/world.png",
  advanced: "/icons/statistics.svg",
};

// header 76 + tab+button row 56 + page padding 64 + month heading 40 + pagination 56 + gap buffer 16
const RESERVED_PX = 308;
const CURRENT_YEAR = new Date().getFullYear();

function getCourseMonthLabel(course: CourseListItem): string {
  const date = new Date(course.created_at);
  const monthName = date.toLocaleString("en-US", { month: "long" });
  return date.getFullYear() === CURRENT_YEAR ? monthName : `${monthName} ${date.getFullYear()}`;
}

export default function TeacherCoursesPage() {
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("All");
  const [page, setPage] = useState(1);

  const { pageSize, gridRef, recalc } = useViewportPageSize(RESERVED_PX);

  useEffect(() => {
    getTeacherCourses()
      .then((data: { results: CourseListItem[] }) => setCourses(data.results))
      .catch((err: Partial<ApiError>) =>
        setError(err.message ?? "Failed to load courses."),
      )
      .finally(() => setLoading(false));
  }, []);

  const filtered = courses
    .filter((course) => {
      if (activeTab === "All") return true;
      const allowed = TAB_STATUSES[activeTab];
      if (!allowed) return true;
      return allowed.includes(course.status);
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageSlice = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const monthsOnPage = [...new Set(pageSlice.map(getCourseMonthLabel))];

  useEffect(() => {
    if (pageSlice.length > 0) recalc();
  }, [pageSlice.length, recalc]);

  function handlePageChange(newPage: number) {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    setPage(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main
      className="bg-my-courses min-h-[calc(100vh-76px)]"
      style={{ paddingInline: "clamp(16px, 2.78vw, 40px)", paddingBlock: "clamp(16px, 2.22vw, 32px)" }}
    >
      <div style={{ maxWidth: "1648px", margin: "0 auto" }}>
        {/* Tabs + Add Course button */}
        <div
          className="flex flex-wrap items-center justify-between"
          style={{ marginBottom: "clamp(16px, 2.22vw, 32px)", gap: "clamp(12px, 1.11vw, 16px)" }}
        >
          <nav
            aria-label="Course filter"
            className="flex flex-wrap items-center"
            style={{ gap: "clamp(16px, 1.67vw, 40px)" }}
          >
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                aria-current={activeTab === tab ? "page" : undefined}
                className={[
                  "font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-blue)",
                  activeTab === tab
                    ? "text-(--color-text-primary) underline underline-offset-4"
                    : "text-(--color-text-secondary) hover:text-(--color-text-primary)",
                ].join(" ")}
                style={{ fontSize: "clamp(14px, 1.39vw, 24px)" }}
              >
                {tab}
              </button>
            ))}
          </nav>

          <Link
            href="/teacher-dashboard/courses/new"
            className="flex items-center font-(family-name:--font-accent) font-medium uppercase text-(--color-text-primary) transition-opacity hover:opacity-85 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-blue)"
            style={{
              background: "var(--gradient-brand)",
              borderRadius: "clamp(16px, 1.94vw, 28px)",
              padding: "clamp(8px, 0.83vw, 12px) clamp(16px, 1.94vw, 28px)",
              fontSize: "clamp(14px, 1.39vw, 20px)",
              gap: "clamp(8px, 0.83vw, 12px)",
            }}
          >
            Add Course
            <Image
              src="/icons/add.svg"
              alt=""
              width={14}
              height={14}
              style={{ width: "clamp(18px, 1.94vw, 28px)", height: "clamp(18px, 1.94vw, 28px)" }}
            />
          </Link>
        </div>

        {loading ? (
          <p className="mt-16 text-center text-lg text-(--color-text-secondary)">Loading...</p>
        ) : error ? (
          <p className="mt-16 text-center text-lg text-red-500">{error}</p>
        ) : monthsOnPage.length === 0 ? (
          <p className="mt-16 text-center text-lg text-(--color-text-secondary)">
            No courses found.
          </p>
        ) : (
          <>
            {monthsOnPage.map((month, mi) => (
              <section key={month} style={{ marginBottom: "clamp(16px, 2.22vw, 32px)" }}>
                <h2
                  className="font-normal text-(--color-text-primary)"
                  style={{ fontSize: "clamp(16px, 1.67vw, 24px)", marginBottom: "clamp(8px, 1.11vw, 16px)" }}
                >
                  {month}
                </h2>
                <div
                  ref={mi === 0 ? gridRef : undefined}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  style={{ gap: "clamp(8px, 1.11vw, 16px)" }}
                >
                  {pageSlice
                    .filter((c) => getCourseMonthLabel(c) === month)
                    .map((course) => (
                      <TeacherCourseCard
                        key={course.id}
                        title={course.title}
                        level={course.level}
                        status={BACKEND_TO_UI[course.status] ?? "draft"}
                        imageSrc={course.image}
                        iconSrc={LEVEL_ICON[course.level] ?? "/icons/curses.svg"}
                        rating={
                          course.status === "archived" || course.status === "published"
                            ? Number(course.rating_avg)
                            : undefined
                        }
                        slug={course.slug}
                      />
                    ))}
                </div>
              </section>
            ))}

            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", marginTop: "clamp(16px, 2.22vw, 32px)" }}>
                <Pagination
                  currentPage={safePage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}