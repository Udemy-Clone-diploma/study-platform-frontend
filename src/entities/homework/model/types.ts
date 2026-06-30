import type { CourseTest } from "@/entities/course";
import type { TestAttemptResult } from "@/entities/course";

export type HomeworkAssignmentStatus = "draft" | "published" | "closed";

export type HomeworkAssignment = {
  id: number;
  course_id: number;
  course_slug: string;
  course_title: string;
  course_image: string | null;
  source_assignment: number | null;
  module: number | null;
  module_title: string | null;
  lesson: number | null;
  lesson_title: string | null;
  test: number | null;
  test_detail: CourseTest | null;
  title: string;
  description: string;
  due_at: string | null;
  max_score: number | null;
  status: HomeworkAssignmentStatus;
  published_at: string | null;
  closed_at: string | null;
  attachments: HomeworkAttachment[];
  recipients: HomeworkRecipient[];
  recipients_count: number;
  my_submission: HomeworkSubmission | null;
  teacher_submissions: HomeworkSubmission[];
  created_at: string;
  updated_at: string;
};

export type HomeworkAttachment = {
  id: number;
  original_name: string;
  url: string | null;
  created_at: string;
};

export type HomeworkRecipient = {
  id: number;
  enrollment_id: number;
  student_email: string;
  student_name: string;
  assigned_at: string;
};

export type HomeworkAvailableRecipient = {
  id: number;
  student_email: string;
  student_name: string;
  delivery_format_id: number | null;
  delivery_format_type: "self_paced" | "scheduled" | "individual" | "group" | null;
  cohort_ids: number[];
  cohort_names: string[];
};

export type HomeworkSubmission = {
  id: number;
  enrollment_id: number;
  student_email: string;
  student_name: string;
  content: string;
  attachments: HomeworkAttachment[];
  test_attempt: TestAttemptResult | null;
  status: "submitted" | "reviewed" | "retrieved";
  score: number | null;
  feedback: string;
  submitted_at: string;
  reviewed_at: string | null;
  updated_at: string;
};

export type HomeworkAssignmentInput = {
  source_assignment?: number | null;
  module?: number | null;
  lesson?: number | null;
  test?: number | null;
  title?: string;
  description?: string;
  due_at?: string;
  max_score?: number;
};
