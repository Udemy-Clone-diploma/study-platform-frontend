"use client";

import type { TeacherApplicationStatus } from "@/entities/teacher-application";

const TABS: { label: string; value: TeacherApplicationStatus | null }[] = [
  { label: "All", value: null },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Cancelled", value: "cancelled" },
];

type Props = {
  active: TeacherApplicationStatus | null;
  onChange: (status: TeacherApplicationStatus | null) => void;
};

/** Status filter tabs for the teacher applications queue, styled like RoleTabs on the admin Users page. */
export function StatusTabs({ active, onChange }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Filter applications by status"
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
