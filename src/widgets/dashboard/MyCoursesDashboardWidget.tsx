"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { StudentCourseCard, TeacherCourseCard, type TeacherCourseStatus } from "@/features/courses";
import {
  getEnrolledCourses,
  getTeacherCourses,
  getStudentCompletions,
  deleteCourse,
  archiveCourse,
  withdrawCourseFromReview,
  unarchiveCourse,
  hideCourse,
  openCourse,
  submitCourseForReview,
} from "@/entities/course";
import type {
  CourseListItem,
  CourseLevel,
  CourseStatus,
  EnrolledCourseListItem,
} from "@/entities/course";
import { GradientButton } from "@/shared/ui/GradientButton";

const LEVEL_ICON: Record<CourseLevel, string> = {
  beginner: "/icons/curses.svg",
  intermediate: "/icons/world.png",
  advanced: "/icons/statistics.svg",
};

const BACKEND_TO_UI: Record<CourseStatus, TeacherCourseStatus> = {
  draft: "draft",
  review: "pending_moderation",
  needs_revision: "needs_revision",
  rejected: "needs_revision",
  published: "active",
  hidden: "hidden",
  archived: "completed",
};

type Props = {
  role: "student" | "teacher";
};

/** My Courses widget for the teacher and student dashboard home pages */
export function MyCoursesDashboardWidget({ role }: Props) {
  const t = useTranslations("MyCoursesDashboardWidget");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const [teacherCourses, setTeacherCourses] = useState<CourseListItem[]>([]);
  const [studentCourses, setStudentCourses] = useState<EnrolledCourseListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  function fetchCourses() {
    if (role === "teacher") {
      getTeacherCourses()
        .then((data) => {
          setTotal(data.count);
          setTeacherCourses(data.results.slice(0, 2));
        })
        .catch(() => {})
        .finally(() => setLoading(false));
      return;
    }
    // A completed course keeps its (unrevoked) enrollment, so it would
    // otherwise still show up here as "in progress" -- exclude it, matching
    // the same dedup the full My Courses page applies.
    Promise.all([getEnrolledCourses(), getStudentCompletions()])
      .then(([enrolled, completed]) => {
        const completedIds = new Set(
          completed.results.map((c) => c.course).filter((id): id is number => id != null),
        );
        const active = enrolled.results.filter((c) => !completedIds.has(c.id));
        setTotal(active.length);
        setStudentCourses(active.slice(0, 2));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchCourses();
  }, [role]); // eslint-disable-line react-hooks/exhaustive-deps

  function updateStatus(slug: string, newStatus: CourseStatus) {
    setTeacherCourses((prev) =>
      prev.map((course) => (course.slug === slug ? { ...course, status: newStatus } : course)),
    );
  }

  function removeCourse(slug: string) {
    setTeacherCourses((prev) => prev.filter((course) => course.slug !== slug));
  }

  function makeHandlers(course: CourseListItem) {
    const { slug } = course;
    return {
      onEdit: () => router.push(`/teacher-dashboard/courses/${slug}/edit`),
      onPublish: () =>
        submitCourseForReview(slug)
          .then(() => updateStatus(slug, "review"))
          .catch(() => {}),
      onWithdraw: () =>
        withdrawCourseFromReview(slug)
          .then(() => updateStatus(slug, "draft"))
          .catch(() => {}),
      onArchive: () =>
        archiveCourse(slug)
          .then(() => updateStatus(slug, "archived"))
          .catch(() => {}),
      onUnarchive: () =>
        unarchiveCourse(slug)
          .then(() => updateStatus(slug, "draft"))
          .catch(() => {}),
      onDelete: () =>
        deleteCourse(slug)
          .then(() => removeCourse(slug))
          .catch(() => {}),
      onHide: () =>
        hideCourse(slug)
          .then(() => updateStatus(slug, "hidden"))
          .catch(() => {}),
      onOpen: () =>
        openCourse(slug)
          .then(() => updateStatus(slug, "published"))
          .catch(() => {}),
    };
  }

  const allHref = role === "teacher" ? "/teacher-dashboard/courses" : "/student-dashboard/courses";

  return (
    <div className="flex flex-col" style={{ gap: "clamp(16px, 1.04vw, 20px)" }}>
      <div
        className="flex items-center justify-between"
        style={{ gap: "clamp(8px, 0.83vw, 16px)" }}
      >
        <div
          className={`flex min-w-0 shrink-0 items-center justify-between bg-(--color-brand-lavender) font-bold ${
            role === "student"
              ? "h-[52px] flex-1 gap-2.5 rounded-[20px] p-4 font-(family-name:--font-base) text-xl leading-none tracking-normal not-italic text-(--color-text-primary) lg:w-[399px] lg:flex-none"
              : "font-(family-name:--font-accent) text-(--color-blue-dark)"
          }`}
          style={
            role === "teacher"
              ? {
                  borderRadius: "clamp(16px, 1.35vw, 26px)",
                  height: "clamp(36px, 2.71vw, 52px)",
                  padding: "0 clamp(12px, 1.25vw, 24px)",
                  fontSize: "clamp(12px, 1.04vw, 20px)",
                  gap: "clamp(8px, 0.83vw, 16px)",
                }
              : undefined
          }
        >
          <span>{tCommon("myCourses")}</span>
          <span>{loading ? "…" : total}</span>
        </div>
        <GradientButton href={allHref} className="catalog-btn">
          {tCommon("all")}
          <Image
            src="/icons/arrow-goto.png"
            alt=""
            width={14}
            height={14}
            style={{ width: "clamp(8px, 1.04vw, 14px)", height: "auto", flexShrink: 0 }}
          />
        </GradientButton>
      </div>

      {!loading &&
        ((role === "teacher" ? teacherCourses.length : studentCourses.length) > 0 ? (
          <div
            className="-mx-4 flex snap-x snap-mandatory overflow-x-auto px-4 py-8 -my-6 [-ms-overflow-style:none] [scrollbar-width:none] lg:mx-0 lg:grid lg:grid-cols-2 lg:overflow-visible lg:px-0 lg:py-0 lg:my-0 [&::-webkit-scrollbar]:hidden"
            style={{ gap: "clamp(8px, 0.83vw, 16px)" }}
          >
            {role === "teacher"
              ? teacherCourses.map((course) => (
                  <div key={course.id} className="w-[300px] shrink-0 snap-start lg:w-auto">
                    <TeacherCourseCard
                      title={course.title}
                      level={course.level}
                      status={BACKEND_TO_UI[course.status] ?? "draft"}
                      imageSrc={course.image}
                      iconSrc={LEVEL_ICON[course.level] ?? "/icons/curses.svg"}
                      rating={
                        course.status === "archived" || course.status === "published"
                          ? Number(course.rating_avg)
                          : undefined
                      }
                      slug={course.slug}
                      enrolledCount={course.students_count}
                      {...makeHandlers(course)}
                    />
                  </div>
                ))
              : studentCourses.map((course) => (
                  <div key={course.id} className="w-[300px] shrink-0 snap-start lg:w-auto">
                    <StudentCourseCard
                      title={course.title}
                      teacherName={course.teacher_name}
                      progressPercent={course.progress_percent ?? 0}
                      imageSrc={course.image}
                      iconSrc={LEVEL_ICON[course.level] ?? "/icons/curses.svg"}
                      level={course.level}
                      slug={course.slug}
                    />
                  </div>
                ))}
          </div>
        ) : (
          <div
            className="flex items-center justify-center text-(--color-text-secondary)"
            style={{ minHeight: "clamp(100px, 7.29vw, 140px)" }}
          >
            {role === "teacher" ? t("noActiveCoursesTeacher") : t("noActiveCoursesStudent")}
          </div>
        ))}
    </div>
  );
}
