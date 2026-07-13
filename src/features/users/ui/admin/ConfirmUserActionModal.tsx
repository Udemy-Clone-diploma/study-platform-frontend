"use client";

import { ModalShell } from "@/shared/ui/ModalShell";
import { AccentButton } from "@/shared/ui/AccentButton";
import { WhiteButton } from "@/shared/ui/WhiteButton";

type Props = {
  title: string;
  description: string;
  confirmLabel: string;
  loading: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmUserActionModal({
  title,
  description,
  confirmLabel,
  loading,
  error,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <ModalShell
      onClose={onCancel}
      title={title}
      width="clamp(300px, 28vw, 440px)"
      padding="clamp(20px, 2.08vw, 30px) clamp(20px, 2.08vw, 32px)"
      shadow="var(--shadow-modal)"
    >
      <p
        className="font-(family-name:--font-base) font-normal text-(--color-text-secondary)"
        style={{
          fontSize: "clamp(13px, 0.97vw, 16px)",
          lineHeight: 1.5,
          margin: "0 0 clamp(20px, 1.67vw, 28px)",
        }}
      >
        {description}
      </p>
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
          Cancel
        </WhiteButton>
        <AccentButton
          size="md"
          onClick={onConfirm}
          disabled={loading}
          style={{
            minWidth: "clamp(110px, 9vw, 140px)",
            height: "clamp(36px, 2.71vw, 44px)",
            fontSize: "clamp(12px, 0.97vw, 15px)",
          }}
        >
          {loading ? "Please wait…" : confirmLabel}
        </AccentButton>
      </div>
    </ModalShell>
  );
}
