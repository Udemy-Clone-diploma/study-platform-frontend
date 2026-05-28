"use client";

import { useState, useEffect } from "react";
import { StudentCourseCard } from "@/features/courses";
import { Pagination } from "@/shared/ui/Pagination";
import { getEnrolledCourses } from "@/entities/course";
import type { CourseListItem, CourseLevel } from "@/entities/course";
import type { ApiError } from "@/shared/api/base";
import { useViewportPageSize } from "@/shared/lib/useViewportPageSize";

const TABS = ["All", "Current", "Completed"] as const;
type Tab = (typeof TABS)[number];

const LEVEL_ICON: Record<CourseLevel, string> = {
  beginner: "/icons/curses.svg",
  intermediate: "/icons/world.png",
  advanced: "/icons/statistics.svg",
};

// header 76 + tab row 48 + page padding 64 + month heading 40 + pagination 56 + gap buffer 16
const RESERVED_PX = 300;
const CURRENT_YEAR = new Date().getFullYear();

function getCourseMonthLabel(course: CourseListItem): string {
  const date = new Date(course.enrolled_at ?? course.created_at);
  const monthName = date.toLocaleString("en-US", { month: "long" });
  return date.getFullYear() === CURRENT_YEAR ? monthName : `${monthName} ${date.getFullYear()}`;
}

function getProgressPercent(course: CourseListItem): number {
  return course.status === "archived" ? 100 : 0;
}

export default function StudentCoursesPage() {
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("All");
  const [page, setPage] = useState(1);

  const { pageSize, gridRef, recalc } = useViewportPageSize(RESERVED_PX);

  useEffect(() => {
    getEnrolledCourses()
      .then((data: { results: CourseListItem[] }) => setCourses(data.results))
      .catch((err: Partial<ApiError>) =>
        setError(err.message ?? "Failed to load courses."),
      )
      .finally(() => setLoading(false));
  }, []);

  const filtered = courses
    .filter((course) => {
      if (activeTab === "Current") return course.status !== "archived";
      if (activeTab === "Completed") return course.status === "archived";
      return true;
    })
    .sort((a, b) => {
      const da = new Date(a.enrolled_at ?? a.created_at).getTime();
      const db = new Date(b.enrolled_at ?? b.created_at).getTime();
      return db - da;
    });

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
        <nav
          aria-label="Course filter"
          className="flex items-center"
          style={{ marginBottom: "clamp(16px, 2.22vw, 32px)", gap: "clamp(16px, 1.67vw, 40px)" }}
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
              style={{ fontSize: "clamp(14px, 1.67vw, 24px)" }}
            >
              {tab}
            </button>
          ))}
        </nav>

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
                      <StudentCourseCard
                        key={course.id}
                        title={course.title}
                        teacherName={course.teacher_name}
                        progressPercent={getProgressPercent(course)}
                        imageSrc={course.image}
                        iconSrc={LEVEL_ICON[course.level] ?? "/icons/curses.svg"}
                        level={course.level}
                        slug={course.slug}
                        isArchived={course.status === "archived"}
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