"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { updateLesson } from "@/entities/course";
import type { CourseLesson, CourseModule } from "@/entities/course";

function LessonUnlockRow({
  lesson,
  slug,
  moduleId,
  isFirst,
  onUpdated,
}: {
  lesson: CourseLesson;
  slug: string;
  moduleId: number;
  isFirst: boolean;
  onUpdated: (l: CourseLesson) => void;
}) {
  const t = useTranslations("CourseManagementScheduledTab");
  const [saving, setSaving] = useState(false);
  const [days, setDays] = useState(
    lesson.unlock_after_days != null ? String(lesson.unlock_after_days) : "",
  );

  async function patch(data: { unlock_after_days?: number | null; requires_previous?: boolean }) {
    setSaving(true);
    try {
      const updated = await updateLesson(slug, moduleId, lesson.id, data);
      onUpdated(updated);
    } finally {
      setSaving(false);
    }
  }

  function handleDaysBlur() {
    const val = days.trim() === "" ? null : Number(days);
    if (val === (lesson.unlock_after_days ?? null)) return;
    patch({ unlock_after_days: val });
  }

  const reqPrev = !!lesson.requires_previous;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "8px 12px",
        borderRadius: 10,
        background: "var(--color-bg)",
        border: "1px solid var(--color-border-light)",
        opacity: saving ? 0.6 : 1,
        transition: "opacity 0.15s",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-base)",
          fontWeight: 600,
          fontSize: "clamp(12px, 0.83vw, 14px)",
          color: "var(--color-text-primary)",
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {lesson.order}.&nbsp;{lesson.title}
      </span>

      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <input
          type="number"
          min={0}
          value={days}
          placeholder="—"
          onChange={(e) => setDays(e.target.value)}
          onBlur={handleDaysBlur}
          disabled={saving}
          title={t("daysFromStartTooltip")}
          style={{
            fontFamily: "var(--font-base)",
            fontSize: "clamp(12px, 0.83vw, 14px)",
            color: "var(--color-text-primary)",
            textAlign: "center",
            width: 58,
            padding: "4px 8px",
            borderRadius: 8,
            border: "1px solid var(--color-border-light)",
            background: "#fff",
            outline: "none",
          }}
        />
        <span
          style={{
            fontFamily: "var(--font-base)",
            fontSize: "clamp(11px, 0.69vw, 13px)",
            color: "var(--color-text-muted)",
            flexShrink: 0,
          }}
        >
          {t("days")}
        </span>
      </div>

      {/* Requires-previous toggle — hidden for the very first lesson */}
      {!isFirst ? (
        <button
          type="button"
          disabled={saving}
          onClick={() => patch({ requires_previous: !reqPrev })}
          title={reqPrev ? t("removeSequentialRequirement") : t("requirePreviousLessonTooltip")}
          style={{
            flexShrink: 0,
            fontFamily: "var(--font-base)",
            fontWeight: 600,
            fontSize: "clamp(11px, 0.69vw, 13px)",
            padding: "4px 12px",
            borderRadius: 999,
            cursor: saving ? "not-allowed" : "pointer",
            border: `1px solid ${reqPrev ? "var(--color-text-primary)" : "var(--color-border-light)"}`,
            background: reqPrev ? "var(--color-text-primary)" : "transparent",
            color: reqPrev ? "#fff" : "var(--color-text-secondary)",
            transition: "all 0.15s",
          }}
        >
          {t("requiresPrevious")}
        </button>
      ) : (
        <div style={{ flexShrink: 0, width: 130 }} />
      )}
    </div>
  );
}

/** Per-lesson unlock schedule settings for the Scheduled delivery format. */
export function CourseManagementScheduledTab({
  modules,
  slug,
  onLessonUpdated,
}: {
  modules: CourseModule[];
  slug: string;
  onLessonUpdated: (moduleId: number, lesson: CourseLesson) => void;
}) {
  const t = useTranslations("CourseManagementScheduledTab");
  const hasLessons = modules.some((m) => m.lessons.length > 0);

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        padding: "clamp(16px, 1.25vw, 22px)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-base)",
            fontWeight: 700,
            fontSize: "clamp(14px, 0.94vw, 17px)",
            color: "var(--color-text-primary)",
            margin: 0,
          }}
        >
          {t("lessonUnlockSchedule")}
        </p>
        <div style={{ display: "flex", gap: 24 }}>
          <span
            style={{
              fontFamily: "var(--font-base)",
              fontWeight: 600,
              fontSize: "clamp(10px, 0.63vw, 11px)",
              color: "var(--color-text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            {t("daysFromStart")}
          </span>
          <span
            style={{
              fontFamily: "var(--font-base)",
              fontWeight: 600,
              fontSize: "clamp(10px, 0.63vw, 11px)",
              color: "var(--color-text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            {t("sequential")}
          </span>
        </div>
      </div>

      {!hasLessons ? (
        <p
          style={{
            fontFamily: "var(--font-base)",
            fontSize: "clamp(13px, 0.83vw, 15px)",
            color: "var(--color-text-muted)",
            margin: 0,
          }}
        >
          {t("noLessonsYet")}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {(() => {
            let globalIndex = 0;
            return modules
              .filter((m) => m.lessons.length > 0)
              .map((mod) => (
                <div key={mod.id}>
                  <p
                    style={{
                      fontFamily: "var(--font-base)",
                      fontWeight: 600,
                      fontSize: "clamp(11px, 0.72vw, 13px)",
                      color: "var(--color-text-secondary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      margin: "0 0 6px",
                    }}
                  >
                    {mod.title}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {mod.lessons.map((lesson) => {
                      const isFirst = globalIndex === 0;
                      globalIndex++;
                      return (
                        <LessonUnlockRow
                          key={lesson.id}
                          lesson={lesson}
                          slug={slug}
                          moduleId={mod.id}
                          isFirst={isFirst}
                          onUpdated={(updated) => onLessonUpdated(mod.id, updated)}
                        />
                      );
                    })}
                  </div>
                </div>
              ));
          })()}
        </div>
      )}
    </div>
  );
}
