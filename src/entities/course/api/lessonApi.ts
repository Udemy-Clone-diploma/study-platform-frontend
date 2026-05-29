import { api } from "@/shared/api/base";
import type { CourseLesson, LessonDocument } from "../model/module";

const COURSES = "courses/";

export type LessonPayload = {
  title: string;
  content?: string;
  video?: File | null;
  duration_minutes?: number | null;
  min_score?: number | null;
};

function lessonBody(data: LessonPayload): FormData | Record<string, unknown> {
  if (!data.video) {
    return {
      title: data.title,
      content: data.content,
      duration_minutes: data.duration_minutes,
      min_score: data.min_score,
    } as Record<string, unknown>;
  }
  const fd = new FormData();
  fd.append("title", data.title);
  if (data.content != null) fd.append("content", data.content);
  fd.append("video", data.video);
  if (data.duration_minutes != null) fd.append("duration_minutes", String(data.duration_minutes));
  if (data.min_score != null) fd.append("min_score", String(data.min_score));
  return fd;
}

export async function createLesson(
  courseSlug: string,
  moduleId: number,
  data: LessonPayload,
): Promise<CourseLesson> {
  const { data: result } = await api.post<CourseLesson>(
    `${COURSES}${courseSlug}/modules/${moduleId}/lessons/`,
    lessonBody(data),
  );
  return result;
}

export async function updateLesson(
  courseSlug: string,
  moduleId: number,
  lessonId: number,
  data: LessonPayload,
): Promise<CourseLesson> {
  const { data: result } = await api.patch<CourseLesson>(
    `${COURSES}${courseSlug}/modules/${moduleId}/lessons/${lessonId}/`,
    lessonBody(data),
  );
  return result;
}

export async function deleteLesson(
  courseSlug: string,
  moduleId: number,
  lessonId: number,
): Promise<void> {
  await api.delete(`${COURSES}${courseSlug}/modules/${moduleId}/lessons/${lessonId}/`);
}

export async function uploadLessonDocument(
  courseSlug: string,
  moduleId: number,
  lessonId: number,
  file: File,
): Promise<LessonDocument> {
  const fd = new FormData();
  fd.append("file", file);
  const { data } = await api.post<LessonDocument>(
    `${COURSES}${courseSlug}/modules/${moduleId}/lessons/${lessonId}/documents/`,
    fd,
  );
  return data;
}

export async function deleteLessonDocument(
  courseSlug: string,
  moduleId: number,
  lessonId: number,
  docId: number,
): Promise<void> {
  await api.delete(
    `${COURSES}${courseSlug}/modules/${moduleId}/lessons/${lessonId}/documents/${docId}/`,
  );
}
