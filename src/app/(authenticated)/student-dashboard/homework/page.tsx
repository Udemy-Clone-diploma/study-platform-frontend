"use client";

import Image from "next/image";
import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { ChevronDown, ClipboardList, Paperclip, X } from "lucide-react";
import {
  byOrder,
  getTestAttempt,
  getTestAttempts,
  submitTestAttempt,
  type TestAnswerInput,
  type TestAttemptResult,
} from "@/entities/course";
import {
  getAssignedHomework,
  submitHomework,
  uploadHomeworkSubmissionAttachment,
  type HomeworkAssignment,
  type HomeworkSubmission,
} from "@/entities/homework";
import { QuizQuestionCard, QuizWindow, type AnswerState } from "@/features/quiz";
import type { ApiError } from "@/shared/api/base";
import { GradientButton } from "@/shared/ui/GradientButton";

type TaskTypeFilter = "all" | "task" | "test";
type StatusFilter = "all" | "to_do" | "submitted" | "reviewed";

function compactDateLabel(value: string | null): string {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit" })
    .format(new Date(value))
    .replace(/\//g, ".");
}

function cardDeadlineLabel(value: string | null): string {
  if (!value) return "No deadline";
  return compactDateLabel(value);
}

function assignmentDateValue(assignment: HomeworkAssignment): string {
  return assignment.due_at ?? assignment.published_at ?? assignment.created_at;
}

function monthKey(value: string): string {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(value: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "long" }).format(new Date(value));
}

function assignmentKind(assignment: HomeworkAssignment): "Task" | "Test" {
  return assignment.test_detail ? "Test" : "Task";
}

function assignmentStatus(
  assignment: HomeworkAssignment,
  submission?: HomeworkSubmission,
): StatusFilter {
  if (submission?.status === "reviewed") return "reviewed";
  if (submission) return "submitted";
  return "to_do";
}

function submissionStatusLabel(submission: HomeworkSubmission): string {
  if (submission.status === "reviewed") return "Reviewed";
  if (submission.status === "retrieved") return "In review";
  return "Submitted";
}

function drawerTitle(assignment: HomeworkAssignment): string {
  return assignment.module_title || assignment.title;
}

function drawerSubtitle(assignment: HomeworkAssignment): string {
  if (assignment.module_title) return assignment.title;
  return assignment.course_title;
}

const emptyAnswer = (): AnswerState => ({ selected: [], bool: null, text: "" });

function toAnswerInput(
  questionId: number,
  questionType: string,
  answer: AnswerState,
): TestAnswerInput {
  if (questionType === "single_choice" || questionType === "multiple_choice") {
    return { question_id: questionId, selected_indices: answer.selected };
  }
  if (questionType === "true_false") {
    return { question_id: questionId, answer_bool: answer.bool ?? undefined };
  }
  return { question_id: questionId, answer_text: answer.text };
}

