"use client";

import { useTranslations } from "next-intl";
import type { CertificateStatus } from "@/entities/certificate";

type Translator = (key: string, values?: Record<string, string | number>) => string;

type Props = {
  status: CertificateStatus;
  superseded?: boolean;
};

function statusConfig(
  status: CertificateStatus,
  superseded: boolean,
  t: Translator,
): { label: string; accent: string } {
  if (status === "revoked") return { label: t("statusRevoked"), accent: "var(--color-rejected)" };
  if (superseded) return { label: t("statusSuperseded"), accent: "var(--color-text-secondary)" };
  return { label: t("statusActive"), accent: "var(--color-success)" };
}

export function CertificateStatusBadge({ status, superseded = false }: Props) {
  const t = useTranslations("CertificateStatusBadge");
  const config = statusConfig(status, superseded, t);

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
