"use client";

import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ClipboardList } from "lucide-react";
import {
  getCourseBySlug,
  getCourseEnrolledStudents,
  getTeacherCourses,
  type CourseCohort,
  type CourseDetail,
  type CourseListItem,
  type CourseModule,
  type EnrolledStudent,
} from "@/entities/course";
import {
  getHomeworkAssignments,
  type HomeworkAssignment,
  type HomeworkSubmission,
} from "@/entities/homework";
import type { ApiError } from "@/shared/api/base";

type SelectOption = {
  value: string;
  label: string;
};

type GradebookStudent = {
  enrollmentId: number;
  name: string;
  email: string;
};

type ReviewedGrade = {
  score: number;
  maxScore: number | null;
  homeworkTitle: string;
  submittedAt: string;
  reviewedAt: string;
  updatedAt: number;
};

const STUDENT_NUMBER_COLUMN_WIDTH = 54;
const STUDENT_NAME_COLUMN_WIDTH = 220;
const GRADE_CELL_WIDTH = 62;
const LESSON_COLUMN_MIN_GAP = 32;
const STUDENT_COLUMNS_WIDTH = STUDENT_NUMBER_COLUMN_WIDTH + STUDENT_NAME_COLUMN_WIDTH;
const ALL_GROUPS_FILTER_VALUE = "all";
const INDIVIDUAL_FILTER_VALUE = "individual";