function FilterSelect({
  value,
  onChange,
  label,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <span className="relative inline-flex h-10 items-center">
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 appearance-none rounded-full border border-[#ECECEC] bg-white px-5 pr-11 font-(family-name:--font-base) text-[20px] leading-none font-normal text-[#121212] shadow-[0_0_4px_rgba(0,0,0,0.06)] outline-none transition focus:ring-2 focus:ring-[#9DB1FA]"
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-4 h-5 w-5 text-[#121212]"
        aria-hidden="true"
      />
    </span>
  );
}

function HomeworkCard({
  assignment,
  submission,
  expanded,
  onToggle,
}: {
  assignment: HomeworkAssignment;
  submission?: HomeworkSubmission;
  expanded: boolean;
  onToggle: () => void;
}) {
  const kind = assignmentKind(assignment);
  const courseName = assignment.course_title || "Course";
  const iconSrc = assignment.course_image ?? "/icons/book-gradient.svg";
  const showScoreBadge = kind === "Test" && assignment.max_score;

  return (
    <button
      type="button"
      aria-expanded={expanded}
      onClick={onToggle}
      className="group grid h-20 w-full max-w-[722px] grid-cols-[60px_minmax(0,1fr)_auto] items-center gap-2.5 rounded-lg bg-white px-3 py-2.5 text-left font-(family-name:--font-base) shadow-[0_0_4px_rgba(0,0,0,0.16)] transition hover:shadow-[0_3px_12px_rgba(0,0,0,0.12)] focus:outline-none focus:ring-2 focus:ring-[#9DB1FA]"
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
          {courseName} &bull; {kind}
        </span>
        <span className="mt-[7px] block max-w-[393px] truncate text-[20px] leading-none font-medium text-[#121212]">
          {assignment.title}
        </span>
        {submission ? (
          <span className="mt-1.5 block text-[12px] leading-none font-normal text-[#5E5E5E]">
            {submissionStatusLabel(submission)}
          </span>
        ) : null}
      </span>
      <span className="flex h-full min-w-[98px] items-end justify-end">
        {showScoreBadge ? (
          <span className="inline-flex h-[60px] min-w-[60px] items-center justify-center rounded-lg bg-[#FFF0C8] px-3 text-[24px] leading-none font-medium text-[#9A6500]">
            {assignment.max_score}+
          </span>
        ) : (
          <span className="mb-2 whitespace-nowrap text-[16px] leading-none font-normal text-[#121212]">
            Do to: <span className="text-[#003AFF]">{cardDeadlineLabel(assignment.due_at)}</span>
          </span>
        )}
      </span>
    </button>
  );
}

function HomeworkSidebar({
  assignment,
  submission,
  answer,
  files,
  saving,
  onClose,
  onOpenTest,
  onAnswerChange,
  onSubmit,
  onAddFiles,
  onRemoveFile,
}: {
  assignment: HomeworkAssignment | null;
  submission?: HomeworkSubmission;
  answer: string;
  files: File[];
  saving: boolean;
  onClose: () => void;
  onOpenTest: (assignment: HomeworkAssignment) => void;
  onAnswerChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>, assignmentId: number) => void;
  onAddFiles: (files: FileList | null) => void;
  onRemoveFile: (index: number) => void;
}) {
  const open = Boolean(assignment);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  return (
    <aside
      aria-hidden={!open}
      className={[
        "fixed top-[76px] right-0 bottom-0 z-40 w-[min(490px,calc(100vw-24px))] overflow-hidden rounded-tl-[20px] rounded-bl-[20px] bg-white shadow-[0_0_30px_rgba(0,0,0,0.16)] transition-transform duration-300 ease-out",
        open ? "translate-x-0" : "translate-x-full",
      ].join(" ")}
    >
      {assignment ? (
        <div className="flex h-full flex-col overflow-y-auto px-[36px] py-8 font-(family-name:--font-base) text-[#121212]">
          <button
            type="button"
            aria-label="Close homework details"
            onClick={onClose}
            className="mb-9 flex h-8 w-8 items-center justify-center rounded-full text-black transition hover:bg-[#F4F4F4]"
          >
            <X size={18} aria-hidden="true" />
          </button>

          <div className="flex items-center gap-5 text-[14px] leading-[18px] text-[#5E5E5E]">
            <span>{compactDateLabel(assignment.due_at || assignment.published_at)}</span>
            <span className="truncate">{assignment.course_title}</span>
          </div>

          <div className="mt-7">
            <h2 className="font-(family-name:--font-accent) text-[28px] leading-[35px] font-normal tracking-normal">
              {drawerTitle(assignment)}
            </h2>
            <p className="mt-1 font-(family-name:--font-accent) text-[16px] leading-5 tracking-normal">
              {drawerSubtitle(assignment)}
            </p>
          </div>

          <div className="mt-6 max-w-[330px] text-[13px] leading-[16px]">
            {assignment.lesson_title ? (
              <p className="font-semibold">Lesson: {assignment.lesson_title}</p>
            ) : null}
            {assignment.description ? (
              <p className="mt-1 whitespace-pre-wrap">{assignment.description}</p>
            ) : (
              <p className="mt-1 text-[#5E5E5E]">No description provided.</p>
            )}
          </div>

          <div className="mt-8">
            <h3 className="text-[13px] leading-4 font-semibold">Main materials</h3>
            <div className="mt-5 flex flex-col gap-5">
              {assignment.test_detail ? (
                <button
                  type="button"
                  onClick={() => onOpenTest(assignment)}
                  className="-mx-1 flex items-center gap-4 rounded-md px-1 py-0.5 text-left transition hover:bg-[#FAFAFA]"
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
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] leading-4 font-medium">
                      {assignment.test_detail.title}
                    </span>
                    <span className="mt-0.5 block text-[10px] leading-3 text-[#5E5E5E]">Test</span>
                  </span>
                </button>
              ) : null}
              {assignment.attachments.length > 0
                ? assignment.attachments.map((attachment) =>
                    attachment.url ? (
                      <a
                        key={attachment.id}
                        href={attachment.url}
                        target="_blank"
                        rel="noreferrer"
                        className="-mx-1 flex items-center gap-4 rounded-md px-1 py-0.5 transition hover:bg-[#FAFAFA]"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[linear-gradient(135deg,#FCC4C3_0%,#A7BAFA_100%)]">
                          <Image
                            src="/icons/book.svg"
                            alt=""
                            width={22}
                            height={22}
                            className="h-5 w-5"
                          />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] leading-4 font-medium">
                            {attachment.original_name}
                          </span>
                          <span className="mt-0.5 block text-[10px] leading-3 text-[#5E5E5E]">
                            Material
                          </span>
                        </span>
                      </a>
                    ) : null,
                  )
                : null}
              {!assignment.test_detail && assignment.attachments.length === 0 ? (
                <p className="text-[12px] text-[#5E5E5E]">No materials attached.</p>
              ) : null}
            </div>
          </div>

          <div className="mt-7 h-px bg-[#A7BAFA]" />

          {submission ? (
            <div className="mt-5 rounded-lg bg-[#F4F7FF] p-4 text-sm">
              <p className="font-medium text-[#24376F]">
                {submissionStatusLabel(submission)}
              </p>
              {submission.test_attempt ? (
                <p className="mt-2 text-[#24376F]">
                  Test attempt sent: {submission.test_attempt.score}% · attempt{" "}
                  {submission.test_attempt.attempt_number}
                </p>
              ) : null}
              {submission.content ? (
                <p className="mt-2 whitespace-pre-wrap text-[#303030]">{submission.content}</p>
              ) : null}
              {submission.attachments.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {submission.attachments.map((attachment) =>
                    attachment.url ? (
                      <a
                        key={attachment.id}
                        href={attachment.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md bg-white px-3 py-2 text-[#3851B0] hover:underline"
                      >
                        {attachment.original_name}
                      </a>
                    ) : null,
                  )}
                </div>
              ) : null}
              {submission.status === "reviewed" ? (
                <div className="mt-3 space-y-1 text-[#24376F]">
                  <p>Score: {submission.score ?? "-"}</p>
                  {submission.feedback ? <p>Comment: {submission.feedback}</p> : null}
                </div>
              ) : null}
            </div>
          ) : (
            <form onSubmit={(event) => onSubmit(event, assignment.id)} className="mt-6">
              <textarea
                rows={8}
                value={answer}
                onChange={(event) => onAnswerChange(event.target.value)}
                placeholder="Text"
                className="h-[192px] w-full resize-none rounded-[4px] border border-[#CFCFCF] px-4 py-4 text-[16px] leading-5 outline-none transition placeholder:text-[#7E7E7E] focus:ring-2 focus:ring-[#9DB1FA]"
              />

              {files.length > 0 ? (
                <div className="mt-3 flex flex-col gap-2">
                  {files.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between gap-3 rounded bg-[#F5F5F5] px-3 py-2 text-xs text-[#3E3E3E]"
                    >
                      <span className="truncate">{file.name}</span>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => onRemoveFile(index)}
                        className="shrink-0 text-[#A44] hover:underline disabled:text-[#AAA]"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="relative mt-4 flex min-h-[38px] items-center justify-center">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-[38px] min-w-[144px] items-center justify-center rounded-full bg-black px-8 font-(family-name:--font-accent) text-[13px] leading-none font-semibold uppercase text-white transition hover:bg-[#252525] disabled:bg-[#BFBFBF]"
                >
                  {saving ? "Submitting" : "Submit"}
                </button>
                <label className="absolute right-0 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-black transition hover:bg-[#F4F4F4] has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
                  <Paperclip size={30} strokeWidth={1.8} aria-hidden="true" />
                  <input
                    type="file"
                    multiple
                    disabled={saving}
                    className="sr-only"
                    onChange={(event) => {
                      onAddFiles(event.target.files);
                      event.target.value = "";
                    }}
                  />
                </label>
              </div>
            </form>
          )}
        </div>
      ) : null}
    </aside>
  );
}

function HomeworkQuizModal({
  assignment,
  onClose,
}: {
  assignment: HomeworkAssignment | null;
  onClose: () => void;
}) {
  const test = assignment?.test_detail ?? null;
  const ordered = useMemo(() => byOrder(test?.questions ?? []), [test]);
  const [answers, setAnswers] = useState<Record<number, AnswerState>>({});
  const [result, setResult] = useState<TestAttemptResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!assignment || !test) return;
    let cancelled = false;

    setAnswers(
      Object.fromEntries(byOrder(test.questions).map((question) => [question.id, emptyAnswer()])),
    );
    setResult(null);
    setError(null);
    setLoading(true);

    (async () => {
      try {
        const attempts = await getTestAttempts(assignment.course_slug, test.id);
        if (cancelled || attempts.length === 0) return;
        const latest = attempts.reduce((first, second) =>
          second.attempt_number > first.attempt_number ? second : first,
        );
        const detail = await getTestAttempt(assignment.course_slug, test.id, latest.id);
        if (!cancelled) setResult(detail);
      } catch {
        if (!cancelled) setError(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [assignment, test]);

  useEffect(() => {
    if (!assignment) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [assignment, onClose]);

  if (!assignment || !test) return null;

  const restart = () => {
    setAnswers(Object.fromEntries(ordered.map((question) => [question.id, emptyAnswer()])));
    setResult(null);
    setError(null);
  };

  const handleSubmitTest = async () => {
    setSubmitting(true);
    setError(null);

    const payload = ordered.map((question) =>
      toAnswerInput(question.id, question.question_type, answers[question.id] ?? emptyAnswer()),
    );

    try {
      const response = await submitTestAttempt(assignment.course_slug, test.id, payload);
      setResult(response);
    } catch (requestError) {
      const apiError = requestError as Partial<ApiError>;
      setError(
        apiError.message || apiError.detail || "Could not submit your answers. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const closeButton = (
    <button
      type="button"
      aria-label="Close test"
      onClick={onClose}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-(--color-text-primary) transition hover:bg-(--color-bg-surface)"
    >
      <X size={20} aria-hidden="true" />
    </button>
  );

  return (
    <div
      className="fixed top-[76px] right-0 bottom-0 left-[clamp(60px,4.5vw,80px)] z-40 overflow-y-auto bg-(--color-brand-lavender-soft) px-8 py-[52px]"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={test.title}
        onClick={(event) => event.stopPropagation()}
        className="mx-auto max-w-[1380px]"
      >
        <QuizWindow
          title={test.title}
          description={test.description}
          passingScore={test.passing_score}
          headerAction={closeButton}
        >
          {loading ? (
            <p role="status" className="py-8 text-center text-(--color-text-secondary)">
              Loading your test...
            </p>
          ) : (
            <div className="mx-auto flex max-w-[1280px] flex-col gap-5">
              <div className="flex flex-col gap-5">
                {result
                  ? byOrder(result.questions).map((question, index) => (
                      <QuizQuestionCard
                        key={question.id}
                        mode="review"
                        index={index}
                        graded={question}
                      />
                    ))
                  : ordered.map((question, index) => (
                      <QuizQuestionCard
                        key={question.id}
                        mode="answer"
                        index={index}
                        questionType={question.question_type}
                        text={question.text}
                        options={question.options}
                        value={answers[question.id] ?? emptyAnswer()}
                        onChange={(next) =>
                          setAnswers((current) => ({ ...current, [question.id]: next }))
                        }
                      />
                    ))}
              </div>

              {error ? (
                <p role="alert" className="text-center text-base text-(--color-danger)">
                  {error}
                </p>
              ) : null}

              {result ? (
                <HomeworkQuizResults result={result} onRetake={restart} onClose={onClose} />
              ) : (
                <div className="flex justify-center pt-1">
                  <QuizActionButton onClick={handleSubmitTest} disabled={submitting}>
                    {submitting ? "Submitting..." : "To the results"}
                  </QuizActionButton>
                </div>
              )}
            </div>
          )}
        </QuizWindow>
      </section>
    </div>
  );
}

function HomeworkQuizResults({
  result,
  onRetake,
  onClose,
}: {
  result: TestAttemptResult;
  onRetake: () => void;
  onClose: () => void;
}) {
  const answered = result.questions.filter(
    (question) =>
      (question.selected_indices?.length ?? 0) > 0 ||
      question.answer_bool != null ||
      (question.answer_text?.trim() ?? "") !== "",
  ).length;
  const incorrect = result.total_count - result.correct_count;

  return (
    <div className="flex flex-col gap-6 pt-2">
      <div className="flex flex-wrap justify-center gap-x-16 gap-y-2 font-(family-name:--font-base) text-xl leading-[25px] text-(--color-black)">
        <span>
          Answered: {answered} / {result.total_count}
        </span>
        <span>Correct answers: {result.correct_count}</span>
        <span>Incorrect answers: {incorrect}</span>
      </div>

      <p
        className={`text-center font-(family-name:--font-base) text-xl leading-[25px] ${
          result.passed ? "text-(--color-quiz-correct)" : "text-(--color-pink-dark)"
        }`}
      >
        {result.passed
          ? "You passed!"
          : `You did not reach the passing score (${result.passing_score}%).`}
      </p>

      <div className="flex flex-wrap items-center justify-end gap-5">
        <span className="font-(family-name:--font-base) text-xl leading-[25px] text-(--color-black)">
          Assessment:
        </span>
        <span className="flex h-[60px] w-[60px] items-center justify-center rounded-lg bg-(--color-brand-lavender) font-(family-name:--font-accent) text-2xl font-medium leading-[30px] text-(--color-blue-dark)">
          {result.score}
        </span>
        {result.can_retake ? <GradientButton onClick={onRetake}>Retake</GradientButton> : null}
        <QuizActionButton onClick={onClose}>Back to homework</QuizActionButton>
      </div>
    </div>
  );
}

function QuizActionButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-[30px] min-w-[124px] items-center justify-center rounded-full bg-(--color-text-primary) px-5 font-(family-name:--font-accent) text-xs font-medium leading-none text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export default function StudentHomeworkPage() {
  const [assignments, setAssignments] = useState<HomeworkAssignment[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [attachmentFiles, setAttachmentFiles] = useState<Record<number, File[]>>({});
  const [submissions, setSubmissions] = useState<Record<number, HomeworkSubmission>>({});
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null);
  const [testAssignment, setTestAssignment] = useState<HomeworkAssignment | null>(null);
  const [taskTypeFilter, setTaskTypeFilter] = useState<TaskTypeFilter>("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const subjectOptions = useMemo(
    () =>
      Array.from(
        new Set(assignments.map((assignment) => assignment.course_title).filter(Boolean)),
      ).sort((first, second) => first.localeCompare(second)),
    [assignments],
  );

  const filteredAssignments = useMemo(
    () =>
      assignments.filter((assignment) => {
        const kind = assignmentKind(assignment).toLowerCase();
        const submission = submissions[assignment.id];
        const status = assignmentStatus(assignment, submission);

        if (taskTypeFilter !== "all" && kind !== taskTypeFilter) return false;
        if (subjectFilter !== "all" && assignment.course_title !== subjectFilter) return false;
        if (statusFilter !== "all" && status !== statusFilter) return false;
        return true;
      }),
    [assignments, submissions, statusFilter, subjectFilter, taskTypeFilter],
  );

  const groupedAssignments = useMemo(() => {
    const sorted = [...filteredAssignments].sort(
      (first, second) =>
        new Date(assignmentDateValue(second)).getTime() -
        new Date(assignmentDateValue(first)).getTime(),
    );
    const groups = new Map<string, { key: string; label: string; items: HomeworkAssignment[] }>();

    sorted.forEach((assignment) => {
      const dateValue = assignmentDateValue(assignment);
      const key = monthKey(dateValue);
      const group = groups.get(key);
      if (group) {
        group.items.push(assignment);
      } else {
        groups.set(key, { key, label: monthLabel(dateValue), items: [assignment] });
      }
    });

    return Array.from(groups.values());
  }, [filteredAssignments]);

  const selectedAssignment =
    assignments.find((assignment) => assignment.id === selectedAssignmentId) ?? null;

  useEffect(() => {
    getAssignedHomework()
      .then((items) => {
        setAssignments(items);
        setSubmissions(
          Object.fromEntries(
            items.flatMap((assignment) =>
              assignment.my_submission ? [[assignment.id, assignment.my_submission] as const] : [],
            ),
          ),
        );
      })
      .catch((requestError: Partial<ApiError>) =>
        setError(requestError.detail || requestError.message || "Could not load homework."),
      )
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>, assignmentId: number) {
    event.preventDefault();
    const assignment = assignments.find((item) => item.id === assignmentId);
    const content = answers[assignmentId]?.trim();
    const files = attachmentFiles[assignmentId] ?? [];
    if ((!assignment?.test_detail && !content && files.length === 0) || savingId !== null) return;

    setSavingId(assignmentId);
    setError("");
    try {
      let submission: HomeworkSubmission | undefined;
      if (assignment?.test_detail) {
        submission = await submitHomework(assignmentId, content ?? "");
        for (const file of files) {
          submission = await uploadHomeworkSubmissionAttachment(assignmentId, file);
        }
      } else {
        for (const file of files) {
          submission = await uploadHomeworkSubmissionAttachment(assignmentId, file);
        }
        if (content) {
          submission = await submitHomework(assignmentId, content);
        }
      }
      if (!submission) return;
      setSubmissions((current) => ({ ...current, [assignmentId]: submission }));
      setAttachmentFiles((current) => ({ ...current, [assignmentId]: [] }));
    } catch (requestError) {
      const apiError = requestError as Partial<ApiError>;
      setError(apiError.detail || apiError.message || "Could not submit homework.");
    } finally {
      setSavingId(null);
    }
  }

  function addAttachmentFiles(assignmentId: number, files: FileList | null) {
    if (!files) return;
    const selectedFiles = Array.from(files);
    const tooLarge = selectedFiles.find((file) => file.size > 25 * 1024 * 1024);
    if (tooLarge) {
      setError(`"${tooLarge.name}" exceeds the 25 MB file limit.`);
      return;
    }
    setAttachmentFiles((current) => ({
      ...current,
      [assignmentId]: [...(current[assignmentId] ?? []), ...selectedFiles],
    }));
    setError("");
  }

  return (
    <main className="relative isolate min-h-[calc(100vh-76px)] overflow-hidden bg-white px-4 py-7 sm:px-8 lg:px-11">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[-257px] left-[113px] z-0 h-[1002px] w-[1368px] rotate-[-33.8deg] bg-[#FCC4C3] opacity-50 blur-[300px]"
      />
      <section className="relative z-10 w-full max-w-[1710px] font-(family-name:--font-base)">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="mr-2 text-[28px] leading-none font-normal text-[#121212]">Homework</h1>
          <FilterSelect
            label="Task type"
            value={taskTypeFilter}
            onChange={(value) => setTaskTypeFilter(value as TaskTypeFilter)}
          >
            <option value="all">All Task Types</option>
            <option value="task">Tasks</option>
            <option value="test">Tests</option>
          </FilterSelect>
          <FilterSelect
            label="Subject"
            value={subjectFilter}
            onChange={(value) => setSubjectFilter(value)}
          >
            <option value="all">Subject</option>
            {subjectOptions.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            label="Status"
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as StatusFilter)}
          >
            <option value="all">Status</option>
            <option value="to_do">To Do</option>
            <option value="submitted">Submitted</option>
            <option value="reviewed">Reviewed</option>
          </FilterSelect>
          <span className="inline-flex h-10 items-center rounded-full border border-[#ECECEC] bg-white px-5 text-[20px] leading-none font-normal text-[#121212] shadow-[0_0_4px_rgba(0,0,0,0.06)]">
            Total Assignments: {filteredAssignments.length}
          </span>
        </div>

        {loading ? <p className="mt-8 text-sm text-[#6A6A6A]">Loading homework...</p> : null}
        {error ? (
          <p role="alert" className="mt-6 text-sm text-[#B42318]">
            {error}
          </p>
        ) : null}
        {!loading && !error && assignments.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-[#D9D4CB] bg-white px-6 py-14 text-center">
            <ClipboardList className="mx-auto text-[#9DAEF3]" size={34} aria-hidden="true" />
            <h2 className="mt-3 font-semibold text-[#121212]">No homework assigned yet</h2>
          </div>
        ) : null}
        {!loading && !error && assignments.length > 0 && filteredAssignments.length === 0 ? (
          <div className="mt-8 max-w-[722px] rounded-lg border border-dashed border-[#D9D4CB] bg-white px-6 py-10 text-center text-sm text-[#6A6A6A]">
            No homework matches these filters.
          </div>
        ) : null}

        <div className="mt-14 space-y-11">
          {groupedAssignments.map((group) => (
            <section key={group.key}>
              <h2 className="mb-6 text-[28px] leading-none font-normal text-[#121212]">
                {group.label}
              </h2>
              <div className="grid gap-x-5 gap-y-6 2xl:grid-cols-[minmax(0,722px)_minmax(0,722px)]">
                {group.items.map((assignment) => {
                  const submission = submissions[assignment.id];
                  const selected = selectedAssignmentId === assignment.id;

                  return (
                    <article key={assignment.id} className="w-full max-w-[722px]">
                      <HomeworkCard
                        assignment={assignment}
                        submission={submission}
                        expanded={selected}
                        onToggle={() => setSelectedAssignmentId(assignment.id)}
                      />
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </section>
      <HomeworkSidebar
        assignment={selectedAssignment}
        submission={selectedAssignment ? submissions[selectedAssignment.id] : undefined}
        answer={selectedAssignment ? (answers[selectedAssignment.id] ?? "") : ""}
        files={selectedAssignment ? (attachmentFiles[selectedAssignment.id] ?? []) : []}
        saving={selectedAssignment ? savingId === selectedAssignment.id : false}
        onClose={() => setSelectedAssignmentId(null)}
        onOpenTest={setTestAssignment}
        onAnswerChange={(value) => {
          if (!selectedAssignment) return;
          setAnswers((current) => ({ ...current, [selectedAssignment.id]: value }));
        }}
        onSubmit={handleSubmit}
        onAddFiles={(files) => {
          if (!selectedAssignment) return;
          addAttachmentFiles(selectedAssignment.id, files);
        }}
        onRemoveFile={(index) => {
          if (!selectedAssignment) return;
          setAttachmentFiles((current) => ({
            ...current,
            [selectedAssignment.id]: (current[selectedAssignment.id] ?? []).filter(
              (_, fileIndex) => fileIndex !== index,
            ),
          }));
        }}
      />
      <HomeworkQuizModal assignment={testAssignment} onClose={() => setTestAssignment(null)} />
    </main>
  );
}
