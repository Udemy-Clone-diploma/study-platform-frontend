"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { getTeacherCourses } from "@/entities/course";
import {
  getHomeworkAssignments,
  type HomeworkAssignment,
  type HomeworkSubmission,
} from "@/entities/homework";
import { TodoPanel, type DashboardListItem } from "./DashboardOverview";

const ACCENTS = [
  "from-[#fff3dc] to-[#ffe7ef]",
  "from-[#ffe7ef] to-[#dfd7ff]",
  "from-[#e0fbf5] to-[#d8ddff]",
  "from-[#edf1ff] to-[#fff3dc]",
] as const;

const FALLBACK_ICONS = [
  "/icons/world.png",
  "/icons/statistics.svg",
  "/icons/curses.svg",
  "/icons/diary.svg",
] as const;

function assignmentKind(assignment: HomeworkAssignment, t: (key: string) => string): string {
  return assignment.test_detail ? t("test") : t("task");
}

function assignmentVisual(assignment: HomeworkAssignment) {
  const index = Math.abs(assignment.course_id || assignment.id) % FALLBACK_ICONS.length;
  return {
    icon: assignment.course_image || FALLBACK_ICONS[index],
    accent: ACCENTS[index],
  };
}

function submissionTimestamp(submission: HomeworkSubmission): number {
  const value = submission.reviewed_at || submission.submitted_at;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

/**
 * Teacher dashboard "Check / Verified" panel: flattens every submission across all of the
 * teacher's courses (no dedicated cross-course backend endpoint exists yet, mirrors
 * TeacherStudentsPanel's per-course fan-out) into two real tabs -- submissions still awaiting
 * review ("Check") and already-graded ones ("Verified") -- instead of the previous mock rows.
 */
export function TeacherHomeworkCheckPanel() {
  const t = useTranslations("TeacherHomeworkCheckPanel");
  const [assignments, setAssignments] = useState<HomeworkAssignment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<"primary" | "secondary">("primary");

  useEffect(() => {
    let cancelled = false;

    getTeacherCourses()
      .then(async (res) => {
        if (cancelled) return;
        const perCourse = await Promise.all(
          res.results.map((course) =>
            getHomeworkAssignments(course.slug).catch(() => [] as HomeworkAssignment[]),
          ),
        );
        if (!cancelled) setAssignments(perCourse.flat());
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const { toCheck, verified } = useMemo(() => {
    const pairs = assignments
      .flatMap((assignment) =>
        assignment.teacher_submissions.map((submission) => ({ assignment, submission })),
      )
      .sort((a, b) => submissionTimestamp(b.submission) - submissionTimestamp(a.submission));

    const toCheck: DashboardListItem[] = [];
    const verified: DashboardListItem[] = [];

    pairs.forEach(({ assignment, submission }) => {
      const { icon, accent } = assignmentVisual(assignment);
      const item: DashboardListItem = {
        id: submission.id,
        course: assignment.course_title,
        meta: assignmentKind(assignment, t),
        title: assignment.title,
        icon,
        accent,
        author: submission.student_name || submission.student_email,
        badge:
          submission.status === "reviewed" && submission.score != null
            ? `${submission.score}+`
            : undefined,
        href: {
          pathname: "/teacher-dashboard/homework",
          query: {
            course: assignment.course_slug,
            assignment: assignment.id,
            submission: submission.id,
          },
        },
      };

      (submission.status === "reviewed" ? verified : toCheck).push(item);
    });

    return { toCheck, verified };
  }, [assignments, t]);

  return (
    <TodoPanel
      title={t("check")}
      secondaryLabel={t("verified")}
      activeTab={tab}
      onTabChange={setTab}
      items={tab === "primary" ? toCheck : verified}
      loading={!loaded}
      emptyLabel={tab === "primary" ? t("noSubmissionsToReview") : t("nothingVerifiedYet")}
      teacher
    />
  );
}
