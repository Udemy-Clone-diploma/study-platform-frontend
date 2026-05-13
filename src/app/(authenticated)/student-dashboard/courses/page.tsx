"use client";

import { useState, useEffect } from "react";
import { StudentCourseCard } from "@/features/courses";
import { getEnrolledCourses } from "@/entities/course";
import type { CourseListItem, CourseLevel } from "@/entities/course";
import type { ApiError } from "@/shared/api/base";

const TABS = ["All", "Current", "Completed"] as const;
type Tab = (typeof TABS)[number];

const LEVEL_ICON: Record<CourseLevel, string> = {
  beginner: "/icons/curses.svg",
  intermediate: "/icons/world.png",
  advanced: "/icons/statistics.svg",
};

function getCourseMonth(course: CourseListItem): string {
  const dateStr = course.published_at;
  if (!dateStr) return "Enrolled";
  return new Date(dateStr).toLocaleString("en-US", { month: "long" });
}

function getProgressPercent(course: CourseListItem): number {
  return course.status === "archived" ? 100 : 0;
}

export default function StudentCoursesPage() {
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("All");

  useEffect(() => {
    getEnrolledCourses()
      .then((data: { results: CourseListItem[] }) => setCourses(data.results))
      .catch((err: Partial<ApiError>) =>
        setError(err.message ?? "Failed to load courses."),
      )
      .finally(() => setLoading(false));
  }, []);

  const filtered = courses.filter((course) => {
    if (activeTab === "Current") return course.status !== "archived";
    if (activeTab === "Completed") return course.status === "archived";
    return true;
  });

  const months = [...new Set(filtered.map(getCourseMonth))];

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
            onClick={() => setActiveTab(tab)}
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
      ) : months.length === 0 ? (
        <p className="mt-16 text-center text-lg text-(--color-text-secondary)">
          No courses found.
        </p>
      ) : (
        months.map((month) => (
          <section key={month} style={{ marginBottom: "clamp(16px, 2.22vw, 32px)" }}>
            <h2
              className="font-normal text-(--color-text-primary)"
              style={{ fontSize: "clamp(16px, 1.67vw, 24px)", marginBottom: "clamp(8px, 1.11vw, 16px)" }}
            >
              {month}
            </h2>
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              style={{ gap: "clamp(8px, 1.11vw, 16px)" }}
            >
              {filtered
                .filter((c) => getCourseMonth(c) === month)
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
        ))
      )}
      </div>
    </main>
  );
}
