"use client";

import { AccentButton } from "./AccentButton";
import { WhiteButton } from "./WhiteButton";

type Props = {
  onCancel: () => void;
  submitLabel: string;
  loading: boolean;
  disabled: boolean;
  /** Optional error message displayed above the buttons. */
  error?: string | null;
};

/** Shared modal footer — divider + optional error + Cancel + submit AccentButton. */
export function ModalFooter({ onCancel, submitLabel, loading, disabled, error }: Props) {
  return (
    <div style={{ marginTop: "clamp(20px, 2.22vw, 32px)" }}>
      <div style={{ borderTop: "2px solid var(--color-border-light)", marginBottom: "clamp(16px, 2.22vw, 32px)" }} />
      {error && (
        <p
          style={{
            fontFamily: "var(--font-base)",
            fontSize: "clamp(13px, 1.04vw, 15px)",
            color: "var(--color-danger)",
            marginBottom: 16,
            textAlign: "right",
          }}
        >
          {error}
        </p>
      )}
      <div className="flex items-center justify-end" style={{ gap: "clamp(12px, 1.39vw, 20px)" }}>
        <WhiteButton
          icon={null}
          onClick={onCancel}
          disabled={loading}
          style={{
            minWidth: "clamp(140px, 13.89vw, 200px)",
            height: "clamp(44px, 3.61vw, 52px)",
            fontSize: "clamp(14px, 1.39vw, 20px)",
          }}
        >
          Cancel
        </WhiteButton>
        <AccentButton
          type="submit"
          size="md"
          disabled={disabled}
          style={{
            minWidth: "clamp(140px, 13.89vw, 200px)",
            height: "clamp(44px, 3.61vw, 52px)",
            fontSize: "clamp(14px, 1.39vw, 20px)",
          }}
        >
          {loading ? "Saving…" : submitLabel}
        </AccentButton>
      </div>
    </div>
  );
}
