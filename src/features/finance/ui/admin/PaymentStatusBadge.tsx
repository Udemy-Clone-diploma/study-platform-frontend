"use client";

import type { PaymentStatus } from "@/entities/payment";

const STATUS_CONFIG: Record<PaymentStatus, { label: string; accent: string; filled?: boolean }> = {
  pending: { label: "Pending", accent: "var(--color-warning)" },
  processing: { label: "Processing", accent: "var(--color-warning)" },
  succeeded: { label: "Succeeded", accent: "var(--color-success)" },
  failed: { label: "Failed", accent: "var(--color-rejected)" },
  canceled: { label: "Canceled", accent: "var(--color-text-secondary)" },
  refunded: { label: "Refunded", accent: "var(--color-blue)", filled: true },
};

export const PAYMENT_STATUS_LABELS = Object.entries(STATUS_CONFIG).map(([value, config]) => ({
  value: value as PaymentStatus,
  label: config.label,
}));

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;

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
      {config.label}
    </span>
  );
}
