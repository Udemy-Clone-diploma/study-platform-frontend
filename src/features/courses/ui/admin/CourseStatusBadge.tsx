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
  const t = useTranslations("CourseStatusBadge");
  const state = deriveCourseState({ status, pending_edit_status: pendingEditStatus });
  const color = courseStateColor(state);
  const filled = state.key === "hidden";
  const label = state.key === status ? t(status) : state.label;

  return (
    <Tooltip content={state.description}>
      <span
        className="inline-flex max-w-full shrink-0 items-center justify-center rounded-full font-(family-name:--font-accent) font-medium whitespace-nowrap"
        style={{
          fontSize: "clamp(11px, 0.83vw, 14px)",
          padding: "2px 12px",
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
