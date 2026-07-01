"use client";

import Image from "next/image";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChevronDown } from "lucide-react";
import {
  getAssignedHomework,
  type HomeworkAssignment,
  type HomeworkSubmission,
} from "@/entities/homework";
import type { ApiError } from "@/shared/api/base";

type HomeworkTab = "todo" | "overdue";

type HomeworkDashboardState = {
  assignments: HomeworkAssignment[];
  loading: boolean;
  error: string;
};

type CourseOption = {
  value: string;
  label: string;
};

const HomeworkDashboardContext = createContext<HomeworkDashboardState | null>(null);

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

function formatShortDate(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
  }).format(date).replace(/\//g, ".");
}

function courseOptions(assignments: HomeworkAssignment[]): CourseOption[] {
  const byTitle = new Map<string, string>();
  assignments.forEach((assignment) => {
    if (assignment.course_title) {
      byTitle.set(assignment.course_title, assignment.course_title);
    }
  });

  return [
    { value: "all", label: "All courses" },
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

function statusLabel(submission: HomeworkSubmission): string {
  if (submission.status === "reviewed") return "Reviewed";
  if (submission.status === "retrieved") return "In review";
  return "Submitted";
}

export function StudentHomeworkProvider({ children }: { children: ReactNode }) {
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
          setError(requestError.detail || requestError.message || "Could not load homework.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({ assignments, loading, error }),
    [assignments, loading, error],
  );

  return (
    <HomeworkDashboardContext.Provider value={value}>
      {children}
    </HomeworkDashboardContext.Provider>
  );
}

export function HomeworkReviewPanel() {
  const { assignments, loading, error } = useHomeworkDashboard();
  const [courseFilter, setCourseFilter] = useState("all");
  const options = useMemo(() => courseOptions(assignments), [assignments]);
  const activeCourseFilter = options.some((option) => option.value === courseFilter)
    ? courseFilter
    : "all";

  const submittedAssignments = useMemo(() => {
    return assignments
      .filter((assignment) => assignment.my_submission)
      .filter((assignment) =>
        activeCourseFilter === "all" || assignment.course_title === activeCourseFilter,
      )
      .sort((first, second) => {
        const firstSubmission = first.my_submission;
        const secondSubmission = second.my_submission;
        return (
          assignmentTimestamp(secondSubmission?.reviewed_at || secondSubmission?.submitted_at) -
          assignmentTimestamp(firstSubmission?.reviewed_at || firstSubmission?.submitted_at)
        );
      });
  }, [activeCourseFilter, assignments]);

  return (
    <section className="flex h-[300px] flex-col overflow-hidden rounded-lg bg-white p-4 shadow-[0_0_16px_rgba(0,0,0,0.14)]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="shrink-0 text-base font-bold text-black">Homework</h2>
        <HomeworkCourseDropdown
          value={activeCourseFilter}
          options={options}
          onChange={setCourseFilter}
        />
      </div>

      <HomeworkListState loading={loading} error={error} empty={!submittedAssignments.length}>
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {submittedAssignments.map((assignment) => (
            <HomeworkReviewCard key={assignment.id} assignment={assignment} />
          ))}
        </div>
      </HomeworkListState>
    </section>
  );
}

export function HomeworkQueuePanel() {
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
      .sort((first, second) => assignmentTimestamp(second.due_at) - assignmentTimestamp(first.due_at));
  }, [assignments, now]);

  const visibleAssignments = tab === "todo" ? todoAssignments : overdueAssignments;

  return (
    <section className="flex h-[230px] flex-col overflow-hidden rounded-lg bg-white p-3 shadow-[0_0_16px_rgba(0,0,0,0.14)]">
      <div className="mb-2 flex items-center gap-3">
        <ModeButton active={tab === "todo"} onClick={() => setTab("todo")}>
          To Do
        </ModeButton>
        <ModeButton active={tab === "overdue"} onClick={() => setTab("overdue")}>
          Overdue
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
  if (loading) {
    return <p className="pt-8 text-center text-sm text-[#5e5e5e]">Loading homework...</p>;
  }

  if (error) {
    return <p className="pt-8 text-center text-sm text-[#B42318]">{error}</p>;
  }

  if (empty) {
    return <p className="pt-8 text-center text-sm text-[#5e5e5e]">No homework found.</p>;
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
  options: CourseOption[];
  onChange: (value: string) => void;
}) {
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
        aria-label="Filter homework by course"
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
                    selected
                      ? "bg-[#edf1ff] text-[#003aff]"
                      : "text-black hover:bg-[#fafafa]"
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

function HomeworkReviewCard({ assignment }: { assignment: HomeworkAssignment }) {
  const visual = homeworkVisual(assignment);
  const submission = assignment.my_submission;
  const date = formatShortDate(submission?.reviewed_at || submission?.submitted_at);

  return (
    <div className="mb-2 flex min-h-[58px] items-center gap-3 rounded-md border border-black/5 bg-white px-3 shadow-[0_1px_8px_rgba(0,0,0,0.12)]">
      <HomeworkIcon visual={visual} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] text-[#5e5e5e]">
          {assignment.course_title} <span className="px-1">|</span> {assignmentKind(assignment)}
        </p>
        <p className="truncate text-sm font-medium text-black">{assignment.title}</p>
        {submission ? (
          <p className="mt-0.5 truncate text-[10px] text-[#5e5e5e]">{statusLabel(submission)}</p>
        ) : null}
      </div>
      {submission?.status === "reviewed" ? (
        <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-md bg-[#fff4da] px-2 text-sm font-medium text-[#8a6201]">
          {submission.score ?? "-"}
        </span>
      ) : date ? (
        <span className="whitespace-nowrap text-xs text-[#003aff]">{date}</span>
      ) : null}
    </div>
  );
}

function HomeworkQueueCard({
  assignment,
  tab,
}: {
  assignment: HomeworkAssignment;
  tab: HomeworkTab;
}) {
  const visual = homeworkVisual(assignment);
  const date = formatShortDate(assignment.due_at);
  const showScoreBadge = assignment.max_score !== null && assignment.max_score !== undefined;

  return (
    <div className="mb-2 flex min-h-[56px] items-center gap-3 rounded-md border border-black/5 bg-white px-3 shadow-[0_1px_8px_rgba(0,0,0,0.12)]">
      <HomeworkIcon visual={visual} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] text-[#5e5e5e]">
          {assignment.course_title} <span className="px-1">|</span> {assignmentKind(assignment)}
        </p>
        <p className="truncate text-sm font-medium text-black">{assignment.title}</p>
      </div>
      {showScoreBadge && tab === "todo" ? (
        <span className="rounded-md bg-[#fff4da] px-3 py-2 text-base font-medium text-[#8a6201]">
          {assignment.max_score}+
        </span>
      ) : date ? (
        <span className="whitespace-nowrap text-xs text-black">
          {tab === "overdue" ? "Overdue: " : "Do to: "}
          <span className="text-[#003aff]">{date}</span>
        </span>
      ) : (
        <span className="whitespace-nowrap text-xs text-[#003aff]">No deadline</span>
      )}
    </div>
  );
}

function HomeworkIcon({
  visual,
}: {
  visual: { iconSrc: string; accent: string; unoptimized: boolean };
}) {
  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gradient-to-br ${visual.accent}`}
    >
      <Image
        src={visual.iconSrc}
        alt=""
        width={32}
        height={32}
        unoptimized={visual.unoptimized}
        className="h-8 w-8 object-contain"
      />
    </div>
  );
}
