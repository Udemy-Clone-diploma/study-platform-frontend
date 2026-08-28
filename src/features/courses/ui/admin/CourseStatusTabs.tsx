"use client";

import { useTranslations } from "next-intl";
import type { CourseStatus } from "@/entities/course";

type Translator = (key: string, values?: Record<string, string | number>) => string;

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

function getTabs(t: Translator, tCommon: Translator): { label: string; value: CourseStatusTab }[] {
  return [
    { label: tCommon("allCourses"), value: null },
    { label: t("published"), value: "published" },
    { label: t("underModeration"), value: "moderation" },
    { label: t("drafts"), value: "draft" },
    { label: t("hidden"), value: "hidden" },
    { label: t("rejected"), value: "rejected" },
    { label: t("archived"), value: "archived" },
  ];
}

type Props = {
  active: CourseStatusTab;
  onChange: (tab: CourseStatusTab) => void;
};

export function CourseStatusTabs({ active, onChange }: Props) {
  const t = useTranslations("CourseStatusTabs");
  const tCommon = useTranslations("Common");
  const TABS = getTabs(t, tCommon);

  return (
    <div
      role="tablist"
      aria-label={t("ariaLabel")}
      className="-mx-4 flex items-center overflow-x-auto px-4 [-ms-overflow-style:none] [scrollbar-width:none] lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden"
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
            className={`shrink-0 cursor-pointer whitespace-nowrap border-b-2 pb-0.5 text-(--color-text-primary) transition ${
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
