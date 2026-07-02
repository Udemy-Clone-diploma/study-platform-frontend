"use client";

import { SectionCard } from "@/shared/ui/SectionCard";
import { ModeratorItemStatusBadge } from "./ModeratorItemStatusBadge";
import { NoteActionBlock } from "./NoteActionBlock";
import { ModerationNavButtons } from "./ModerationNavButtons";
import type { StepProps, ItemStatuses } from "../model/moderatorReview";
import { BASICS_FIELD_KEYS, bodyFont, labelSt, valueWithBadgeSt } from "../model/moderatorReview";

function FieldRow({ fieldKey, label, children, itemStatuses, onItemStatusToggle, locked = false }: {
  fieldKey: string;
  label: string;
  children: React.ReactNode;
  itemStatuses: ItemStatuses;
  onItemStatusToggle: (key: string) => void;
  locked?: boolean;
}) {
  return (
    <div style={{ opacity: locked ? 0.6 : 1 }}>
      <span style={labelSt}>{label}</span>
      <div style={{ position: "relative" }}>
        {children}
        <div style={{ position: "absolute", right: "clamp(10px, 0.83vw, 16px)", top: "50%", transform: "translateY(-50%)" }}>
          <ModeratorItemStatusBadge status={itemStatuses[fieldKey] ?? null} onClick={() => onItemStatusToggle(fieldKey)} locked={locked} />
        </div>
      </div>
    </div>
  );
}

/** Step 1: course basics fields review with per-field status badges. */
export function ModeratorBasicsStep(props: StepProps) {
  const { course, draftCourse, lockedKeys, action, comment, submitting, error, step, hasAnyFlagged, itemStatuses,
          onActionChange, onCommentChange, onItemStatusToggle, basicsAction, onBasicsActionChange,
          onNext, onBack, onSubmit, router } = props;
  void onActionChange; void onCommentChange;

  // For pending edits, show proposed values for changed fields
  const draft = draftCourse;
  const displayTitle     = (!lockedKeys.has("field-title")             && draft?.title)             || course?.title             || "—";
  const displayShortDesc = (!lockedKeys.has("field-short-description") && draft?.short_description) || course?.short_description || "—";
  const displayFullDesc  = (!lockedKeys.has("field-full-description")  && draft?.full_description)  || course?.full_description  || "—";
  const displayImage    = (!lockedKeys.has("field-icon")        && draft?.image)             ?? course?.image ?? null;
  const displayCategory = !lockedKeys.has("field-category") && draft
    ? (draft.category?.name ?? "—")
    : (course?.category?.name ?? "—");
  const displayLevel    = (!lockedKeys.has("field-level") && draft?.level) ?? course?.level ?? "";

  const levelLabel   = displayLevel ? displayLevel.charAt(0).toUpperCase() + displayLevel.slice(1) : "—";

  const canContinue =
    BASICS_FIELD_KEYS.every((k) => (itemStatuses[k] ?? null) !== null) &&
    basicsAction !== null;


  return (
    <div className="rounded-2xl bg-white" style={{ padding: "clamp(24px, 2.08vw, 40px) clamp(24px, 2.6vw, 50px)", boxShadow: "var(--shadow-dashboard-card)", display: "flex", flexDirection: "column", gap: "clamp(16px, 1.25vw, 24px)" }}>
      <div>
        <h2 style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: "clamp(20px, 1.875vw, 36px)", marginBottom: "clamp(4px, 0.42vw, 8px)" }}>Basics</h2>
        <p style={{ fontFamily: bodyFont, fontWeight: 500, fontSize: "clamp(13px, 1.04vw, 20px)", letterSpacing: "-0.011em", color: "var(--color-text-secondary)" }}>
          Course information — review and mark each field
        </p>
      </div>

      <SectionCard>
        <p style={{ fontFamily: bodyFont, fontSize: "clamp(14px, 1.25vw, 24px)", marginBottom: "clamp(14px, 1.04vw, 20px)" }}>
          Course information
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "clamp(14px, 1.25vw, 20px)" }}>

          {/* Course Title */}
          <FieldRow fieldKey="field-title" label="Course Title*" itemStatuses={itemStatuses} onItemStatusToggle={onItemStatusToggle} locked={lockedKeys.has("field-title")}>
            <div style={valueWithBadgeSt}>{displayTitle}</div>
          </FieldRow>

          {/* Short Description */}
          <FieldRow fieldKey="field-short-description" label="Short Description*" itemStatuses={itemStatuses} onItemStatusToggle={onItemStatusToggle} locked={lockedKeys.has("field-short-description")}>
            <div style={valueWithBadgeSt}>{displayShortDesc}</div>
          </FieldRow>

          {/* Full Description */}
          <FieldRow fieldKey="field-full-description" label="Full Description*" itemStatuses={itemStatuses} onItemStatusToggle={onItemStatusToggle} locked={lockedKeys.has("field-full-description")}>
            <div style={{ ...valueWithBadgeSt, whiteSpace: "pre-wrap" }}>{displayFullDesc}</div>
          </FieldRow>

          {/* Course Icon */}
          <FieldRow fieldKey="field-icon" label="Course Icon*" itemStatuses={itemStatuses} onItemStatusToggle={onItemStatusToggle} locked={lockedKeys.has("field-icon")}>
            <div style={{ ...valueWithBadgeSt, display: "flex", alignItems: "center", gap: 12 }}>
              {displayImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={displayImage} alt="course icon" style={{ width: "clamp(44px, 4.06vw, 78px)", height: "clamp(44px, 4.06vw, 78px)", objectFit: "contain", flexShrink: 0 }} />
              ) : (
                <span style={{ color: "var(--color-text-secondary)", fontStyle: "italic" }}>No image</span>
              )}
            </div>
          </FieldRow>

          {/* Category + Level */}
          <div className="grid grid-cols-2" style={{ gap: "clamp(16px, 2.08vw, 40px)" }}>
            <FieldRow fieldKey="field-category" label="Category*" itemStatuses={itemStatuses} onItemStatusToggle={onItemStatusToggle} locked={lockedKeys.has("field-category")}>
              <div style={valueWithBadgeSt}>{displayCategory}</div>
            </FieldRow>
            <FieldRow fieldKey="field-level" label="Level*" itemStatuses={itemStatuses} onItemStatusToggle={onItemStatusToggle} locked={lockedKeys.has("field-level")}>
              <div style={valueWithBadgeSt}>{levelLabel}</div>
            </FieldRow>
          </div>

        </div>
      </SectionCard>

      <NoteActionBlock note={comment} onNoteChange={onCommentChange} itemAction={basicsAction} onItemActionChange={onBasicsActionChange} onSave={() => {}} title="Section action" />

      <ModerationNavButtons step={step} action={action} hasAnyFlagged={hasAnyFlagged} canContinue={canContinue} submitting={submitting} error={error} onNext={onNext} onBack={onBack} onSubmit={onSubmit} router={router} />
    </div>
  );
}
