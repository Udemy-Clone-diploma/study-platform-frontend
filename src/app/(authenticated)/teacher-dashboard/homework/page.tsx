"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Plus,
  Upload,
  X,
} from "lucide-react";
import {
  createHomeworkAssignment,
  getHomeworkAssignments,
  getHomeworkRecipients,
  publishHomeworkAssignment,
  reviewHomeworkSubmission,
  retrieveHomeworkSubmission,
  uploadHomeworkAssignmentAttachment,
  type HomeworkAssignment,
  type HomeworkAvailableRecipient,
  type HomeworkSubmission,
} from "@/entities/homework";
import {
  byOrder,
  createQuestion,
  createTest,
  getCourseBySlug,
  getTeacherCourses,
  type CourseDetail,
  type CourseListItem,
  type CourseModule,
} from "@/entities/course";
import { TestFormBody, type TestFormValues, type TestQuestion } from "@/features/courses";
import { QuizQuestionCard, QuizWindow } from "@/features/quiz";
import type { ApiError } from "@/shared/api/base";
import { PageShell } from "@/shared/ui/PageShell";

type FormState = {
  courseSlug: string;
  sourceAssignmentId: string;
  moduleId: string;
  lessonId: string;
  recipientGroupId: string;
  testId: string;
  title: string;
  description: string;
  dueAt: string;
  maxScore: string;
};

const HOMEWORK_SCORE_MIN = 1;
const HOMEWORK_SCORE_MAX = 5;

const EMPTY_FORM: FormState = {
  courseSlug: "",
  sourceAssignmentId: "",
  moduleId: "",
  lessonId: "",
  recipientGroupId: "",
  testId: "",
  title: "",
  description: "",
  dueAt: "",
  maxScore: String(HOMEWORK_SCORE_MAX),
};

type SelectOption = {
  value: string;
  label: string;
};

type RecipientGroupOption = SelectOption & {
  enrollmentIds: number[];
};

type HomeworkQueueFilter = "all" | "waiting_submit" | "to_review" | "completed";

const HOMEWORK_QUEUE_TABS: { value: HomeworkQueueFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "waiting_submit", label: "Waiting for submit" },
  { value: "to_review", label: "To review" },
  { value: "completed", label: "Completed" },
];

type HomeworkSelectProps = {
  label?: string;
  value: string;
  options: SelectOption[];
  placeholder: string;
  variant?: "field" | "filter";
  disabled?: boolean;
  searchable?: boolean;
  onChange: (value: string) => void;
};

