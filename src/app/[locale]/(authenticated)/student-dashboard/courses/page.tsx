"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { StudentCourseCard, CompletedCourseCard, CompletionResultModal } from "@/features/courses";
import { getEnrolledCourses, getStudentCompletions } from "@/entities/course";
import type { CourseCompletion, CourseLevel, EnrolledCourseListItem } from "@/entities/course";
import type { ApiError } from "@/shared/api/base";
import { PageShell } from "@/shared/ui/PageShell";

type Translator = (key: string, values?: Record<string, string | number>) => string;

const TAB_VALUES = ["All", "Current", "Completed"] as const;
type Tab = (typeof TAB_VALUES)[number];

function tabLabel(tab: Tab, t: Translator, tCommon: Translator): string {
  if (tab === "All") return tCommon("all");
  if (tab === "Current") return t("tabCurrent");
  return t("tabCompleted");
}

const LEVEL_ICON: Record<CourseLevel, string> = {
  beginner: "/icons/curses.svg",
  intermediate: "/icons/world.png",
  advanced: "/icons/statistics.svg",
};

const CURRENT_YEAR = new Date().getFullYear();

function getMonthLabel(iso: string, locale: string): string {
  const date = new Date(iso);
  const monthName = date.toLocaleString(locale, { month: "long" });
  return date.getFullYear() === CURRENT_YEAR ? monthName : `${monthName} ${date.getFullYear()}`;
}

type AllItem =
  | { kind: "active"; item: EnrolledCourseListItem }
  | { kind: "completed"; item: CourseCompletion };

function itemDate(entry: AllItem): number {
  return entry.kind === "active"
    ? new Date(entry.item.enrolled_at ?? entry.item.created_at).getTime()
    : new Date(entry.item.completed_at).getTime();
}

function itemMonthLabel(entry: AllItem, locale: string): string {
  return entry.kind === "active"
    ? getMonthLabel(entry.item.enrolled_at ?? entry.item.created_at, locale)
    : getMonthLabel(entry.item.completed_at, locale);
}

export default function StudentCoursesPage() {
  const t = useTranslations("StudentCoursesPage");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const [courses, setCourses] = useState<EnrolledCourseListItem[]>([]);
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
      .catch((err: Partial<ApiError>) => setError(err.message ?? t("errorLoad")))
      .finally(() => setLoading(false));
  }, [t]);

  // A completed course keeps its (unrevoked) enrollment, so it would otherwise
  // show up as both an active card and a completed card — keep only the
  // completed one once a course has been finished.
  const completedCourseIds = new Set(
    completions.map((c) => c.course).filter((id): id is number => id != null),
  );
  const activeCourses = courses.filter((c) => !completedCourseIds.has(c.id));

  const allItems: AllItem[] = [
    ...activeCourses.map((item): AllItem => ({ kind: "active", item })),
    ...completions.map((item): AllItem => ({ kind: "completed", item })),
  ].sort((a, b) => itemDate(b) - itemDate(a));

  const displayItems: AllItem[] =
    activeTab === "Current"
      ? activeCourses
          .sort(
            (a, b) =>
              new Date(b.enrolled_at ?? b.created_at).getTime() -
              new Date(a.enrolled_at ?? a.created_at).getTime(),
          )
          .map((item): AllItem => ({ kind: "active", item }))
      : activeTab === "Completed"
        ? completions
            .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
            .map((item): AllItem => ({ kind: "completed", item }))
        : allItems;

  const months = [...new Set(displayItems.map((entry) => itemMonthLabel(entry, locale)))];

  const emptyLabel = activeTab === "Completed" ? t("noCompletedCoursesYet") : t("noCoursesFound");

  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <PageShell className="bg-my-courses">
      <div style={{ maxWidth: "1648px", margin: "0 auto" }}>
        <nav
          aria-label={t("courseFilterAriaLabel")}
          className="-mx-4 flex items-center overflow-x-auto px-4 [-ms-overflow-style:none] [scrollbar-width:none] lg:mx-0 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden"
          style={{ marginBottom: "clamp(16px, 2.22vw, 32px)", gap: "clamp(16px, 1.67vw, 40px)" }}
        >
          {TAB_VALUES.map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              aria-current={activeTab === tab ? "page" : undefined}
              className={[
                "shrink-0 whitespace-nowrap font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-blue)",
                activeTab === tab
                  ? "text-(--color-text-primary) underline underline-offset-4"
                  : "text-(--color-text-primary)",
              ].join(" ")}
              style={{
                fontFamily: "var(--font-base)",
                fontWeight: 600,
                fontSize: "clamp(20px, 1.39vw, 24px)",
              }}
            >
              {tabLabel(tab, t, tCommon)}
            </button>
          ))}
        </nav>

        {loading ? (
          <p className="mt-16 text-center text-lg text-(--color-text-secondary)">
            {tCommon("loading")}
          </p>
        ) : error ? (
          <p className="mt-16 text-center text-lg text-red-500">{error}</p>
        ) : months.length === 0 ? (
          <p className="mt-16 text-center text-lg text-(--color-text-secondary)">{emptyLabel}</p>
        ) : (
          months.map((month) => (
            <section key={month} style={{ marginBottom: "clamp(16px, 2.22vw, 32px)" }}>
              <h2
                className="font-normal text-(--color-text-primary)"
                style={{
                  fontSize: "clamp(16px, 1.67vw, 24px)",
                  marginBottom: "clamp(8px, 1.11vw, 16px)",
                }}
              >
                {month}
              </h2>
              <div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                style={{ gap: "clamp(8px, 1.11vw, 16px)" }}
              >
                {displayItems
                  .filter((entry) => itemMonthLabel(entry, locale) === month)
                  .map((entry) =>
                    entry.kind === "active" ? (
                      <StudentCourseCard
                        key={`active-${entry.item.id}`}
                        title={entry.item.title}
                        teacherName={entry.item.teacher_name}
                        progressPercent={entry.item.progress_percent ?? 0}
                        imageSrc={entry.item.image}
                        iconSrc={LEVEL_ICON[entry.item.level] ?? "/icons/curses.svg"}
                        level={entry.item.level}
                        slug={entry.item.slug}
                        suspended={entry.item.enrollment_access_status === "suspended"}
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
    </PageShell>
  );
}
