"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ModalShell } from "@/shared/ui/ModalShell";
import { ModalFooter } from "@/shared/ui/ModalFooter";

const MIN_REASON_LENGTH = 5;

type Props = {
  title: string;
  description: string;
  reasonLabel: string;
  placeholder: string;
  confirmLabel: string;
  loading: boolean;
  error: string | null;
  fieldError?: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
};

export function ReasonPromptModal({
  title,
  description,
  reasonLabel,
  placeholder,
  confirmLabel,
  loading,
  error,
  fieldError,
  onConfirm,
  onCancel,
}: Props) {
  const t = useTranslations("ReasonPromptModal");
  const [reason, setReason] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = reason.trim();
    if (trimmed.length < MIN_REASON_LENGTH) {
      setLocalError(t("reasonValidationError", { min: MIN_REASON_LENGTH }));
      return;
    }
    setLocalError(null);
    onConfirm(trimmed);
  }

  const reasonError = localError ?? fieldError;

  return (
    <ModalShell
      onClose={onCancel}
      closeOnOverlayClick={false}
      title={title}
      width="clamp(360px, 38vw, 560px)"
      padding="clamp(20px, 2.08vw, 32px) clamp(24px, 2.5vw, 40px)"
      shadow="var(--shadow-modal)"
    >
      <form onSubmit={handleSubmit} noValidate>
        <p
          className="font-(family-name:--font-base) font-normal text-(--color-text-secondary)"
          style={{
            fontSize: "clamp(13px, 0.97vw, 16px)",
            lineHeight: 1.5,
            margin: "0 0 clamp(16px, 1.39vw, 20px)",
          }}
        >
          {description}
        </p>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="certificate-reason"
            className="font-mono text-sm font-medium text-gray-400"
          >
            {reasonLabel}
          </label>
          <textarea
            id="certificate-reason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={placeholder}
            aria-invalid={reasonError ? true : undefined}
            className={`w-full resize-y rounded-lg border px-3 py-2 outline-none transition ${
              reasonError
                ? "border-red-500 focus:border-red-500"
                : "border-gray-300 focus:border-black"
            }`}
          />
          {reasonError && <span className="text-sm text-red-500">{reasonError}</span>}
        </div>

        <ModalFooter
          onCancel={onCancel}
          submitLabel={confirmLabel}
          loading={loading}
          disabled={loading}
          error={error}
        />
      </form>
    </ModalShell>
  );
}
