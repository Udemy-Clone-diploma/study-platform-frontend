import { api } from "@/shared/api/base";
import type { LessonItem } from "../model/module";

const COURSES = "courses/";

function itemsBase(courseSlug: string, moduleId: number, lessonId: number) {
  return `${COURSES}${courseSlug}/modules/${moduleId}/lessons/${lessonId}/items/`;
}

export type LessonItemPayload = {
  item_type: "text" | "video" | "test";
  order?: number;
  content?: string;
  body_html?: string;
  video?: File | null;
  video_url?: string;
  duration_minutes?: number | null;
  test?: number | null;
};

function buildCreateBody(data: LessonItemPayload): FormData | Record<string, unknown> {
  if (!data.video) {
    const body: Record<string, unknown> = { item_type: data.item_type };
    if (data.order != null) body.order = data.order;
    if (data.content != null) body.content = data.content;
    if (data.body_html != null) body.body_html = data.body_html;
    if (data.video_url != null) body.video_url = data.video_url;
    if (data.duration_minutes != null) body.duration_minutes = data.duration_minutes;
    if (data.test != null) body.test = data.test;
    return body;
  }
  const fd = new FormData();
  fd.append("item_type", data.item_type);
  if (data.content) fd.append("content", data.content);
  fd.append("video", data.video);
  if (data.duration_minutes != null) fd.append("duration_minutes", String(data.duration_minutes));
  return fd;
}

function buildPatchBody(data: Partial<LessonItemPayload>): FormData | Record<string, unknown> {
  if (!data.video) {
    const body: Record<string, unknown> = {};
    if (data.item_type != null) body.item_type = data.item_type;
    if (data.order != null) body.order = data.order;
    if (data.content != null) body.content = data.content;
    if (data.body_html != null) body.body_html = data.body_html;
    if (data.video_url != null) body.video_url = data.video_url;
    if (data.duration_minutes != null) body.duration_minutes = data.duration_minutes;
    if (data.test != null) body.test = data.test;
    return body;
  }
  const fd = new FormData();
  fd.append("video", data.video);
  if (data.content) fd.append("content", data.content);
  if (data.duration_minutes != null) fd.append("duration_minutes", String(data.duration_minutes));
  return fd;
}

export async function createLessonItem(
  courseSlug: string,
  moduleId: number,
  lessonId: number,
  data: LessonItemPayload,
): Promise<LessonItem> {
  const { data: result } = await api.post<LessonItem>(itemsBase(courseSlug, moduleId, lessonId), buildCreateBody(data));
  return result;
}

export async function updateLessonItem(
  courseSlug: string,
  moduleId: number,
  lessonId: number,
  itemId: number,
  data: Partial<LessonItemPayload>,
): Promise<LessonItem> {
  const { data: result } = await api.patch<LessonItem>(
    `${itemsBase(courseSlug, moduleId, lessonId)}${itemId}/`,
    buildPatchBody(data),
  );
  return result;
}

export async function deleteLessonItem(
  courseSlug: string,
  moduleId: number,
  lessonId: number,
  itemId: number,
): Promise<void> {
  await api.delete(`${itemsBase(courseSlug, moduleId, lessonId)}${itemId}/`);
}
