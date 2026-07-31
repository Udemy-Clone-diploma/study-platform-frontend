"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { ItemStatus } from "../model/moderatorReview";
import { getContentActions, bodyFont, monoFont } from "../model/moderatorReview";

/** Note textarea + action selector panel used on each moderator review step. */
export function NoteActionBlock({ note, onNoteChange, itemAction, onItemActionChange, onSave, title }: {
  note: string;
  onNoteChange: (v: string) => void;
  itemAction: ItemStatus;
  onItemActionChange: (s: ItemStatus) => void;
  onSave: () => void;
  title: string;
}) {
  const t = useTranslations("NoteActionBlock");
  const tBasics = useTranslations("CourseBasicsForm");
  const tCommon = useTranslations("Common");
  const contentActions = getContentActions(tBasics);
  const [isEditing, setIsEditing] = useState(!note);

  function handleChange(value: string) {
    onNoteChange(value);
  }

  function handleSave() {
    onSave();
    setIsEditing(false);
  }

  function handleEdit() {
    setIsEditing(true);
  }

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", width: "100%", maxWidth: 880 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 16, border: "1px solid var(--color-pink-dark)", borderRadius: 20, padding: "28px 34px" }}>
          {isEditing ? (
            <textarea
              autoFocus
              value={note}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={t("takeNotePlaceholder")}
              style={{ flex: 1, minHeight: 360, resize: "none", border: "none", outline: "none", fontFamily: bodyFont, fontWeight: 400, fontSize: 16, lineHeight: "20px", color: note ? "var(--color-text-primary)" : "var(--color-draft)" }}
            />
          ) : (
            <div style={{ flex: 1, minHeight: 360, fontFamily: bodyFont, fontWeight: 400, fontSize: 16, lineHeight: "20px", color: note ? "var(--color-text-primary)" : "var(--color-draft)", whiteSpace: "pre-wrap" }}>
              {note || t("takeNotePlaceholder")}
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "center" }}>
            {isEditing ? (
              <button type="button" onClick={handleSave}
                style={{ background: "var(--color-text-primary)", color: "white", borderRadius: 28, padding: "10px 28px", minWidth: 200, height: 52, fontFamily: monoFont, fontWeight: 500, fontSize: 20, lineHeight: "150%", textTransform: "uppercase", border: "none", cursor: note.trim() ? "pointer" : "default", opacity: note.trim() ? 1 : 0.6, transition: "opacity 0.2s" }}>
                {tCommon("save")}
              </button>
            ) : (
              <button type="button" onClick={handleEdit}
                style={{ background: "transparent", color: "var(--color-text-secondary)", borderRadius: 28, padding: "10px 28px", minWidth: 200, height: 52, fontFamily: monoFont, fontWeight: 500, fontSize: 20, lineHeight: "150%", textTransform: "uppercase", border: "1px solid var(--color-draft)", cursor: "pointer" }}>
                {t("editLabel")}
              </button>
            )}
          </div>
        </div>

        {/* Action panel */}
        <div style={{ width: 274, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-start", padding: "28px 34px", gap: 12, border: "1px solid var(--color-pink-dark)", borderRadius: 20 }}>
          <span style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 16, lineHeight: "20px", width: "100%", textAlign: "center" }}>{title}</span>
          <span style={{ fontFamily: bodyFont, fontWeight: 500, fontSize: 15, lineHeight: "19px", color: "var(--color-text-secondary)", width: "100%", textAlign: "center" }}>{t("selectStatusLabel")}</span>
          {contentActions.map(({ key, label, color }) => {
            const isActive = itemAction === key;
            return (
              <button key={key} type="button" onClick={() => onItemActionChange(isActive ? null : key)}
                style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: "2px 12px", width: "100%", height: 23, background: "white", border: `1px solid ${isActive ? color : "var(--color-draft)"}`, borderRadius: 20, cursor: "pointer", fontFamily: monoFont, fontWeight: 500, fontSize: 15, lineHeight: "19px", color: isActive ? color : "var(--color-text-secondary)", transition: "border-color 0.2s, color 0.2s" }}>
                <span>{label}</span>
                {key === "approved" && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src="/icons/yes.svg" alt="" width={16} height={16} style={{ width: 16, height: 16, opacity: isActive ? 1 : 0.35 }} />
                )}
                {key === "rejected" && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src="/icons/no.svg" alt="" width={16} height={16} style={{ width: 16, height: 16, opacity: isActive ? 1 : 0.35 }} />
                )}
                {key === "needs_revision" && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src="/icons/refine.svg" alt="" width={14} height={14} style={{ width: 14, height: 14, opacity: isActive ? 1 : 0.35 }} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
