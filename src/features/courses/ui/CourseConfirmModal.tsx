"use client";

import { ModalShell } from "@/shared/ui/ModalShell";
import { AccentButton } from "@/shared/ui/AccentButton";
import { WhiteButton } from "@/shared/ui/WhiteButton";

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <path
        d="M3 12C3 12 6.5 6 12 6C17.5 6 21 12 21 12C21 12 17.5 18 12 18C6.5 18 3 12 3 12Z"
        stroke="white"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2" stroke="white" strokeWidth="1.5" />
    </svg>
  );
}

type Props = {
  title: string;
  description: string;
  confirmLabel: string;
  hideVariant?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
};

/** Small confirmation dialog for course actions (Delete / Archive / Withdraw / Hide). */
export function CourseConfirmModal({
  title,
  description,
  confirmLabel,
  hideVariant = false,
  onConfirm,
  onCancel,
  loading = false,
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

      <div className="flex items-center justify-center" style={{ gap: 12 }}>
        <WhiteButton
          icon={null}
          onClick={onCancel}
          disabled={loading}
          style={{
            minWidth: "unset",
            fontSize: "clamp(12px, 0.78vw, 15px)",
            height: "clamp(34px, 2.08vw, 40px)",
            padding: "0 clamp(16px, 1.25vw, 24px)",
          }}
        >
          Cancel
        </WhiteButton>
        <AccentButton
          type="button"
          size="sm"
          disabled={loading}
          onClick={onConfirm}
          style={{
            gap: 6,
            fontSize: "clamp(12px, 0.78vw, 15px)",
            height: "clamp(34px, 2.08vw, 40px)",
          }}
        >
          {hideVariant && <EyeIcon />}
          {loading ? "…" : confirmLabel}
        </AccentButton>
      </div>
    </ModalShell>
  );
}
