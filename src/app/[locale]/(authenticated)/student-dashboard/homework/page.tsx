"use client";

import Image from "next/image";
import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { useLocale, useTranslations } from "next-intl";
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
import { PageShell } from "@/shared/ui/PageShell";

type Translator = (key: string, values?: Record<string, string | number>) => string;

type TaskTypeFilter = "all" | "task" | "test";
type StatusFilter = "all" | "to_do" | "overdue" | "completed" | "submitted" | "reviewed";

type FilterOption<T extends string = string> = {
  value: T;
  label: string;
};

const STATUS_FILTER_VALUES: StatusFilter[] = [
  "all",
  "to_do",
  "overdue",
  "completed",
  "submitted",
  "reviewed",
];

const subscribeToClientMount = () => () => {};
const getClientMountSnapshot = () => true;
const getServerMountSnapshot = () => false;
const subscribeToMobileViewport = (onChange: () => void) => {
  const mediaQuery = window.matchMedia("(max-width: 1023px)");
  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
};
const getMobileViewportSnapshot = () => window.matchMedia("(max-width: 1023px)").matches;
const getServerMobileViewportSnapshot = () => false;
const DIALOG_FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function taskTypeOptions(t: Translator): FilterOption<TaskTypeFilter>[] {
  return [
    { value: "all", label: t("taskTypeAll") },
    { value: "task", label: t("taskTypeTask") },
    { value: "test", label: t("taskTypeTest") },
  ];
}

function statusOptions(t: Translator): FilterOption<StatusFilter>[] {
  return [
    { value: "all", label: t("statusFilterLabel") },
    { value: "to_do", label: t("statusToDo") },
    { value: "overdue", label: t("statusOverdue") },
    { value: "completed", label: t("statusCompleted") },
    { value: "submitted", label: t("statusSubmitted") },
    { value: "reviewed", label: t("statusReviewed") },
  ];
}

