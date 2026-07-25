"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ModalShell } from "./ModalShell";
import { AccentButton } from "./AccentButton";
import { WhiteButton } from "./WhiteButton";
import type { ApiError } from "@/shared/api/base";

type Props = {
  onClose: () => void;
  /** Submit the report. Reject on failure (e.g. an ApiError); the modal shows its message and stays open. */
  onSubmit: (reason: string) => Promise<void>;
};

/** Small modal for flagging a review for moderator attention, with a required reason. */
export function ReportReviewModal({ onClose, onSubmit }: Props) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const t = useTranslations("ReportReviewModal");
  const tCommon = useTranslations("Common");

  async function handleSubmit() {
    if (!reason.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      await onSubmit(reason.trim());
      onClose();
    } catch (err: unknown) {
      setError((err as Partial<ApiError>).message ?? t("genericError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalShell
      onClose={onClose}
      title={t("title")}
      width="clamp(320px, 30vw, 460px)"
      padding="clamp(20px, 2.08vw, 30px) clamp(20px, 2.08vw, 32px)"
      shadow="var(--shadow-modal)"
    >
      <p
        className="font-(family-name:--font-base) font-normal text-(--color-text-secondary)"
        style={{ fontSize: "clamp(13px, 0.97vw, 16px)", lineHeight: 1.5, margin: "0 0 clamp(12px, 1vw, 16px)" }}
      >
        {t("description")}
      </p>

      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder={t("placeholder")}
        rows={4}
        className="w-full resize-none rounded-lg border border-(--color-border-light) font-(family-name:--font-base) text-(--color-text-primary) focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-blue)"
        style={{ padding: "10px 12px", fontSize: "clamp(13px, 0.97vw, 15px)" }}
      />

      {error && (
        <p style={{ color: "var(--color-danger)", fontSize: "clamp(12px, 0.83vw, 14px)", marginTop: 8 }}>
          {error}
        </p>
      )}

      <div className="flex items-center justify-center" style={{ gap: 12, marginTop: "clamp(16px, 1.67vw, 24px)" }}>
        <WhiteButton
          icon={null}
          onClick={onClose}
          disabled={submitting}
          style={{
            minWidth: "unset",
            fontSize: "clamp(12px, 0.78vw, 15px)",
            height: "clamp(34px, 2.08vw, 40px)",
            padding: "0 clamp(16px, 1.25vw, 24px)",
          }}
        >
          {tCommon("cancel")}
        </WhiteButton>
        <AccentButton
          type="button"
          size="sm"
          disabled={submitting || !reason.trim()}
          onClick={handleSubmit}
          style={{ fontSize: "clamp(12px, 0.78vw, 15px)", height: "clamp(34px, 2.08vw, 40px)" }}
        >
          {submitting ? "…" : t("submit")}
        </AccentButton>
      </div>
    </ModalShell>
  );
}
