"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ModalShell } from "@/shared/ui/ModalShell";
import { AccentButton } from "@/shared/ui/AccentButton";
import { WhiteButton } from "@/shared/ui/WhiteButton";

type Props = {
  onConfirm: (comment: string) => Promise<void>;
  onCancel: () => void;
};

/** Small modal collecting a moderator's rejection reason for an article under review. */
export function ArticleRejectModal({ onConfirm, onCancel }: Props) {
  const t = useTranslations("ArticleRejectModal");
  const tCommon = useTranslations("Common");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    if (!comment.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await onConfirm(comment.trim());
    } catch {
      setError(t("error"));
      setLoading(false);
    }
  }

  return (
    <ModalShell
      onClose={onCancel}
      title={t("title")}
      width="clamp(320px, 32vw, 480px)"
      padding="clamp(20px, 2.08vw, 30px) clamp(20px, 2.08vw, 32px)"
      shadow="var(--shadow-modal)"
    >
      <label
        htmlFor="reject-comment"
        style={{ display: "block", fontFamily: "var(--font-base)", fontWeight: 700, fontSize: 14, color: "var(--color-text-primary)", marginBottom: 8 }}
      >
        {t("reasonLabel")}
      </label>
      <textarea
        id="reject-comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={t("reasonPlaceholder")}
        rows={4}
        style={{
          display: "block",
          width: "100%",
          backgroundColor: "var(--color-input-bg)",
          border: "none",
          borderRadius: 12,
          padding: 14,
          fontFamily: "var(--font-base)",
          fontSize: 14,
          color: "var(--color-text-primary)",
          outline: "none",
          resize: "vertical",
          boxSizing: "border-box",
          marginBottom: 16,
        }}
      />
      {error && (
        <p style={{ fontFamily: "var(--font-base)", fontSize: 13, color: "var(--color-danger)", margin: "0 0 12px" }}>{error}</p>
      )}
      <div className="flex items-center justify-end" style={{ gap: 12 }}>
        <WhiteButton icon={null} onClick={onCancel} disabled={loading} style={{ minWidth: 120, height: 44 }}>
          {tCommon("cancel")}
        </WhiteButton>
        <AccentButton size="md" onClick={handleConfirm} disabled={loading || !comment.trim()} style={{ minWidth: 120, height: 44 }}>
          {loading ? t("rejecting") : t("reject")}
        </AccentButton>
      </div>
    </ModalShell>
  );
}
