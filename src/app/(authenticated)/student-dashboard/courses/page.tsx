"use client";

import { useState, useEffect } from "react";
import { StudentCourseCard, CompletedCourseCard, CompletionResultModal } from "@/features/courses";
import { getEnrolledCourses, getStudentCompletions } from "@/entities/course";
import type { CourseListItem, CourseLevel, CourseCompletion } from "@/entities/course";
import type { ApiError } from "@/shared/api/base";

const TABS = ["All", "Current", "Completed"] as const;
type Tab = (typeof TABS)[number];

const LEVEL_ICON: Record<CourseLevel, string> = {
  beginner: "/icons/curses.svg",
  intermediate: "/icons/world.png",
  advanced: "/icons/statistics.svg",
};

const CURRENT_YEAR = new Date().getFullYear();

function getMonthLabel(iso: string): string {
  const date = new Date(iso);
  const monthName = date.toLocaleString("en-US", { month: "long" });
  return date.getFullYear() === CURRENT_YEAR ? monthName : `${monthName} ${date.getFullYear()}`;
}

type AllItem =
  | { kind: "active"; item: CourseListItem }
  | { kind: "completed"; item: CourseCompletion };

function itemDate(entry: AllItem): number {
  return entry.kind === "active"
    ? new Date(entry.item.enrolled_at ?? entry.item.created_at).getTime()
    : new Date(entry.item.completed_at).getTime();
}

function itemMonthLabel(entry: AllItem): string {
  return entry.kind === "active"
    ? getMonthLabel(entry.item.enrolled_at ?? entry.item.created_at)
    : getMonthLabel(entry.item.completed_at);
}

export default function StudentCoursesPage() {
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [completions, setCompletions] = useState<CourseCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("All");
  const [selectedCompletion, setSelectedCompletion] = useState<CourseCompletion | null>(null);

  useEffect(() => {
    Promise.all([getEnrolledCourses(), getStudentCompletions()])
      .then(([enrolled, completed]) => {
        setCourses(enrolled.results);
        setCompletions(completed.results);
      })
      .catch((err: Partial<ApiError>) => setError(err.message ?? "Failed to load courses."))
      .finally(() => setLoading(false));
  }, []);

  const allItems: AllItem[] = [
    ...courses.map((item): AllItem => ({ kind: "active", item })),
    ...completions.map((item): AllItem => ({ kind: "completed", item })),
  ].sort((a, b) => itemDate(b) - itemDate(a));

  const displayItems: AllItem[] =
    activeTab === "Current"
      ? courses
          .sort((a, b) =>
            new Date(b.enrolled_at ?? b.created_at).getTime() -
            new Date(a.enrolled_at ?? a.created_at).getTime(),
          )
          .map((item): AllItem => ({ kind: "active", item }))
      : activeTab === "Completed"
      ? completions
          .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
          .map((item): AllItem => ({ kind: "completed", item }))
      : allItems;

  const months = [...new Set(displayItems.map(itemMonthLabel))];

  const emptyLabel =
    activeTab === "Completed" ? "No completed courses yet." : "No courses found.";

  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
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
              style={{ fontSize: "clamp(14px, 1.39vw, 24px)" }}
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
          <p className="mt-16 text-center text-lg text-(--color-text-secondary)">{emptyLabel}</p>
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
                {displayItems
                  .filter((entry) => itemMonthLabel(entry) === month)
                  .map((entry) =>
                    entry.kind === "active" ? (
                      <StudentCourseCard
                        key={`active-${entry.item.id}`}
                        title={entry.item.title}
                        teacherName={entry.item.teacher_name}
                        progressPercent={0}
                        imageSrc={entry.item.image}
                        iconSrc={LEVEL_ICON[entry.item.level] ?? "/icons/curses.svg"}
                        level={entry.item.level}
                        slug={entry.item.slug}
                      />
                    ) : (
                      <CompletedCourseCard
                        key={`completed-${entry.item.id}`}
                        title={entry.item.title}
                        teacherName={entry.item.teacher_name}
                        progressPercent={entry.item.progress_percent}
                        imageSrc={entry.item.image_url}
                        iconSrc={LEVEL_ICON[entry.item.level] ?? "/icons/curses.svg"}
                        level={entry.item.level}
                        onClick={() => setSelectedCompletion(entry.item)}
                      />
                    ),
                  )}
              </div>
            </section>
          ))
        )}
      </div>

      {selectedCompletion && (
        <CompletionResultModal
          completion={selectedCompletion}
          onClose={() => setSelectedCompletion(null)}
        />
      )}
    </main>
  );
}
