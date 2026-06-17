import { api } from "@/shared/api/base";
import type { CourseLesson, LessonDocument } from "../model/module";

const COURSES = "courses/";

/** Full lesson payload. Preview lessons are public; locked lessons require enrollment. */
export async function getLessonDetail(
  courseSlug: string,
  lessonId: number,
): Promise<CourseLesson> {
  const { data } = await api.get<CourseLesson>(`${COURSES}${courseSlug}/lessons/${lessonId}/`);
  return data;
}

export type LessonPayload = {
  title: string;
  duration_minutes?: number | null;
  min_score?: number | null;
};

export async function createLesson(
  courseSlug: string,
  moduleId: number,
  data: LessonPayload,
): Promise<CourseLesson> {
  const { data: result } = await api.post<CourseLesson>(
    `${COURSES}${courseSlug}/modules/${moduleId}/lessons/`,
    data,
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
    data,
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
