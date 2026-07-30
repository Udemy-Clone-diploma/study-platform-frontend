"use client";

import { useTranslations } from "next-intl";
import type { UserRole } from "@/entities/user";

type Props = {
  active: UserRole | null;
  onChange: (role: UserRole | null) => void;
};

export function RoleTabs({ active, onChange }: Props) {
  const t = useTranslations("RoleTabs");
  const TABS: { label: string; value: UserRole | null }[] = [
    { label: t("allUsers"), value: null },
    { label: t("students"), value: "student" },
    { label: t("teachers"), value: "teacher" },
    { label: t("moderators"), value: "moderator" },
    { label: t("administrators"), value: "administrator" },
  ];
  return (
    <div
      role="tablist"
      aria-label={t("filterByRoleAriaLabel")}
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
