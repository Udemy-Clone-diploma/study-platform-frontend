"use client";

import type { CertificateStatus } from "@/entities/certificate";

type Props = {
  status: CertificateStatus;
  superseded?: boolean;
};

export function CertificateStatusBadge({ status, superseded = false }: Props) {
  const config =
    status === "revoked"
      ? { label: "Revoked", accent: "var(--color-rejected)" }
      : superseded
        ? { label: "Superseded", accent: "var(--color-text-secondary)" }
        : { label: "Active", accent: "var(--color-success)" };

  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-(family-name:--font-accent) font-medium whitespace-nowrap"
      style={{
        fontSize: "clamp(11px, 0.83vw, 14px)",
        padding: "2px 12px",
        color: config.accent,
        border: `1px solid ${config.accent}`,
        background: "white",
      }}
    >
      {config.label}
    </span>
  );
}
