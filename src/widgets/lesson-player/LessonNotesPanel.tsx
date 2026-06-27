"use client";

import { useEffect, useRef, useState } from "react";
import { readLessonNote, writeLessonNote } from "@/features/learning";

type Props = { slug: string; lessonId: number };

/**
 * Per-lesson "Take a note" scratchpad (Figma 3113:16283), persisted to
 * localStorage (see lessonNotes). The textarea is uncontrolled and filled from
 * storage after mount so the SSR markup stays stable; mount one per lesson via
 * `key`.
 */
export function LessonNotesPanel({ slug, lessonId }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  // The last persisted value; Save is enabled only when the text differs from it.
  const savedValueRef = useRef("");
  const [canSave, setCanSave] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  // Fill the textarea from storage after mount (the server renders it empty).
  // State defaults hold because the panel remounts per lesson (keyed by lessonId).
  useEffect(() => {
    const stored = readLessonNote(slug, lessonId);
    savedValueRef.current = stored;
    if (ref.current) ref.current.value = stored;
  }, [slug, lessonId]);

  const handleChange = () => {
    const text = ref.current?.value ?? "";
    setCanSave(text.trim() !== "" && text !== savedValueRef.current);
    setJustSaved(false);
  };

  const handleSave = () => {
    if (!canSave) return;
    const text = ref.current?.value ?? "";
    writeLessonNote(slug, lessonId, text);
    savedValueRef.current = text;
    setCanSave(false);
    setJustSaved(true);
  };

  return (
    <aside className="flex min-h-[300px] flex-col gap-2.5 rounded-[20px] bg-white p-5 shadow-[0_0_11.45px_var(--shadow-yellow)] lg:min-h-0">
      <textarea
        ref={ref}
        defaultValue=""
        onChange={handleChange}
        placeholder="Take a note"
        aria-label="Lesson note"
        className="flex-1 resize-none bg-transparent font-(family-name:--font-base) text-base leading-normal text-(--color-text-primary) placeholder:text-(--color-draft) focus:outline-none"
      />
      <button
        type="button"
        onClick={handleSave}
        disabled={!canSave}
        className={`mx-auto inline-flex h-[52px] min-w-[200px] items-center justify-center rounded-[28px] px-7 font-(family-name:--font-accent) text-xl font-medium uppercase transition-colors ${
          canSave
            ? "bg-(--color-text-primary) text-white hover:opacity-90"
            : "cursor-not-allowed bg-(--color-placeholder) text-(--color-text-secondary)"
        }`}
      >
        {justSaved ? "Saved" : "Save"}
      </button>
    </aside>
  );
}
