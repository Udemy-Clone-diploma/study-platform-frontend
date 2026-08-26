"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChevronDown } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { getAssignedHomework, type HomeworkAssignment } from "@/entities/homework";
import type { ApiError } from "@/shared/api/base";

type HomeworkTab = "todo" | "overdue";

type HomeworkDashboardState = {
  assignments: HomeworkAssignment[];
  loading: boolean;
  error: string;
};

export type HomeworkCourseOption = {
  value: string;
  label: string;
};

export type HomeworkReviewListItem = {
  id: number;
  courseTitle: string;
  courseValue: string;
  kind: "Task" | "Test";
  title: string;
  dateValue: string;
  dateLabel: string;
  score: number | null;
  iconSrc: string;
  accent: string;
  unoptimized?: boolean;
  href?: ComponentProps<typeof Link>["href"];
};

const HomeworkDashboardContext = createContext<HomeworkDashboardState | null>(null);
const EMPTY_ASSIGNMENTS: HomeworkAssignment[] = [];

const LEVELLESS_ACCENTS = [
  "from-[#fff3dc] to-[#ffe7ef]",
  "from-[#ffe7ef] to-[#dfd7ff]",
  "from-[#e0fbf5] to-[#d8ddff]",
  "from-[#edf1ff] to-[#fff3dc]",
] as const;

const FALLBACK_ICONS = [
  "/icons/world.png",
  "/icons/statistics.svg",
  "/icons/curses.svg",
  "/icons/diary.svg",
] as const;

function useHomeworkDashboard() {
  const context = useContext(HomeworkDashboardContext);
  if (!context) {
    throw new Error("Student homework panels must be rendered inside StudentHomeworkProvider.");
  }
  return context;
}

function assignmentKind(assignment: HomeworkAssignment): "Task" | "Test" {
  return assignment.test_detail ? "Test" : "Task";
}

function kindLabel(kind: "Task" | "Test", t: (key: string) => string): string {
  return kind === "Test" ? t("test") : t("task");
}

function assignmentTimestamp(value: string | null | undefined): number {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function isOverdue(assignment: HomeworkAssignment, now: number): boolean {
  if (!assignment.due_at) return false;
  return assignmentTimestamp(assignment.due_at) < now;
}

function isTodoAssignment(assignment: HomeworkAssignment, now: number): boolean {
  if (assignment.my_submission) return false;
  return !isOverdue(assignment, now);
}

function isOverdueAssignment(assignment: HomeworkAssignment, now: number): boolean {
  return !assignment.my_submission && isOverdue(assignment, now);
}

function formatShortDate(value: string | null | undefined, locale: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
  })
    .format(date)
    .replace(/\//g, ".");
}

function courseOptions(
  assignments: HomeworkAssignment[],
  allCoursesLabel: string,
): HomeworkCourseOption[] {
  const byTitle = new Map<string, string>();
  assignments.forEach((assignment) => {
    if (assignment.course_title) {
      byTitle.set(assignment.course_title, assignment.course_title);
    }
  });

  return [
    { value: "all", label: allCoursesLabel },
    ...Array.from(byTitle.values())
      .sort((first, second) => first.localeCompare(second))
      .map((title) => ({ value: title, label: title })),
  ];
}

function homeworkVisual(assignment: HomeworkAssignment) {
  const index = Math.abs(assignment.course_id || assignment.id) % FALLBACK_ICONS.length;

  return {
    iconSrc: assignment.course_image || FALLBACK_ICONS[index],
    accent: LEVELLESS_ACCENTS[index],
    unoptimized: Boolean(assignment.course_image),
  };
}

