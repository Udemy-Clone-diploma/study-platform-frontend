"use client";

import { useTranslations } from "next-intl";
import type { TeacherApplicationStatus } from "@/entities/teacher-application";

type Props = {
  active: TeacherApplicationStatus | null;
  onChange: (status: TeacherApplicationStatus | null) => void;
};

/** Status filter tabs for the teacher applications queue, styled like RoleTabs on the admin Users page. */
export function StatusTabs({ active, onChange }: Props) {
  const t = useTranslations("TeacherApplicationsAdmin");
  const tCommon = useTranslations("Common");
  const TABS: { label: string; value: TeacherApplicationStatus | null }[] = [
    { label: tCommon("all"), value: null },
    { label: t("statusPending"), value: "pending" },
    { label: t("statusApproved"), value: "approved" },
    { label: t("statusCancelled"), value: "cancelled" },
  ];
  return (
    <div
      role="tablist"
      aria-label={t("filterByStatusAriaLabel")}
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
          </button>
        );
      })}
    </div>
  );
}
