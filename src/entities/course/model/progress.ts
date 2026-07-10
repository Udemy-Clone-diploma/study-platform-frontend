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
  /**
   * Informational test/homework stats — do NOT drive course completion,
   * which is based solely on `Course.passing_score` vs the lesson-completion
   * percentage above. `test_average`/`homework_average` are null until the
   * student has at least one graded test/homework respectively.
   */
  test_average: number | null;
  tests_passed: number;
  tests_failed: number;
  tests_skipped: number;
  tests_total: number;
  /**
   * Whether THIS student's enrollment is taught with a teacher (group or
   * individual delivery format) — a course can offer several delivery formats
   * at once, so this reflects the specific enrollment, not `Course.mode`.
   * Decides whether the homework block below should be shown at all.
   */
  is_with_teacher: boolean;
  /** Homework is only assigned on courses taught with a teacher (group/individual). */
  homework_average: number | null;
  homework_graded: number;
  homework_ungraded: number;
  homework_total: number;
  /**
   * Whether the "Complete course" action should be offered right now — reached
   * `Course.passing_score` on lesson completion AND finished every lesson
   * flagged `is_mandatory`. False once the course has already been completed.
   */
  can_complete_course: boolean;
  /** Whether a `CourseCompletion` record already exists for this enrollment. */
  is_course_completed: boolean;
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
