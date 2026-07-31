"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ModalShell } from "@/shared/ui/ModalShell";
import { AccentButton } from "@/shared/ui/AccentButton";
import { WhiteButton } from "@/shared/ui/WhiteButton";

type Props = {
  title: string;
  description: string;
  confirmLabel: string;
  commentRequired?: boolean;
  loading: boolean;
  error: string | null;
  onConfirm: (comment: string) => void;
  onCancel: () => void;
};

/** Approve/cancel modal for a teacher application — includes a moderator comment, required when cancelling since it is emailed to the applicant. */
export function TeacherApplicationDecisionModal({
  title,
  description,
  confirmLabel,
  commentRequired = false,
  loading,
  error,
  onConfirm,
  onCancel,
}: Props) {
  const t = useTranslations("TeacherApplicationsAdmin");
  const tCommon = useTranslations("Common");
  const [comment, setComment] = useState("");
  const canConfirm = !commentRequired || comment.trim().length > 0;

  return (
    <ModalShell
      onClose={onCancel}
      title={title}
      width="clamp(320px, 32vw, 480px)"
      padding="clamp(20px, 2.08vw, 30px) clamp(20px, 2.08vw, 32px)"
      shadow="var(--shadow-modal)"
    >
      <p
        className="font-(family-name:--font-base) font-normal text-(--color-text-secondary)"
        style={{ fontSize: "clamp(13px, 0.97vw, 16px)", lineHeight: 1.5, margin: "0 0 16px" }}
      >
        {description}
      </p>

      <label
        className="mb-1 block font-(family-name:--font-base) text-(--color-text-primary)"
        style={{ fontSize: "clamp(13px, 0.97vw, 15px)" }}
      >
        {commentRequired ? t("commentLabelRequired") : t("commentLabelOptional")}
      </label>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        placeholder={commentRequired ? t("commentPlaceholderCancel") : t("commentPlaceholderApprove")}
        className="w-full resize-y rounded-xl border border-(--color-pink-dark) bg-white outline-none focus:border-(--color-blue)"
        style={{
          fontFamily: "var(--font-base)",
          fontSize: "clamp(13px, 0.97vw, 14px)",
          color: "var(--color-text-primary)",
          padding: "10px 12px",
          marginBottom: "clamp(16px, 1.67vw, 24px)",
        }}
      />

      {error && (
        <p
          className="font-(family-name:--font-base) text-(--color-danger)"
          style={{ fontSize: "clamp(12px, 0.83vw, 14px)", margin: "0 0 12px" }}
        >
          {error}
        </p>
      )}

      <div className="flex items-center justify-center" style={{ gap: 12 }}>
        <WhiteButton
          icon={null}
          onClick={onCancel}
          disabled={loading}
          style={{
            minWidth: "clamp(110px, 9vw, 140px)",
            height: "clamp(36px, 2.71vw, 44px)",
            fontSize: "clamp(12px, 0.97vw, 15px)",
          }}
        >
          {tCommon("cancel")}
        </WhiteButton>
        <AccentButton
          size="md"
          onClick={() => onConfirm(comment.trim())}
          disabled={loading || !canConfirm}
          style={{
            minWidth: "clamp(110px, 9vw, 140px)",
            height: "clamp(36px, 2.71vw, 44px)",
            fontSize: "clamp(12px, 0.97vw, 15px)",
          }}
        >
          {loading ? tCommon("pleaseWait") : confirmLabel}
        </AccentButton>
      </div>
    </ModalShell>
  );
}
