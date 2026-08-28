"use client";

import { useTranslations } from "next-intl";
import { ModeratorModuleCard } from "./ModeratorModuleCard";
import { NoteActionBlock } from "./NoteActionBlock";
import { ModerationNavButtons } from "./ModerationNavButtons";
import type { StepProps } from "../model/moderatorReview";
import { bodyFont } from "../model/moderatorReview";

/** Step 2: module and lesson content review with per-item status badges. */
export function ModeratorContentStep(props: StepProps) {
  const {
    moduleList,
    lockedKeys,
    action,
    submitting,
    error,
    step,
    hasAnyFlagged,
    itemStatuses,
    contentNote,
    contentAction,
    onActionChange,
    onItemStatusToggle,
    onContentNoteChange,
    onContentActionChange,
    onNext,
    onBack,
    onSubmit,
    router,
    courseSlug,
  } = props;
  void onActionChange;

  const t = useTranslations("ModeratorCourseReviewPage");
  const tStepper = useTranslations("CourseCreationStepper");

  const allItemKeys = moduleList.flatMap((m) => m.lessons.map((l) => `lesson-${l.id}`));
  const unratedCount = allItemKeys.filter((k) => (itemStatuses[k] ?? null) === null).length;
  const canContinue = unratedCount === 0 && contentAction !== null;
  const highlightUnrated = unratedCount > 0 && unratedCount < allItemKeys.length;

  return (
    <div
      className="rounded-2xl bg-white"
      style={{
        padding: "clamp(24px, 2.08vw, 40px) clamp(24px, 2.6vw, 50px)",
        boxShadow: "var(--shadow-dashboard-card)",
        display: "flex",
        flexDirection: "column",
        gap: "clamp(16px, 1.25vw, 24px)",
      }}
    >
      <div>
        <h2
          style={{
            fontFamily: bodyFont,
            fontWeight: 700,
            fontSize: "clamp(20px, 1.875vw, 36px)",
            marginBottom: "clamp(4px, 0.42vw, 8px)",
          }}
        >
          {tStepper("stepContentName")}
        </h2>
        <p
          style={{
            fontFamily: bodyFont,
            fontWeight: 500,
            fontSize: "clamp(13px, 1.04vw, 20px)",
            letterSpacing: "-0.011em",
            color: "var(--color-text-secondary)",
          }}
        >
          {t("contentSubtitle")}
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "clamp(10px, 0.83vw, 16px)" }}>
        {moduleList.length === 0 ? (
          <p style={{ fontFamily: bodyFont, color: "var(--color-text-secondary)", fontSize: 15 }}>
            {t("noModulesFound")}
          </p>
        ) : (
          moduleList.map((mod, i) => (
            <ModeratorModuleCard
              key={mod.id}
              module={mod}
              index={i}
              itemStatuses={itemStatuses}
              onItemToggle={onItemStatusToggle}
              lockedKeys={lockedKeys}
              highlightUnrated={highlightUnrated}
              courseSlug={courseSlug}
            />
          ))
        )}
      </div>

      <NoteActionBlock
        note={contentNote}
        onNoteChange={onContentNoteChange}
        itemAction={contentAction}
        onItemActionChange={onContentActionChange}
        onSave={() => {}}
        title={t("contentActionTitle")}
      />

      <ModerationNavButtons
        step={step}
        action={action}
        hasAnyFlagged={hasAnyFlagged}
        canContinue={canContinue}
        unratedCount={unratedCount}
        needsSectionAction={contentAction === null}
        submitting={submitting}
        error={error}
        onNext={onNext}
        onBack={onBack}
        onSubmit={onSubmit}
        router={router}
      />
    </div>
  );
}
