"use client";

import { Pencil, Trash2 } from "lucide-react";

export type CourseTest = {
  id: number;
  title: string;
  question_count?: number;
  pass_percent?: number;
};

type Props = {
  test: CourseTest;
  onEdit?: () => void;
  onDelete?: () => void;
};

/** Bordered card for a single course test — no shadow, shows metadata, with optional edit/delete actions. */
export function TestRow({ test, onEdit, onDelete }: Props) {
  return (
    <div
      className="flex items-center justify-between"
      style={{
        background: "var(--color-bg)",
        border: "2px solid var(--color-border-light)",
        borderRadius: 16,
        padding: "clamp(14px, 1.04vw, 20px) clamp(16px, 1.25vw, 24px)",
      }}
    >
      <div className="flex items-center" style={{ gap: "clamp(16px, 1.25vw, 24px)" }}>
        <span
          style={{
            fontFamily: "var(--font-base)",
            fontWeight: 600,
            fontSize: "clamp(14px, 1.04vw, 20px)",
            color: "var(--color-text-primary)",
          }}
        >
          {test.title}
        </span>
        {test.question_count != null && (
          <span
            style={{
              fontFamily: "var(--font-base)",
              fontWeight: 600,
              fontSize: "clamp(12px, 0.83vw, 16px)",
              color: "var(--color-text-secondary)",
              whiteSpace: "nowrap",
            }}
          >
            {test.question_count} questions
          </span>
        )}
        {test.pass_percent != null && (
          <span
            style={{
              fontFamily: "var(--font-base)",
              fontWeight: 600,
              fontSize: "clamp(12px, 0.83vw, 16px)",
              color: "var(--color-text-secondary)",
              whiteSpace: "nowrap",
            }}
          >
            Pass {test.pass_percent}%
          </span>
        )}
      </div>

      <div className="flex items-center" style={{ gap: 4 }}>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center justify-center rounded-full transition hover:bg-gray-100"
            style={{ width: 36, height: 36, color: "var(--color-text-secondary)", flexShrink: 0 }}
            aria-label="Edit test"
          >
            <Pencil size={16} />
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="flex items-center justify-center rounded-full transition hover:bg-red-50"
            style={{ width: 36, height: 36, color: "var(--color-danger)", flexShrink: 0 }}
            aria-label="Delete test"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
