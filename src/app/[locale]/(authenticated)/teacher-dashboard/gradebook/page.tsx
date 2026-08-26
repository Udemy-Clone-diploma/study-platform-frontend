"use client";

import { type CSSProperties, useEffect, useMemo, useState } from "react";
import { ClipboardList } from "lucide-react";
import { useTranslations } from "next-intl";
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
import { PageShell } from "@/shared/ui/PageShell";
import { PillSelect } from "@/shared/ui/PillSelect";

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

type GradebookMode = "group" | "individual";
type Translator = (key: string, values?: Record<string, string | number>) => string;

function lessonColumnLabel(index: number, t: Translator): string {
  return t("lessonColumnShort", { number: index + 1 });
}

function moduleLabel(module: CourseModule, index: number, t: Translator): string {
  return t("moduleLabel", { number: index + 1, title: module.title });
}

function cohortLabel(cohort: CourseCohort, index: number, t: Translator): string {
  return cohort.name?.trim() || t("groupFallback", { number: index + 1 });
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
  const t = useTranslations("TeacherGradebookPage");
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
      aria-label={`${t("reviewedHomeworkAriaLabel", { title: grade.homeworkTitle, score: grade.score })}${
        grade.maxScore != null ? t("ofMax", { max: grade.maxScore }) : ""
      }`}
    >
      {grade.score}
    </span>
  );
}

