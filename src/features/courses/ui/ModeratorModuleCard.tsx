"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, Play, Eye } from "lucide-react";
import type { CourseModule, CourseLesson } from "@/entities/course";
import { LessonFormModal } from "./LessonFormModal";
import { ModeratorItemStatusBadge } from "./ModeratorItemStatusBadge";
import type { ItemStatus, ItemStatuses } from "../model/moderatorReview";
import { bodyFont, metaSt, sectionTitleSt } from "../model/moderatorReview";

function ModeratorLessonRow({
  lesson,
  index,
  status,
  onToggle,
  onView,
  locked = false,
  unrated = false,
}: {
  lesson: CourseLesson;
  index: number;
  status: ItemStatus;
  onToggle: () => void;
  onView: () => void;
  locked?: boolean;
  unrated?: boolean;
}) {
  const t = useTranslations("ModeratorModuleCard");
  return (
    <div
      className="flex items-center justify-between"
      style={{
        background: "var(--color-bg)",
        border: `2px solid ${unrated ? "var(--color-warning-text)" : "var(--color-border-light)"}`,
        borderRadius: 16,
        padding: "clamp(20px, 1.67vw, 24px) clamp(24px, 2.22vw, 32px)",
      }}
    >
      <div className="flex min-w-0 items-center" style={{ gap: "clamp(8px, 0.83vw, 16px)" }}>
        <span
          style={{
            fontFamily: bodyFont,
            fontWeight: 400,
            fontSize: "clamp(16px, 1.39vw, 20px)",
            color: "var(--color-text-secondary)",
            flexShrink: 0,
          }}
        >
          {index + 1}.
        </span>
        <span
          style={{
            fontFamily: bodyFont,
            fontWeight: 600,
            fontSize: "clamp(16px, 1.39vw, 20px)",
            color: "var(--color-text-primary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {lesson.title}
        </span>
      </div>
      <div
        className="flex items-center"
        style={{ gap: 8, flexShrink: 0, opacity: locked ? 0.6 : 1 }}
      >
        <button
          type="button"
          onClick={onView}
          title={t("viewLessonTitle")}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            padding: 4,
            borderRadius: 8,
            color: "var(--color-text-secondary)",
          }}
          className="transition hover:text-(--color-text-primary)"
        >
          <Eye size={18} />
        </button>
        <ModeratorItemStatusBadge status={status} onClick={onToggle} locked={locked} />
      </div>
    </div>
  );
}

/** Expandable module card for moderator review — shows lessons with per-item status badges and a lesson viewer. */
export function ModeratorModuleCard({
  module,
  index,
  itemStatuses,
  onItemToggle,
  lockedKeys = new Set(),
  highlightUnrated = false,
  readOnly = false,
  courseSlug,
}: {
  module: CourseModule;
  index: number;
  itemStatuses: ItemStatuses;
  onItemToggle: (key: string) => void;
  lockedKeys?: Set<string>;
  highlightUnrated?: boolean;
  readOnly?: boolean;
  courseSlug?: string;
}) {
  const t = useTranslations("ModeratorModuleCard");
  const tModule = useTranslations("ModuleCard");
  const [open, setOpen] = useState(true);
  const [viewLesson, setViewLesson] = useState<CourseLesson | null>(null);
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
      <div className="flex items-center justify-between" style={{ gap: 8 }}>
        <div className="flex min-w-0 items-center" style={{ gap: 8 }}>
          <span style={{ ...metaSt, color: "var(--color-text-secondary)", flexShrink: 0 }}>
            {tModule("moduleNumber", { order: index + 1 })}
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
              {tModule("lessonsCount", { count: lessonCount })}
            </span>
          </span>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex shrink-0 items-center justify-center rounded-full transition hover:bg-gray-100"
          style={{ width: 40, height: 40 }}
          aria-label={open ? t("collapseAriaLabel") : t("expandAriaLabel")}
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

      {/* Lessons only: tests live inside lesson content blocks */}
      {open && (
        <div
          style={{
            marginTop: "clamp(16px, 1.25vw, 24px)",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          <div className="flex items-center" style={{ gap: 8 }}>
            <Play size={20} style={{ color: "var(--color-text-primary)", flexShrink: 0 }} />
            <span style={sectionTitleSt}>{tModule("lessons")}</span>
          </div>
          {lessonCount === 0 ? (
            <p style={{ fontFamily: bodyFont, color: "var(--color-text-secondary)", fontSize: 15 }}>
              {t("noLessons")}
            </p>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "clamp(8px, 0.52vw, 10px)" }}
            >
              {module.lessons.map((lesson, i) => {
                const key = `lesson-${lesson.id}`;
                return readOnly ? (
                  <div
                    key={lesson.id}
                    className="flex items-center justify-between"
                    style={{
                      background: "var(--color-bg)",
                      border: "2px solid var(--color-border-light)",
                      borderRadius: 16,
                      padding: "clamp(20px, 1.67vw, 24px) clamp(24px, 2.22vw, 32px)",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: bodyFont,
                        fontWeight: 600,
                        fontSize: "clamp(16px, 1.39vw, 20px)",
                        color: "var(--color-text-primary)",
                      }}
                    >
                      {i + 1}. {lesson.title}
                    </span>
                  </div>
                ) : (
                  <ModeratorLessonRow
                    key={lesson.id}
                    lesson={lesson}
                    index={i}
                    status={itemStatuses[key] ?? null}
                    onToggle={() => onItemToggle(key)}
                    onView={() => setViewLesson(lesson)}
                    locked={lockedKeys.has(key)}
                    unrated={highlightUnrated && (itemStatuses[key] ?? null) === null}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {viewLesson && (
        <LessonFormModal
          mode="view"
          onClose={() => setViewLesson(null)}
          initialValues={{
            title: viewLesson.title,
            duration_minutes: viewLesson.duration_minutes?.toString() ?? "",
            min_score: viewLesson.min_score?.toString() ?? "",
            existing_documents: viewLesson.documents ?? [],
            new_documents: [],
            deleted_document_ids: [],
            items: viewLesson.items ?? [],
          }}
          courseSlug={courseSlug}
          moduleId={module.id}
          lessonId={viewLesson.id}
        />
      )}
    </div>
  );
}
