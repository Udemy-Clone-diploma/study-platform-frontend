"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { TeacherCourseCard, type TeacherCourseStatus } from "@/features/courses";
import { getTeacherCourses } from "@/entities/course";
import type { CourseListItem, CourseLevel, CourseStatus } from "@/entities/course";
import type { ApiError } from "@/shared/api/base";

const TABS = [
  "All",
  "Active",
  "Drafts",
  "Pending moderation",
  "Needs revision",
  "Completed",
] as const;
type Tab = (typeof TABS)[number];

const TAB_STATUSES: Partial<Record<Tab, CourseStatus[]>> = {
  Active: ["published"],
  Drafts: ["draft"],
  "Pending moderation": ["review"],
  "Needs revision": ["needs_revision"],
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

function getCourseMonth(course: CourseListItem): string {
  const dateStr = course.published_at;
  if (!dateStr) return "Drafts";
  return new Date(dateStr).toLocaleString("en-US", { month: "long" });
}

export default function TeacherCoursesPage() {
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("All");

  useEffect(() => {
    getTeacherCourses()
      .then((data: { results: CourseListItem[] }) => setCourses(data.results))
      .catch((err: Partial<ApiError>) =>
        setError(err.message ?? "Failed to load courses."),
      )
      .finally(() => setLoading(false));
  }, []);

  const filtered = courses.filter((course) => {
    if (activeTab === "All") return true;
    const allowed = TAB_STATUSES[activeTab];
    if (!allowed) return true;
    return allowed.includes(course.status);
  });

  const months = [...new Set(filtered.map(getCourseMonth))];

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
              onClick={() => setActiveTab(tab)}
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
            src="/icons/arrow-goto.png"
            alt=""
            width={28}
            height={28}
            style={{ width: "clamp(18px, 1.94vw, 28px)", height: "clamp(18px, 1.94vw, 28px)" }}
          />
        </Link>
      </div>

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
                  <TeacherCourseCard
                    key={course.id}
                    title={course.title}
                    status={BACKEND_TO_UI[course.status] ?? "draft"}
                    imageSrc={course.image}
                    iconSrc={LEVEL_ICON[course.level] ?? "/icons/curses.svg"}
                    rating={
                      course.status === "archived"
                        ? Number(course.rating_avg)
                        : undefined
                    }
                    slug={course.slug}
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
