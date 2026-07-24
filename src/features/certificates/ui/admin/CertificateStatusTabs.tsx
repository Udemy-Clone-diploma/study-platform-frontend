"use client";

import type { CertificateCounts, CertificateStatus } from "@/entities/certificate";

export type CertificateStatusTab = CertificateStatus | null;

export const STATUS_TAB_VALUES: Record<CertificateStatus, CertificateStatus> = {
  valid: "valid",
  revoked: "revoked",
};

const TABS: { label: string; value: CertificateStatusTab; countKey: keyof CertificateCounts }[] = [
  { label: "All Certificates", value: null, countKey: "total" },
  { label: "Active", value: "valid", countKey: "valid" },
  { label: "Revoked", value: "revoked", countKey: "revoked" },
];

type Props = {
  active: CertificateStatusTab;
  onChange: (tab: CertificateStatusTab) => void;
  counts: CertificateCounts | null;
};

export function CertificateStatusTabs({ active, onChange, counts }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Filter certificates by status"
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
