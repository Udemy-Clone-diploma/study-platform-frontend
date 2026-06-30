/**
 * Per-lesson note persistence. One note per (user, lesson), pinned to the
 * lesson and scoped to the authenticated user server-side. The route follows
 * the existing lesson-scoped action convention (`/courses/<slug>/lessons/<id>/...`).
 * Backend contract: TASK in BACKEND_CHANGES.md.
 */
import { api } from "@/shared/api/base";

const notePath = (slug: string, lessonId: number) =>
  `courses/${slug}/lessons/${lessonId}/note/`;

export async function readLessonNote(slug: string, lessonId: number): Promise<string> {
  try {
    const { data } = await api.get<{ content: string }>(notePath(slug, lessonId));
    return data.content ?? "";
  } catch {
    // 404 (no note yet) or a transient failure: start from an empty scratchpad.
    return "";
  }
}

export async function writeLessonNote(slug: string, lessonId: number, text: string): Promise<void> {
  await api.put(notePath(slug, lessonId), { content: text });
}
