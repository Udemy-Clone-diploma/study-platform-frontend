import { api } from "@/shared/api/base";
import type { CourseCompletion } from "../model/completion";
import type { CourseProgress, LessonCompletionResult } from "../model/progress";

const COURSES = "courses/";

/**
 * Fetch the authenticated student's progress for a course.
 * Backend returns 401 for anonymous users and 403 for non-enrolled users.
 */
export async function getCourseProgress(slug: string): Promise<CourseProgress> {
  const { data } = await api.get<CourseProgress>(`${COURSES}${slug}/progress/`);
  return data;
}

/**
 * Mark a lesson complete. Idempotent on the backend: a second POST returns the
 * same completion timestamp without incrementing the counter.
 */
export async function markLessonComplete(
  slug: string,
  lessonId: number,
): Promise<LessonCompletionResult> {
  const { data } = await api.post<LessonCompletionResult>(
    `${COURSES}${slug}/lessons/${lessonId}/complete/`,
  );
  return data;
}

/** Undo a completion. Returns the decremented counter. */
export async function unmarkLessonComplete(
  slug: string,
  lessonId: number,
): Promise<LessonCompletionResult> {
  const { data } = await api.delete<LessonCompletionResult>(
    `${COURSES}${slug}/lessons/${lessonId}/complete/`,
  );
  return data;
}

/**
 * Record that the student opened a lesson. Updates `last_lesson_id` and
 * `last_opened_at` on the enrollment so `/learn/<slug>` can resume here.
 * Fire-and-forget; the response body is irrelevant to the UI.
 */
export async function recordLessonOpened(slug: string, lessonId: number): Promise<void> {
  await api.post(`${COURSES}${slug}/lessons/${lessonId}/open/`);
}

/**
 * Complete the course: creates a `CourseCompletion` snapshot for the student's
 * enrollment. Only valid once `CourseProgress.can_complete_course` is true.
 */
export async function completeCourse(slug: string): Promise<CourseCompletion> {
  const { data } = await api.post<CourseCompletion>(`${COURSES}${slug}/complete/`);
  return data;
}
