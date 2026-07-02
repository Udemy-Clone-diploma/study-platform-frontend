export type PendingEditStatus = "draft" | "pending" | "needs_revision";

export type CoursePendingEdit = {
  status: PendingEditStatus;
  /** Slug of the hidden PENDING_EDIT shadow course the teacher actually edits —
   *  fetch it with getCourseBySlug() and use it as the target slug for every
   *  normal course/module/lesson/etc. CRUD call while in pending-edit mode. */
  draft_course_slug: string;
  moderator_comment: string;
  /** Course-level metadata fields that differ from the live course. */
  changed_fields: string[];
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
};