function GradebookSelect({
  value,
  options,
  ariaLabel,
  placeholder,
  className = "",
  disabled = false,
  onChange,
}: {
  value: string;
  options: SelectOption[];
  ariaLabel: string;
  placeholder: string;
  className?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    function closeOnOutsidePointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, []);

  return (
    <div ref={rootRef} className={`relative h-10 ${className}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-full border border-[#ECECEC] bg-white px-4 font-(family-name:--font-base) text-[15px] leading-[20px] font-normal text-[#121212] shadow-[0_0_4px_rgba(0,0,0,0.06)] outline-none transition hover:shadow-[0_2px_10px_rgba(0,0,0,0.08)] focus:ring-2 focus:ring-[#9DB1FA] disabled:cursor-not-allowed disabled:text-[#8A8A8A]"
      >
        <span className="min-w-0 truncate leading-[20px]">{selected?.label ?? placeholder}</span>
        <ChevronDown
          size={18}
          aria-hidden="true"
          className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className="absolute z-[120] mt-2 max-h-[248px] min-w-full overflow-y-auto rounded-[14px] border border-[#E2E2E2] bg-white py-2 shadow-[0_12px_28px_rgba(0,0,0,0.16)]"
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
                  setOpen(false);
                }}
                className={`flex min-h-10 w-full items-center px-4 text-left font-(family-name:--font-base) text-[15px] leading-[20px] transition hover:bg-[#F5F7FF] ${
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

function lessonColumnLabel(index: number): string {
  return `${index + 1}. Les.`;
}

function moduleLabel(module: CourseModule, index: number): string {
  return `${index + 1}. ${module.title}`;
}

function cohortLabel(cohort: CourseCohort, index: number): string {
  return cohort.name?.trim() || `Group ${index + 1}`;
}

function studentsFromCohort(cohort: CourseCohort | null): GradebookStudent[] {
  if (!cohort) return [];
  return cohort.members.map((member) => ({
    enrollmentId: member.enrollment_id,
    name: member.student_name || member.student_email,
    email: member.student_email,
  }));
}

function studentsFromEnrollments(students: EnrolledStudent[]): GradebookStudent[] {
  return students.map((student) => ({
    enrollmentId: student.enrollment_id,
    name: student.student_name || student.student_email,
    email: student.student_email,
  }));
}

function gradeKey(enrollmentId: number, lessonId: number): string {
  return `${enrollmentId}:${lessonId}`;
}

function isCheckedHomeworkSubmission(
  submission: HomeworkSubmission,
): submission is HomeworkSubmission & { score: number; submitted_at: string; reviewed_at: string } {
  return (
    submission.status === "reviewed" &&
    submission.score != null &&
    Boolean(submission.submitted_at) &&
    Boolean(submission.reviewed_at)
  );
}

function isIssuedHomeworkAssignment(assignment: HomeworkAssignment): boolean {
  return assignment.status === "published" || assignment.status === "closed";
}

function buildGradeMap(assignments: HomeworkAssignment[], moduleId: number | null) {
  const grades = new Map<string, ReviewedGrade>();

  assignments.forEach((assignment) => {
    if (moduleId != null && assignment.module !== moduleId) return;
    if (!assignment.lesson) return;

    assignment.teacher_submissions.forEach((submission) => {
      if (!isCheckedHomeworkSubmission(submission)) return;

      const key = gradeKey(submission.enrollment_id, assignment.lesson as number);
      const updatedAt = new Date(submission.reviewed_at).getTime();
      if (Number.isNaN(updatedAt)) return;

      const current = grades.get(key);

      if (!current || updatedAt >= current.updatedAt) {
        grades.set(key, {
          score: submission.score,
          maxScore: assignment.max_score,
          homeworkTitle: assignment.title,
          submittedAt: submission.submitted_at,
          reviewedAt: submission.reviewed_at,
          updatedAt,
        });
      }
    });
  });

  return grades;
}

function GradeCell({ grade, inactive = false }: { grade?: ReviewedGrade; inactive?: boolean }) {
  if (!grade || inactive) {
    return (
      <span
        aria-hidden="true"
        className={`block h-7 w-[62px] rounded-md border ${
          inactive ? "border-[#E3E3E3] bg-[#F3F3F3]" : "border-[#E1E1E1] bg-[#FAFAFA]"
        }`}
      />
    );
  }

  return (
    <span
      className="flex h-7 w-[62px] items-center justify-center rounded-md bg-[linear-gradient(90deg,var(--color-brand-lavender)_0%,var(--color-brand-pink)_55%,var(--color-brand-cream)_100%)] font-(family-name:--font-base) text-[20px] leading-none font-normal text-[#121212]"
      title={`${grade.homeworkTitle}: ${grade.score}${grade.maxScore != null ? `/${grade.maxScore}` : ""}`}
      aria-label={`Reviewed homework ${grade.homeworkTitle}, score ${grade.score}${
        grade.maxScore != null ? ` of ${grade.maxScore}` : ""
      }`}
    >
      {grade.score}
    </span>
  );
}

export default function TeacherGradebookPage() {
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [selectedCourseSlug, setSelectedCourseSlug] = useState("");
  const [courseDetail, setCourseDetail] = useState<CourseDetail | null>(null);
  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [individualStudents, setIndividualStudents] = useState<EnrolledStudent[]>([]);
  const [assignments, setAssignments] = useState<HomeworkAssignment[]>([]);
  const [selectedCohortId, setSelectedCohortId] = useState(ALL_GROUPS_FILTER_VALUE);
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingGradebook, setLoadingGradebook] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    getTeacherCourses()
      .then((result) => {
        if (cancelled) return;
        setCourses(result.results);
        setSelectedCourseSlug(result.results[0]?.slug ?? "");
      })
      .catch((requestError: Partial<ApiError>) => {
        if (!cancelled) {
          setError(requestError.detail || requestError.message || "Could not load your courses.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingCourses(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedCourseSlug) {
      return;
    }

    let cancelled = false;

    void (async () => {
      await Promise.resolve();
      if (cancelled) return;

      setLoadingGradebook(true);
      setError("");

      try {
        const course = await getCourseBySlug(selectedCourseSlug);
        const individualFormat = course.delivery_formats.find(
          (format) => format.format_type === "individual",
        );
        const [enrolledStudents, individualEnrolledStudents, homework] = await Promise.all([
          getCourseEnrolledStudents(selectedCourseSlug),
          individualFormat
            ? getCourseEnrolledStudents(selectedCourseSlug, individualFormat.id)
            : Promise.resolve([]),
          getHomeworkAssignments(selectedCourseSlug),
        ]);
        if (cancelled) return;
        setCourseDetail(course);
        setStudents(enrolledStudents);
        setIndividualStudents(individualEnrolledStudents);
        setAssignments(homework);
        setSelectedModuleId(course.modules[0]?.id ?? null);
        setSelectedCohortId(
          course.cohorts[0] ? String(course.cohorts[0].id) : ALL_GROUPS_FILTER_VALUE,
        );
      } catch (requestError) {
        if (!cancelled) {
          const apiError = requestError as Partial<ApiError>;
          setError(apiError.detail || apiError.message || "Could not load gradebook data.");
        }
      } finally {
        if (!cancelled) setLoadingGradebook(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedCourseSlug]);

  const courseOptions = useMemo(
    () => courses.map((course) => ({ value: course.slug, label: course.title })),
    [courses],
  );

  const cohorts = useMemo(() => courseDetail?.cohorts ?? [], [courseDetail]);
  const cohortOptions = useMemo(
    () => [
      { value: ALL_GROUPS_FILTER_VALUE, label: "All groups" },
      { value: INDIVIDUAL_FILTER_VALUE, label: "individual" },
      ...cohorts.map((cohort, index) => ({
        value: String(cohort.id),
        label: cohortLabel(cohort, index),
      })),
    ],
    [cohorts],
  );

  const selectedCohort = cohorts.find((cohort) => String(cohort.id) === selectedCohortId) ?? null;
  const selectedModule =
    courseDetail?.modules.find((module) => module.id === selectedModuleId) ?? null;
  const lessonColumns = selectedModule?.lessons ?? [];
  const visibleStudents =
    selectedCohortId === INDIVIDUAL_FILTER_VALUE
      ? studentsFromEnrollments(individualStudents)
      : selectedCohort
        ? studentsFromCohort(selectedCohort)
        : studentsFromEnrollments(students);
  const grades = useMemo(
    () => buildGradeMap(assignments, selectedModuleId),
    [assignments, selectedModuleId],
  );
  const issuedLessonIds = useMemo(() => {
    const lessonIds = new Set<number>();

    assignments.forEach((assignment) => {
      if (selectedModuleId != null && assignment.module !== selectedModuleId) return;
      if (!assignment.lesson || !isIssuedHomeworkAssignment(assignment)) return;
      lessonIds.add(assignment.lesson);
    });

    return lessonIds;
  }, [assignments, selectedModuleId]);
  const lessonTrackMinWidth =
    lessonColumns.length > 0
      ? lessonColumns.length * GRADE_CELL_WIDTH +
        Math.max(lessonColumns.length - 1, 0) * LESSON_COLUMN_MIN_GAP
      : 240;
  const gradebookContentMinWidth = STUDENT_COLUMNS_WIDTH + lessonTrackMinWidth;
  const gradebookGridStyle = useMemo<CSSProperties>(
    () => ({
      gridTemplateColumns: `${STUDENT_NUMBER_COLUMN_WIDTH}px ${STUDENT_NAME_COLUMN_WIDTH}px minmax(${lessonTrackMinWidth}px, 1fr)`,
    }),
    [lessonTrackMinWidth],
  );
  const gradebookContentStyle = useMemo<CSSProperties>(
    () => ({
      width: `max(100%, ${gradebookContentMinWidth}px)`,
    }),
    [gradebookContentMinWidth],
  );
  const lessonTrackStyle = useMemo<CSSProperties>(
    () => ({
      columnGap: `${LESSON_COLUMN_MIN_GAP}px`,
      gridTemplateColumns:
        lessonColumns.length > 0
          ? `repeat(${lessonColumns.length}, ${GRADE_CELL_WIDTH}px)`
          : `${GRADE_CELL_WIDTH}px`,
      justifyContent: lessonColumns.length === 1 ? "center" : "space-between",
    }),
    [lessonColumns.length],
  );

  return (
    <main className="relative isolate h-[calc(100vh-76px)] overflow-hidden bg-white px-4 py-[52px] sm:px-8 lg:pr-[90px] lg:pl-[89px]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[-257px] left-[113px] z-0 h-[1002px] w-[1368px] rotate-[-33.8deg] bg-[#FCC4C3] opacity-50 blur-[300px]"
      />

      <section className="relative z-10 h-full w-full font-(family-name:--font-base) text-[#121212]">
        <div className="flex h-10 shrink-0 items-center gap-3">
          <h1 className="mr-6 text-[18px] leading-none font-semibold">Homework</h1>
          <GradebookSelect
            value={selectedCourseSlug}
            options={courseOptions}
            ariaLabel="Course"
            placeholder={loadingCourses ? "Loading courses" : "Select course"}
            disabled={loadingCourses || courseOptions.length === 0}
            className="w-[230px]"
            onChange={setSelectedCourseSlug}
          />
          <GradebookSelect
            value={selectedCohortId}
            options={cohortOptions}
            ariaLabel="Group"
            placeholder="Group"
            disabled={loadingGradebook || !courseDetail}
            className="w-[132px]"
            onChange={setSelectedCohortId}
          />
        </div>

        {error ? (
          <p role="alert" className="mt-5 text-sm text-[#B42318]">
            {error}
          </p>
        ) : null}

        {!loadingCourses && courses.length === 0 ? (
          <div className="mt-10 max-w-[720px] rounded-xl border border-dashed border-[#D9D4CB] bg-white px-6 py-14 text-center">
            <ClipboardList className="mx-auto text-[#9DAEF3]" size={34} aria-hidden="true" />
            <h2 className="mt-3 font-semibold">No courses yet</h2>
          </div>
        ) : null}

        <div className="mt-7 grid min-h-0 w-full grid-cols-[331px_minmax(0,1fr)] gap-[20px]">
          <aside className="h-[min(793px,calc(100vh-248px))] overflow-hidden rounded-[16px] bg-white shadow-(--shadow-dashboard-card)">
            <div className="flex h-10 items-center justify-center rounded-t-[16px] bg-[linear-gradient(90deg,var(--color-brand-lavender)_0%,var(--color-brand-pink)_55%,var(--color-brand-cream)_100%)] text-[20px] leading-none font-normal tracking-normal">
              Modules
            </div>
            <div className="h-[calc(100%-40px)] overflow-y-auto py-2">
              {courseDetail?.modules.map((module, index) => {
                const active = module.id === selectedModuleId;
                return (
                  <button
                    key={module.id}
                    type="button"
                    onClick={() => setSelectedModuleId(module.id)}
                    className={`flex min-h-[46px] w-full items-center px-3.5 text-left text-[20px] leading-[25px] font-normal transition ${
                      active ? "bg-[#ECECEC]" : "bg-white hover:bg-[#F7F7F7]"
                    }`}
                  >
                    <span className="line-clamp-2">{moduleLabel(module, index)}</span>
                  </button>
                );
              })}
              {!loadingGradebook && courseDetail && courseDetail.modules.length === 0 ? (
                <p className="px-4 py-5 text-sm text-[#5E5E5E]">No modules in this course.</p>
              ) : null}
              {loadingGradebook ? (
                <p className="px-4 py-5 text-sm text-[#5E5E5E]">Loading modules...</p>
              ) : null}
            </div>
          </aside>

          <section className="flex h-[min(793px,calc(100vh-248px))] min-w-0 flex-col gap-[10px] overflow-hidden rounded-[16px] bg-white shadow-(--shadow-dashboard-card)">
            <div className="grid h-10 shrink-0 grid-cols-[274px_minmax(0,1fr)] items-center rounded-t-[16px] bg-[linear-gradient(90deg,var(--color-brand-lavender)_0%,var(--color-brand-pink)_55%,var(--color-brand-cream)_100%)] text-center text-[20px] leading-none font-normal tracking-normal">
              <span>Students</span>
              <span>Lessons</span>
            </div>

            <div className="min-h-0 flex-1 overflow-auto px-5 pb-6">
              <div style={gradebookContentStyle}>
                <div
                  className="grid h-10 items-center text-left text-[20px] font-bold"
                  style={gradebookGridStyle}
                >
                  <div className="px-1">№</div>
                  <div className="px-1">Name</div>
                  {lessonColumns.length > 0 ? (
                    <div className="grid items-center px-2" style={lessonTrackStyle}>
                      {lessonColumns.map((lesson, index) => (
                        <span
                          key={lesson.id}
                          className={`block w-[62px] text-center ${
                            issuedLessonIds.has(lesson.id) ? "text-[#121212]" : "text-[#BFBFBF]"
                          }`}
                        >
                          {lessonColumnLabel(index)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="px-2 text-[#BFBFBF]">No lessons</div>
                  )}
                </div>

                {visibleStudents.map((student, rowIndex) => (
                  <div
                    key={student.enrollmentId}
                    className="grid h-[64px] items-center border-b border-[#EFEFEF] text-[20px] font-normal"
                    style={gradebookGridStyle}
                  >
                    <div className="px-1">{rowIndex + 1}</div>
                    <div className="px-1">
                      <span className="block max-w-[200px] truncate">{student.name}</span>
                    </div>
                    {lessonColumns.length > 0 ? (
                      <div className="grid items-center px-2" style={lessonTrackStyle}>
                        {lessonColumns.map((lesson) => {
                          const inactive = !issuedLessonIds.has(lesson.id);

                          return (
                            <div key={lesson.id} className="flex w-[62px] justify-center">
                              <GradeCell
                                grade={grades.get(gradeKey(student.enrollmentId, lesson.id))}
                                inactive={inactive}
                              />
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="px-2 text-sm text-[#5E5E5E]">
                        Select a module with lessons.
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {!loadingGradebook && visibleStudents.length === 0 ? (
                <div className="flex h-[360px] items-center justify-center text-sm text-[#5E5E5E]">
                  No students in this group.
                </div>
              ) : null}
              {loadingGradebook ? (
                <div className="flex h-[360px] items-center justify-center text-sm text-[#5E5E5E]">
                  Loading gradebook...
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
