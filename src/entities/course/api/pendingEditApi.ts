import { api } from "@/shared/api/base";
import type { CoursePendingEdit } from "../model/pending-edit";

const base = (slug: string) => `courses/${slug}/pending-edit/`;

/** GET — load (or auto-create) the pending edit for a published course.
 *  Returns draft_course_slug — fetch that with getCourseBySlug() and use it as
 *  the target slug for normal course/module/lesson/etc. CRUD while editing. */
export async function getPendingEdit(slug: string): Promise<CoursePendingEdit> {
  const { data } = await api.get<CoursePendingEdit>(base(slug));
  return data;
}

/** POST .../submit/ — submit for moderation (editing locks). */
export async function submitPendingEdit(slug: string): Promise<CoursePendingEdit> {
  const { data } = await api.post<CoursePendingEdit>(`${base(slug)}submit/`);
  return data;
}

/** POST .../withdraw/ — pull back from moderation, keeps draft edits. */
export async function withdrawPendingEdit(slug: string): Promise<CoursePendingEdit> {
  const { data } = await api.post<CoursePendingEdit>(`${base(slug)}withdraw/`);
  return data;
}

/** DELETE — discard all pending changes (deletes the draft course too); published course stays untouched. */
export async function discardPendingEdit(slug: string): Promise<void> {
  await api.delete(base(slug));
}

/** POST .../approve/ — moderator merges the draft course onto the live course. */
export async function approvePendingEdit(slug: string): Promise<void> {
  await api.post(`${base(slug)}approve/`);
}

/** POST .../reject/ — moderator returns for revision with full review data. */
export async function rejectPendingEdit(
  slug: string,
  basicsFieldStatuses: Record<string, string> = {},
  basicsAction = "",
  basicsComment = "",
  contentItemStatuses: Record<string, string> = {},
  contentAction = "",
  contentComment = "",
  finalAction = "",
  finalComment = "",
): Promise<CoursePendingEdit> {
  const { data } = await api.post<CoursePendingEdit>(`${base(slug)}reject/`, {
    basics_field_statuses: basicsFieldStatuses,
    basics_action: basicsAction,
    basics_comment: basicsComment,
    content_item_statuses: contentItemStatuses,
    content_action: contentAction,
    content_comment: contentComment,
    final_action: finalAction,
    final_comment: finalComment,
  });
  return data;
}
