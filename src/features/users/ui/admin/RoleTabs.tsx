"use client";

import type { UserRole } from "@/entities/user";

const TABS: { label: string; value: UserRole | null }[] = [
  { label: "All Users", value: null },
  { label: "Students", value: "student" },
  { label: "Teachers", value: "teacher" },
  { label: "Moderators", value: "moderator" },
  { label: "Administrators", value: "administrator" },
];

type Props = {
  active: UserRole | null;
  onChange: (role: UserRole | null) => void;
};

export function RoleTabs({ active, onChange }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Filter users by role"
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
