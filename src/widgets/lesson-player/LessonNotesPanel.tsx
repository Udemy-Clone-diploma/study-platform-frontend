"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { CourseLevel } from "@/entities/course";
import { readLessonNote, updateLessonNoteMetadata, writeLessonNote } from "@/features/learning";

type Props = {
  slug: string;
  lessonId: number;
  isMock?: boolean;
  courseTitle?: string;
  courseLevel?: CourseLevel;
  lessonTitle?: string;
  lessonOrder?: number | null;
};

/**
 * Per-lesson "Take a note" scratchpad. Real lessons persist through the notes
 * API; mock lessons and the dashboard index use the local cache in lessonNotes.
 */
export function LessonNotesPanel({
  slug,
  lessonId,
  isMock = false,
  courseTitle,
  courseLevel,
  lessonTitle,
  lessonOrder,
}: Props) {
  const t = useTranslations("LessonNotes");
  const ref = useRef<HTMLTextAreaElement>(null);
  const savedValueRef = useRef("");
  const [canSave, setCanSave] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    let cancelled = false;

    readLessonNote(slug, lessonId, { localOnly: isMock }).then((stored) => {
      if (cancelled) return;

      savedValueRef.current = stored;
      if (ref.current) ref.current.value = stored;
      if (stored.trim()) {
        updateLessonNoteMetadata(slug, lessonId, {
          courseTitle,
          courseLevel,
          lessonTitle,
          lessonOrder,
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [slug, lessonId, isMock, courseTitle, courseLevel, lessonTitle, lessonOrder]);

  const handleChange = () => {
    const text = ref.current?.value ?? "";
    setCanSave(
      text !== savedValueRef.current && (text.trim() !== "" || savedValueRef.current.trim() !== ""),
    );
    setStatus("idle");
  };

  const handleSave = async () => {
    if (!canSave) return;
    const text = ref.current?.value ?? "";

    setStatus("saving");
    try {
      await writeLessonNote(
        slug,
        lessonId,
        text,
        {
          courseTitle,
          courseLevel,
          lessonTitle,
          lessonOrder,
        },
        { localOnly: isMock },
      );
    } catch {
      setStatus("error");
      return;
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
        placeholder={t("placeholder")}
        aria-label={t("ariaLabel")}
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
          ? t("saving")
          : status === "error"
            ? t("tryAgain")
            : status === "saved"
              ? t("saved")
              : t("save")}
      </button>
    </aside>
  );
}
