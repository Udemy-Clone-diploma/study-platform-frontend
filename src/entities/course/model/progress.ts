/**
 * Per-student progress snapshot for a course. Drives the progress bar on the
 * course detail page, the resume CTA, completion ticks in the curriculum, and
 * the per-card progress on the student dashboard.
 *
 * Returned by `GET /courses/<slug>/progress/`. The endpoint is enrollment-gated
 * and returns 403 for users who are not enrolled in the course.
 */
export type CourseProgress = {
  enrollment_id: number;
  /** Denormalized counter kept in sync by the backend on completion writes. */
  lessons_completed_count: number;
  /** Mirror of `Course.lessons_count`, included so the client can render a percentage in one round-trip. */
  lessons_count: number;
  /** Sorted ascending. Used to render completion ticks in the curriculum sidebar. */
  completed_lesson_ids: number[];
  /**
   * Last lesson the student opened. Drives the "Continue learning" CTA on the
   * course detail page and the auto-redirect from `/learn/<slug>` to a lesson.
   * Null for enrolled students who haven't opened any lesson yet.
   */
  last_lesson_id: number | null;
  last_opened_at: string | null;
};

/**
 * Response shape for `POST /courses/<slug>/lessons/<id>/complete/` and
 * `DELETE /courses/<slug>/lessons/<id>/complete/`. The updated counter lets
 * the client refresh the progress bar without a follow-up GET.
 */
export type LessonCompletionResult = {
  lesson_id: number;
  completed_at: string | null;
  lessons_completed_count: number;
};
