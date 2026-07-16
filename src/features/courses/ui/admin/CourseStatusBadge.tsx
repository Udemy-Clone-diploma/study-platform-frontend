"use client";

import type { CourseStatus } from "@/entities/course";

const STATUS_CONFIG: Record<CourseStatus, { label: string; accent: string; filled?: boolean }> = {
  draft: { label: "Draft", accent: "var(--color-text-secondary)" },
  review: { label: "Moderation", accent: "var(--color-warning)" },
  needs_revision: { label: "Needs revision", accent: "var(--color-warning)" },
  rejected: { label: "Rejected", accent: "var(--color-rejected)" },
  published: { label: "Published", accent: "var(--color-success)" },
  hidden: { label: "Hidden", accent: "var(--color-rejected)", filled: true },
  archived: { label: "Archived", accent: "var(--color-text-secondary)" },
};

export function CourseStatusBadge({ status }: { status: CourseStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;

  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-(family-name:--font-accent) font-medium whitespace-nowrap"
      style={{
        fontSize: "clamp(11px, 0.83vw, 14px)",
        padding: "2px 12px",
        color: config.filled ? "white" : config.accent,
        border: `1px solid ${config.accent}`,
        background: config.filled ? config.accent : "white",
      }}
    >
      {config.label}
    </span>
  );
}
