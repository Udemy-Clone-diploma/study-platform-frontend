/**
 * Per-lesson note persistence. There is no notes backend yet, so the lesson
 * player's "Take a note" panel stores text in localStorage keyed by course and
 * lesson. Swap these two functions for an API client when the backend lands.
 */
const key = (slug: string, lessonId: number) => `nexo:lesson-note:${slug}:${lessonId}`;

export function readLessonNote(slug: string, lessonId: number): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(key(slug, lessonId)) ?? "";
  } catch {
    return "";
  }
}

export function writeLessonNote(slug: string, lessonId: number, text: string): void {
  if (typeof window === "undefined") return;
  try {
    if (text.trim()) window.localStorage.setItem(key(slug, lessonId), text);
    else window.localStorage.removeItem(key(slug, lessonId));
  } catch {
    /* ignore storage failures */
  }
}
