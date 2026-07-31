"use client";

import { useTranslations } from "next-intl";
import type { TeacherApplicationStatus } from "@/entities/teacher-application";

const ACCENTS: Record<TeacherApplicationStatus, string> = {
  pending: "var(--color-warning)",
  approved: "var(--color-success)",
  cancelled: "var(--color-rejected)",
};

/** Status pill for a teacher application (pending / approved / cancelled). */
export function ApplicationStatusBadge({ status }: { status: TeacherApplicationStatus }) {
  const t = useTranslations("TeacherApplicationsAdmin");
  const labels: Record<TeacherApplicationStatus, string> = {
    pending: t("statusPending"),
    approved: t("statusApproved"),
    cancelled: t("statusCancelled"),
  };
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-(family-name:--font-accent) font-medium whitespace-nowrap"
      style={{
        fontSize: "clamp(11px, 0.83vw, 14px)",
        padding: "2px 12px",
        color: ACCENTS[status],
        border: `1px solid ${ACCENTS[status]}`,
        background: "white",
      }}
    >
      {labels[status]}
    </span>
  );
}
