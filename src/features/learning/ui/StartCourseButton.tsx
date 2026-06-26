import { AccentButton } from "@/shared/ui/AccentButton";

type Props = {
  slug: string;
  /** The lesson id to open. Computed by the parent from progress (last opened) or fallback (first by order). */
  lessonId: number | null;
  /** "Start the course" before any progress exists, "Continue learning" after. */
  hasProgress?: boolean;
};

/**
 * "Start the course" / "Continue learning" CTA used by the lesson player home.
 * The parent computes the target lesson id so a stale-progress fetch never
 * stalls the click. When no lessons exist, the button renders disabled.
 */
export function StartCourseButton({ slug, lessonId, hasProgress = false }: Props) {
  if (lessonId == null) {
    return (
      <AccentButton size="md" style={{ width: 200, minWidth: 200, height: 52 }} disabled>
        Start the course
      </AccentButton>
    );
  }
  return (
    <AccentButton
      size="md"
      style={{ minWidth: 240, height: 52, padding: "0 32px", whiteSpace: "nowrap" }}
      href={`/learn/${slug}/${lessonId}`}
    >
      {hasProgress ? "Continue learning" : "Start the course"}
    </AccentButton>
  );
}
