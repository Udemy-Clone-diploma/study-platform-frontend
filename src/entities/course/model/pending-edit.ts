import type { CourseModule } from "./module";
import type { CourseDeliveryType, CourseLanguage, CourseLevel, CourseMode, CourseType } from "./types";

export type PendingEditStatus = "draft" | "pending" | "needs_revision";

export type CoursePendingEdit = {
  status: PendingEditStatus;
  title: string;
  subtitle: string | null;
  short_description: string;
  full_description: string;
  image: string | null;
  level: CourseLevel;
  language: CourseLanguage;
  mode: CourseMode;
  delivery_type: CourseDeliveryType;
  course_type: CourseType;
  duration_hours: number;
  with_certificate: boolean;
  is_on_sale: boolean;
  category_id: number | null;
  tag_ids: number[];
  /** Full modules/lessons/tests snapshot. IDs are null for items added in this draft. */
  modules_snapshot: SnapshotModule[];
  moderator_comment: string;
  /** Fields that differ from the live course — used by the moderator review page. */
  changed_fields: string[];
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
};

/** Module entry in the pending edit snapshot. id is null for newly added modules. */
export type SnapshotModule = Omit<CourseModule, "id" | "lessons" | "tests"> & {
  id: number | null;
  lessons: SnapshotLesson[];
  tests: SnapshotTest[];
};

export type SnapshotLesson = {
  id: number | null;
  title: string;
  duration_minutes: number | null;
  min_score: number | null;
  is_preview: boolean;
  order: number;
  /** Content blocks at the time the snapshot was saved. Used to detect item changes during moderation. */
  items_snapshot?: Array<{ id: number; item_type: string; content: string; video_url: string | null }>;
};

export type SnapshotTest = {
  id: number | null;
  title: string;
  description: string;
  passing_score: number;
  order: number;
  allow_retakes?: boolean;
  max_attempts?: number | null;
  questions: SnapshotQuestion[];
};

export type SnapshotQuestion = {
  id: number | null;
  question_type: "single_choice" | "multiple_choice" | "true_false" | "short_answer";
  text: string;
  options: string[];
  correct_indices: number[] | null;
  exact_set_match?: boolean;
  correct_bool: boolean | null;
  sample_answer: string;
  accepted_answers?: string[] | null;
  order: number;
};
