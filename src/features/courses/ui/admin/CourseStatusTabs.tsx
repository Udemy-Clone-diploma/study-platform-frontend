"use client";

import type { CourseStatus } from "@/entities/course";

export type CourseStatusTab =
  | "published"
  | "moderation"
  | "draft"
  | "hidden"
  | "rejected"
  | "archived"
  | null;

export const STATUS_TAB_VALUES: Record<Exclude<CourseStatusTab, null>, CourseStatus[]> = {
  published: ["published"],
  moderation: ["review", "needs_revision"],
  draft: ["draft"],
  hidden: ["hidden"],
  rejected: ["rejected"],
  archived: ["archived"],
};

const TABS: { label: string; value: CourseStatusTab }[] = [
  { label: "All Courses", value: null },
  { label: "Published", value: "published" },
  { label: "Under Moderation", value: "moderation" },
  { label: "Drafts", value: "draft" },
  { label: "Hidden", value: "hidden" },
  { label: "Rejected", value: "rejected" },
  { label: "Archived", value: "archived" },
];

type Props = {
  active: CourseStatusTab;
  onChange: (tab: CourseStatusTab) => void;
};

export function CourseStatusTabs({ active, onChange }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Filter courses by status"
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
