"use client";

import { useTranslations } from "next-intl";
import type { PaymentStatus } from "@/entities/payment";

type Translator = (key: string, values?: Record<string, string | number>) => string;

const STATUS_STYLE: Record<PaymentStatus, { accent: string; filled?: boolean }> = {
  pending: { accent: "var(--color-warning)" },
  processing: { accent: "var(--color-warning)" },
  succeeded: { accent: "var(--color-success)" },
  failed: { accent: "var(--color-rejected)" },
  canceled: { accent: "var(--color-text-secondary)" },
  refunded: { accent: "var(--color-blue)", filled: true },
};

const STATUS_KEYS: Record<PaymentStatus, string> = {
  pending: "statusPending",
  processing: "statusProcessing",
  succeeded: "statusSucceeded",
  failed: "statusFailed",
  canceled: "statusCanceled",
  refunded: "statusRefunded",
};

export function paymentStatusLabel(status: PaymentStatus, t: Translator): string {
  return t(STATUS_KEYS[status] ?? STATUS_KEYS.pending);
}

export function getPaymentStatusOptions(t: Translator): { value: PaymentStatus; label: string }[] {
  return (Object.keys(STATUS_STYLE) as PaymentStatus[]).map((value) => ({
    value,
    label: paymentStatusLabel(value, t),
  }));
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const t = useTranslations("PaymentStatusBadge");
  const config = STATUS_STYLE[status] ?? STATUS_STYLE.pending;
  const label = paymentStatusLabel(status, t);

  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-(family-name:--font-accent) font-medium whitespace-nowrap"
      style={{
        fontSize: "clamp(11px, 0.83vw, 14px)",
        padding: "2px 12px",
        color: config.filled ? "white" : config.accent,
        border: `1px solid ${config.accent}`,
        background: config.filled ? config.accent : "white",
      }}
    >
      {label}
    </span>
  );
}
