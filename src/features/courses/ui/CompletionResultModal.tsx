"use client";

import { ModalShell } from "@/shared/ui/ModalShell";
import type { CourseCompletion } from "@/entities/course";

type Props = {
  completion: CourseCompletion;
  onClose: () => void;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
}

const ROW_STYLE: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  paddingBlock: "clamp(8px, 0.83vw, 14px)",
  borderBottom: "1px solid var(--color-brand-lavender)",
  fontSize: "clamp(13px, 0.97vw, 16px)",
};

const LABEL_STYLE: React.CSSProperties = {
  color: "var(--color-text-secondary)",
  fontFamily: "var(--font-base)",
};

const VALUE_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-accent)",
  fontWeight: 600,
  color: "var(--color-text-primary)",
  textAlign: "right",
};

/** Modal showing course completion results: progress, dates, score, certificate. */
export function CompletionResultModal({ completion, onClose }: Props) {
  return (
    <ModalShell
      onClose={onClose}
      title={completion.title}
      width="clamp(300px, 32vw, 520px)"
      padding="clamp(20px, 2.08vw, 32px)"
      shadow="var(--shadow-modal)"
    >
      <p
        style={{
          fontFamily: "var(--font-base)",
          fontSize: "clamp(11px, 0.83vw, 13px)",
          color: "var(--color-text-secondary)",
          margin: "0 0 clamp(12px, 1.25vw, 20px)",
        }}
      >
        {completion.teacher_name}
      </p>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={ROW_STYLE}>
          <span style={LABEL_STYLE}>Progress</span>
          <span style={VALUE_STYLE}>{completion.progress_percent}%</span>
        </div>

        <div style={ROW_STYLE}>
          <span style={LABEL_STYLE}>Started</span>
          <span style={VALUE_STYLE}>{formatDate(completion.started_at)}</span>
        </div>

        <div style={{ ...ROW_STYLE, borderBottom: undefined }}>
          <span style={LABEL_STYLE}>Completed</span>
          <span style={VALUE_STYLE}>{formatDate(completion.completed_at)}</span>
        </div>

        <div style={{ ...ROW_STYLE, borderBottom: completion.certificate_url ? undefined : "none" }}>
          <span style={LABEL_STYLE}>Final score</span>
          <span style={VALUE_STYLE}>{completion.final_score ?? "—"}</span>
        </div>

        {completion.certificate_url && (
          <div style={{ ...ROW_STYLE, borderBottom: "none" }}>
            <span style={LABEL_STYLE}>Certificate</span>
            <a
              href={completion.certificate_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...VALUE_STYLE, color: "var(--color-blue)", textDecoration: "underline" }}
            >
              Download
            </a>
          </div>
        )}
      </div>
    </ModalShell>
  );
}
