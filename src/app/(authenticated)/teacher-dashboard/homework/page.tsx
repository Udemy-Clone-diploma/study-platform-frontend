"use client";

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
  type HomeworkAssignment,
} from "@/entities/homework";
import {
  getCourseBySlug,
  getTeacherCourses,
  type CourseListItem,
  type CourseModule,
} from "@/entities/course";
import type { ApiError } from "@/shared/api/base";

type FormState = {
  courseSlug: string;
  moduleId: string;
  title: string;
  description: string;
  dueAt: string;
  maxScore: string;
};

const EMPTY_FORM: FormState = {
  courseSlug: "",
  moduleId: "",
  title: "",
  description: "",
  dueAt: "",
  maxScore: "",
};

type SelectOption = {
  value: string;
  label: string;
};

type HomeworkSelectProps = {
  label?: string;
  value: string;
  options: SelectOption[];
  placeholder: string;
  variant?: "field" | "filter";
  disabled?: boolean;
  onChange: (value: string) => void;
};

function HomeworkSelect({
  label,
  value,
  options,
  placeholder,
  variant = "field",
  disabled = false,
  onChange,
}: HomeworkSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    function closeOnOutsidePointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      {label ? <p className="mb-2 text-[14px] font-semibold text-[#121212]">{label}</p> : null}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={() => setIsOpen((current) => !current)}
        className={
          variant === "filter"
            ? "flex h-10 w-full items-center justify-between gap-2 rounded-full bg-white px-4 text-left text-[14px] text-[#121212] outline-none transition focus:ring-2 focus:ring-[#9DB1FA] disabled:cursor-not-allowed disabled:text-[#8A8A8A]"
            : "flex h-14 w-full items-center justify-between gap-3 rounded-md bg-[#ECECEC] px-4 text-left text-[15px] text-[#121212] outline-none transition focus:ring-2 focus:ring-[#9DB1FA] disabled:cursor-not-allowed disabled:text-[#8A8A8A]"
        }
      >
        <span className="truncate">{selectedOption?.label ?? placeholder}</span>
        <ChevronDown
          size={20}
          aria-hidden="true"
          className={`shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen ? (
        <div
          role="listbox"
          aria-label={label ?? placeholder}
          className={
            variant === "filter"
              ? "absolute z-[140] mt-2 max-h-[248px] min-w-[220px] overflow-y-auto rounded-[16px] border border-[#E2E2E2] bg-white py-3 shadow-[0_12px_28px_rgba(0,0,0,0.16)] sm:min-w-[320px]"
              : "absolute z-[140] mt-2 max-h-[248px] w-full overflow-y-auto rounded-[16px] border border-[#E2E2E2] bg-white py-2 shadow-[0_12px_28px_rgba(0,0,0,0.16)]"
          }
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

export default function TeacherHomeworkPage() {
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [selectedCourseSlug, setSelectedCourseSlug] = useState("");
  const [assignments, setAssignments] = useState<HomeworkAssignment[]>([]);
  const [activeModules, setActiveModules] = useState<CourseModule[]>([]);
  const [modalModules, setModalModules] = useState<CourseModule[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
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
      setModalModules([]);
      return;
    }

    let cancelled = false;
    getCourseBySlug(form.courseSlug)
      .then((course) => {
        if (!cancelled) setModalModules(course.modules);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load modules for this course.");
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
  const isSaveDisabled =
    saving || !form.courseSlug || !form.moduleId || !form.title.trim() || !form.description.trim();

  function openModal() {
    setError("");
    setSuccess("");
    setForm({
      ...EMPTY_FORM,
      courseSlug: selectedCourseSlug || courses[0]?.slug || "",
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    if (!saving) setIsModalOpen(false);
  }

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === "courseSlug" ? { moduleId: "" } : {}),
    }));
    setError("");
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
        module: form.moduleId ? Number(form.moduleId) : undefined,
        title: form.title.trim(),
        description: form.description.trim(),
        due_at: form.dueAt ? new Date(`${form.dueAt}T23:59:00`).toISOString() : undefined,
        max_score: maxScore,
      });
      if (selectedCourseSlug === form.courseSlug) {
        setAssignments((current) => [assignment, ...current]);
      } else {
        setSelectedCourseSlug(form.courseSlug);
      }
      setSuccess("Homework draft saved. It has not been sent to students.");
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
                        className="flex min-h-[92px] items-start gap-3 rounded-lg border border-[#ECE8E0] bg-white px-4 py-3 shadow-[0_2px_8px_rgba(18,18,18,0.03)]"
                      >
                        <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FCE1F1] text-[#CC5D9C]">
                          <ClipboardList size={19} aria-hidden="true" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] leading-4 text-[#777]">
                            {moduleNameById.get(assignment.module ?? 0) ?? "Course task"} ·{" "}
                            {assignment.status}
                          </p>
                          <h3 className="mt-0.5 truncate text-[15px] font-medium text-[#121212]">
                            {assignment.title}
                          </h3>
                          <p className="mt-1 truncate text-[11px] text-[#6A6A6A]">
                            {assignment.description}
                          </p>
                        </div>
                        <div className="shrink-0 text-right text-[11px] text-[#5E5E5E]">
                          <p>{deadlineLabel(assignment.due_at)}</p>
                          {assignment.max_score ? (
                            <p className="mt-2 rounded-md bg-[#FFF0D0] px-2 py-1 font-medium text-[#9A6500]">
                              {assignment.max_score} pt
                            </p>
                          ) : null}
                        </div>
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
              <label className="grid gap-2 text-[14px] font-semibold text-[#121212]">
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
                  label="Subject*"
                  value={form.courseSlug}
                  options={courses.map((course) => ({ value: course.slug, label: course.title }))}
                  placeholder="Select a subject"
                  disabled={saving || courses.length === 0}
                  onChange={(value) => updateField("courseSlug", value)}
                />
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
              </div>

              <label className="mt-6 grid gap-2 text-[14px] font-semibold text-[#121212]">
                Homework content*
                <textarea
                  value={form.description}
                  onChange={(event) => updateField("description", event.target.value)}
                  required
                  disabled={saving}
                  rows={10}
                  placeholder="Write your homework content here... You can include text, instructions, and explanations."
                  className="h-[300px] resize-none rounded-md bg-[#ECECEC] px-4 py-4 text-[15px] outline-none transition placeholder:text-[#858585] focus:ring-2 focus:ring-[#9DB1FA] disabled:cursor-not-allowed"
                />
              </label>
              <p className="mt-2 text-[12px] text-[#6A6A6A]">
                This is the main content students will read.
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
                <div className="mt-2 flex h-[208px] flex-col items-center justify-center rounded-md border border-dashed border-[#C9C9C9] px-4 text-center text-[#4E4E4E]">
                  <Upload className="mb-3" size={20} aria-hidden="true" />
                  <p className="text-[15px] font-medium">Upload a file for this homework</p>
                  <p className="mt-1 text-[12px] text-[#6A6A6A]">PDF, JPG, PNG up to 500MB</p>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setError("File uploads are not available yet.")}
                    className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-full border border-[#CFCFCF] bg-white px-4 text-[12px] text-[#121212] transition hover:bg-[#F4F4F4] disabled:cursor-not-allowed"
                  >
                    <Upload size={13} aria-hidden="true" />
                    Choose File
                  </button>
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
          </section>
        </div>
      ) : null}
    </main>
  );
}
