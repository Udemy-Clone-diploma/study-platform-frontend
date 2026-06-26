"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Copy,
  Plus,
  Upload,
  X,
} from "lucide-react";
import {
  createHomeworkAssignment,
  getHomeworkAssignments,
  getHomeworkRecipients,
  publishHomeworkAssignment,
  uploadHomeworkAssignmentAttachment,
  type HomeworkAssignment,
  type HomeworkAvailableRecipient,
} from "@/entities/homework";
import {
  createQuestion,
  createTest,
  getCourseBySlug,
  getTeacherCourses,
  type CourseDetail,
  type CourseListItem,
  type CourseModule,
} from "@/entities/course";
import { TestFormBody, type TestFormValues, type TestQuestion } from "@/features/courses";
import type { ApiError } from "@/shared/api/base";

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
  maxScore: "",
};

type SelectOption = {
  value: string;
  label: string;
};

type RecipientGroupOption = SelectOption & {
  enrollmentIds: number[];
};

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
      ? "flex h-10 w-full items-center justify-between gap-2 rounded-full bg-white px-4 text-left text-[14px] text-[#121212] outline-none transition focus-within:ring-2 focus-within:ring-[#9DB1FA] focus:ring-2 focus:ring-[#9DB1FA] disabled:cursor-not-allowed disabled:text-[#8A8A8A]"
      : "flex h-14 w-full items-center justify-between gap-3 rounded-md bg-[#ECECEC] px-4 text-left text-[15px] text-[#121212] outline-none transition focus-within:ring-2 focus-within:ring-[#9DB1FA] focus:ring-2 focus:ring-[#9DB1FA] disabled:cursor-not-allowed disabled:text-[#8A8A8A]";

  return (
    <div ref={rootRef} className="relative">
      {label ? <p className="mb-2 text-[14px] font-semibold text-[#121212]">{label}</p> : null}
      {searchable ? (
        <div className={`${controlClassName} ${disabled ? "cursor-not-allowed text-[#8A8A8A]" : ""}`}>
          <input
            type="text"
            role="combobox"
            aria-expanded={isOpen}
            aria-controls={`${label ?? placeholder}-options`}
            value={isOpen ? query : selectedOption?.label ?? ""}
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
              ? "absolute z-[140] mt-2 max-h-[248px] min-w-[220px] overflow-y-auto rounded-[16px] border border-[#E2E2E2] bg-white py-3 shadow-[0_12px_28px_rgba(0,0,0,0.16)] sm:min-w-[320px]"
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
                  variant === "filter" ? "min-h-14 text-[18px]" : "min-h-12 text-[17px]"
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

function buildQuestionPayload(question: TestQuestion) {
  return {
    question_type: question.type,
    text: question.text,
    options: question.type === "multiple_choice" ? question.options : undefined,
    correct_index: question.type === "multiple_choice" ? question.correct_index : undefined,
    correct_bool: question.type === "true_false" ? question.correct_bool : undefined,
    sample_answer: question.type === "short_answer" ? question.sample_answer : undefined,
  };
}

export default function TeacherHomeworkPage() {
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [selectedCourseSlug, setSelectedCourseSlug] = useState("");
  const [assignments, setAssignments] = useState<HomeworkAssignment[]>([]);
  const [activeModules, setActiveModules] = useState<CourseModule[]>([]);
  const [modalCourse, setModalCourse] = useState<CourseDetail | null>(null);
  const [modalModules, setModalModules] = useState<CourseModule[]>([]);
  const [modalAssignments, setModalAssignments] = useState<HomeworkAssignment[]>([]);
  const [availableRecipients, setAvailableRecipients] = useState<HomeworkAvailableRecipient[]>([]);
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<number[]>([]);
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
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
      setActiveModules([]);
      return;
    }

    let cancelled = false;
    setLoadingAssignments(true);

    Promise.all([getHomeworkAssignments(selectedCourseSlug), getCourseBySlug(selectedCourseSlug)])
      .then(([homework, course]) => {
        if (cancelled) return;
        setAssignments(homework);
        setActiveModules(course.modules);
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

  const visibleAssignments = useMemo(
    () =>
      assignments.filter(
        (assignment) => statusFilter === "all" || assignment.status === statusFilter,
      ),
    [assignments, statusFilter],
  );
  const assignmentsByMonth = useMemo(() => {
    const result = new Map<string, HomeworkAssignment[]>();
    visibleAssignments.forEach((assignment) => {
      const month = monthLabel(assignment.created_at);
      result.set(month, [...(result.get(month) ?? []), assignment]);
    });
    return [...result.entries()];
  }, [visibleAssignments]);
  const moduleNameById = useMemo(
    () => new Map(activeModules.map((module) => [module.id, module.title])),
    [activeModules],
  );
  const lessonNameById = useMemo(
    () =>
      new Map(
        activeModules.flatMap((module) =>
          module.lessons.map((lesson) => [lesson.id, lesson.title] as const),
        ),
      ),
    [activeModules],
  );
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
  const isSaveDisabled =
    saving || !form.courseSlug || !form.moduleId || !form.lessonId || !form.title.trim() ||
    (!form.testId && !form.description.trim()) ||
    selectedRecipientIds.length === 0;

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
        return {
          ...next,
          moduleId: sourceAssignment.module ? String(sourceAssignment.module) : "",
          lessonId: sourceAssignment.lesson ? String(sourceAssignment.lesson) : "",
          testId: sourceAssignment.test ? String(sourceAssignment.test) : "",
          title: sourceAssignment.title,
          description: sourceAssignment.description,
          maxScore: sourceAssignment.max_score ? String(sourceAssignment.max_score) : "",
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
    if (maxScore !== undefined && (!Number.isInteger(maxScore) || maxScore < 1)) {
      setError("Maximum score must be a positive whole number.");
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

  return (
    <main className="min-h-[calc(100vh-76px)] bg-[#FFFDF8] px-4 py-6 sm:px-8 lg:px-11">
      <section className="mx-auto w-full max-w-[1180px]">
        <div className="flex flex-col gap-5 border-b border-[#E6E1D8] pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-[15px] text-[#121212]">
            <h1 className="font-(family-name:--font-base) text-[20px] font-semibold">
              Assignments
            </h1>
            <span className="text-[#6A6A6A]">Tests</span>
            <span className="text-[#6A6A6A]">Completed</span>
            <span className="text-[#6A6A6A]">Under review</span>
          </div>

          <button
            type="button"
            onClick={openModal}
            disabled={loadingCourses || courses.length === 0}
            className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-full bg-[#D6E0FF] px-5 font-(family-name:--font-accent) text-[13px] font-medium uppercase tracking-wide text-[#121212] transition hover:bg-[#C4D1FF] disabled:cursor-not-allowed disabled:bg-[#E8E8E8] disabled:text-[#8B8B8B] lg:self-auto"
          >
            Add homework
            <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-[13px]">
          <span className="rounded-full border border-[#E1DED8] bg-white px-4 py-2 text-[#5E5E5E]">
            All task types
          </span>
          <div className="w-[min(100%,260px)]">
            <HomeworkSelect
              value={selectedCourseSlug}
              options={courses.map((course) => ({ value: course.slug, label: course.title }))}
              placeholder="All courses"
              variant="filter"
              disabled={loadingCourses || courses.length === 0}
              onChange={setSelectedCourseSlug}
            />
          </div>
          <div className="w-[150px]">
            <HomeworkSelect
              value={statusFilter}
              options={[
                { value: "all", label: "All statuses" },
                { value: "draft", label: "Drafts" },
              ]}
              placeholder="Status"
              variant="filter"
              onChange={setStatusFilter}
            />
          </div>
          <span className="rounded-full border border-[#E1DED8] bg-white px-4 py-2 text-[#A3A3A3]">
            Group — soon
          </span>
          <span className="rounded-full border border-[#E1DED8] bg-white px-4 py-2 text-[#A3A3A3]">
            Student — soon
          </span>
          <span className="rounded-full border border-[#E1DED8] bg-white px-4 py-2 text-[#5E5E5E]">
            Total assignments:
            <strong className="ml-1 font-semibold text-[#121212]">
              {visibleAssignments.length}
            </strong>
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

        <div className="mt-8">
          {loadingAssignments ? (
            <p className="text-sm text-[#6A6A6A]">Loading assignments...</p>
          ) : assignmentsByMonth.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#D9D4CB] bg-white/70 px-6 py-14 text-center">
              <ClipboardList className="mx-auto text-[#9DAEF3]" size={34} aria-hidden="true" />
              <h2 className="mt-3 text-base font-semibold text-[#121212]">No homework yet</h2>
              <p className="mt-1 text-sm text-[#6A6A6A]">
                Create the first draft for the selected subject.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {assignmentsByMonth.map(([month, items]) => (
                <section key={month}>
                  <h2 className="mb-3 text-[15px] font-medium text-[#3E3E3E]">{month}</h2>
                  <div className="grid gap-3 lg:grid-cols-2">
                    {items.map((assignment) => (
                      <article
                        key={assignment.id}
                        className="rounded-lg border border-[#ECE8E0] bg-white px-4 py-3 shadow-[0_2px_8px_rgba(18,18,18,0.03)]"
                      >
                        <div className="flex min-h-[68px] items-start gap-3">
                        <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FCE1F1] text-[#CC5D9C]">
                          <ClipboardList size={19} aria-hidden="true" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] leading-4 text-[#777]">
                            {moduleNameById.get(assignment.module ?? 0) ?? "Course task"} /{" "}
                            {lessonNameById.get(assignment.lesson ?? 0) ?? "No lesson"} /{" "}
                            {assignment.status}
                          </p>
                          <h3 className="mt-0.5 truncate text-[15px] font-medium text-[#121212]">
                            {assignment.title}
                          </h3>
                          <p className="mt-1 truncate text-[11px] text-[#6A6A6A]">
                            {assignment.description}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                            {assignment.test_detail ? (
                              <span className="rounded bg-[#EEF4FF] px-2 py-1 text-[#3851B0]">
                                Test: {assignment.test_detail.title}
                              </span>
                            ) : null}
                            {assignment.source_assignment ? (
                              <span className="inline-flex items-center gap-1 rounded bg-[#F6F3EE] px-2 py-1 text-[#6A5B43]">
                                <Copy size={11} aria-hidden="true" />
                                Reused
                              </span>
                            ) : null}
                          </div>
                          {assignment.attachments.length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                              {assignment.attachments.map((attachment) => (
                                attachment.url ? (
                                  <a
                                    key={attachment.id}
                                    href={attachment.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded bg-[#F0F3FF] px-2 py-1 text-[#3851B0] hover:underline"
                                  >
                                    {attachment.original_name}
                                  </a>
                                ) : null
                              ))}
                            </div>
                          ) : null}
                        </div>
                        <div className="shrink-0 text-right text-[11px] text-[#5E5E5E]">
                          <p>{deadlineLabel(assignment.due_at)}</p>
                          {assignment.max_score ? (
                            <p className="mt-2 rounded-md bg-[#FFF0D0] px-2 py-1 font-medium text-[#9A6500]">
                              {assignment.max_score} pt
                            </p>
                          ) : null}
                        </div>
                        </div>
                        {assignment.teacher_submissions.length > 0 ? (
                          <div className="mt-3 border-t border-[#EEEAE4] pt-2 text-[12px] text-[#3E3E3E]">
                            <p className="font-medium">Student answers</p>
                            {assignment.teacher_submissions.map((submission) => (
                              <div key={submission.id} className="mt-1">
                                <p className="truncate">
                                  {submission.student_name || submission.student_email}: {submission.content || "Files attached"}
                                </p>
                                {submission.attachments.map((attachment) => (
                                  attachment.url ? (
                                    <a
                                      key={attachment.id}
                                      href={attachment.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="mr-2 text-[#3851B0] hover:underline"
                                    >
                                      {attachment.original_name}
                                    </a>
                                  ) : null
                                ))}
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </section>

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
                      {selectedTest.questions.length} question(s), passing score {selectedTest.passing_score}
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="mt-6">
                <p className="mb-2 text-[14px] font-semibold text-[#121212]">Group or student*</p>
                {availableRecipients.length === 0 ? (
                  <p className="mt-2 text-[12px] text-[#A44]">No active students are enrolled in this course.</p>
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
                  Maximum score
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={form.maxScore}
                    onChange={(event) => updateField("maxScore", event.target.value)}
                    disabled={saving}
                    placeholder="For example, 100"
                    className="h-14 rounded-md bg-[#ECECEC] px-4 text-[15px] outline-none transition placeholder:text-[#858585] focus:ring-2 focus:ring-[#9DB1FA] disabled:cursor-not-allowed"
                  />
                </label>
              </div>

              <div className="mt-6">
                <p className="text-[14px] font-semibold text-[#121212]">Homework Material</p>
                <div className="mt-2 flex min-h-[208px] flex-col items-center justify-center rounded-md border border-dashed border-[#C9C9C9] px-4 py-5 text-center text-[#4E4E4E]">
                  <Upload className="mb-3" size={20} aria-hidden="true" />
                  <p className="text-[15px] font-medium">Upload a file for this homework</p>
                  <p className="mt-1 text-[12px] text-[#6A6A6A]">Any file type, up to 25 MB per file</p>
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
                        <div key={`${file.name}-${index}`} className="flex items-center justify-between gap-3 rounded bg-[#F5F5F5] px-3 py-2">
                          <span className="truncate">{file.name}</span>
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => setAttachmentFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))}
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
    </main>
  );
}
