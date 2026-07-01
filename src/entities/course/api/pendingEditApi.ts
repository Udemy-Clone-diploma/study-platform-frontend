import { api } from "@/shared/api/base";
import type { CoursePendingEdit, SnapshotModule } from "../model/pending-edit";

const base = (slug: string) => `courses/${slug}/pending-edit/`;

export type PendingEditMetadataPayload = Partial<
  Pick<
    CoursePendingEdit,
    | "title"
    | "subtitle"
    | "short_description"
    | "full_description"
    | "level"
    | "language"
    | "mode"
    | "delivery_type"
    | "course_type"
    | "duration_hours"
    | "with_certificate"
    | "is_on_sale"
    | "tag_ids"
  > & { category_id: number | null }
>;

/** GET — load (or auto-create) the pending edit for a published course. */
export async function getPendingEdit(slug: string): Promise<CoursePendingEdit> {
  const { data } = await api.get<CoursePendingEdit>(base(slug));
  return data;
}

/** PUT — create-or-update course metadata in the pending edit. */
export async function savePendingEditMetadata(
  slug: string,
  payload: PendingEditMetadataPayload,
): Promise<CoursePendingEdit> {
  const { data } = await api.put<CoursePendingEdit>(base(slug), payload);
  return data;
}

/** PUT with modules_snapshot — save the full modules tree. */
export async function savePendingEditModules(
  slug: string,
  modules: SnapshotModule[],
): Promise<CoursePendingEdit> {
  const { data } = await api.put<CoursePendingEdit>(base(slug), {
    modules_snapshot: toSnapshotPayload(modules),
  });
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

/** DELETE — discard all pending changes; published course stays untouched. */
export async function discardPendingEdit(slug: string): Promise<void> {
  await api.delete(base(slug));
}

/** POST .../approve/ — moderator applies changes to the live course. */
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

/** PUT image to the pending edit (multipart). Only call when the icon actually changed. */
export async function uploadPendingEditIcon(slug: string, iconSrc: string, iconName: string): Promise<void> {
  try {
    const res = await fetch(iconSrc);
    if (!res.ok) return;
    const blob = await res.blob();
    const extension = iconSrc.split(".").pop() || "png";
    const formData = new FormData();
    formData.append("image", new File([blob], `${iconName}-pic.${extension}`, { type: blob.type }));
    await api.put<CoursePendingEdit>(base(slug), formData);
  } catch { /* best-effort */ }
}

/**
 * Convert frontend module list to backend snapshot format.
 * Temporary negative IDs (used for newly added items) become null so the backend
 * knows to create new records on approval.
 */
export function toSnapshotPayload(modules: SnapshotModule[]): SnapshotModule[] {
  return modules.map((mod) => ({
    ...mod,
    id: mod.id !== null && mod.id > 0 ? mod.id : null,
    lessons: mod.lessons.map((l) => ({
      ...l,
      id: l.id !== null && l.id > 0 ? l.id : null,
    })),
    tests: mod.tests.map((t) => ({
      ...t,
      id: t.id !== null && t.id > 0 ? t.id : null,
      questions: t.questions.map((q) => ({
        ...q,
        id: q.id !== null && q.id > 0 ? q.id : null,
      })),
    })),
  }));
}

/** Generate a temporary negative ID for newly created snapshot items. */
let _tempIdCounter = -1;
export function nextTempId(): number {
  return _tempIdCounter--;
}