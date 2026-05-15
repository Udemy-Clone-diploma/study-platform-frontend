"use client";

import { Save, ArrowUpRight } from "lucide-react";
import { AccentButton } from "@/shared/ui/AccentButton";
import { GradientButton } from "@/shared/ui/GradientButton";

type Props = {
  title: string;
  saving: boolean;
  onSaveDraft: () => void;
};

/** Shared page header for course creation / edit pages. */
export function CoursePageHeader({ title, saving, onSaveDraft }: Props) {
  return (
    <div
      className="flex flex-wrap items-center justify-between"
      style={{ marginBottom: "clamp(16px, 1.56vw, 30px)", gap: "clamp(10px, 0.83vw, 12px)" }}
    >
      <div className="flex items-center" style={{ gap: "clamp(10px, 1.04vw, 20px)" }}>
        <h1
          className="font-semibold font-(family-name:--font-base) text-(--color-text-primary)"
          style={{ fontSize: "clamp(22px, 1.875vw, 36px)", lineHeight: 1.25 }}
        >
          {title}
        </h1>
        <span
          className="rounded bg-(--color-draft) font-medium font-(family-name:--font-accent) text-(--color-text-secondary)"
          style={{ padding: "clamp(3px, 0.21vw, 4px) clamp(6px, 0.56vw, 8px)", fontSize: "clamp(11px, 0.78vw, 15px)" }}
        >
          Draft
        </span>
      </div>

      <div className="flex items-center" style={{ gap: "clamp(10px, 1.25vw, 24px)" }}>
        <AccentButton type="button" size="md" disabled={saving} style={{ gap: "clamp(8px, 0.69vw, 10px)" }} onClick={onSaveDraft}>
          <Save size={20} />
          {saving ? "Saving..." : "Save Draft"}
        </AccentButton>
        <GradientButton type="button" disabled style={{ gap: "clamp(8px, 0.83vw, 12px)" }}>
          Continue to Review &amp; Publish
          <ArrowUpRight size={20} aria-hidden="true" />
        </GradientButton>
      </div>
    </div>
  );
}
