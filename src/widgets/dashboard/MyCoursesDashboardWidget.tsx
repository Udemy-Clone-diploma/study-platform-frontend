"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { StudentCourseCard, TeacherCourseCard, type TeacherCourseStatus } from "@/features/courses";
import { getEnrolledCourses, getTeacherCourses } from "@/entities/course";
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
  published: "active",
  archived: "completed",
};

type Props = {
  role: "student" | "teacher";
};

/** My Courses widget for the teacher and student dashboard home pages */
export function MyCoursesDashboardWidget({ role }: Props) {
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFn = role === "teacher" ? getTeacherCourses : getEnrolledCourses;
    fetchFn()
      .then((data) => {
        setTotal(data.count);
        setCourses(data.results.slice(0, 2));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [role]);

  const allHref =
    role === "teacher" ? "/teacher-dashboard/courses" : "/student-dashboard/courses";

  return (
    <div className="flex flex-col" style={{ gap: "clamp(12px, 1.04vw, 20px)" }}>
      <div
        className="flex items-center justify-between"
        style={{ gap: "clamp(8px, 0.83vw, 16px)" }}
      >
        <div
          className="flex shrink-0 items-center justify-between font-bold text-(--color-blue-dark)"
          style={{
            background: "var(--color-brand-lavender)",
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
                status={BACKEND_TO_UI[course.status] ?? "draft"}
                imageSrc={course.image}
                iconSrc={LEVEL_ICON[course.level] ?? "/icons/curses.svg"}
                rating={
                  course.status === "archived" || course.status === "published"
                    ? Number(course.rating_avg)
                    : undefined
                }
                slug={course.slug}
              />
            ) : (
              <StudentCourseCard
                key={course.id}
                title={course.title}
                teacherName={course.teacher_name}
                progressPercent={course.status === "archived" ? 100 : 0}
                imageSrc={course.image}
                iconSrc={LEVEL_ICON[course.level] ?? "/icons/curses.svg"}
                level={course.level}
                slug={course.slug}
                isArchived={course.status === "archived"}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}
