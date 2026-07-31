import type { ComponentType } from "react";
import { useTranslations } from "next-intl";
import { BookOpen, ListChecks, Video } from "lucide-react";
import type { LessonItem, LessonItemType } from "@/entities/course";
import { byOrder } from "@/entities/course";

/** One renderable block of a lesson, surfaced as a single tab in the player. */
export type LessonTab = {
  /** The lesson item's id; identifies the active tab. */
  id: number;
  itemType: LessonItemType;
  label: string;
};

const ITEM_ICON: Record<LessonItemType, ComponentType<{ className?: string }>> = {
  video: Video,
  text: BookOpen,
  test: ListChecks,
};

/** Whether a lesson item has something to render (and therefore earns a tab). */
function isRenderable(item: LessonItem): boolean {
  if (item.item_type === "video") return !!item.video_url;
  if (item.item_type === "text") return !!item.body_html;
  return !!item.test;
}

/**
 * Build one tab per renderable lesson item, in `order`. Same-type blocks get a
 * 1-based suffix ("Video 1", "Video 2") so they're distinguishable; a lone block
 * of a type stays unnumbered ("Reading", "Test").
 */
export function buildLessonTabs(
  items: LessonItem[],
  itemLabels: Record<LessonItemType, string>,
): LessonTab[] {
  const ordered = byOrder(items).filter(isRenderable);
  const totals = ordered.reduce<Record<string, number>>((acc, item) => {
    acc[item.item_type] = (acc[item.item_type] ?? 0) + 1;
    return acc;
  }, {});
  const seen: Record<string, number> = {};
  return ordered.map((item) => {
    const n = (seen[item.item_type] = (seen[item.item_type] ?? 0) + 1);
    const label = itemLabels[item.item_type];
    return {
      id: item.id,
      itemType: item.item_type,
      label: totals[item.item_type] > 1 ? `${label} ${n}` : label,
    };
  });
}

type Props = {
  tabs: LessonTab[];
  activeId: number;
  onSelect: (id: number) => void;
};

/** Segmented control: one tab per lesson content block, in order (Figma 3113:14283). */
export function LessonContentTabs({ tabs, activeId, onSelect }: Props) {
  const t = useTranslations("LessonContentTabs");
  return (
    <div
      role="tablist"
      aria-label={t("ariaLabel")}
      className="flex w-full max-w-[1044px] items-stretch"
    >
      {tabs.map((tab, i) => {
        const Icon = ITEM_ICON[tab.itemType];
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(tab.id)}
            className={[
              "relative flex min-h-[74px] flex-1 flex-col items-center justify-center gap-1 px-4 py-2 text-(--color-text-primary) transition-colors",
              i === 0 && "rounded-l-[20px]",
              i === tabs.length - 1 && "rounded-r-[20px]",
              isActive
                ? "z-10 border-x-[0.5px] border-t-[0.5px] border-b-2 border-(--color-blue) bg-white"
                : "border-[0.5px] border-(--color-text-primary) bg-white/60 hover:bg-white",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <Icon className="h-10 w-10" />
            <span className="font-(family-name:--font-base) text-sm font-medium">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
