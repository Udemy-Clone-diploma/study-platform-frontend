"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { getTeacherCourses, getCourseEnrolledStudents, getCohorts } from "@/entities/course";
import type { CourseListItem, CourseCohort, EnrolledStudent } from "@/entities/course";
import { StudentAvatar } from "@/shared/ui/StudentAvatar";
import { Card, ProgressRing } from "./DashboardOverview";
import { Dropdown, type Option } from "./GrowthCard";

const ALL = "";

/**
 * Teacher dashboard: distinct student count across all of the teacher's
 * courses, plus a per-student progress list filterable by course and
 * (once a course is picked) by cohort/group.
 */
export function TeacherStudentsPanel() {
  const t = useTranslations("TeacherStudentsPanel");
  const tCommon = useTranslations("Common");
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [byCourse, setByCourse] = useState<Record<string, EnrolledStudent[]>>({});
  const [cohorts, setCohorts] = useState<CourseCohort[]>([]);
  const [courseSlug, setCourseSlug] = useState(ALL);
  const [cohortId, setCohortId] = useState(ALL);
  const [loaded, setLoaded] = useState(false);

  // Loads every course's enrolled students once, so the default "all
  // courses" view can show a merged list without a dedicated cross-course
  // backend endpoint.
  useEffect(() => {
    let cancelled = false;
    getTeacherCourses()
      .then(async (res) => {
        if (cancelled) return;
        setCourses(res.results);
        const entries = await Promise.all(
          res.results.map((c) =>
            getCourseEnrolledStudents(c.slug)
              .then((rows) => [c.slug, rows] as const)
              .catch(() => [c.slug, []] as const),
          ),
        );
        if (!cancelled) setByCourse(Object.fromEntries(entries));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Cohorts are always course-scoped, so fetch them lazily once a specific
  // course is selected, and reset the group filter whenever the course changes.
  useEffect(() => {
    setCohortId(ALL);
    if (!courseSlug) {
      setCohorts([]);
      return;
    }
    let cancelled = false;
    getCohorts(courseSlug)
      .then((res) => {
        if (!cancelled) setCohorts(res);
      })
      .catch(() => {
        if (!cancelled) setCohorts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [courseSlug]);

  const allStudents = useMemo(() => Object.values(byCourse).flat(), [byCourse]);
  const total = useMemo(() => new Set(allStudents.map((s) => s.student_id)).size, [allStudents]);

  const groupMemberIds = useMemo(() => {
    if (!cohortId) return null;
    const cohort = cohorts.find((c) => String(c.id) === cohortId);
    return new Set((cohort?.members ?? []).map((m) => m.enrollment_id));
  }, [cohorts, cohortId]);

  const visibleStudents = useMemo(() => {
    const base = courseSlug ? (byCourse[courseSlug] ?? []) : allStudents;
    return groupMemberIds ? base.filter((s) => groupMemberIds.has(s.enrollment_id)) : base;
  }, [courseSlug, byCourse, allStudents, groupMemberIds]);

  const courseOptions: Option[] = [
    { value: ALL, label: tCommon("allCourses") },
    ...courses.map((c) => ({ value: c.slug, label: c.title })),
  ];
  const cohortOptions: Option[] = [
    { value: ALL, label: t("allGroups") },
    ...cohorts.map((c, i) => ({
      value: String(c.id),
      label: c.name ?? t("groupFallback", { number: i + 1 }),
    })),
  ];

  return (
    <>
      <Card className="min-h-[140px] border border-[#fcc4c3] p-6">
        <div className="flex h-full items-center justify-between gap-4">
          <div>
            <p className="text-base text-black">{t("totalStudents")}</p>
            <p className="mt-4 text-2xl font-bold text-black">{loaded ? total : "—"}</p>
          </div>
          <Image src="/icons/people.svg" alt="" width={40} height={40} className="h-10 w-10" />
        </div>
      </Card>

      <Card className="flex h-[clamp(357px,26.04vw,500px)] flex-col overflow-hidden p-4">
        <div className="mb-3 flex shrink-0 items-center justify-between gap-4">
          <h2 className="text-base font-bold text-black">{t("studentProgress")}</h2>
          <div className="flex items-center gap-3">
            <Dropdown value={courseSlug} options={courseOptions} onChange={setCourseSlug} />
            <Dropdown
              value={cohortId}
              options={cohortOptions}
              onChange={setCohortId}
              disabled={!courseSlug}
            />
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {visibleStudents.map((s) => (
            <div
              key={s.enrollment_id}
              className="mb-2 flex min-h-[64px] items-center gap-3 rounded-md border border-black/5 bg-white px-3 shadow-[0_1px_8px_rgba(0,0,0,0.12)]"
            >
              <StudentAvatar name={s.student_name} avatar={s.student_avatar} />
              <span className="min-w-0 flex-1 truncate text-xs text-[#5e5e5e]">
                {s.student_name}
              </span>
              <ProgressRing value={s.progress_percent} />
            </div>
          ))}
          {loaded && visibleStudents.length === 0 && (
            <div className="flex min-h-[64px] items-center justify-center text-xs text-[#5e5e5e]">
              {t("noStudentsYet")}
            </div>
          )}
        </div>
      </Card>
    </>
  );
}
