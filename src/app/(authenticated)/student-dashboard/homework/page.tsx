"use client";

import Image from "next/image";
import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { ChevronDown, ClipboardList, Send, Upload } from "lucide-react";
import {
  getAssignedHomework,
  submitHomework,
  uploadHomeworkSubmissionAttachment,
  type HomeworkAssignment,
  type HomeworkSubmission,
} from "@/entities/homework";
import type { ApiError } from "@/shared/api/base";

type TaskTypeFilter = "all" | "task" | "test";
type StatusFilter = "all" | "to_do" | "submitted" | "reviewed";

function deadlineLabel(value: string | null): string {
  if (!value) return "No deadline";
  return `Due ${new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))}`;
}

function cardDeadlineLabel(value: string | null): string {
  if (!value) return "No deadline";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit" })
    .format(new Date(value))
    .replace(/\//g, ".");
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

function assignmentStatus(assignment: HomeworkAssignment, submission?: HomeworkSubmission): StatusFilter {
  if (submission?.status === "reviewed") return "reviewed";
  if (submission) return "submitted";
  return "to_do";
}

function questionTypeLabel(type: string): string {
  if (type === "multiple_choice") return "Multiple choice";
  if (type === "true_false") return "True / false";
  if (type === "short_answer") return "Short answer";
  return "Question";
}

function HomeworkTestPreview({ assignment }: { assignment: HomeworkAssignment }) {
  const test = assignment.test_detail;
  if (!test) return null;

  return (
    <div className="mt-5 rounded-lg border border-[#DDE6FF] bg-[#F7F9FF] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[#3851B0]">Test</p>
          <h3 className="mt-1 font-semibold text-[#121212]">{test.title}</h3>
        </div>
        <span className="rounded-md bg-white px-2 py-1 text-xs font-medium text-[#3851B0]">
          Pass {test.passing_score}%
        </span>
      </div>
      {test.description ? (
        <p className="mt-2 whitespace-pre-wrap text-sm text-[#4A4A4A]">{test.description}</p>
      ) : null}
      <div className="mt-4 space-y-3">
        {test.questions.map((question, index) => (
          <div key={question.id} className="rounded-md bg-white p-3 text-sm text-[#242424]">
            <p className="text-xs text-[#6A6A6A]">
              Question {index + 1} / {questionTypeLabel(question.question_type)}
            </p>
            <p className="mt-1 font-medium">{question.text}</p>
            {question.question_type === "multiple_choice" && question.options.filter(Boolean).length > 0 ? (
              <ul className="mt-2 space-y-1 text-[#4A4A4A]">
                {question.options.filter(Boolean).map((option, optionIndex) => (
                  <li key={`${question.id}-${optionIndex}`}>
                    {optionIndex + 1}. {option}
                  </li>
                ))}
              </ul>
            ) : null}
            {question.question_type === "true_false" ? (
              <p className="mt-2 text-[#4A4A4A]">Choose true or false in your answer.</p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
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
    <span className="relative inline-flex h-7 items-center">
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-7 appearance-none rounded-full border border-[#ECECEC] bg-white px-3 pr-8 font-(family-name:--font-base) text-[12px] leading-4 font-normal text-[#121212] shadow-[0_0_4px_rgba(0,0,0,0.06)] outline-none transition focus:ring-2 focus:ring-[#9DB1FA]"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-[#121212]" aria-hidden="true" />
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
  const iconSrc = kind === "Test" ? "/icons/copy-check-gradient.svg" : "/icons/book-gradient.svg";

  return (
    <button
      type="button"
      aria-expanded={expanded}
      onClick={onToggle}
      className="group grid h-20 w-full max-w-[722px] grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-2.5 rounded-lg bg-white px-3 py-2.5 text-left font-(family-name:--font-base) shadow-[0_0_4px_rgba(0,0,0,0.16)] transition hover:shadow-[0_3px_12px_rgba(0,0,0,0.12)] focus:outline-none focus:ring-2 focus:ring-[#9DB1FA]"
    >
      <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md">
        <Image src={iconSrc} alt="" width={40} height={40} aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[10px] leading-4 font-normal text-[#7A7A7A]">
          {courseName} &bull; {kind}
        </span>
        <span className="mt-0.5 block truncate text-[12px] leading-4 font-normal text-[#121212]">
          {assignment.title}
        </span>
        {submission ? (
          <span className="mt-1 block text-[10px] leading-3 font-normal text-[#5E5E5E]">
            {submission.status === "reviewed" ? "Reviewed" : "Submitted"}
          </span>
        ) : null}
      </span>
      <span className="flex h-full min-w-[98px] flex-col items-end justify-end gap-1">
        {kind === "Test" && assignment.max_score ? (
          <span className="mb-auto inline-flex h-[34px] min-w-[34px] items-center justify-center rounded-md bg-[#FFF0C8] px-2 text-[14px] leading-4 font-normal text-[#9A6500]">
            {assignment.max_score}+
          </span>
        ) : null}
        <span className="whitespace-nowrap pb-0.5 text-[10px] leading-3 font-normal text-[#121212]">
          Do to: <span className="text-[#003AFF]">{cardDeadlineLabel(assignment.due_at)}</span>
        </span>
      </span>
    </button>
  );
}

export default function StudentHomeworkPage() {
  const [assignments, setAssignments] = useState<HomeworkAssignment[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [attachmentFiles, setAttachmentFiles] = useState<Record<number, File[]>>({});
  const [submissions, setSubmissions] = useState<Record<number, HomeworkSubmission>>({});
  const [expandedAssignmentId, setExpandedAssignmentId] = useState<number | null>(null);
  const [taskTypeFilter, setTaskTypeFilter] = useState<TaskTypeFilter>("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const subjectOptions = useMemo(() => Array.from(
    new Set(assignments.map((assignment) => assignment.course_title).filter(Boolean)),
  ).sort((first, second) => first.localeCompare(second)), [assignments]);

  const filteredAssignments = useMemo(() => assignments.filter((assignment) => {
    const kind = assignmentKind(assignment).toLowerCase();
    const submission = submissions[assignment.id];
    const status = assignmentStatus(assignment, submission);

    if (taskTypeFilter !== "all" && kind !== taskTypeFilter) return false;
    if (subjectFilter !== "all" && assignment.course_title !== subjectFilter) return false;
    if (statusFilter !== "all" && status !== statusFilter) return false;
    return true;
  }), [assignments, submissions, statusFilter, subjectFilter, taskTypeFilter]);

  const groupedAssignments = useMemo(() => {
    const sorted = [...filteredAssignments].sort(
      (first, second) => new Date(assignmentDateValue(second)).getTime() - new Date(assignmentDateValue(first)).getTime(),
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

  useEffect(() => {
    getAssignedHomework()
      .then((items) => {
        setAssignments(items);
        setSubmissions(Object.fromEntries(
          items.flatMap((assignment) => assignment.my_submission
            ? [[assignment.id, assignment.my_submission] as const]
            : []),
        ));
      })
      .catch((requestError: Partial<ApiError>) => setError(
        requestError.detail || requestError.message || "Could not load homework.",
      ))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>, assignmentId: number) {
    event.preventDefault();
    const content = answers[assignmentId]?.trim();
    const files = attachmentFiles[assignmentId] ?? [];
    if ((!content && files.length === 0) || savingId !== null) return;

    setSavingId(assignmentId);
    setError("");
    try {
      let submission: HomeworkSubmission | undefined;
      for (const file of files) {
        submission = await uploadHomeworkSubmissionAttachment(assignmentId, file);
      }
      if (content) {
        submission = await submitHomework(assignmentId, content);
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
    <main className="min-h-[calc(100vh-76px)] bg-[radial-gradient(circle_at_50%_54%,rgba(255,196,196,0.6)_0,rgba(255,238,238,0.5)_28%,#FFFFFF_68%)] px-4 py-7 sm:px-8 lg:px-11">
      <section className="mx-auto w-full max-w-[1120px] font-(family-name:--font-base)">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="mr-3 text-[15px] leading-5 font-normal text-[#121212]">Homework</h1>
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
              <option key={subject} value={subject}>{subject}</option>
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
          <span className="inline-flex h-7 items-center rounded-full border border-[#ECECEC] bg-white px-3 text-[12px] leading-4 font-normal text-[#121212] shadow-[0_0_4px_rgba(0,0,0,0.06)]">
            Total Assignments: {filteredAssignments.length}
          </span>
        </div>

        {loading ? <p className="mt-8 text-sm text-[#6A6A6A]">Loading homework...</p> : null}
        {error ? <p role="alert" className="mt-6 text-sm text-[#B42318]">{error}</p> : null}
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

        <div className="mt-7 space-y-7">
          {groupedAssignments.map((group) => (
            <section key={group.key}>
              <h2 className="mb-3 text-[15px] leading-5 font-normal text-[#121212]">{group.label}</h2>
              <div className="grid gap-3 xl:grid-cols-2">
                {group.items.map((assignment) => {
                  const submission = submissions[assignment.id];
                  const expanded = expandedAssignmentId === assignment.id;

                  return (
                    <article key={assignment.id} className="w-full max-w-[722px]">
                      <HomeworkCard
                        assignment={assignment}
                        submission={submission}
                        expanded={expanded}
                        onToggle={() => setExpandedAssignmentId((current) => (current === assignment.id ? null : assignment.id))}
                      />
                      {expanded ? (
                        <div className="mt-2 rounded-lg border border-[#ECECEC] bg-white/95 p-4 shadow-[0_0_4px_rgba(0,0,0,0.08)]">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-xs text-[#777]">{deadlineLabel(assignment.due_at)}</p>
                              <h3 className="mt-1 text-base font-semibold text-[#121212]">{assignment.title}</h3>
                              {assignment.lesson_title || assignment.module_title ? (
                                <p className="mt-1 text-xs text-[#777]">
                                  {[assignment.module_title, assignment.lesson_title].filter(Boolean).join(" / ")}
                                </p>
                              ) : null}
                            </div>
                            {assignment.max_score ? (
                              <span className="rounded-md bg-[#FFF0D0] px-2 py-1 text-xs font-medium text-[#9A6500]">
                                {assignment.max_score} pt
                              </span>
                            ) : null}
                          </div>
                          {assignment.description ? (
                            <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[#333]">{assignment.description}</p>
                          ) : null}
                          {assignment.attachments.length > 0 ? (
                            <div className="mt-4 flex flex-wrap gap-2 text-xs">
                              {assignment.attachments.map((attachment) => (
                                attachment.url ? (
                                  <a
                                    key={attachment.id}
                                    href={attachment.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-md bg-[#F0F3FF] px-3 py-2 text-[#3851B0] hover:underline"
                                  >
                                    {attachment.original_name}
                                  </a>
                                ) : null
                              ))}
                            </div>
                          ) : null}

                          <HomeworkTestPreview assignment={assignment} />

                          {submission ? (
                            <div className="mt-5 rounded-lg bg-[#F4F7FF] p-4 text-sm">
                              <p className="font-medium text-[#24376F]">{submission.status === "reviewed" ? "Reviewed" : "Submitted"}</p>
                              {submission.content ? <p className="mt-2 whitespace-pre-wrap text-[#303030]">{submission.content}</p> : null}
                              {submission.attachments.length > 0 ? (
                                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                  {submission.attachments.map((attachment) => (
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
                                    ) : null
                                  ))}
                                </div>
                              ) : null}
                              {submission.status === "reviewed" ? (
                                <p className="mt-3 text-[#24376F]">
                                  Score: {submission.score ?? "-"}. {submission.feedback}
                                </p>
                              ) : null}
                            </div>
                          ) : (
                            <form onSubmit={(event) => handleSubmit(event, assignment.id)} className="mt-5">
                              <label className="grid gap-2 text-sm font-medium text-[#242424]">
                                Your answer
                                <textarea
                                  rows={5}
                                  value={answers[assignment.id] ?? ""}
                                  onChange={(event) => setAnswers((current) => ({ ...current, [assignment.id]: event.target.value }))}
                                  placeholder="Write your answer or paste a link to your work."
                                  className="resize-y rounded-md border border-[#D8D8D8] px-3 py-2 text-sm font-normal outline-none focus:ring-2 focus:ring-[#9DB1FA]"
                                />
                              </label>
                              <div className="mt-3">
                                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#CFCFCF] bg-white px-4 py-2 text-xs font-medium text-[#121212] transition hover:bg-[#F4F4F4] has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
                                  <Upload size={14} aria-hidden="true" />
                                  Attach files
                                  <input
                                    type="file"
                                    multiple
                                    disabled={savingId === assignment.id}
                                    className="sr-only"
                                    onChange={(event) => {
                                      addAttachmentFiles(assignment.id, event.target.files);
                                      event.target.value = "";
                                    }}
                                  />
                                </label>
                                <p className="mt-2 text-xs text-[#6A6A6A]">Any file type, up to 25 MB per file</p>
                                {(attachmentFiles[assignment.id] ?? []).map((file, index) => (
                                  <div key={`${file.name}-${index}`} className="mt-2 flex max-w-md items-center justify-between gap-3 rounded bg-[#F5F5F5] px-3 py-2 text-xs text-[#3E3E3E]">
                                    <span className="truncate">{file.name}</span>
                                    <button
                                      type="button"
                                      disabled={savingId === assignment.id}
                                      onClick={() => setAttachmentFiles((current) => ({
                                        ...current,
                                        [assignment.id]: (current[assignment.id] ?? []).filter((_, fileIndex) => fileIndex !== index),
                                      }))}
                                      className="shrink-0 text-[#A44] hover:underline disabled:text-[#AAA]"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ))}
                              </div>
                              <button
                                type="submit"
                                disabled={savingId === assignment.id}
                                className="mt-3 inline-flex h-9 items-center gap-2 rounded-full bg-[#121212] px-4 text-xs font-medium text-white disabled:bg-[#BFBFBF]"
                              >
                                <Send size={14} aria-hidden="true" />
                                {savingId === assignment.id ? "Submitting..." : "Submit homework"}
                              </button>
                            </form>
                          )}
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
