"use client";

import { useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { GradientButton } from "@/shared/ui/GradientButton";
import type { StepProps, ModeratorAction } from "../model/moderatorReview";
import { getSubmitLabels, bodyFont, monoFont } from "../model/moderatorReview";

/** Back/Continue/Submit navigation row used at the bottom of every moderator review step. */
export function ModerationNavButtons({
  step,
  action,
  hasAnyFlagged,
  canContinue = true,
  unratedCount = 0,
  needsSectionAction = false,
  submitting,
  error,
  onNext,
  onBack,
  onSubmit,
  router,
}: Pick<
  StepProps,
  | "step"
  | "action"
  | "hasAnyFlagged"
  | "submitting"
  | "error"
  | "onNext"
  | "onBack"
  | "onSubmit"
  | "router"
> & { canContinue?: boolean; unratedCount?: number; needsSectionAction?: boolean }) {
  const t = useTranslations("ModerationNavButtons");
  const tReview = useTranslations("CourseReviewPage");
  const isLast = step === 2;
  const effectiveAction: ModeratorAction =
    hasAnyFlagged && action === "approved" ? "needs_revision" : action;
  const submitLabel = effectiveAction ? getSubmitLabels(t)[effectiveAction] : t("selectAnAction");
  const continueHint = canContinue
    ? null
    : unratedCount > 0
      ? t("continueUnratedHint", { count: unratedCount })
      : needsSectionAction
        ? t("continueSectionActionHint")
        : null;
  const actionColor =
    effectiveAction === "approved"
      ? "var(--gradient-brand)"
      : effectiveAction === "needs_revision"
        ? "var(--color-brand-yellow)"
        : effectiveAction === "rejected"
          ? "#FF383C"
          : "var(--color-draft)";

  return (
    <div
      className="flex items-center justify-between"
      style={{ marginTop: "clamp(8px, 0.83vw, 16px)" }}
    >
      {step > 0 ? (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center transition hover:opacity-80"
          style={{
            gap: 10,
            border: "1px solid var(--color-draft)",
            borderRadius: 28,
            padding: "4px 16px",
            background: "var(--color-bg)",
            fontFamily: monoFont,
            fontWeight: 500,
            fontSize: "clamp(13px, 1.04vw, 20px)",
            cursor: "pointer",
            height: 44,
          }}
        >
          <ArrowLeft size={18} /> {t("backLabel")}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => router.push("/moderator-dashboard/courses")}
          className="inline-flex items-center transition hover:opacity-80"
          style={{
            gap: 10,
            border: "1px solid var(--color-draft)",
            borderRadius: 28,
            padding: "4px 16px",
            background: "var(--color-bg)",
            fontFamily: monoFont,
            fontWeight: 500,
            fontSize: "clamp(13px, 1.04vw, 20px)",
            cursor: "pointer",
            height: 44,
          }}
        >
          <ArrowLeft size={18} /> {t("backToCoursesLabel")}
        </button>
      )}

      {isLast ? (
        <div className="flex items-center" style={{ gap: 12 }}>
          {hasAnyFlagged && action === "approved" && (
            <span
              style={{ fontFamily: bodyFont, fontSize: 13, color: "var(--color-brand-yellow)" }}
            >
              {t("flaggedWillRevise")}
            </span>
          )}
          {error && (
            <span style={{ fontFamily: bodyFont, fontSize: 14, color: "var(--color-pink-dark)" }}>
              {error}
            </span>
          )}
          <button
            type="button"
            disabled={!action || submitting}
            onClick={onSubmit}
            style={{
              background: action ? actionColor : "var(--color-draft)",
              borderRadius: 28,
              padding: "clamp(8px, 0.83vw, 12px) clamp(16px, 1.94vw, 28px)",
              fontFamily: monoFont,
              fontWeight: 600,
              fontSize: "clamp(13px, 1.04vw, 20px)",
              cursor: action && !submitting ? "pointer" : "not-allowed",
              border: "none",
              opacity: !action || submitting ? 0.45 : 1,
              transition: "opacity 0.2s",
            }}
          >
            {submitting ? tReview("submitting") : submitLabel}
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          <GradientButton
            type="button"
            disabled={!canContinue}
            onClick={onNext}
            style={{ gap: "clamp(8px, 0.83vw, 12px)" }}
          >
            {t("continueLabel")} <ArrowRight size={18} />
          </GradientButton>
          {continueHint && (
            <span
              role="status"
              style={{ fontFamily: bodyFont, fontSize: 13, color: "var(--color-warning-text)" }}
            >
              {continueHint}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
