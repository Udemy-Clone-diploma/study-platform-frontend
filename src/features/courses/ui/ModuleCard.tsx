"use client";

import { useState } from "react";
import { ChevronDown, Play, Plus } from "lucide-react";
import type { CourseModule } from "@/entities/course";
import { GradientButton } from "@/shared/ui/GradientButton";
import { LessonRow } from "./LessonRow";

type Props = {
  module: CourseModule;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
};

const metaSt: React.CSSProperties = {
  fontFamily: "var(--font-base)",
  fontWeight: 700,
  fontSize: 14,
  lineHeight: "18px",
  whiteSpace: "nowrap",
};

const sectionTitleSt: React.CSSProperties = {
  fontFamily: "var(--font-base)",
  fontWeight: 700,
  fontSize: "clamp(16px, 1.39vw, 20px)",
  color: "var(--color-text-primary)",
};

/** Expandable module card — edit/delete always visible in the header. */
export function ModuleCard({ module, index, onEdit, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const lessonCount = module.lessons.length;
  const testCount = 0;

  return (
    <div
      style={{
        background: "var(--color-bg)",
        border: "1px solid var(--color-border-light)",
        borderRadius: 16,
        padding: "clamp(14px, 1.04vw, 20px) clamp(16px, 1.25vw, 24px)",
      }}
    >
      {/* ── Header row ── */}
      <div className="flex items-center justify-between" style={{ gap: 8 }}>
        {/* Left: Module N · title · counts */}
        <div className="flex min-w-0 items-center" style={{ gap: 8 }}>
          <span style={{ ...metaSt, color: "var(--color-text-secondary)", flexShrink: 0 }}>
            Module {index + 1}
          </span>
          <span style={{ ...metaSt, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis" }}>
            {module.title}
          </span>
          <span className="flex shrink-0 items-center" style={{ gap: 4 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/book.svg" alt="" width={16} height={16} style={{ width: 16, height: 16, flexShrink: 0 }} />
            <span style={{ ...metaSt, color: "var(--color-text-secondary)" }}>{lessonCount} lessons</span>
          </span>
          <span className="flex shrink-0 items-center" style={{ gap: 4 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/test.svg" alt="" width={16} height={16} style={{ width: 16, height: 16, flexShrink: 0 }} />
            <span style={{ ...metaSt, color: "var(--color-text-secondary)" }}>{testCount} tests</span>
          </span>
        </div>

        {/* Right: chevron only */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex shrink-0 items-center justify-center rounded-full transition hover:bg-gray-100"
          style={{ width: 40, height: 40 }}
          aria-label={open ? "Collapse module" : "Expand module"}
        >
          <ChevronDown
            size={20}
            style={{
              color: "var(--color-text-primary)",
              transform: open ? "rotate(180deg)" : "none",
              transition: "transform 0.2s",
            }}
          />
        </button>
      </div>

      {/* ── Edit / delete — always visible, bottom-left ── */}
      <div className="flex items-center" style={{ gap: 8, marginTop: 8 }}>
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center justify-center rounded-full transition hover:bg-gray-100"
          style={{ width: 40, height: 40, padding: 6, flexShrink: 0 }}
          aria-label="Rename module"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/edit.svg" alt="" width={20} height={20} style={{ width: 20, height: 20 }} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="flex items-center justify-center rounded-full transition hover:bg-red-50"
          style={{ width: 40, height: 40, padding: 6, flexShrink: 0 }}
          aria-label="Delete module"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/trash.svg" alt="" width={20} height={20} style={{ width: 20, height: 20 }} />
        </button>
      </div>

      {/* ── Expanded content ── */}
      {open && (
        <div style={{ marginTop: "clamp(16px, 1.25vw, 24px)", display: "flex", flexDirection: "column", gap: 40 }}>

          {/* Lessons section */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Section header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center" style={{ gap: 8 }}>
                <Play size={20} style={{ color: "var(--color-text-primary)", flexShrink: 0 }} />
                <span style={sectionTitleSt}>Lessons</span>
              </div>
              <GradientButton
                type="button"
                style={{ gap: 8, minWidth: "clamp(160px, 10.42vw, 200px)", height: "clamp(38px, 2.29vw, 44px)" }}
              >
                <Plus size={16} />
                Add Lesson
              </GradientButton>
            </div>

            {/* Lesson rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: "clamp(8px, 0.52vw, 10px)" }}>
              {lessonCount === 0 ? (
                <p style={{ fontFamily: "var(--font-base)", fontSize: "clamp(13px, 0.83vw, 16px)", color: "var(--color-text-secondary)", padding: "4px 0" }}>
                  No lessons yet
                </p>
              ) : (
                module.lessons.map((lesson, i) => (
                  <LessonRow key={lesson.id} lesson={lesson} index={i} />
                ))
              )}
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTop: "2px solid var(--color-border-light)", margin: "-20px 0" }} />

          {/* Tests section */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Section header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center" style={{ gap: 8 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/copy-check.svg" alt="" width={24} height={24} style={{ width: 24, height: 24, flexShrink: 0 }} />
                <span style={sectionTitleSt}>Tests</span>
              </div>
              <button
                type="button"
                className="inline-flex items-center justify-center transition hover:opacity-80"
                style={{
                  gap: 8,
                  minWidth: "clamp(130px, 8.33vw, 177px)",
                  height: "clamp(38px, 2.29vw, 44px)",
                  background: "var(--color-bg)",
                  border: "1px solid var(--color-draft)",
                  borderRadius: 28,
                  fontFamily: "var(--font-accent)",
                  fontWeight: 500,
                  fontSize: "clamp(12px, 1.04vw, 20px)",
                  color: "var(--color-text-primary)",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  padding: "0 clamp(16px, 1.25vw, 24px)",
                }}
              >
                <Plus size={16} />
                Add Test
              </button>
            </div>

            {/* Test rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: "clamp(8px, 0.52vw, 10px)" }}>
              <p style={{ fontFamily: "var(--font-base)", fontSize: "clamp(13px, 0.83vw, 16px)", color: "var(--color-text-secondary)", padding: "4px 0" }}>
                No tests yet
              </p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