export function StudentHomeworkProvider({ children }: { children: ReactNode }) {
  const t = useTranslations("StudentHomeworkDashboard");
  const [assignments, setAssignments] = useState<HomeworkAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    getAssignedHomework()
      .then((items) => {
        if (!cancelled) setAssignments(items);
      })
      .catch((requestError: Partial<ApiError>) => {
        if (!cancelled) {
          setError(requestError.detail || requestError.message || t("couldNotLoadHomework"));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [t]);

  const value = useMemo(() => ({ assignments, loading, error }), [assignments, loading, error]);

  return (
    <HomeworkDashboardContext.Provider value={value}>{children}</HomeworkDashboardContext.Provider>
  );
}

export function HomeworkReviewPanel({
  items: suppliedItems,
  loading: suppliedLoading,
  error: suppliedError,
  courses: suppliedCourses,
  courseValue,
  onCourseChange,
  className = "h-[460px]",
  titleHref = "/student-dashboard/homework?status=completed",
}: {
  items?: HomeworkReviewListItem[];
  loading?: boolean;
  error?: string;
  courses?: HomeworkCourseOption[];
  courseValue?: string;
  onCourseChange?: (value: string) => void;
  className?: string;
  titleHref?: string | null;
} = {}) {
  const t = useTranslations("StudentHomeworkDashboard");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const dashboard = useContext(HomeworkDashboardContext);
  if (!dashboard && !suppliedItems) {
    throw new Error("HomeworkReviewPanel requires StudentHomeworkProvider or supplied items.");
  }

  const assignments = dashboard?.assignments ?? EMPTY_ASSIGNMENTS;
  const loading = suppliedLoading ?? dashboard?.loading ?? false;
  const error = suppliedError ?? dashboard?.error ?? "";
  const [courseFilter, setCourseFilter] = useState("all");
  const assignmentItems = useMemo<HomeworkReviewListItem[]>(() => {
    return assignments
      .filter((assignment) => assignment.my_submission)
      .sort((first, second) => {
        const firstSubmission = first.my_submission;
        const secondSubmission = second.my_submission;
        return (
          assignmentTimestamp(
            second.due_at || secondSubmission?.reviewed_at || secondSubmission?.submitted_at,
          ) -
          assignmentTimestamp(
            first.due_at || firstSubmission?.reviewed_at || firstSubmission?.submitted_at,
          )
        );
      })
      .map((assignment) => {
        const visual = homeworkVisual(assignment);
        const submission = assignment.my_submission;
        const status = submission?.status === "reviewed" ? "reviewed" : "submitted";
        const reviewedScore =
          submission?.status === "reviewed" && submission.score != null ? submission.score : null;
        const dateValue =
          assignment.due_at || submission?.reviewed_at || submission?.submitted_at || "";

        return {
          id: assignment.id,
          courseTitle: assignment.course_title,
          courseValue: assignment.course_title,
          kind: assignmentKind(assignment),
          title: assignment.title,
          dateValue,
          dateLabel: formatShortDate(assignment.due_at, locale) || t("noDeadline"),
          score: reviewedScore,
          iconSrc: visual.iconSrc,
          accent: visual.accent,
          unoptimized: visual.unoptimized,
          href: {
            pathname: "/student-dashboard/homework",
            query: { course: assignment.course_slug, status },
          },
        };
      });
  }, [assignments, locale, t]);

  const items = suppliedItems ?? assignmentItems;
  const options = useMemo(
    () => suppliedCourses ?? courseOptions(assignments, tCommon("allCourses")),
    [assignments, suppliedCourses, tCommon],
  );
  const requestedCourse = courseValue ?? courseFilter;
  const fallbackCourse = options[0]?.value ?? "all";
  const activeCourseFilter = options.some((option) => option.value === requestedCourse)
    ? requestedCourse
    : fallbackCourse;
  const visibleItems = useMemo(
    () =>
      items.filter(
        (item) =>
          activeCourseFilter === "all" ||
          activeCourseFilter === "" ||
          item.courseValue === activeCourseFilter,
      ),
    [activeCourseFilter, items],
  );
  const setActiveCourse = onCourseChange ?? setCourseFilter;

  return (
    <section
      className={`flex flex-col overflow-hidden rounded-lg bg-white p-4 shadow-[0_0_16px_rgba(0,0,0,0.14)] ${className}`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="min-w-0 truncate text-base font-bold text-black">
          {titleHref ? (
            <Link
              href={titleHref}
              className="rounded-sm transition-colors hover:text-[#003AFF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003AFF]"
            >
              {t("homework")}
            </Link>
          ) : (
            t("homework")
          )}
        </h2>
        <HomeworkCourseDropdown
          value={activeCourseFilter}
          options={options}
          onChange={setActiveCourse}
        />
      </div>

      <HomeworkListState loading={loading} error={error} empty={!visibleItems.length}>
        <div className="dashboard-homework-scrollbar mt-8 mr-3 -mb-1 min-h-0 flex-1 overflow-y-auto pr-3">
          {visibleItems.map((item, index) => {
            const previousItem = visibleItems[index - 1];
            const startsNewMonth =
              index > 0 &&
              previousItem &&
              monthKey(item.dateValue) !== monthKey(previousItem.dateValue);

            return (
              <div key={item.id}>
                {startsNewMonth ? (
                  <h3 className="my-4 w-fit text-center text-[16px] leading-none font-normal tracking-normal not-italic text-[#121212]">
                    {monthLabel(item.dateValue, locale, t("noDeadline"))}
                  </h3>
                ) : null}
                <HomeworkReviewCard item={item} />
              </div>
            );
          })}
        </div>
      </HomeworkListState>
    </section>
  );
}

export function HomeworkQueuePanel() {
  const t = useTranslations("StudentHomeworkDashboard");
  const { assignments, loading, error } = useHomeworkDashboard();
  const [tab, setTab] = useState<HomeworkTab>("todo");
  const [now] = useState(() => Date.now());

  const todoAssignments = useMemo(() => {
    return assignments
      .filter((assignment) => isTodoAssignment(assignment, now))
      .sort((first, second) => {
        const firstDate = assignmentTimestamp(first.due_at) || Number.MAX_SAFE_INTEGER;
        const secondDate = assignmentTimestamp(second.due_at) || Number.MAX_SAFE_INTEGER;
        return firstDate - secondDate;
      });
  }, [assignments, now]);

  const overdueAssignments = useMemo(() => {
    return assignments
      .filter((assignment) => isOverdueAssignment(assignment, now))
      .sort(
        (first, second) => assignmentTimestamp(second.due_at) - assignmentTimestamp(first.due_at),
      );
  }, [assignments, now]);

  const visibleAssignments = tab === "todo" ? todoAssignments : overdueAssignments;

  return (
    <section className="flex h-[230px] flex-col overflow-hidden rounded-lg bg-white p-3 shadow-[0_0_16px_rgba(0,0,0,0.14)]">
      <div className="mb-2 flex items-center gap-3">
        <ModeButton active={tab === "todo"} onClick={() => setTab("todo")}>
          {t("toDo")}
        </ModeButton>
        <ModeButton active={tab === "overdue"} onClick={() => setTab("overdue")}>
          {t("overdue")}
        </ModeButton>
      </div>

      <HomeworkListState loading={loading} error={error} empty={!visibleAssignments.length}>
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {visibleAssignments.map((assignment) => (
            <HomeworkQueueCard key={assignment.id} assignment={assignment} tab={tab} />
          ))}
        </div>
      </HomeworkListState>
    </section>
  );
}

function HomeworkListState({
  loading,
  error,
  empty,
  children,
}: {
  loading: boolean;
  error: string;
  empty: boolean;
  children: ReactNode;
}) {
  const t = useTranslations("StudentHomeworkDashboard");

  if (loading) {
    return <p className="pt-8 text-center text-sm text-[#5e5e5e]">{t("loading")}</p>;
  }

  if (error) {
    return <p className="pt-8 text-center text-sm text-[#B42318]">{error}</p>;
  }

  if (empty) {
    return <p className="pt-8 text-center text-sm text-[#5e5e5e]">{t("noHomeworkFound")}</p>;
  }

  return children;
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`h-7 rounded-full px-4 text-sm text-black transition-colors ${
        active
          ? "bg-[linear-gradient(90deg,#a7bafa_0%,#fcc4c3_60%,#fff4da_100%)]"
          : "border border-black bg-white hover:bg-[#fafafa]"
      }`}
    >
      {children}
    </button>
  );
}

function HomeworkCourseDropdown({
  value,
  options,
  onChange,
}: {
  value: string;
  options: HomeworkCourseOption[];
  onChange: (value: string) => void;
}) {
  const t = useTranslations("StudentHomeworkDashboard");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  return (
    <div ref={ref} className="relative min-w-0">
      <button
        type="button"
        aria-label={t("filterByCourseAriaLabel")}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex h-8 max-w-[168px] items-center gap-1 rounded-full border border-black/10 bg-[#fafafa] px-3 text-[11px] font-medium text-black shadow-[0_1px_6px_rgba(0,0,0,0.08)] transition-colors hover:border-[#003aff]/40"
      >
        <span className="truncate">{active?.label}</span>
        <ChevronDown
          aria-hidden="true"
          className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <ul
          role="listbox"
          className="absolute right-0 z-20 mt-2 flex max-h-56 w-52 flex-col overflow-y-auto rounded-xl bg-white p-2 shadow-[0_6px_18px_rgba(0,0,0,0.16)]"
        >
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <li key={option.value} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`w-full rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                    selected ? "bg-[#edf1ff] text-[#003aff]" : "text-black hover:bg-[#fafafa]"
                  }`}
                >
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function monthKey(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? `${date.getFullYear()}-${date.getMonth()}` : "undated";
}

function monthLabel(value: string, locale: string, noDeadlineLabel: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat(locale, { month: "long" }).format(date)
    : noDeadlineLabel;
}

function scoreBadgeClassName(score: number) {
  switch (Math.round(score)) {
    case 5:
      return "bg-(--color-brand-cream) text-(--color-yellow-dark)";
    case 4:
      return "bg-(--color-brand-lavender) text-(--color-blue-dark)";
    case 3:
      return "bg-(--color-brand-pink) text-(--color-pink-dark)";
    case 2:
      return "bg-(--color-brand-lavender-soft) text-(--color-blue)";
    default:
      return "bg-(--color-border-light) text-(--color-text-secondary)";
  }
}

function HomeworkReviewCard({ item }: { item: HomeworkReviewListItem }) {
  const t = useTranslations("StudentHomeworkDashboard");
  const content = (
    <>
      {item.score != null ? (
        <span
          className={`flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-md text-[24px] leading-none font-medium ${scoreBadgeClassName(item.score)}`}
        >
          {item.score}+
        </span>
      ) : (
        <HomeworkIcon
          visual={{
            iconSrc: item.iconSrc,
            accent: item.accent,
            unoptimized: Boolean(item.unoptimized),
          }}
          size="large"
        />
      )}
      <div className="flex h-full min-w-0 flex-col justify-between py-[3.5px]">
        <p className="flex min-w-0 items-center gap-2 text-[16px] leading-none font-normal tracking-normal not-italic text-[#5E5E5E]">
          <span className="min-w-0 truncate">{item.courseTitle}</span>
          <span
            aria-hidden="true"
            className="h-[3px] w-[3px] shrink-0 rotate-180 rounded-full bg-[#5E5E5E] opacity-100"
          />
          <span className="shrink-0">{kindLabel(item.kind, t)}</span>
        </p>
        <p className="truncate text-[20px] leading-[1.2] font-medium tracking-normal not-italic text-[#121212]">
          {item.title}
        </p>
      </div>
      <span className="flex h-full items-end justify-end">
        <span className="mb-[3.5px] whitespace-nowrap text-[16px] leading-none font-normal tracking-normal not-italic text-[#003AFF]">
          {item.dateLabel}
        </span>
      </span>
    </>
  );
  const className =
    "mb-2 grid h-20 w-full grid-cols-[60px_minmax(0,1fr)_auto] items-center gap-2.5 rounded-lg border border-black/5 bg-white px-3 py-2.5 font-(family-name:--font-base) shadow-[0_1px_8px_rgba(0,0,0,0.12)]";

  return item.href ? (
    <Link
      href={item.href}
      className={`${className} transition hover:bg-black/[0.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-blue)`}
    >
      {content}
    </Link>
  ) : (
    <article className={className}>{content}</article>
  );
}

function HomeworkQueueCard({
  assignment,
  tab,
}: {
  assignment: HomeworkAssignment;
  tab: HomeworkTab;
}) {
  const t = useTranslations("StudentHomeworkDashboard");
  const locale = useLocale();
  const visual = homeworkVisual(assignment);
  const date = formatShortDate(assignment.due_at, locale);
  const showScoreBadge = assignment.max_score !== null && assignment.max_score !== undefined;

  return (
    <Link
      href={{
        pathname: "/student-dashboard/homework",
        query: {
          course: assignment.course_slug,
          status: tab === "overdue" ? "overdue" : "to_do",
        },
      }}
      className="mb-2 flex min-h-[56px] items-center gap-3 rounded-md border border-black/5 bg-white px-3 shadow-[0_1px_8px_rgba(0,0,0,0.12)] transition hover:bg-black/[0.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-blue)"
    >
      <HomeworkIcon visual={visual} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-[#5e5e5e]">
          {assignment.course_title} <span className="px-1">|</span>{" "}
          {kindLabel(assignmentKind(assignment), t)}
        </p>
        <p className="truncate text-base font-medium text-black">{assignment.title}</p>
      </div>
      {showScoreBadge && tab === "todo" ? (
        <span className="rounded-md bg-[#fff4da] px-3 py-2 text-base font-medium text-[#8a6201]">
          {assignment.max_score}
        </span>
      ) : date ? (
        <span className="whitespace-nowrap text-xs text-black">
          {tab === "overdue" ? t("overduePrefix") : t("duePrefix")}
          <span className="text-[#003aff]">{date}</span>
        </span>
      ) : (
        <span className="whitespace-nowrap text-xs text-[#003aff]">{t("noDeadline")}</span>
      )}
    </Link>
  );
}

function HomeworkIcon({
  visual,
  size = "small",
}: {
  visual: { iconSrc: string; accent: string; unoptimized: boolean };
  size?: "small" | "large";
}) {
  const large = size === "large";

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-md bg-gradient-to-br ${visual.accent} ${
        large ? "h-[60px] w-[60px]" : "h-10 w-10"
      }`}
    >
      <Image
        src={visual.iconSrc}
        alt=""
        width={large ? 48 : 32}
        height={large ? 48 : 32}
        unoptimized={visual.unoptimized}
        className={`${large ? "h-12 w-12" : "h-8 w-8"} object-contain`}
      />
    </div>
  );
}
