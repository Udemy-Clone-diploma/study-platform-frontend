"use client";

import { useTranslations } from "next-intl";
import type { CertificateCounts, CertificateStatus } from "@/entities/certificate";

type Translator = (key: string, values?: Record<string, string | number>) => string;

export type CertificateStatusTab = CertificateStatus | null;

export const STATUS_TAB_VALUES: Record<CertificateStatus, CertificateStatus> = {
  valid: "valid",
  revoked: "revoked",
};

function getTabs(
  t: Translator,
): { label: string; value: CertificateStatusTab; countKey: keyof CertificateCounts }[] {
  return [
    { label: t("allCertificates"), value: null, countKey: "total" },
    { label: t("active"), value: "valid", countKey: "valid" },
    { label: t("revoked"), value: "revoked", countKey: "revoked" },
  ];
}

type Props = {
  active: CertificateStatusTab;
  onChange: (tab: CertificateStatusTab) => void;
  counts: CertificateCounts | null;
};

export function CertificateStatusTabs({ active, onChange, counts }: Props) {
  const t = useTranslations("CertificateStatusTabs");
  const TABS = getTabs(t);

  return (
    <div
      role="tablist"
      aria-label={t("ariaLabel")}
      className="flex flex-wrap items-center"
      style={{ gap: "clamp(16px, 2.22vw, 32px)" }}
    >
      {TABS.map((tab) => {
        const isActive = tab.value === active;
        return (
          <button
            key={tab.label}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.value)}
            className={`cursor-pointer border-b-2 pb-0.5 text-(--color-text-primary) transition ${
              isActive
                ? "border-(--color-blue) font-semibold"
                : "border-transparent font-normal hover:text-(--color-blue)"
            }`}
            style={{ fontFamily: "var(--font-base)", fontSize: "clamp(16px, 1.67vw, 24px)" }}
          >
            {tab.label}
            {counts && (
              <span className="text-(--color-text-secondary)"> ({counts[tab.countKey]})</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