function compactDateLabel(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}`;
}

function cardDeadlineLabel(value: string | null, t: Translator): string {
  if (!value) return t("noDeadline");
  return compactDateLabel(value);
}

function assignmentDateValue(assignment: HomeworkAssignment): string {
  return assignment.due_at ?? assignment.published_at ?? assignment.created_at;
}

function monthKey(value: string): string {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { month: "long" }).format(new Date(value));
}

function assignmentTypeValue(assignment: HomeworkAssignment): "task" | "test" {
  return assignment.test_detail ? "test" : "task";
}

function assignmentKindLabel(assignment: HomeworkAssignment, t: Translator): string {
  return assignment.test_detail ? t("taskKindTest") : t("taskKindTask");
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

function assignmentStatus(
  assignment: HomeworkAssignment,
  submission?: HomeworkSubmission,
): StatusFilter {
  if (submission?.status === "reviewed") return "reviewed";
  if (submission) return "submitted";
  if (assignment.due_at && new Date(assignment.due_at).getTime() < Date.now()) return "overdue";
  return "to_do";
}

function submissionStatusLabel(submission: HomeworkSubmission, t: Translator): string {
  if (submission.status === "reviewed") return t("submissionStatusReviewed");
  if (submission.status === "retrieved") return t("submissionStatusInReview");
  return t("submissionStatusSubmitted");
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

function FilterSelect<T extends string>({
  value,
  onChange,
  label,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  label: string;
  options: FilterOption<T>[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const selectedOption = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    function closeOnOutsidePointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, []);

  return (
    <div ref={rootRef} className="relative inline-flex h-10 items-center">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        onClick={() => setIsOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setIsOpen(false);
        }}
        className="flex h-10 min-w-[118px] items-center justify-between gap-3 rounded-full border border-[#ECECEC] bg-white px-5 font-(family-name:--font-base) text-[20px] leading-none font-normal text-[#121212] shadow-[0_0_4px_rgba(0,0,0,0.06)] outline-none transition hover:shadow-[0_2px_10px_rgba(0,0,0,0.08)] focus:ring-2 focus:ring-[#9DB1FA]"
      >
        <span className="truncate">{selectedOption?.label}</span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-[#121212] transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      {isOpen ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label={label}
          className="absolute top-[calc(100%+8px)] left-0 z-[120] w-[220px] overflow-hidden rounded-[12px] bg-white py-3 shadow-[0_0_5.2px_rgba(54,54,54,0.25)]"
        >
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`flex min-h-[46px] w-full items-center px-[22px] text-left font-(family-name:--font-base) text-[20px] leading-none transition hover:bg-[#F5F7FF] hover:text-[#003AFF] ${
                  isSelected ? "text-[#003AFF]" : "text-[#121212]"
                }`}
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
  const t = useTranslations("StudentHomeworkPage");
  const kind = assignmentKindLabel(assignment, t);
  const courseName = assignment.course_title || t("courseFallback");
  const iconSrc = assignment.course_image ?? "/icons/book-gradient.svg";
  const reviewedScore =
    submission?.status === "reviewed" && submission.score != null ? submission.score : null;

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
      <span className="flex h-full min-w-0 flex-col justify-between py-[3.5px]">
        <span className="flex max-w-[244px] items-center gap-2 text-[16px] leading-none font-normal tracking-normal not-italic text-[#5E5E5E]">
          <span className="min-w-0 truncate">{courseName}</span>
          <span
            aria-hidden="true"
            className="h-[3px] w-[3px] shrink-0 rotate-180 rounded-full bg-[#5E5E5E] opacity-100"
          />
          <span className="shrink-0">{kind}</span>
        </span>
        <span className="block max-w-[393px] truncate text-[20px] leading-none font-medium tracking-normal not-italic text-[#121212]">
          {assignment.title}
        </span>
      </span>
      <span className="flex h-full min-w-[98px] items-end justify-end">
        {reviewedScore != null ? (
          <span
            className={`inline-flex h-[60px] min-w-[60px] items-center justify-center rounded-lg px-3 text-[24px] leading-none font-medium ${scoreBadgeClassName(reviewedScore)}`}
          >
            {reviewedScore}
          </span>
        ) : (
          <span className="mb-[3.5px] whitespace-nowrap text-[16px] leading-none font-normal tracking-normal not-italic text-[#003AFF]">
            {cardDeadlineLabel(assignment.due_at, t)}
          </span>
        )}
      </span>
    </button>
  );
}

function HomeworkBookIcon() {
  return (
    <>
      <span aria-hidden="true" className="relative block h-8 w-8 lg:hidden">
        <span className="absolute bottom-0 left-0 h-2.5 w-[30px] rounded-bl-[5px] border-[3px] border-black bg-[#FCC4C3]" />
        <span className="absolute top-0 left-0 h-[26px] w-[29px] rounded-[3px] bg-black" />
        <span className="absolute top-[7px] left-[8px] h-[3px] w-[14px] rounded-full bg-[#FCC4C3]" />
      </span>
      <Image
        src="/icons/book.svg"
        alt=""
        width={22}
        height={22}
        className="hidden h-5 w-5 lg:block"
      />
    </>
  );
}

function HomeworkSidebar({
  assignment,
  submission,
  answer,
  files,
  saving,
  error,
  covered,
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
  error: string | null;
  covered: boolean;
  onClose: () => void;
  onOpenTest: (assignment: HomeworkAssignment) => void;
  onAnswerChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>, assignmentId: number) => void;
  onAddFiles: (files: FileList | null) => void;
  onRemoveFile: (index: number) => void;
}) {
  const t = useTranslations("StudentHomeworkPage");
  const open = Boolean(assignment);
  const dialogRef = useRef<HTMLElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const mounted = useSyncExternalStore(
    subscribeToClientMount,
    getClientMountSnapshot,
    getServerMountSnapshot,
  );
  const mobileViewport = useSyncExternalStore(
    subscribeToMobileViewport,
    getMobileViewportSnapshot,
    getServerMobileViewportSnapshot,
  );

  useEffect(() => {
    if (!open || !mobileViewport) return;
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [mobileViewport, open]);

  useEffect(() => {
    if (!open) return;

    returnFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusFrame = window.requestAnimationFrame(() => {
      const firstVisibleControl = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(DIALOG_FOCUSABLE_SELECTOR) ?? [],
      ).find((element) => element.offsetParent !== null);
      firstVisibleControl?.focus();
    });

    return () => {
      window.cancelAnimationFrame(focusFrame);
      if (returnFocusRef.current?.isConnected) returnFocusRef.current.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open || covered) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab" || !mobileViewport) return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const controls = Array.from(
        dialog.querySelectorAll<HTMLElement>(DIALOG_FOCUSABLE_SELECTOR),
      ).filter((element) => element.offsetParent !== null);
      if (controls.length === 0) {
        event.preventDefault();
        return;
      }

      const first = controls[0];
      const last = controls[controls.length - 1];
      if (
        event.shiftKey &&
        (document.activeElement === first || !dialog.contains(document.activeElement))
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last || !dialog.contains(document.activeElement))
      ) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [covered, mobileViewport, onClose, open]);

  if (!mounted) return null;

  return createPortal(
    <>
      {open && !covered ? (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-[55] bg-black/75 lg:hidden"
          onClick={onClose}
        />
      ) : null}

      <aside
        ref={dialogRef}
        role="dialog"
        aria-modal={open && mobileViewport && !covered ? "true" : undefined}
        aria-hidden={!open || covered}
        inert={!open || covered}
        aria-label={assignment ? drawerTitle(assignment) : t("closeHomeworkDetails")}
        className={[
          "fixed top-1/2 left-1/2 z-[60] h-[min(833px,calc(100dvh-32px))] w-[min(375px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[25px] bg-white shadow-[0_0_30px_rgba(0,0,0,0.35)] transition-[transform,opacity,visibility] duration-300 ease-out lg:top-[76px] lg:right-0 lg:bottom-0 lg:left-auto lg:z-40 lg:h-auto lg:w-[min(490px,calc(100vw-24px))] lg:translate-y-0 lg:rounded-none lg:rounded-tl-[20px] lg:rounded-bl-[20px] lg:shadow-[0_0_30px_rgba(0,0,0,0.16)]",
          open
            ? "scale-100 opacity-100 lg:translate-x-0"
            : "pointer-events-none invisible scale-95 opacity-0 lg:visible lg:scale-100 lg:translate-x-full lg:opacity-100",
        ].join(" ")}
      >
        {assignment ? (
          <div className="flex h-full min-h-0 flex-col overflow-y-auto overscroll-contain px-4 pt-10 pb-8 font-(family-name:--font-base) text-[#121212] lg:px-[36px] lg:py-8">
            <div className="flex shrink-0 items-center justify-between gap-4 lg:hidden">
              <div className="flex min-w-0 items-center gap-5 text-base leading-5 text-[#5E5E5E]">
                <span className="shrink-0">
                  {compactDateLabel(assignment.due_at || assignment.published_at)}
                </span>
                <span className="truncate">{assignment.course_title}</span>
              </div>
              <button
                type="button"
                aria-label={t("closeHomeworkDetails")}
                onClick={onClose}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-black transition hover:bg-[#F4F4F4]"
              >
                <X className="h-7 w-7" aria-hidden="true" />
              </button>
            </div>

            <button
              type="button"
              aria-label={t("closeHomeworkDetails")}
              onClick={onClose}
              className="mb-9 hidden h-8 w-8 items-center justify-center rounded-full text-black transition hover:bg-[#F4F4F4] lg:flex"
            >
              <X size={18} aria-hidden="true" />
            </button>

            <div className="hidden items-center gap-5 text-[14px] leading-[18px] text-[#5E5E5E] lg:flex">
              <span>{compactDateLabel(assignment.due_at || assignment.published_at)}</span>
              <span className="truncate">{assignment.course_title}</span>
            </div>

            <div className="mt-5 lg:mt-7">
              <h2 className="font-(family-name:--font-accent) text-[32px] leading-10 font-normal tracking-normal lg:text-[28px] lg:leading-[35px]">
                {drawerTitle(assignment)}
              </h2>
              <p className="mt-1 font-(family-name:--font-accent) text-[16px] leading-5 tracking-normal">
                {drawerSubtitle(assignment)}
              </p>
            </div>

            <div className="mt-6 max-w-none text-base leading-5 lg:max-w-[330px] lg:text-[13px] lg:leading-[16px]">
              {assignment.lesson_title ? (
                <p className="font-semibold">
                  {t("lessonLabel", { title: assignment.lesson_title })}
                </p>
              ) : null}
              {assignment.description ? (
                <p className="mt-1 whitespace-pre-wrap">{assignment.description}</p>
              ) : (
                <p className="mt-1 text-[#5E5E5E]">{t("noDescriptionProvided")}</p>
              )}
            </div>

            <div className="mt-6 lg:mt-8">
              <h3 className="text-base leading-5 font-semibold lg:text-[13px] lg:leading-4">
                {t("mainMaterialsHeading")}
              </h3>
              <div className="mt-4 flex flex-col gap-4 lg:mt-5 lg:gap-5">
                {assignment.test_detail ? (
                  <button
                    type="button"
                    onClick={() => onOpenTest(assignment)}
                    className="-mx-1 flex items-center gap-4 rounded-md px-1 py-0 text-left transition hover:bg-[#FAFAFA] lg:py-0.5"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-[linear-gradient(135deg,#FCC4C3_0%,#A7BAFA_100%)] lg:h-9 lg:w-9">
                      <Image
                        src="/icons/test.svg"
                        alt=""
                        width={32}
                        height={32}
                        className="h-8 w-8 lg:h-5 lg:w-5"
                      />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-base leading-5 font-medium lg:text-[13px] lg:leading-4">
                        {assignment.test_detail.title}
                      </span>
                      <span className="mt-0.5 block text-xs leading-4 text-[#5E5E5E] lg:text-[10px] lg:leading-3">
                        {t("taskKindTest")}
                      </span>
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
                          className="-mx-1 flex items-center gap-4 rounded-md px-1 py-0 transition hover:bg-[#FAFAFA] lg:py-0.5"
                        >
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-[linear-gradient(135deg,#FCC4C3_0%,#A7BAFA_100%)] lg:h-9 lg:w-9">
                            <HomeworkBookIcon />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-base leading-5 font-medium lg:text-[13px] lg:leading-4">
                              {attachment.original_name}
                            </span>
                            <span className="mt-0.5 block text-xs leading-4 text-[#5E5E5E] lg:text-[10px] lg:leading-3">
                              {t("materialLabel")}
                            </span>
                          </span>
                        </a>
                      ) : null,
                    )
                  : null}
                {!assignment.test_detail && assignment.attachments.length === 0 ? (
                  <p className="text-[12px] text-[#5E5E5E]">{t("noMaterialsAttached")}</p>
                ) : null}
              </div>
            </div>

            <div className="mt-3 h-px shrink-0 bg-[#A7BAFA] lg:mt-7" />

            {submission ? (
              <div className="mt-5 rounded-lg bg-[#F4F7FF] p-4 text-sm">
                <p className="font-medium text-[#24376F]">{submissionStatusLabel(submission, t)}</p>
                {submission.test_attempt ? (
                  <p className="mt-2 text-[#24376F]">
                    {t("testAttemptSent", {
                      score: submission.test_attempt.score,
                      number: submission.test_attempt.attempt_number,
                    })}
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
                    <p>{t("scoreLabel", { score: submission.score ?? "-" })}</p>
                    {submission.feedback ? (
                      <p>{t("commentLabel", { feedback: submission.feedback })}</p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : (
              <form onSubmit={(event) => onSubmit(event, assignment.id)} className="mt-5 lg:mt-6">
                <textarea
                  rows={8}
                  value={answer}
                  onChange={(event) => onAnswerChange(event.target.value)}
                  placeholder={t("textPlaceholder")}
                  className="h-[clamp(160px,30dvh,266px)] w-full resize-none rounded-lg border-2 border-[#CFCFCF] px-5 py-5 text-xl leading-6 outline-none transition placeholder:text-[#7E7E7E] focus:ring-2 focus:ring-[#9DB1FA] lg:h-[192px] lg:rounded-[4px] lg:border lg:px-4 lg:py-4 lg:text-[16px] lg:leading-5"
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
                          {t("remove")}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}

                {error ? (
                  <p role="alert" className="mt-3 text-sm text-[#B42318]">
                    {error}
                  </p>
                ) : null}

                <div className="relative mt-7 flex min-h-10 items-center justify-center lg:mt-4 lg:min-h-[38px]">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex h-10 min-w-40 items-center justify-center rounded-full bg-black px-8 font-(family-name:--font-accent) text-sm leading-none font-semibold uppercase text-white transition hover:bg-[#252525] disabled:bg-[#BFBFBF] lg:h-[38px] lg:min-w-[144px] lg:text-[13px]"
                  >
                    {saving ? t("submitting") : t("submit")}
                  </button>
                  <label className="absolute right-0 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-black transition hover:bg-[#F4F4F4] focus-within:ring-2 focus-within:ring-[#9DB1FA] has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60 lg:h-9 lg:w-9">
                    <Paperclip
                      className="h-10 w-10 lg:h-[30px] lg:w-[30px]"
                      strokeWidth={1.8}
                      aria-hidden="true"
                    />
                    <input
                      type="file"
                      multiple
                      disabled={saving}
                      aria-label={t("materialLabel")}
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
    </>,
    document.body,
  );
}

function HomeworkQuizModal({
  assignment,
  onClose,
}: {
  assignment: HomeworkAssignment | null;
  onClose: () => void;
}) {
  const t = useTranslations("StudentHomeworkPage");
  const test = assignment?.test_detail ?? null;
  const ordered = useMemo(() => byOrder(test?.questions ?? []), [test]);
  const [answers, setAnswers] = useState<Record<number, AnswerState>>({});
  const [result, setResult] = useState<TestAttemptResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

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

  useEffect(() => {
    if (!assignment) return;

    const returnFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    return () => {
      window.cancelAnimationFrame(focusFrame);
      if (returnFocus?.isConnected) returnFocus.focus();
    };
  }, [assignment]);

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
      setError(apiError.message || apiError.detail || t("couldNotSubmitAnswers"));
    } finally {
      setSubmitting(false);
    }
  };

  const closeButton = (
    <button
      ref={closeButtonRef}
      type="button"
      aria-label={t("closeTest")}
      onClick={onClose}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-(--color-text-primary) transition hover:bg-(--color-bg-surface)"
    >
      <X size={20} aria-hidden="true" />
    </button>
  );

  return createPortal(
    <div
      className="fixed inset-0 z-[70] overflow-y-auto bg-(--color-brand-lavender-soft) px-4 py-4 lg:top-[76px] lg:right-0 lg:bottom-0 lg:left-[clamp(60px,4.5vw,80px)] lg:px-8 lg:py-[52px]"
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
              {t("loadingYourTest")}
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
                    {submitting ? t("submittingEllipsis") : t("toTheResults")}
                  </QuizActionButton>
                </div>
              )}
            </div>
          )}
        </QuizWindow>
      </section>
    </div>,
    document.body,
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
  const t = useTranslations("StudentHomeworkPage");
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
        <span>{t("answeredLabel", { answered, total: result.total_count })}</span>
        <span>{t("correctAnswersLabel", { count: result.correct_count })}</span>
        <span>{t("incorrectAnswersLabel", { count: incorrect })}</span>
      </div>

      <p
        className={`text-center font-(family-name:--font-base) text-xl leading-[25px] ${
          result.passed ? "text-(--color-quiz-correct)" : "text-(--color-pink-dark)"
        }`}
      >
        {result.passed
          ? t("youPassed")
          : t("didNotReachPassingScore", { score: result.passing_score })}
      </p>

      <div className="flex flex-wrap items-center justify-end gap-5">
        <span className="font-(family-name:--font-base) text-xl leading-[25px] text-(--color-black)">
          {t("assessmentLabel")}
        </span>
        <span className="flex h-[60px] w-[60px] items-center justify-center rounded-lg bg-(--color-brand-lavender) font-(family-name:--font-accent) text-2xl font-medium leading-[30px] text-(--color-blue-dark)">
          {result.score}
        </span>
        {result.can_retake ? (
          <GradientButton onClick={onRetake}>{t("retake")}</GradientButton>
        ) : null}
        <QuizActionButton onClick={onClose}>{t("backToHomework")}</QuizActionButton>
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
  const t = useTranslations("StudentHomeworkPage");
  const tSidebar = useTranslations("AppSidebar");
  const locale = useLocale();
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
        new Map(
          assignments
            .filter((assignment) => assignment.course_slug && assignment.course_title)
            .map((assignment) => [assignment.course_slug, assignment.course_title]),
        ),
      ).sort((first, second) => first[1].localeCompare(second[1])),
    [assignments],
  );

  const filteredAssignments = useMemo(
    () =>
      assignments.filter((assignment) => {
        const kind = assignmentTypeValue(assignment);
        const submission = submissions[assignment.id];
        const status = assignmentStatus(assignment, submission);

        if (taskTypeFilter !== "all" && kind !== taskTypeFilter) return false;
        if (subjectFilter !== "all" && assignment.course_slug !== subjectFilter) return false;
        if (statusFilter === "completed" && !submission) return false;
        if (statusFilter !== "all" && statusFilter !== "completed" && status !== statusFilter) {
          return false;
        }
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
        groups.set(key, { key, label: monthLabel(dateValue, locale), items: [assignment] });
      }
    });

    return Array.from(groups.values());
  }, [filteredAssignments, locale]);

  const selectedAssignment =
    assignments.find((assignment) => assignment.id === selectedAssignmentId) ?? null;

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const requestedCourse = query.get("course");
    const requestedStatus = query.get("status");

    if (requestedCourse) setSubjectFilter(requestedCourse);
    if (STATUS_FILTER_VALUES.includes(requestedStatus as StatusFilter)) {
      setStatusFilter(requestedStatus as StatusFilter);
    }

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
        setError(requestError.detail || requestError.message || t("couldNotLoadHomework")),
      )
      .finally(() => setLoading(false));
  }, [t]);

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
      setError(apiError.detail || apiError.message || t("couldNotSubmitHomework"));
    } finally {
      setSavingId(null);
    }
  }

  function addAttachmentFiles(assignmentId: number, files: FileList | null) {
    if (!files) return;
    const selectedFiles = Array.from(files);
    const tooLarge = selectedFiles.find((file) => file.size > 25 * 1024 * 1024);
    if (tooLarge) {
      setError(t("fileSizeLimit", { name: tooLarge.name }));
      return;
    }
    setAttachmentFiles((current) => ({
      ...current,
      [assignmentId]: [...(current[assignmentId] ?? []), ...selectedFiles],
    }));
    setError("");
  }

  return (
    <PageShell className="relative isolate overflow-hidden bg-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[-257px] left-[113px] z-0 h-[1002px] w-[1368px] rotate-[-33.8deg] bg-[#FCC4C3] opacity-50 blur-[300px]"
      />
      <section className="relative z-10 w-full max-w-[1710px] font-(family-name:--font-base)">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="mr-2 text-[28px] leading-none font-normal text-[#121212]">
            {tSidebar("homework")}
          </h1>
          <FilterSelect
            label={t("taskTypeFilterLabel")}
            value={taskTypeFilter}
            options={taskTypeOptions(t)}
            onChange={setTaskTypeFilter}
          />
          <FilterSelect
            label={t("subjectFilterLabel")}
            value={subjectFilter}
            options={[
              { value: "all", label: t("subjectFilterLabel") },
              ...subjectOptions.map(([slug, title]) => ({ value: slug, label: title })),
            ]}
            onChange={(value) => setSubjectFilter(value)}
          />
          <FilterSelect
            label={t("statusFilterLabel")}
            value={statusFilter}
            options={statusOptions(t)}
            onChange={setStatusFilter}
          />
          <span className="inline-flex h-10 items-center rounded-full border border-[#ECECEC] bg-white px-5 text-[20px] leading-none font-normal text-[#121212] shadow-[0_0_4px_rgba(0,0,0,0.06)]">
            {t("totalAssignments", { count: filteredAssignments.length })}
          </span>
        </div>

        {loading ? <p className="mt-8 text-sm text-[#6A6A6A]">{t("loadingHomework")}</p> : null}
        {error && !selectedAssignment ? (
          <p role="alert" className="mt-6 text-sm text-[#B42318]">
            {error}
          </p>
        ) : null}
        {!loading && !error && assignments.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-[#D9D4CB] bg-white px-6 py-14 text-center">
            <ClipboardList className="mx-auto text-[#9DAEF3]" size={34} aria-hidden="true" />
            <h2 className="mt-3 font-semibold text-[#121212]">
              {t("noHomeworkAssignedYetHeading")}
            </h2>
          </div>
        ) : null}
        {!loading && !error && assignments.length > 0 && filteredAssignments.length === 0 ? (
          <div className="mt-8 max-w-[722px] rounded-lg border border-dashed border-[#D9D4CB] bg-white px-6 py-10 text-center text-sm text-[#6A6A6A]">
            {t("noHomeworkMatchesFilters")}
          </div>
        ) : null}

        <div className="mt-14 space-y-11">
          {groupedAssignments.map((group) => (
            <section key={group.key}>
              <h2 className="mb-4 w-fit text-center text-[16px] leading-none font-normal tracking-normal not-italic text-[#121212]">
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
                        onToggle={() => {
                          setError("");
                          setSelectedAssignmentId(assignment.id);
                        }}
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
        error={error}
        covered={Boolean(testAssignment)}
        onClose={() => {
          setError("");
          setSelectedAssignmentId(null);
        }}
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
    </PageShell>
  );
}
