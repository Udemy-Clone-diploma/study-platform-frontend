"use client";

import { useTranslations } from "next-intl";
import {
  courseStateColor,
  deriveCourseState,
  type CourseListItem,
  type CourseStatus,
} from "@/entities/course";
import { Tooltip } from "@/shared/ui/Tooltip";

type Props = {
  status: CourseStatus;
  pendingEditStatus?: CourseListItem["pending_edit_status"];
};

/** Status pill for a course, with a hover hint explaining who the course is waiting on. */
export function CourseStatusBadge({ status, pendingEditStatus }: Props) {
  const t = useTranslations("CourseManagementPage");
  const state = deriveCourseState({ status, pending_edit_status: pendingEditStatus });
  const color = courseStateColor(state);
  const filled = state.key === "hidden";
  const label = state.key === status ? t(`status.${status}`) : state.label;

  return (
    <Tooltip content={state.description}>
      <span
        className="inline-flex max-w-full items-center justify-center rounded-full text-center font-(family-name:--font-accent) font-medium break-words"
        style={{
          fontSize: "clamp(11px, 0.97vw, 13px)",
          lineHeight: "1.35",
          padding: "clamp(8px, 0.83vw, 10px) clamp(12px, 1.25vw, 16px)",
          color: filled ? "white" : color,
          border: `1px solid ${color}`,
          background: filled ? color : "white",
        }}
      >
        {label}
      </span>
    </Tooltip>
  );
}
