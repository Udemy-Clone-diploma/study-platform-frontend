"use client";

import { useEffect, useRef, useState } from "react";
import { readLessonNote, writeLessonNote } from "@/features/learning";

type Props = { slug: string; lessonId: number; isMock?: boolean };

/**
 * Per-lesson "Take a note" scratchpad (Figma 3113:16283), persisted per user
 * via the notes API (see lessonNotes). The textarea is uncontrolled and filled
 * after mount so the SSR markup stays stable; mount one per lesson via `key`.
 * Mock/preview lessons have no server record, so persistence is skipped.
 */
export function LessonNotesPanel({ slug, lessonId, isMock = false }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  // The last persisted value; Save is enabled only when the text differs from it.
  const savedValueRef = useRef("");
  const [canSave, setCanSave] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // Load the note after mount (the server renders the textarea empty).
  // State defaults hold because the panel remounts per lesson (keyed by lessonId).
  useEffect(() => {
    if (isMock) return;
    let cancelled = false;
    readLessonNote(slug, lessonId).then((stored) => {
      if (cancelled) return;
      savedValueRef.current = stored;
      if (ref.current) ref.current.value = stored;
    });
    return () => {
      cancelled = true;
    };
  }, [slug, lessonId, isMock]);

  const handleChange = () => {
    const text = ref.current?.value ?? "";
    setCanSave(text.trim() !== "" && text !== savedValueRef.current);
    setStatus("idle");
  };

  const handleSave = async () => {
    if (!canSave) return;
    const text = ref.current?.value ?? "";
    if (!isMock) {
      setStatus("saving");
      try {
        await writeLessonNote(slug, lessonId, text);
      } catch {
        setStatus("error");
        return;
      }
    }
    savedValueRef.current = text;
    setCanSave(false);
    setStatus("saved");
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
        disabled={!canSave || status === "saving"}
        className={`mx-auto inline-flex h-[52px] min-w-[200px] items-center justify-center rounded-[28px] px-7 font-(family-name:--font-accent) text-xl font-medium uppercase transition-colors ${
          canSave
            ? "bg-(--color-text-primary) text-white hover:opacity-90"
            : "cursor-not-allowed bg-(--color-placeholder) text-(--color-text-secondary)"
        }`}
      >
        {status === "saving"
          ? "Saving..."
          : status === "error"
            ? "Try again"
            : status === "saved"
              ? "Saved"
              : "Save"}
      </button>
    </aside>
  );
}