function HomeworkSelect({
  label,
  value,
  options,
  placeholder,
  variant = "field",
  disabled = false,
  searchable = false,
  onChange,
}: HomeworkSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((option) => option.value === value);
  const filteredOptions =
    searchable && query.trim()
      ? options.filter((option) => option.label.toLowerCase().includes(query.trim().toLowerCase()))
      : options;

  useEffect(() => {
    function closeOnOutsidePointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setQuery("");
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, []);

  const controlClassName =
    variant === "filter"
      ? "flex h-10 w-full items-center justify-between gap-3 rounded-full border border-[#ECECEC] bg-white px-5 text-left font-(family-name:--font-base) text-[20px] leading-none font-normal text-[#121212] shadow-[0_0_4px_rgba(0,0,0,0.06)] outline-none transition focus-within:ring-2 focus-within:ring-[#9DB1FA] focus:ring-2 focus:ring-[#9DB1FA] disabled:cursor-not-allowed disabled:text-[#8A8A8A]"
      : "flex h-14 w-full items-center justify-between gap-3 rounded-md bg-[#ECECEC] px-4 text-left text-[15px] text-[#121212] outline-none transition focus-within:ring-2 focus-within:ring-[#9DB1FA] focus:ring-2 focus:ring-[#9DB1FA] disabled:cursor-not-allowed disabled:text-[#8A8A8A]";

  return (
    <div ref={rootRef} className="relative">
      {label ? <p className="mb-2 text-[14px] font-semibold text-[#121212]">{label}</p> : null}
      {searchable ? (
        <div
          className={`${controlClassName} ${disabled ? "cursor-not-allowed text-[#8A8A8A]" : ""}`}
        >
          <input
            type="text"
            role="combobox"
            aria-expanded={isOpen}
            aria-controls={`${label ?? placeholder}-options`}
            value={isOpen ? query : (selectedOption?.label ?? "")}
            placeholder={placeholder}
            disabled={disabled}
            onFocus={() => setIsOpen(true)}
            onClick={() => setIsOpen(true)}
            onChange={(event) => {
              setQuery(event.target.value);
              setIsOpen(true);
            }}
            className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[#858585] disabled:cursor-not-allowed"
          />
          <button
            type="button"
            aria-label="Toggle options"
            disabled={disabled}
            onClick={() => {
              if (isOpen) setQuery("");
              setIsOpen((current) => !current);
            }}
            className="shrink-0 disabled:cursor-not-allowed"
          >
            <ChevronDown
              size={20}
              aria-hidden="true"
              className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      ) : (
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          disabled={disabled}
          onClick={() => setIsOpen((current) => !current)}
          className={controlClassName}
        >
          <span className="truncate">{selectedOption?.label ?? placeholder}</span>
          <ChevronDown
            size={20}
            aria-hidden="true"
            className={`shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
      )}

      {isOpen ? (
        <div
          role="listbox"
          id={`${label ?? placeholder}-options`}
          aria-label={label ?? placeholder}
          className={
            variant === "filter"
              ? "absolute z-[140] mt-2 max-h-[248px] min-w-[190px] overflow-y-auto rounded-[16px] border border-[#E2E2E2] bg-white py-3 shadow-[0_12px_28px_rgba(0,0,0,0.16)] sm:min-w-[220px]"
              : "absolute z-[140] mt-2 max-h-[248px] w-full overflow-y-auto rounded-[16px] border border-[#E2E2E2] bg-white py-2 shadow-[0_12px_28px_rgba(0,0,0,0.16)]"
          }
        >
          {filteredOptions.length === 0 ? (
            <p className="px-5 py-3 text-[14px] text-[#777]">No matching options</p>
          ) : null}
          {filteredOptions.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value || "__empty"}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value);
                  setQuery("");
                  setIsOpen(false);
                }}
                className={`flex w-full items-center px-5 text-left transition hover:bg-[#F5F7FF] ${
                  variant === "filter" ? "min-h-[46px] text-[20px]" : "min-h-12 text-[17px]"
                } ${isSelected ? "text-[#003AFF]" : "text-[#121212]"}`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

const WEEK_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function toDateValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateValue(value: string): Date | null {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

function sameDate(left: Date | null, right: Date): boolean {
  return Boolean(
    left &&
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate(),
  );
}

function HomeworkDatePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const selectedDate = parseDateValue(value);
  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(
    () =>
      new Date(
        selectedDate?.getFullYear() ?? new Date().getFullYear(),
        selectedDate?.getMonth() ?? new Date().getMonth(),
        1,
      ),
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const monthName = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(
    visibleMonth,
  );
  const days = useMemo(() => {
    const firstDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const start = new Date(firstDay);
    start.setDate(firstDay.getDate() - firstDay.getDay());
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }, [visibleMonth]);

  useEffect(() => {
    function closeOnOutsidePointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <p className="mb-2 text-[14px] font-semibold text-[#121212]">Due date</p>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className="flex h-14 w-full items-center justify-between gap-3 rounded-md bg-[#ECECEC] px-4 text-left text-[15px] text-[#121212] outline-none transition focus:ring-2 focus:ring-[#9DB1FA]"
      >
        <span>{selectedDate ? dateLabel(selectedDate) : "Select a due date"}</span>
        <CalendarDays size={20} aria-hidden="true" />
      </button>

      {isOpen ? (
        <div
          role="dialog"
          aria-label="Choose due date"
          className="absolute z-[140] mt-2 w-[330px] rounded-[16px] bg-[#FAFAFA] p-4 shadow-[0_12px_28px_rgba(0,0,0,0.18)]"
        >
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() =>
                setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))
              }
              className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-[#EEEEEE]"
            >
              <ChevronLeft size={24} aria-hidden="true" />
            </button>
            <p className="text-[16px] font-medium text-[#121212]">{monthName}</p>
            <button
              type="button"
              aria-label="Next month"
              onClick={() =>
                setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))
              }
              className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-[#EEEEEE]"
            >
              <ChevronRight size={24} aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-y-2 text-center">
            {WEEK_DAYS.map((day) => (
              <span key={day} className="text-[14px] text-[#6A6A6A]">
                {day}
              </span>
            ))}
            {days.map((day) => {
              const isVisibleMonth = day.getMonth() === visibleMonth.getMonth();
              const isSelected = sameDate(selectedDate, day);
              return (
                <button
                  key={toDateValue(day)}
                  type="button"
                  onClick={() => {
                    onChange(toDateValue(day));
                    setIsOpen(false);
                  }}
                  className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full text-[16px] transition ${
                    isSelected
                      ? "bg-[radial-gradient(circle_at_25%_25%,#A7BAFA_0%,#A7BAFA_28%,#FCC4C3_68%,#FFF4DA_100%)] text-white"
                      : isVisibleMonth
                        ? "text-[#121212] hover:bg-[#F0F3FF]"
                        : "text-[#D2D2D2]"
                  }`}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function monthLabel(value: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "long" }).format(new Date(value));
}

function dateLabel(value: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

function deadlineLabel(value: string | null): string {
  if (!value) return "No deadline";
  return dateLabel(new Date(value));
}

function cardDateLabel(value: string | null): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit" })
    .format(new Date(value))
    .replace(/\//g, ".");
}

function assignmentDateValue(assignment: HomeworkAssignment): string {
  return assignment.published_at ?? assignment.created_at;
}

function assignmentKind(assignment: HomeworkAssignment): "Task" | "Test" {
  return assignment.test_detail ? "Test" : "Task";
}

function recipientsLabel(assignment: HomeworkAssignment): string {
  if (assignment.recipients.length === 0) {
    return assignment.recipients_count > 0
      ? `${assignment.recipients_count} student${assignment.recipients_count === 1 ? "" : "s"}`
      : "Not sent";
  }

  const names = assignment.recipients.map(
    (recipient) => recipient.student_name || recipient.student_email,
  );
  if (names.length <= 2) return names.join(", ");
  return `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
}

function latestReviewedAt(assignment: HomeworkAssignment): string | null {
  const reviewedTimestamps = assignment.teacher_submissions
    .map((submission) => submission.reviewed_at)
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value).getTime())
    .filter((value) => !Number.isNaN(value));

  if (reviewedTimestamps.length === 0) return null;
  return new Date(Math.max(...reviewedTimestamps)).toISOString();
}

function submissionTimestamp(submission: HomeworkSubmission): number {
  const value = submission.reviewed_at || submission.submitted_at;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function reviewableSubmissions(assignment: HomeworkAssignment): HomeworkSubmission[] {
  return [...assignment.teacher_submissions].sort((first, second) => {
    const firstIsEditable = first.status !== "reviewed";
    const secondIsEditable = second.status !== "reviewed";
    if (firstIsEditable !== secondIsEditable) return firstIsEditable ? -1 : 1;
    return submissionTimestamp(second) - submissionTimestamp(first);
  });
}

function submissionStatusLabel(status: HomeworkSubmission["status"]): string {
  if (status === "reviewed") return "Reviewed";
  if (status === "retrieved") return "Retrieved";
  return "Submitted";
}

function studentSubmissionLabel(submission: HomeworkSubmission): string {
  return submission.student_name || submission.student_email || "Student";
}

function reviewSubmissionForAssignment(assignment: HomeworkAssignment): HomeworkSubmission | null {
  return reviewableSubmissions(assignment)[0] ?? null;
}

function assignmentRecipientCount(assignment: HomeworkAssignment): number {
  return assignment.recipients_count || assignment.recipients.length;
}

function hasWaitingRecipients(assignment: HomeworkAssignment): boolean {
  const recipientCount = assignmentRecipientCount(assignment);
  return (
    assignment.status === "published" &&
    recipientCount > 0 &&
    assignment.teacher_submissions.length < recipientCount
  );
}

function hasUnreviewedSubmission(assignment: HomeworkAssignment): boolean {
  return assignment.teacher_submissions.some((submission) => submission.status !== "reviewed");
}

function hasReviewedSubmission(assignment: HomeworkAssignment): boolean {
  return assignment.teacher_submissions.some((submission) => submission.status === "reviewed");
}

function assignmentMatchesQueue(
  assignment: HomeworkAssignment,
  queue: HomeworkQueueFilter,
): boolean {
  if (queue === "all") return true;
  if (queue === "waiting_submit") return hasWaitingRecipients(assignment);
  if (queue === "to_review") return hasUnreviewedSubmission(assignment);
  return hasReviewedSubmission(assignment);
}

function TeacherHomeworkCard({
  assignment,
  onOpenReview,
}: {
  assignment: HomeworkAssignment;
  onOpenReview: () => void;
}) {
  const kind = assignmentKind(assignment);
  const iconSrc = assignment.course_image ?? "/icons/book-gradient.svg";
  const returnedAt = latestReviewedAt(assignment);
  const submissionsCount = assignment.teacher_submissions.length;

  return (
    <button
      type="button"
      disabled={submissionsCount === 0}
      onClick={onOpenReview}
      className="group grid h-20 w-full max-w-[722px] grid-cols-[60px_minmax(0,1fr)_178px] items-center gap-2.5 rounded-lg bg-white px-3 py-2.5 text-left font-(family-name:--font-base) shadow-[0_0_4px_rgba(0,0,0,0.16)] transition hover:shadow-[0_3px_12px_rgba(0,0,0,0.12)] focus:outline-none focus:ring-2 focus:ring-[#9DB1FA]"
    >
      <span className="flex h-[60px] w-[60px] items-center justify-center overflow-hidden rounded-md">
        <Image
          src={iconSrc}
          alt=""
          width={60}
          height={60}
          unoptimized={!!assignment.course_image}
          aria-hidden="true"
          className="h-[60px] w-[60px] object-contain"
        />
      </span>
      <span className="min-w-0">
        <span className="block h-5 max-w-[244px] truncate text-[16px] leading-5 font-normal text-[#5E5E5E]">
          {assignment.course_title || "Course"} &bull; {kind}
        </span>
        <span className="mt-[7px] block max-w-[393px] truncate text-[20px] leading-none font-medium text-[#121212]">
          {assignment.title}
        </span>
      </span>
      <span className="grid gap-1 text-[11px] leading-none font-normal text-[#5E5E5E]">
        <span className="truncate">
          To: <span className="text-[#121212]">{recipientsLabel(assignment)}</span>
        </span>
        <span>
          Sent: <span className="text-[#003AFF]">{cardDateLabel(assignment.published_at)}</span>
        </span>
        <span>
          Submitted: <span className="text-[#121212]">{submissionsCount}</span>
        </span>
        {returnedAt ? (
          <span>
            Returned: <span className="text-[#003AFF]">{cardDateLabel(returnedAt)}</span>
          </span>
        ) : null}
      </span>
    </button>
  );
}

function HomeworkSubmissionPickerDialog({
  assignment,
  submissions,
  onSelect,
  onClose,
}: {
  assignment: HomeworkAssignment;
  submissions: HomeworkSubmission[];
  onSelect: (submissionId: number) => void;
  onClose: () => void;
}) {
  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[145] flex items-center justify-center bg-[#121212]/45 px-4 py-6"
      onMouseDown={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="homework-submissions-title"
        className="max-h-[calc(100vh-48px)] w-full max-w-[760px] overflow-y-auto rounded-[16px] bg-white px-6 py-6 font-(family-name:--font-base) text-[#121212] shadow-[0_18px_56px_rgba(18,18,18,0.26)] sm:px-8"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E7E7E7] pb-5">
          <div className="min-w-0">
            <p className="text-[12px] font-medium uppercase tracking-wide text-[#5E5E5E]">
              Student submissions
            </p>
            <h2 id="homework-submissions-title" className="mt-1 truncate text-[24px] font-semibold">
              {assignment.title}
            </h2>
            <p className="mt-1 text-sm text-[#5E5E5E]">{assignment.course_title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close submission list"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition hover:bg-[#F1F1F1]"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {submissions.map((submission) => (
            <button
              key={submission.id}
              type="button"
              onClick={() => onSelect(submission.id)}
              className="min-h-[136px] rounded-lg border border-[#E7E7E7] bg-white p-4 text-left shadow-[0_1px_8px_rgba(0,0,0,0.08)] transition hover:border-[#9DB1FA] hover:shadow-[0_5px_18px_rgba(0,0,0,0.12)] focus:outline-none focus:ring-2 focus:ring-[#9DB1FA]"
            >
              <span className="block truncate text-[17px] font-semibold text-[#121212]">
                {studentSubmissionLabel(submission)}
              </span>
              <span className="mt-1 block truncate text-[12px] text-[#5E5E5E]">
                {submission.student_email}
              </span>
              <span className="mt-4 grid gap-1 text-[12px] text-[#5E5E5E]">
                <span>
                  Status:{" "}
                  <span className="text-[#121212]">{submissionStatusLabel(submission.status)}</span>
                </span>
                <span>
                  Submitted:{" "}
                  <span className="text-[#003AFF]">{cardDateLabel(submission.submitted_at)}</span>
                </span>
                {submission.reviewed_at ? (
                  <span>
                    Returned:{" "}
                    <span className="text-[#003AFF]">{cardDateLabel(submission.reviewed_at)}</span>
                  </span>
                ) : null}
                {submission.score != null ? (
                  <span>
                    Score: <span className="text-[#121212]">{submission.score}</span>
                  </span>
                ) : null}
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function buildQuestionPayload(question: TestQuestion) {
  return {
    question_type: question.type,
    text: question.text,
    options: question.type === "multiple_choice" ? question.options : undefined,
    correct_indices: question.type === "multiple_choice" ? question.correct_indices : undefined,
    correct_bool: question.type === "true_false" ? question.correct_bool : undefined,
    sample_answer: question.type === "short_answer" ? question.sample_answer : undefined,
  };
}

type ReviewTarget = {
  assignmentId: number;
  submissionId: number;
};

type SubmissionTestAttempt = NonNullable<HomeworkSubmission["test_attempt"]>;

function HomeworkAttemptReviewDialog({
  assignment,
  submission,
  attempt,
  onClose,
}: {
  assignment: HomeworkAssignment;
  submission: HomeworkSubmission;
  attempt: SubmissionTestAttempt;
  onClose: () => void;
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const title = assignment.test_detail?.title ?? assignment.title;
  const closeButton = (
    <button
      type="button"
      aria-label="Close test attempt"
      onClick={onClose}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#121212] transition hover:bg-[#F1F1F1]"
    >
      <X size={20} aria-hidden="true" />
    </button>
  );

  return (
    <div
      role="presentation"
      className="fixed inset-x-0 top-[76px] bottom-0 z-[170] overflow-y-auto bg-(--color-brand-lavender-soft) px-8 py-[52px]"
      onMouseDown={(event) => {
        event.stopPropagation();
        onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={`${title} submitted attempt`}
        className="mx-auto max-w-[1380px]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <QuizWindow
          title={title}
          description={`Submitted by ${submission.student_name || submission.student_email}`}
          passingScore={attempt.passing_score}
          headerAction={closeButton}
          className="max-w-[1180px]"
        >
          <div className="mb-6 flex flex-wrap items-center gap-3 font-(family-name:--font-base) text-sm">
            <span className="font-semibold text-[#121212]">
              Best test attempt #{attempt.attempt_number}
            </span>
            <span className="rounded bg-[#FFF0D0] px-2 py-1 text-xs text-[#8B5B00]">
              {attempt.score}%
            </span>
            <span className={attempt.passed ? "text-[#067647]" : "text-[#B42318]"}>
              {attempt.passed ? "Passed" : "Not passed"}
            </span>
            <span className="text-[#5E5E5E]">
              Correct: {attempt.correct_count} / {attempt.total_count}
            </span>
          </div>

          <div className="space-y-4">
            {byOrder(attempt.questions).map((question, index) => (
              <QuizQuestionCard key={question.id} mode="review" index={index} graded={question} />
            ))}
          </div>
        </QuizWindow>
      </section>
    </div>
  );
}

function HomeworkReviewDialog({
  assignment,
  submission,
  score,
  feedback,
  saving,
  retrieving,
  error,
  onScoreChange,
  onFeedbackChange,
  onClose,
  onBack,
  onRetrieve,
  onReturn,
}: {
  assignment: HomeworkAssignment;
  submission: HomeworkSubmission;
  score: string;
  feedback: string;
  saving: boolean;
  retrieving: boolean;
  error: string;
  onScoreChange: (value: string) => void;
  onFeedbackChange: (value: string) => void;
  onClose: () => void;
  onBack?: () => void;
  onRetrieve: () => void;
  onReturn: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const attempt = submission.test_attempt;
  const [isAttemptReviewOpen, setIsAttemptReviewOpen] = useState(false);
  const maxScore =
    assignment.max_score != null
      ? Math.min(Math.max(assignment.max_score, HOMEWORK_SCORE_MIN), HOMEWORK_SCORE_MAX)
      : HOMEWORK_SCORE_MAX;
  const isReadOnly = submission.status === "reviewed";
  const busy = saving || retrieving;
  const reviewDisabled = busy || isReadOnly || !score.trim() || !feedback.trim();

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[150] flex items-center justify-center bg-[#121212]/45 px-4 py-6"
      onMouseDown={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="homework-review-title"
        className="max-h-[calc(100vh-48px)] w-full max-w-[1180px] overflow-y-auto rounded-[16px] bg-white px-6 py-6 font-(family-name:--font-base) text-[#121212] shadow-[0_18px_56px_rgba(18,18,18,0.26)] sm:px-8"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E7E7E7] pb-5">
          <div className="min-w-0">
            <p className="text-[12px] font-medium uppercase tracking-wide text-[#5E5E5E]">
              {isReadOnly ? "Homework review - read only" : "Homework review"}
            </p>
            <h2 id="homework-review-title" className="mt-1 truncate text-[24px] font-semibold">
              {assignment.title}
            </h2>
            <p className="mt-1 text-sm text-[#5E5E5E]">
              {submission.student_name || submission.student_email} · {assignment.course_title}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                disabled={busy}
                className="inline-flex h-9 items-center justify-center rounded-full border border-[#E1E1E1] px-4 text-sm font-medium text-[#121212] transition hover:bg-[#F7F7F7] disabled:cursor-not-allowed"
              >
                Back
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              aria-label="Close review"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition hover:bg-[#F1F1F1] disabled:cursor-not-allowed"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            <section className="rounded-lg border border-[#E8E8E8] p-4">
              <h3 className="text-sm font-semibold">Assignment</h3>
              <div className="mt-3 grid gap-3 text-sm text-[#3E3E3E] sm:grid-cols-2">
                <p>
                  <span className="font-medium text-[#121212]">Module:</span>{" "}
                  {assignment.module_title || "Not selected"}
                </p>
                <p>
                  <span className="font-medium text-[#121212]">Lesson:</span>{" "}
                  {assignment.lesson_title || "Not selected"}
                </p>
                <p>
                  <span className="font-medium text-[#121212]">Due:</span>{" "}
                  {deadlineLabel(assignment.due_at)}
                </p>
                <p>
                  <span className="font-medium text-[#121212]">Max score:</span> {maxScore}
                </p>
              </div>
              {assignment.description ? (
                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[#333]">
                  {assignment.description}
                </p>
              ) : null}
              {assignment.test_detail ? (
                <div className="mt-4 rounded-md bg-[#EEF4FF] px-3 py-2 text-sm text-[#24376F]">
                  <p className="font-medium">Test attachment: {assignment.test_detail.title}</p>
                  <p className="mt-1 text-xs">
                    {assignment.test_detail.questions.length} question(s), passing score{" "}
                    {assignment.test_detail.passing_score}%
                  </p>
                </div>
              ) : null}
              {assignment.attachments.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  {assignment.attachments.map((attachment) =>
                    attachment.url ? (
                      <a
                        key={attachment.id}
                        href={attachment.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded bg-[#F0F3FF] px-3 py-2 text-[#3851B0] hover:underline"
                      >
                        {attachment.original_name}
                      </a>
                    ) : null,
                  )}
                </div>
              ) : null}
            </section>

            <section className="rounded-lg border border-[#E8E8E8] p-4">
              <h3 className="text-sm font-semibold">Student submission</h3>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-[#5E5E5E]">
                <span>Submitted: {deadlineLabel(submission.submitted_at)}</span>
                {submission.reviewed_at ? (
                  <span>Returned: {deadlineLabel(submission.reviewed_at)}</span>
                ) : null}
                <span>Status: {submissionStatusLabel(submission.status)}</span>
              </div>
              {submission.content ? (
                <p className="mt-4 whitespace-pre-wrap rounded-md bg-[#F7F7F7] px-3 py-3 text-sm leading-6 text-[#303030]">
                  {submission.content}
                </p>
              ) : (
                <p className="mt-4 text-sm text-[#6A6A6A]">No text answer submitted.</p>
              )}
              {submission.attachments.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  {submission.attachments.map((attachment) =>
                    attachment.url ? (
                      <a
                        key={attachment.id}
                        href={attachment.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded bg-[#F0F3FF] px-3 py-2 text-[#3851B0] hover:underline"
                      >
                        {attachment.original_name}
                      </a>
                    ) : null,
                  )}
                </div>
              ) : null}

              {attempt ? (
                <button
                  type="button"
                  onClick={() => setIsAttemptReviewOpen(true)}
                  className="mt-4 flex w-full max-w-[420px] items-center gap-3 rounded-md bg-[#F0F3FF] px-3 py-2 text-left text-sm text-[#3851B0] transition hover:bg-[#E7ECFF] focus:outline-none focus:ring-2 focus:ring-[#9DB1FA]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[linear-gradient(135deg,#FCC4C3_0%,#A7BAFA_100%)]">
                    <Image
                      src="/icons/test.svg"
                      alt=""
                      width={22}
                      height={22}
                      className="h-5 w-5"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-[#121212]">
                      Best test attempt #{attempt.attempt_number}
                    </span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-2 text-xs">
                      <span>{attempt.score}%</span>
                      <span className={attempt.passed ? "text-[#067647]" : "text-[#B42318]"}>
                        {attempt.passed ? "Passed" : "Not passed"}
                      </span>
                    </span>
                  </span>
                </button>
              ) : assignment.test_detail ? (
                <p className="mt-4 rounded-md bg-[#FFF5F5] px-3 py-2 text-sm text-[#B42318]">
                  No test attempt was submitted with this homework.
                </p>
              ) : null}
            </section>
          </div>

          <form
            onSubmit={(event) => {
              if (isReadOnly) {
                event.preventDefault();
                return;
              }
              onReturn(event);
            }}
            className="h-fit rounded-lg border border-[#E8E8E8] p-4"
          >
            <h3 className="text-sm font-semibold">Return to student</h3>
            {isReadOnly ? (
              <p className="mt-3 rounded-md bg-[#F7F7F7] px-3 py-2 text-xs leading-5 text-[#5E5E5E]">
                This returned review is read-only. Retrieve it before editing and sending it back.
              </p>
            ) : null}
            <label className="mt-4 grid gap-2 text-sm font-medium">
              Score / {maxScore}
              <input
                type="number"
                min={HOMEWORK_SCORE_MIN}
                max={maxScore}
                step="1"
                value={score}
                onChange={(event) => onScoreChange(event.target.value)}
                disabled={busy || isReadOnly}
                className="h-11 rounded-md bg-[#ECECEC] px-3 text-sm outline-none transition focus:ring-2 focus:ring-[#9DB1FA] disabled:cursor-not-allowed"
              />
            </label>
            <label className="mt-4 grid gap-2 text-sm font-medium">
              Comment
              <textarea
                rows={8}
                value={feedback}
                onChange={(event) => onFeedbackChange(event.target.value)}
                disabled={busy || isReadOnly}
                className="resize-none rounded-md bg-[#ECECEC] px-3 py-3 text-sm outline-none transition focus:ring-2 focus:ring-[#9DB1FA] disabled:cursor-not-allowed"
              />
            </label>
            {error ? (
              <p role="alert" className="mt-3 text-sm text-[#B42318]">
                {error}
              </p>
            ) : null}
            {isReadOnly ? (
              <button
                type="button"
                onClick={onRetrieve}
                disabled={busy}
                className="mt-5 h-10 w-full rounded-full bg-[#121212] px-5 text-sm font-medium text-white transition hover:bg-[#303030] disabled:cursor-not-allowed disabled:bg-[#BFBFBF]"
              >
                {retrieving ? "Retrieving..." : "Retrieve"}
              </button>
            ) : (
              <button
                type="submit"
                disabled={reviewDisabled}
                className="mt-5 h-10 w-full rounded-full bg-[#121212] px-5 text-sm font-medium text-white transition hover:bg-[#303030] disabled:cursor-not-allowed disabled:bg-[#BFBFBF]"
              >
                {saving ? "Returning..." : "Return reviewed homework"}
              </button>
            )}
          </form>
        </div>
      </section>
      {attempt && isAttemptReviewOpen ? (
        <HomeworkAttemptReviewDialog
          assignment={assignment}
          submission={submission}
          attempt={attempt}
          onClose={() => setIsAttemptReviewOpen(false)}
        />
      ) : null}
    </div>
  );
}

export default function TeacherHomeworkPage() {
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [selectedCourseSlug, setSelectedCourseSlug] = useState("");
  const [assignments, setAssignments] = useState<HomeworkAssignment[]>([]);
  const [modalCourse, setModalCourse] = useState<CourseDetail | null>(null);
  const [modalModules, setModalModules] = useState<CourseModule[]>([]);
  const [modalAssignments, setModalAssignments] = useState<HomeworkAssignment[]>([]);
  const [availableRecipients, setAvailableRecipients] = useState<HomeworkAvailableRecipient[]>([]);
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<number[]>([]);
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [queueFilter, setQueueFilter] = useState<HomeworkQueueFilter>("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [reviewSelectionAssignmentId, setReviewSelectionAssignmentId] = useState<number | null>(
    null,
  );
  const [isReviewSelectionOpen, setIsReviewSelectionOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<ReviewTarget | null>(null);
  const [reviewScore, setReviewScore] = useState("");
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewRetrieving, setReviewRetrieving] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingTest, setSavingTest] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    getTeacherCourses()
      .then((result) => {
        setCourses(result.results);
        setSelectedCourseSlug(result.results[0]?.slug || "");
      })
      .catch(() => setError("Could not load your courses."))
      .finally(() => setLoadingCourses(false));
  }, []);

  useEffect(() => {
    if (!selectedCourseSlug) {
      setAssignments([]);
      return;
    }

    let cancelled = false;
    setLoadingAssignments(true);

    getHomeworkAssignments(selectedCourseSlug)
      .then((homework) => {
        if (cancelled) return;
        setAssignments(homework);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load homework for this course.");
      })
      .finally(() => {
        if (!cancelled) setLoadingAssignments(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCourseSlug]);

  useEffect(() => {
    if (!isModalOpen || !form.courseSlug) {
      setModalCourse(null);
      setModalModules([]);
      setModalAssignments([]);
      return;
    }

    let cancelled = false;
    Promise.all([getCourseBySlug(form.courseSlug), getHomeworkAssignments(form.courseSlug)])
      .then(([course, homework]) => {
        if (cancelled) return;
        setModalCourse(course);
        setModalModules(course.modules);
        setModalAssignments(homework);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load course homework data.");
      });

    return () => {
      cancelled = true;
    };
  }, [form.courseSlug, isModalOpen]);

  useEffect(() => {
    if (!isModalOpen || !form.courseSlug) {
      setAvailableRecipients([]);
      setSelectedRecipientIds([]);
      return;
    }

    let cancelled = false;
    getHomeworkRecipients(form.courseSlug)
      .then((recipients) => {
        if (!cancelled) {
          setAvailableRecipients(recipients);
          setSelectedRecipientIds([]);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Could not load course students.");
      });

    return () => {
      cancelled = true;
    };
  }, [form.courseSlug, isModalOpen]);

  const statusFilteredAssignments = useMemo(
    () =>
      assignments.filter(
        (assignment) => statusFilter === "all" || assignment.status === statusFilter,
      ),
    [assignments, statusFilter],
  );
  const visibleAssignments = useMemo(
    () =>
      statusFilteredAssignments.filter((assignment) =>
        assignmentMatchesQueue(assignment, queueFilter),
      ),
    [queueFilter, statusFilteredAssignments],
  );
  const assignmentsByMonth = useMemo(() => {
    const result = new Map<string, HomeworkAssignment[]>();
    [...visibleAssignments]
      .sort(
        (first, second) =>
          new Date(assignmentDateValue(second)).getTime() -
          new Date(assignmentDateValue(first)).getTime(),
      )
      .forEach((assignment) => {
        const month = monthLabel(assignmentDateValue(assignment));
        result.set(month, [...(result.get(month) ?? []), assignment]);
      });
    return [...result.entries()];
  }, [visibleAssignments]);
  const recipientGroups = useMemo<RecipientGroupOption[]>(() => {
    const activeEnrollmentIds = new Set(availableRecipients.map((recipient) => recipient.id));
    const groups: RecipientGroupOption[] = [];

    if (availableRecipients.length > 0) {
      groups.push({
        value: "all",
        label: `All enrolled students (${availableRecipients.length})`,
        enrollmentIds: availableRecipients.map((recipient) => recipient.id),
      });
    }

    modalCourse?.cohorts.forEach((cohort) => {
      const enrollmentIds = cohort.members
        .map((member) => member.enrollment_id)
        .filter((id) => activeEnrollmentIds.has(id));
      if (enrollmentIds.length === 0) return;
      groups.push({
        value: `cohort:${cohort.id}`,
        label: `${cohort.name || `Group ${cohort.id}`} (${enrollmentIds.length})`,
        enrollmentIds,
      });
    });

    availableRecipients
      .filter((recipient) => recipient.delivery_format_type === "individual")
      .forEach((recipient) => {
        groups.push({
          value: `individual:${recipient.id}`,
          label: `${recipient.student_name || recipient.student_email} (individual)`,
          enrollmentIds: [recipient.id],
        });
      });

    return groups;
  }, [availableRecipients, modalCourse]);
  const selectedModalModule = useMemo(
    () => modalModules.find((module) => String(module.id) === form.moduleId) ?? null,
    [form.moduleId, modalModules],
  );
  const selectedTest = useMemo(
    () =>
      modalModules
        .flatMap((module) => module.tests)
        .find((test) => String(test.id) === form.testId) ?? null,
    [form.testId, modalModules],
  );
  const reviewAssignment = useMemo(
    () =>
      reviewTarget
        ? (assignments.find((assignment) => assignment.id === reviewTarget.assignmentId) ?? null)
        : null,
    [assignments, reviewTarget],
  );
  const reviewSubmission = useMemo(
    () =>
      reviewAssignment && reviewTarget
        ? (reviewAssignment.teacher_submissions.find(
            (submission) => submission.id === reviewTarget.submissionId,
          ) ?? null)
        : null,
    [reviewAssignment, reviewTarget],
  );
  const reviewSelectionAssignment = useMemo(
    () =>
      reviewSelectionAssignmentId
        ? (assignments.find((assignment) => assignment.id === reviewSelectionAssignmentId) ?? null)
        : null,
    [assignments, reviewSelectionAssignmentId],
  );
  const reviewSelectionSubmissions = useMemo(
    () => (reviewSelectionAssignment ? reviewableSubmissions(reviewSelectionAssignment) : []),
    [reviewSelectionAssignment],
  );
  const isSaveDisabled =
    saving ||
    !form.courseSlug ||
    !form.moduleId ||
    !form.lessonId ||
    !form.title.trim() ||
    (!form.testId && !form.description.trim()) ||
    selectedRecipientIds.length === 0;

  useEffect(() => {
    if (!reviewSubmission) {
      setReviewScore("");
      setReviewFeedback("");
      return;
    }
    setReviewScore(reviewSubmission.score != null ? String(reviewSubmission.score) : "");
    setReviewFeedback(reviewSubmission.feedback ?? "");
    setReviewError("");
  }, [reviewSubmission]);

  function openModal() {
    setError("");
    setSuccess("");
    setForm({
      ...EMPTY_FORM,
      courseSlug: selectedCourseSlug || courses[0]?.slug || "",
    });
    setAttachmentFiles([]);
    setIsModalOpen(true);
  }

  function closeModal() {
    if (!saving) {
      setAttachmentFiles([]);
      setIsTestModalOpen(false);
      setIsModalOpen(false);
    }
  }

  function openReview(assignmentId: number, submissionId: number, fromSelection = false) {
    setReviewTarget({ assignmentId, submissionId });
    if (!fromSelection) setReviewSelectionAssignmentId(null);
    setIsReviewSelectionOpen(false);
    setSuccess("");
    setReviewError("");
  }

  function openAssignmentReview(assignment: HomeworkAssignment) {
    const submissions = reviewableSubmissions(assignment);
    if (submissions.length === 0) {
      setError("No submitted homework to review yet.");
      return;
    }
    if (submissions.length > 1) {
      setReviewSelectionAssignmentId(assignment.id);
      setIsReviewSelectionOpen(true);
      setSuccess("");
      setReviewError("");
      return;
    }
    const submission = reviewSubmissionForAssignment(assignment);
    if (!submission) return;
    openReview(assignment.id, submission.id);
  }

  function closeReview() {
    if (!reviewSaving && !reviewRetrieving) {
      setReviewTarget(null);
      setReviewSelectionAssignmentId(null);
      setIsReviewSelectionOpen(false);
    }
  }

  function closeReviewSelection() {
    if (!reviewSaving && !reviewRetrieving) {
      setReviewSelectionAssignmentId(null);
      setIsReviewSelectionOpen(false);
    }
  }

  function backToReviewSelection() {
    if (!reviewSaving && !reviewRetrieving) {
      setReviewTarget(null);
      setIsReviewSelectionOpen(true);
    }
  }

  function updateField(field: keyof FormState, value: string) {
    if (field === "recipientGroupId") {
      const group = recipientGroups.find((option) => option.value === value);
      setSelectedRecipientIds(group?.enrollmentIds ?? []);
    }

    if (field === "courseSlug") {
      setModalCourse(null);
      setModalModules([]);
      setModalAssignments([]);
      setAvailableRecipients([]);
      setSelectedRecipientIds([]);
    }

    setForm((current) => {
      const next = { ...current, [field]: value };

      if (field === "courseSlug") {
        return {
          ...next,
          sourceAssignmentId: "",
          moduleId: "",
          lessonId: "",
          recipientGroupId: "",
          testId: "",
        };
      }

      if (field === "moduleId") {
        return {
          ...next,
          lessonId: "",
          testId: "",
        };
      }

      if (field === "sourceAssignmentId") {
        const sourceAssignment = modalAssignments.find(
          (assignment) => String(assignment.id) === value,
        );
        if (!sourceAssignment) return next;
        const inheritedMaxScore =
          sourceAssignment.max_score != null
            ? Math.min(Math.max(sourceAssignment.max_score, HOMEWORK_SCORE_MIN), HOMEWORK_SCORE_MAX)
            : HOMEWORK_SCORE_MAX;
        return {
          ...next,
          moduleId: sourceAssignment.module ? String(sourceAssignment.module) : "",
          lessonId: sourceAssignment.lesson ? String(sourceAssignment.lesson) : "",
          testId: sourceAssignment.test ? String(sourceAssignment.test) : "",
          title: sourceAssignment.title,
          description: sourceAssignment.description,
          maxScore: String(inheritedMaxScore),
        };
      }

      return next;
    });
    setError("");
  }

  function addAttachmentFiles(files: FileList | null) {
    if (!files) return;
    const selectedFiles = Array.from(files);
    const tooLarge = selectedFiles.find((file) => file.size > 25 * 1024 * 1024);
    if (tooLarge) {
      setError(`\"${tooLarge.name}\" exceeds the 25 MB file limit.`);
      return;
    }
    setAttachmentFiles((current) => [...current, ...selectedFiles]);
    setError("");
  }

  async function handleCreateTest(values: TestFormValues) {
    if (!form.courseSlug || !form.moduleId || savingTest) return;

    const moduleId = Number(form.moduleId);
    setSavingTest(true);
    setError("");

    try {
      const test = await createTest(form.courseSlug, moduleId, {
        title: values.title.trim(),
        description: values.description.trim() || undefined,
        passing_score: values.passing_score ? parseInt(values.passing_score, 10) : 70,
      });
      const questions = await Promise.all(
        values.questions.map((question) =>
          createQuestion(form.courseSlug, moduleId, test.id, buildQuestionPayload(question)),
        ),
      );
      const savedTest = { ...test, questions };
      setModalModules((current) =>
        current.map((module) =>
          module.id === moduleId ? { ...module, tests: [...module.tests, savedTest] } : module,
        ),
      );
      setForm((current) => ({ ...current, testId: String(savedTest.id) }));
      setIsTestModalOpen(false);
    } catch (requestError) {
      const apiError = requestError as Partial<ApiError>;
      setError(apiError.detail || apiError.message || "Could not create the test.");
    } finally {
      setSavingTest(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.courseSlug || saving) return;

    const maxScore = form.maxScore ? Number(form.maxScore) : undefined;
    if (
      maxScore !== undefined &&
      (!Number.isInteger(maxScore) ||
        maxScore < HOMEWORK_SCORE_MIN ||
        maxScore > HOMEWORK_SCORE_MAX)
    ) {
      setError(`Maximum score must be a whole number from ${HOMEWORK_SCORE_MIN} to ${HOMEWORK_SCORE_MAX}.`);
      return;
    }

    setSaving(true);
    setError("");

    try {
      const assignment = await createHomeworkAssignment(form.courseSlug, {
        source_assignment: form.sourceAssignmentId ? Number(form.sourceAssignmentId) : undefined,
        module: form.moduleId ? Number(form.moduleId) : undefined,
        lesson: form.lessonId ? Number(form.lessonId) : undefined,
        test: form.testId ? Number(form.testId) : undefined,
        title: form.title.trim(),
        description: form.description.trim(),
        due_at: form.dueAt ? new Date(`${form.dueAt}T23:59:00`).toISOString() : undefined,
        max_score: maxScore,
      });
      await Promise.all(
        attachmentFiles.map((file) =>
          uploadHomeworkAssignmentAttachment(form.courseSlug, assignment.id, file),
        ),
      );
      const publishedAssignment = await publishHomeworkAssignment(
        form.courseSlug,
        assignment.id,
        selectedRecipientIds,
      );
      if (selectedCourseSlug === form.courseSlug) {
        setAssignments((current) => [publishedAssignment, ...current]);
      } else {
        setSelectedCourseSlug(form.courseSlug);
      }
      setSuccess(`Homework sent to ${selectedRecipientIds.length} student(s).`);
      setIsModalOpen(false);
    } catch (requestError) {
      const apiError = requestError as Partial<ApiError>;
      setError(apiError.detail || apiError.message || "Could not save the homework draft.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRetrieveSubmission() {
    if (!reviewAssignment || !reviewSubmission || reviewRetrieving) return;

    setReviewRetrieving(true);
    setReviewError("");
    try {
      const updated = await retrieveHomeworkSubmission(
        reviewAssignment.course_slug,
        reviewAssignment.id,
        reviewSubmission.id,
      );
      setAssignments((current) =>
        current.map((assignment) =>
          assignment.id === reviewAssignment.id
            ? {
                ...assignment,
                teacher_submissions: assignment.teacher_submissions.map((submission) =>
                  submission.id === updated.id ? updated : submission,
                ),
              }
            : assignment,
        ),
      );
      setSuccess("Homework retrieved for editing.");
    } catch (requestError) {
      const apiError = requestError as Partial<ApiError>;
      setReviewError(apiError.detail || apiError.message || "Could not retrieve homework.");
    } finally {
      setReviewRetrieving(false);
    }
  }

  async function handleReturnSubmission(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reviewAssignment || !reviewSubmission || reviewSaving) return;
    if (reviewSubmission.status === "reviewed") {
      setReviewError("Click Retrieve before editing this returned homework.");
      return;
    }

    const score = Number(reviewScore);
    const maxScore =
      reviewAssignment.max_score != null
        ? Math.min(Math.max(reviewAssignment.max_score, HOMEWORK_SCORE_MIN), HOMEWORK_SCORE_MAX)
        : HOMEWORK_SCORE_MAX;
    if (!Number.isInteger(score) || score < HOMEWORK_SCORE_MIN || score > maxScore) {
      setReviewError(`Score must be a whole number from ${HOMEWORK_SCORE_MIN} to ${maxScore}.`);
      return;
    }
    const feedback = reviewFeedback.trim();
    if (!feedback) {
      setReviewError("Comment is required.");
      return;
    }

    setReviewSaving(true);
    setReviewError("");
    try {
      const updated = await reviewHomeworkSubmission(
        reviewAssignment.course_slug,
        reviewAssignment.id,
        reviewSubmission.id,
        { score, feedback },
      );
      setAssignments((current) =>
        current.map((assignment) =>
          assignment.id === reviewAssignment.id
            ? {
                ...assignment,
                teacher_submissions: assignment.teacher_submissions.map((submission) =>
                  submission.id === updated.id ? updated : submission,
                ),
              }
            : assignment,
        ),
      );
      setSuccess("Homework returned to the student.");
      setReviewTarget(null);
      setReviewSelectionAssignmentId(null);
      setIsReviewSelectionOpen(false);
    } catch (requestError) {
      const apiError = requestError as Partial<ApiError>;
      setReviewError(apiError.detail || apiError.message || "Could not return homework.");
    } finally {
      setReviewSaving(false);
    }
  }

  return (
    <PageShell className="relative isolate overflow-hidden bg-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[-257px] left-[113px] z-0 h-[1002px] w-[1368px] rotate-[-33.8deg] bg-[#FCC4C3] opacity-50 blur-[300px]"
      />
      <section className="relative z-10 w-full max-w-[1710px] font-(family-name:--font-base)">
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
          <h1 className="sr-only">Homework</h1>
          <nav aria-label="Homework queues" className="flex flex-wrap items-center gap-[50px]">
            {HOMEWORK_QUEUE_TABS.map((tab) => {
              const active = queueFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setQueueFilter(tab.value)}
                  className={`inline-flex h-9 items-center font-(family-name:--font-base) text-[24px] leading-none font-semibold text-[#121212] transition ${
                    active ? "" : "hover:text-[#003AFF]"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
          <button
            type="button"
            onClick={openModal}
            disabled={loadingCourses || courses.length === 0}
            className="inline-flex h-[52px] w-[240px] shrink-0 items-center justify-center gap-2.5 rounded-[28px] bg-[linear-gradient(90deg,#A7BAFA_0%,#FCC4C3_55%,#FFF4DA_100%)] px-7 py-2.5 font-(family-name:--font-accent) text-[20px] leading-[30px] font-medium text-[#121212] uppercase transition hover:brightness-[0.98] focus:outline-none focus:ring-2 focus:ring-[#9DB1FA] disabled:cursor-not-allowed disabled:grayscale disabled:opacity-60"
          >
            <span className="whitespace-nowrap">Add homework</span>
            <Image
              src="/icons/cross.svg"
              alt=""
              width={21}
              height={21}
              aria-hidden="true"
              className="h-[21px] w-[21px] shrink-0"
            />
          </button>
        </div>

        <div className="mt-3 flex h-10 w-[min(100%,1020px)] items-center gap-2">
          <div className="w-[260px] shrink-0">
            <HomeworkSelect
              value={selectedCourseSlug}
              options={courses.map((course) => ({ value: course.slug, label: course.title }))}
              placeholder="Subject"
              variant="filter"
              disabled={loadingCourses || courses.length === 0}
              onChange={setSelectedCourseSlug}
            />
          </div>
          <div className="w-[190px] shrink-0">
            <HomeworkSelect
              value={statusFilter}
              options={[
                { value: "all", label: "Status" },
                { value: "draft", label: "Drafts" },
                { value: "published", label: "Published" },
                { value: "closed", label: "Closed" },
              ]}
              placeholder="Status"
              variant="filter"
              onChange={setStatusFilter}
            />
          </div>
          <span className="hidden">Group — soon</span>
          <span className="hidden">Student — soon</span>
          <span className="inline-flex h-10 items-center rounded-full border border-[#ECECEC] bg-white px-5 font-(family-name:--font-base) text-[20px] leading-none font-normal text-[#121212] shadow-[0_0_4px_rgba(0,0,0,0.06)]">
            Total Assignments:
          </span>
          <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-[#ECECEC] bg-white px-3 font-(family-name:--font-base) text-[20px] leading-none font-normal text-[#121212] shadow-[0_0_4px_rgba(0,0,0,0.06)]">
            {visibleAssignments.length}
          </span>
        </div>

        {error && !isModalOpen ? (
          <p role="alert" className="mt-5 text-sm text-[#B42318]">
            {error}
          </p>
        ) : null}
        {success ? (
          <p role="status" className="mt-5 text-sm text-[#067647]">
            {success}
          </p>
        ) : null}

        <div className="mt-14">
          {loadingAssignments ? (
            <p className="text-sm text-[#6A6A6A]">Loading assignments...</p>
          ) : assignmentsByMonth.length === 0 ? (
            <div className="max-w-[722px] rounded-xl border border-dashed border-[#D9D4CB] bg-white/70 px-6 py-14 text-center">
              <ClipboardList className="mx-auto text-[#9DAEF3]" size={34} aria-hidden="true" />
              <h2 className="mt-3 text-base font-semibold text-[#121212]">No homework yet</h2>
              <p className="mt-1 text-sm text-[#6A6A6A]">
                Create the first draft for the selected subject.
              </p>
            </div>
          ) : (
            <div className="space-y-11">
              {assignmentsByMonth.map(([month, items]) => (
                <section key={month}>
                  <h2 className="mb-6 text-[28px] leading-none font-normal text-[#121212]">
                    {month}
                  </h2>
                  <div className="grid gap-x-5 gap-y-6 2xl:grid-cols-[minmax(0,722px)_minmax(0,722px)]">
                    {items.map((assignment) => {
                      return (
                        <article key={assignment.id} className="w-full max-w-[722px]">
                          <TeacherHomeworkCard
                            assignment={assignment}
                            onOpenReview={() => openAssignmentReview(assignment)}
                          />
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </section>

      {reviewAssignment && reviewSubmission ? (
        <HomeworkReviewDialog
          assignment={reviewAssignment}
          submission={reviewSubmission}
          score={reviewScore}
          feedback={reviewFeedback}
          saving={reviewSaving}
          retrieving={reviewRetrieving}
          error={reviewError}
          onScoreChange={setReviewScore}
          onFeedbackChange={setReviewFeedback}
          onClose={closeReview}
          onBack={reviewSelectionAssignment ? backToReviewSelection : undefined}
          onRetrieve={handleRetrieveSubmission}
          onReturn={handleReturnSubmission}
        />
      ) : null}

      {reviewSelectionAssignment && isReviewSelectionOpen && reviewSelectionSubmissions.length > 1 ? (
        <HomeworkSubmissionPickerDialog
          assignment={reviewSelectionAssignment}
          submissions={reviewSelectionSubmissions}
          onSelect={(submissionId) => openReview(reviewSelectionAssignment.id, submissionId, true)}
          onClose={closeReviewSelection}
        />
      ) : null}

      {isModalOpen ? (
        <div
          role="presentation"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#B7C7FA]/80 px-4 py-6"
          onMouseDown={closeModal}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="homework-dialog-title"
            className="max-h-[calc(100vh-48px)] w-full max-w-[1240px] overflow-y-auto rounded-[16px] bg-white px-6 py-7 shadow-[0_18px_56px_rgba(38,58,130,0.25)] sm:px-[50px] sm:py-[40px]"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4">
              <h2
                id="homework-dialog-title"
                className="flex items-center gap-2 text-[18px] font-semibold text-[#121212]"
              >
                <ClipboardList size={16} aria-hidden="true" />
                Edit Homework
              </h2>
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close dialog"
                className="rounded-full p-1 text-[#121212] transition hover:bg-[#F1F1F1] disabled:cursor-not-allowed"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-7">
              <div className="grid gap-5 sm:grid-cols-2">
                <HomeworkSelect
                  label="Subject*"
                  value={form.courseSlug}
                  options={courses.map((course) => ({ value: course.slug, label: course.title }))}
                  placeholder="Select a subject"
                  disabled={saving || courses.length === 0}
                  onChange={(value) => updateField("courseSlug", value)}
                />
                <HomeworkSelect
                  label="Reuse previous homework"
                  value={form.sourceAssignmentId}
                  options={[
                    { value: "", label: "Start from scratch" },
                    ...modalAssignments.map((assignment) => ({
                      value: String(assignment.id),
                      label: `${assignment.title} (${assignment.status})`,
                    })),
                  ]}
                  placeholder={
                    modalAssignments.length === 0 ? "No previous homework" : "Choose a template"
                  }
                  disabled={saving || !form.courseSlug || modalAssignments.length === 0}
                  onChange={(value) => updateField("sourceAssignmentId", value)}
                />
              </div>

              <label className="mt-6 grid gap-2 text-[14px] font-semibold text-[#121212]">
                Title*
                <input
                  value={form.title}
                  onChange={(event) => updateField("title", event.target.value)}
                  maxLength={255}
                  required
                  disabled={saving}
                  placeholder="Enter homework title"
                  className="h-14 rounded-md bg-[#ECECEC] px-4 text-[15px] outline-none transition placeholder:text-[#858585] focus:ring-2 focus:ring-[#9DB1FA] disabled:cursor-not-allowed"
                />
              </label>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <HomeworkSelect
                  label="Module*"
                  value={form.moduleId}
                  options={modalModules.map((module) => ({
                    value: String(module.id),
                    label: module.title,
                  }))}
                  placeholder={
                    modalModules.length === 0 ? "No modules available" : "Select a module"
                  }
                  disabled={saving || !form.courseSlug || modalModules.length === 0}
                  onChange={(value) => updateField("moduleId", value)}
                />
                <HomeworkSelect
                  label="Lesson*"
                  value={form.lessonId}
                  options={(selectedModalModule?.lessons ?? []).map((lesson) => ({
                    value: String(lesson.id),
                    label: lesson.title,
                  }))}
                  placeholder={
                    form.moduleId
                      ? selectedModalModule?.lessons.length
                        ? "Select a lesson"
                        : "No lessons in this module"
                      : "Select a module first"
                  }
                  disabled={saving || !form.moduleId || !selectedModalModule?.lessons.length}
                  onChange={(value) => updateField("lessonId", value)}
                />
              </div>

              <div className="mt-6 rounded-md border border-[#E1E1E1] bg-[#FAFAFA] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <HomeworkSelect
                      label="Test as homework"
                      value={form.testId}
                      options={[
                        { value: "", label: "No test" },
                        ...(selectedModalModule?.tests ?? []).map((test) => ({
                          value: String(test.id),
                          label: test.title,
                        })),
                      ]}
                      placeholder={
                        form.moduleId
                          ? selectedModalModule?.tests.length
                            ? "Select an existing test"
                            : "No tests in this module"
                          : "Select a module first"
                      }
                      disabled={saving || !form.moduleId}
                      onChange={(value) => updateField("testId", value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsTestModalOpen(true)}
                    disabled={saving || !form.moduleId}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#CFCFCF] bg-white px-4 text-[13px] font-medium text-[#121212] transition hover:bg-[#F4F4F4] disabled:cursor-not-allowed disabled:text-[#A3A3A3]"
                  >
                    <Plus size={15} aria-hidden="true" />
                    Create test
                  </button>
                </div>
                {selectedTest ? (
                  <div className="mt-3 rounded-md bg-white px-3 py-2 text-[12px] text-[#3E3E3E]">
                    <p className="font-medium text-[#121212]">{selectedTest.title}</p>
                    <p className="mt-1 text-[#6A6A6A]">
                      {selectedTest.questions.length} question(s), passing score{" "}
                      {selectedTest.passing_score}
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="mt-6">
                <p className="mb-2 text-[14px] font-semibold text-[#121212]">Group or student*</p>
                {availableRecipients.length === 0 ? (
                  <p className="mt-2 text-[12px] text-[#A44]">
                    No active students are enrolled in this course.
                  </p>
                ) : (
                  <div>
                    <HomeworkSelect
                      value={form.recipientGroupId}
                      options={recipientGroups}
                      placeholder="Select a group or individual student"
                      disabled={saving || recipientGroups.length === 0}
                      onChange={(value) => updateField("recipientGroupId", value)}
                    />
                    {selectedRecipientIds.length > 0 ? (
                      <div className="mt-2 max-h-28 overflow-y-auto rounded-md border border-[#D8D8D8] bg-[#FAFAFA] p-3 text-[12px] text-[#3E3E3E]">
                        {availableRecipients
                          .filter((recipient) => selectedRecipientIds.includes(recipient.id))
                          .map((recipient) => (
                            <p key={recipient.id} className="truncate">
                              {recipient.student_name || recipient.student_email}
                              <span className="text-[#777]"> · {recipient.student_email}</span>
                            </p>
                          ))}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              <label className="mt-6 grid gap-2 text-[14px] font-semibold text-[#121212]">
                Homework content{form.testId ? "" : "*"}
                <textarea
                  value={form.description}
                  onChange={(event) => updateField("description", event.target.value)}
                  required={!form.testId}
                  disabled={saving}
                  rows={10}
                  placeholder={
                    form.testId
                      ? "Optional instructions for this test homework."
                      : "Write your homework content here... You can include text, instructions, and explanations."
                  }
                  className="h-[300px] resize-none rounded-md bg-[#ECECEC] px-4 py-4 text-[15px] outline-none transition placeholder:text-[#858585] focus:ring-2 focus:ring-[#9DB1FA] disabled:cursor-not-allowed"
                />
              </label>
              <p className="mt-2 text-[12px] text-[#6A6A6A]">
                {form.testId
                  ? "Students will receive the selected test. Extra instructions are optional."
                  : "This is the main content students will read."}
              </p>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <HomeworkDatePicker
                  value={form.dueAt}
                  onChange={(value) => updateField("dueAt", value)}
                />
                <label className="grid gap-2 text-[14px] font-semibold text-[#121212]">
                  Maximum score (1-5)
                  <input
                    type="number"
                    min={HOMEWORK_SCORE_MIN}
                    max={HOMEWORK_SCORE_MAX}
                    step="1"
                    value={form.maxScore}
                    onChange={(event) => updateField("maxScore", event.target.value)}
                    disabled={saving}
                    placeholder="5"
                    className="h-14 rounded-md bg-[#ECECEC] px-4 text-[15px] outline-none transition placeholder:text-[#858585] focus:ring-2 focus:ring-[#9DB1FA] disabled:cursor-not-allowed"
                  />
                </label>
              </div>

              <div className="mt-6">
                <p className="text-[14px] font-semibold text-[#121212]">Homework Material</p>
                <div className="mt-2 flex min-h-[208px] flex-col items-center justify-center rounded-md border border-dashed border-[#C9C9C9] px-4 py-5 text-center text-[#4E4E4E]">
                  <Upload className="mb-3" size={20} aria-hidden="true" />
                  <p className="text-[15px] font-medium">Upload a file for this homework</p>
                  <p className="mt-1 text-[12px] text-[#6A6A6A]">
                    Any file type, up to 25 MB per file
                  </p>
                  <label className="mt-3 inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-[#CFCFCF] bg-white px-4 text-[12px] text-[#121212] transition hover:bg-[#F4F4F4] has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
                    <Upload size={13} aria-hidden="true" />
                    Choose File
                    <input
                      type="file"
                      multiple
                      disabled={saving}
                      className="sr-only"
                      onChange={(event) => {
                        addAttachmentFiles(event.target.files);
                        event.target.value = "";
                      }}
                    />
                  </label>
                  {attachmentFiles.length > 0 ? (
                    <div className="mt-4 w-full max-w-md space-y-1 text-left text-[12px] text-[#3E3E3E]">
                      {attachmentFiles.map((file, index) => (
                        <div
                          key={`${file.name}-${index}`}
                          className="flex items-center justify-between gap-3 rounded bg-[#F5F5F5] px-3 py-2"
                        >
                          <span className="truncate">{file.name}</span>
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() =>
                              setAttachmentFiles((current) =>
                                current.filter((_, fileIndex) => fileIndex !== index),
                              )
                            }
                            className="shrink-0 text-[#A44] hover:underline disabled:text-[#AAA]"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              {error ? (
                <p role="alert" className="mt-4 text-sm text-[#B42318]">
                  {error}
                </p>
              ) : null}

              <div className="mt-8 flex justify-end gap-4 border-t border-[#E4E4E4] pt-5">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="h-10 min-w-[124px] rounded-full border border-[#DADADA] px-5 text-[13px] font-medium text-[#121212] transition hover:bg-[#F6F6F6] disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaveDisabled}
                  className="h-10 min-w-[152px] rounded-full bg-[#121212] px-5 text-[13px] font-medium text-white transition hover:bg-[#303030] disabled:cursor-not-allowed disabled:bg-[#BFBFBF]"
                >
                  {saving ? "Saving..." : "Save homework"}
                </button>
              </div>
            </form>

            {isTestModalOpen ? (
              <div
                role="presentation"
                className="fixed inset-0 z-[160] flex items-center justify-center bg-black/35 px-4 py-6"
                onMouseDown={() => {
                  if (!savingTest) setIsTestModalOpen(false);
                }}
              >
                <section
                  role="dialog"
                  aria-modal="true"
                  aria-label="Create homework test"
                  className="max-h-[calc(100vh-48px)] w-full max-w-[1120px] overflow-y-auto rounded-[16px] bg-white px-6 py-7 shadow-[0_18px_56px_rgba(18,18,18,0.24)] sm:px-10"
                  onMouseDown={(event) => event.stopPropagation()}
                >
                  <div className="mb-6 flex items-center justify-between gap-4">
                    <h3 className="flex items-center gap-2 text-[18px] font-semibold text-[#121212]">
                      <ClipboardList size={18} aria-hidden="true" />
                      Create test
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsTestModalOpen(false)}
                      disabled={savingTest}
                      aria-label="Close test dialog"
                      className="rounded-full p-1 text-[#121212] transition hover:bg-[#F1F1F1] disabled:cursor-not-allowed"
                    >
                      <X size={18} aria-hidden="true" />
                    </button>
                  </div>
                  <TestFormBody
                    mode="add"
                    initialValues={{ title: form.title ? `${form.title} test` : "" }}
                    onSave={handleCreateTest}
                    onCancel={() => setIsTestModalOpen(false)}
                  />
                </section>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </PageShell>
  );
}
