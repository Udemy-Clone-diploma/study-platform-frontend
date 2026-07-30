"use client";

import { useTranslations } from "next-intl";
import type { CourseStatus } from "@/entities/course";

type Translator = (key: string, values?: Record<string, string | number>) => string;

function statusConfig(
  status: CourseStatus,
  t: Translator,
): { label: string; accent: string; filled?: boolean } {
  const config: Record<CourseStatus, { accent: string; filled?: boolean }> = {
    draft: { accent: "var(--color-text-secondary)" },
    review: { accent: "var(--color-warning)" },
    needs_revision: { accent: "var(--color-warning)" },
    rejected: { accent: "var(--color-rejected)" },
    published: { accent: "var(--color-success)" },
    hidden: { accent: "var(--color-rejected)", filled: true },
    archived: { accent: "var(--color-text-secondary)" },
  };
  return { label: t(status), ...(config[status] ?? config.draft) };
}

export function CourseStatusBadge({ status }: { status: CourseStatus }) {
  const t = useTranslations("CourseStatusBadge");
  const config = statusConfig(status, t);

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