export default function TeacherGradebookPage() {
  const t = useTranslations("TeacherGradebookPage");
  const tStudentsPanel = useTranslations("TeacherStudentsPanel");
  const tSchedule = useTranslations("ScheduleRail");
  const tAttendance = useTranslations("TeacherAttendancePage");
  const GRADEBOOK_FORMAT_OPTIONS = useMemo<{ value: GradebookMode; label: string }[]>(
    () => [
      { value: "group", label: tSchedule("groupSession") },
      { value: "individual", label: tSchedule("individualSession") },
    ],
    [tSchedule],
  );
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [selectedCourseSlug, setSelectedCourseSlug] = useState("");
  const [courseDetail, setCourseDetail] = useState<CourseDetail | null>(null);
  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [individualStudents, setIndividualStudents] = useState<EnrolledStudent[]>([]);
  const [assignments, setAssignments] = useState<HomeworkAssignment[]>([]);
  const [mode, setMode] = useState<GradebookMode>("group");
  const [selectedCohortId, setSelectedCohortId] = useState("");
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
          setError(requestError.detail || requestError.message || t("couldNotLoadCourses"));
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingCourses(false);
      });

    return () => {
      cancelled = true;
    };
  }, [t]);

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
        const hasGroup = course.delivery_formats.some((format) => format.format_type === "group");
        setMode(hasGroup ? "group" : "individual");
        setSelectedCohortId(course.cohorts[0] ? String(course.cohorts[0].id) : "");
      } catch (requestError) {
        if (!cancelled) {
          const apiError = requestError as Partial<ApiError>;
          setError(apiError.detail || apiError.message || t("couldNotLoadGradebook"));
        }
      } finally {
        if (!cancelled) setLoadingGradebook(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedCourseSlug, t]);

  const courseOptions = useMemo(
    () => courses.map((course) => ({ value: course.slug, label: course.title })),
    [courses],
  );

  const cohorts = useMemo(() => courseDetail?.cohorts ?? [], [courseDetail]);
  const cohortOptions = useMemo(
    () =>
      cohorts.map((cohort, index) => ({
        value: String(cohort.id),
        label: cohortLabel(cohort, index, tStudentsPanel),
      })),
    [cohorts, tStudentsPanel],
  );

  const hasGroupFormat = useMemo(
    () => courseDetail?.delivery_formats.some((format) => format.format_type === "group") ?? false,
    [courseDetail],
  );
  const hasIndividualFormat = useMemo(
    () =>
      courseDetail?.delivery_formats.some((format) => format.format_type === "individual") ?? false,
    [courseDetail],
  );
  const modeOptions = useMemo(
    () =>
      GRADEBOOK_FORMAT_OPTIONS.filter((option) =>
        option.value === "group" ? hasGroupFormat : hasIndividualFormat,
      ),
    [hasGroupFormat, hasIndividualFormat, GRADEBOOK_FORMAT_OPTIONS],
  );

  const selectedCohort = cohorts.find((cohort) => String(cohort.id) === selectedCohortId) ?? null;
  const selectedModule =
    courseDetail?.modules.find((module) => module.id === selectedModuleId) ?? null;
  const lessonColumns = selectedModule?.lessons ?? [];
  const visibleStudents =
    mode === "individual"
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
    <PageShell className="relative isolate bg-white" fixedHeight>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[-257px] left-[113px] z-0 h-[1002px] w-[1368px] rotate-[-33.8deg] bg-[#FCC4C3] opacity-50 blur-[300px]"
      />

      <section className="relative z-10 flex h-full w-full flex-col font-(family-name:--font-base) text-[#121212]">
        <div className="flex h-[clamp(32px,2.78vw,40px)] shrink-0 items-center gap-3">
          <h1
            className="mr-6 font-semibold"
            style={{ fontSize: "clamp(18px, 1.67vw, 24px)", lineHeight: 1 }}
          >
            {t("heading")}
          </h1>
          <PillSelect
            value={selectedCourseSlug}
            options={courseOptions}
            ariaLabel={t("courseAriaLabel")}
            placeholder={
              loadingCourses ? t("loadingCoursesPlaceholder") : t("selectCoursePlaceholder")
            }
            disabled={loadingCourses || courseOptions.length === 0}
            onChange={setSelectedCourseSlug}
          />
          <PillSelect
            value={mode}
            options={modeOptions}
            ariaLabel={t("typeAriaLabel")}
            placeholder={t("typePlaceholder")}
            disabled={loadingGradebook || !courseDetail || modeOptions.length === 0}
            onChange={(value: string) => setMode(value as GradebookMode)}
          />
          {mode === "group" && cohortOptions.length > 0 && (
            <PillSelect
              value={selectedCohortId}
              options={cohortOptions}
              ariaLabel={t("groupAriaLabel")}
              placeholder={t("groupPlaceholder")}
              disabled={loadingGradebook || !courseDetail}
              onChange={setSelectedCohortId}
            />
          )}
        </div>

        {error ? (
          <p role="alert" className="mt-5 text-sm text-[#B42318]">
            {error}
          </p>
        ) : null}

        {!loadingCourses && courses.length === 0 ? (
          <div className="mt-10 max-w-[720px] rounded-xl border border-dashed border-[#D9D4CB] bg-white px-6 py-14 text-center">
            <ClipboardList className="mx-auto text-[#9DAEF3]" size={34} aria-hidden="true" />
            <h2 className="mt-3 font-semibold">{t("noCoursesYet")}</h2>
          </div>
        ) : null}

        <div className="mt-7 grid min-h-0 w-full flex-1 grid-cols-[331px_minmax(0,1fr)] gap-[20px]">
          <aside className="h-full overflow-hidden rounded-[16px] bg-white shadow-(--shadow-dashboard-card)">
            <div className="flex h-10 items-center justify-center rounded-t-[16px] bg-[linear-gradient(90deg,var(--color-brand-lavender)_0%,var(--color-brand-pink)_55%,var(--color-brand-cream)_100%)] text-[20px] leading-none font-normal tracking-normal">
              {t("modulesHeading")}
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
                    <span className="line-clamp-2">{moduleLabel(module, index, t)}</span>
                  </button>
                );
              })}
              {!loadingGradebook && courseDetail && courseDetail.modules.length === 0 ? (
                <p className="px-4 py-5 text-sm text-[#5E5E5E]">{t("noModulesInCourse")}</p>
              ) : null}
              {loadingGradebook ? (
                <p className="px-4 py-5 text-sm text-[#5E5E5E]">{t("loadingModules")}</p>
              ) : null}
            </div>
          </aside>

          <section className="flex h-full min-w-0 flex-col gap-[10px] overflow-hidden rounded-[16px] bg-white shadow-(--shadow-dashboard-card)">
            <div className="grid h-10 shrink-0 grid-cols-[274px_minmax(0,1fr)] items-center rounded-t-[16px] bg-[linear-gradient(90deg,var(--color-brand-lavender)_0%,var(--color-brand-pink)_55%,var(--color-brand-cream)_100%)] text-center text-[20px] leading-none font-normal tracking-normal">
              <span>{t("studentsHeading")}</span>
              <span>{t("lessonsHeading")}</span>
            </div>

            <div className="min-h-0 flex-1 overflow-auto px-5 pb-6">
              <div style={gradebookContentStyle}>
                <div
                  className="grid h-10 items-center text-left text-[20px] font-bold"
                  style={gradebookGridStyle}
                >
                  <div className="px-1">№</div>
                  <div className="px-1">{t("columnName")}</div>
                  {lessonColumns.length > 0 ? (
                    <div className="grid items-center px-2" style={lessonTrackStyle}>
                      {lessonColumns.map((lesson, index) => (
                        <span
                          key={lesson.id}
                          className={`block w-[62px] text-center ${
                            issuedLessonIds.has(lesson.id) ? "text-[#121212]" : "text-[#BFBFBF]"
                          }`}
                        >
                          {lessonColumnLabel(index, t)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="px-2 text-[#BFBFBF]">{t("noLessons")}</div>
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
                        {t("selectModuleWithLessons")}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {!loadingGradebook && visibleStudents.length === 0 ? (
                <div className="flex h-[360px] items-center justify-center text-sm text-[#5E5E5E]">
                  {tAttendance("noStudentsInGroup")}
                </div>
              ) : null}
              {loadingGradebook ? (
                <div className="flex h-[360px] items-center justify-center text-sm text-[#5E5E5E]">
                  {t("loadingGradebook")}
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </section>
    </PageShell>
  );
}
