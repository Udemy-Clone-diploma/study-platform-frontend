"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StudentCourseCard, TeacherCourseCard, type TeacherCourseStatus } from "@/features/courses";
import {
  getEnrolledCourses,
  getTeacherCourses,
  deleteCourse,
  archiveCourse,
  withdrawCourseFromReview,
  unarchiveCourse,
  hideCourse,
  openCourse,
  submitCourseForReview,
} from "@/entities/course";
import type { CourseListItem, CourseLevel, CourseStatus } from "@/entities/course";
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
  const router = useRouter();
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  function fetchCourses() {
    const fetchFn = role === "teacher" ? getTeacherCourses : getEnrolledCourses;
    fetchFn()
      .then((data) => {
        setTotal(data.count);
        setCourses(data.results.slice(0, 2));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchCourses(); }, [role]); // eslint-disable-line react-hooks/exhaustive-deps

  function updateStatus(slug: string, newStatus: CourseStatus) {
    setCourses((prev) => prev.map((c) => (c.slug === slug ? { ...c, status: newStatus } : c)));
  }

  function removeCourse(slug: string) {
    setCourses((prev) => prev.filter((c) => c.slug !== slug));
  }

  function makeHandlers(course: CourseListItem) {
    const { slug } = course;
    return {
      onEdit:      () => router.push(`/teacher-dashboard/courses/${slug}/edit`),
      onPublish:   () => submitCourseForReview(slug).then(() => updateStatus(slug, "review")).catch(() => {}),
      onWithdraw:  () => withdrawCourseFromReview(slug).then(() => updateStatus(slug, "draft")).catch(() => {}),
      onArchive:   () => archiveCourse(slug).then(() => updateStatus(slug, "archived")).catch(() => {}),
      onUnarchive: () => unarchiveCourse(slug).then(() => updateStatus(slug, "draft")).catch(() => {}),
      onDelete:    () => deleteCourse(slug).then(() => removeCourse(slug)).catch(() => {}),
      onHide:      () => hideCourse(slug).then(() => updateStatus(slug, "hidden")).catch(() => {}),
      onOpen:      () => openCourse(slug).then(() => updateStatus(slug, "published")).catch(() => {}),
    };
  }

  const allHref =
    role === "teacher" ? "/teacher-dashboard/courses" : "/student-dashboard/courses";

  return (
    <div className="flex flex-col" style={{ gap: "clamp(12px, 1.04vw, 20px)" }}>
      <div
        className="flex items-center justify-between"
        style={{ gap: "clamp(8px, 0.83vw, 16px)" }}
      >
        <div
          className="flex shrink-0 items-center justify-between bg-(--color-brand-lavender) font-(family-name:--font-accent) font-bold text-(--color-blue-dark)"
          style={{
            borderRadius: "clamp(16px, 1.35vw, 26px)",
            height: "clamp(36px, 2.71vw, 52px)",
            padding: "0 clamp(12px, 1.25vw, 24px)",
            fontSize: "clamp(12px, 1.04vw, 20px)",
            gap: "clamp(8px, 0.83vw, 16px)",
          }}
        >
          <span>My courses</span>
          <span>{loading ? "…" : total}</span>
        </div>
        <GradientButton href={allHref} className="catalog-btn">
          All
          <Image
            src="/icons/arrow-goto.png"
            alt=""
            width={14}
            height={14}
            style={{ width: "clamp(8px, 1.04vw, 14px)", height: "auto", flexShrink: 0 }}
          />
        </GradientButton>
      </div>

      {!loading && courses.length > 0 && (
        <div className="grid grid-cols-2" style={{ gap: "clamp(8px, 0.83vw, 16px)" }}>
          {courses.map((course) =>
            role === "teacher" ? (
              <TeacherCourseCard
                key={course.id}
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
            ) : (
              <StudentCourseCard
                key={course.id}
                title={course.title}
                teacherName={course.teacher_name}
                progressPercent={0}
                imageSrc={course.image}
                iconSrc={LEVEL_ICON[course.level] ?? "/icons/curses.svg"}
                level={course.level}
                slug={course.slug}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}
