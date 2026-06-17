import type { ComponentType } from "react";
import { BookOpen, Video } from "lucide-react";

/**
 * A content part of a lesson, surfaced as a tab in the player's top panel.
 * Extensible: add `"test"` here and to `PART_META` to light up a quiz tab once
 * the grading backend exists. The player derives the visible parts from the
 * lesson's content blocks (video / text items), so no other call site changes.
 */
export type LessonContentPart = "video" | "reading";

/** Display labels for each content part; reused by the player's tab-advance CTA. */
export const PART_LABELS: Record<LessonContentPart, string> = {
  video: "Video",
  reading: "Reading",
};

const PART_META: Record<
  LessonContentPart,
  { label: string; Icon: ComponentType<{ className?: string }> }
> = {
  video: { label: PART_LABELS.video, Icon: Video },
  reading: { label: PART_LABELS.reading, Icon: BookOpen },
};

type Props = {
  parts: LessonContentPart[];
  active: LessonContentPart;
  onSelect: (part: LessonContentPart) => void;
};

/** Segmented control switching between a lesson's content parts (Figma 3113:14283). */
export function LessonContentTabs({ parts, active, onSelect }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Lesson content"
      className="flex w-full max-w-[1044px] items-stretch"
    >
      {parts.map((part, i) => {
        const { label, Icon } = PART_META[part];
        const isActive = part === active;
        return (
          <button
            key={part}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(part)}
            className={[
              "relative flex min-h-[74px] flex-1 flex-col items-center justify-center gap-1 px-4 py-2 text-(--color-text-primary) transition-colors",
              i === 0 && "rounded-l-[20px]",
              i === parts.length - 1 && "rounded-r-[20px]",
              isActive
                ? "z-10 border-x-[0.5px] border-t-[0.5px] border-b-2 border-(--color-blue) bg-white"
                : "border-[0.5px] border-(--color-text-primary) bg-white/60 hover:bg-white",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <Icon className="h-10 w-10" />
            <span className="font-(family-name:--font-base) text-sm font-medium">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
