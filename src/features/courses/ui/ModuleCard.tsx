"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, Play, Plus } from "lucide-react";
import type { CourseModule, CourseLesson } from "@/entities/course";
import { GradientButton } from "@/shared/ui/GradientButton";
import { LessonRow } from "./LessonRow";

type ItemStatus = "approved" | "rejected" | "needs_revision";

type Props = {
  module: CourseModule;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onAddLesson: () => void;
  onEditLesson: (lesson: CourseLesson) => void;
  onDeleteLesson: (lessonId: number) => void;
  /** Read-only moderation statuses keyed by "lesson-{id}". */
  itemStatuses?: Record<string, ItemStatus>;
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

const emptyCardSt: React.CSSProperties = {
  background: "var(--color-bg)",
  border: "2px solid var(--color-border-light)",
  borderRadius: 16,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "clamp(28px, 2.43vw, 35px) 24px",
};

const emptyTextSt: React.CSSProperties = {
  fontFamily: "var(--font-base)",
  fontWeight: 700,
  fontSize: "clamp(14px, 1.39vw, 20px)",
  color: "var(--color-text-secondary)",
  textAlign: "center",
};

const outlinedBtnSt: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "clamp(8px, 0.69vw, 10px)",
  height: "clamp(38px, 3.06vw, 44px)",
  background: "var(--color-bg)",
  border: "1px solid var(--color-draft)",
  borderRadius: 28,
  fontFamily: "var(--font-accent)",
  fontWeight: 500,
  fontSize: "clamp(14px, 1.39vw, 20px)",
  letterSpacing: "-0.011em",
  color: "var(--color-text-primary)",
  cursor: "pointer",
  padding: "4px clamp(14px, 1.25vw, 24px)",
};

function isLocked(key: string, statuses?: Record<string, ItemStatus>) {
  return statuses?.[key] === "approved";
}

/** Expandable module card showing only lessons (tests live inside lesson content blocks). */
export function ModuleCard({
  module,
  index,
  onEdit,
  onDelete,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  itemStatuses,
}: Props) {
  const t = useTranslations("ModuleCard");
  const [open, setOpen] = useState(false);
  const lessonCount = module.lessons.length;

  return (
    <div
      style={{
        background: "var(--color-bg)",
        border: "1px solid var(--color-border-light)",
        borderRadius: 16,
        padding: "clamp(14px, 1.04vw, 20px) clamp(16px, 1.25vw, 24px)",
      }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between" style={{ gap: 8 }}>
        <div className="flex min-w-0 items-center" style={{ gap: 8 }}>
          <span style={{ ...metaSt, color: "var(--color-text-secondary)", flexShrink: 0 }}>
            {t("moduleNumber", { order: index + 1 })}
          </span>
          <span
            style={{
              ...metaSt,
              color: "var(--color-text-primary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {module.title}
          </span>
          <span className="flex shrink-0 items-center" style={{ gap: 4 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/book.svg"
              alt=""
              width={16}
              height={16}
              style={{ width: 16, height: 16, flexShrink: 0 }}
            />
            <span style={{ ...metaSt, color: "var(--color-text-secondary)" }}>
              {t("lessonsCount", { count: lessonCount })}
            </span>
          </span>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex shrink-0 items-center justify-center rounded-full transition hover:bg-gray-100"
          style={{ width: 40, height: 40 }}
          aria-label={open ? t("collapseModuleAriaLabel") : t("expandModuleAriaLabel")}
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

      {/* Edit / delete */}
      <div className="flex items-center" style={{ gap: 8, marginTop: 8 }}>
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center justify-center rounded-full transition hover:bg-gray-100"
          style={{ width: 40, height: 40, padding: 6, flexShrink: 0 }}
          aria-label={t("renameModuleAriaLabel")}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/edit.svg"
            alt=""
            width={20}
            height={20}
            style={{ width: 20, height: 20 }}
          />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="flex items-center justify-center rounded-full transition hover:bg-red-50"
          style={{ width: 40, height: 40, padding: 6, flexShrink: 0 }}
          aria-label={t("deleteModuleAriaLabel")}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/trash.svg"
            alt=""
            width={20}
            height={20}
            style={{ width: 20, height: 20 }}
          />
        </button>
      </div>

      {/* Expanded content */}
      {open && (
        <div
          style={{
            marginTop: "clamp(16px, 1.25vw, 24px)",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center" style={{ gap: 8 }}>
              <Play size={20} style={{ color: "var(--color-text-primary)", flexShrink: 0 }} />
              <span style={sectionTitleSt}>{t("lessons")}</span>
            </div>
            <GradientButton
              type="button"
              onClick={onAddLesson}
              style={{
                gap: 8,
                minWidth: "clamp(160px, 10.42vw, 200px)",
                height: "clamp(38px, 2.29vw, 44px)",
              }}
            >
              <Plus size={16} />
              {t("addLesson")}
            </GradientButton>
          </div>

          {lessonCount === 0 ? (
            <div style={emptyCardSt}>
              <div
                className="flex flex-col items-center"
                style={{ gap: "clamp(16px, 1.39vw, 20px)" }}
              >
                <div
                  className="flex flex-col items-center"
                  style={{ gap: "clamp(8px, 0.83vw, 12px)" }}
                >
                  <Play
                    size={40}
                    style={{
                      width: "clamp(32px, 2.78vw, 40px)",
                      height: "clamp(32px, 2.78vw, 40px)",
                      color: "var(--color-text-primary)",
                    }}
                  />
                  <span style={emptyTextSt}>{t("noLessonsYet")}</span>
                </div>
                <button
                  type="button"
                  onClick={onAddLesson}
                  className="transition hover:opacity-80"
                  style={outlinedBtnSt}
                >
                  <Plus size={20} />
                  {t("createFirstLesson")}
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "clamp(8px, 0.52vw, 10px)" }}
            >
              {module.lessons.map((lesson, i) => {
                const locked = isLocked(`lesson-${lesson.id}`, itemStatuses);
                return (
                  <LessonRow
                    key={lesson.id}
                    lesson={lesson}
                    index={i}
                    onEdit={locked ? undefined : () => onEditLesson(lesson)}
                    onDelete={locked ? undefined : () => onDeleteLesson(lesson.id)}
                    moderationStatus={itemStatuses?.[`lesson-${lesson.id}`]}
                    locked={locked}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
