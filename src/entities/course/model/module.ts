export type LessonDocument = {
  id: number;
  original_name: string;
  url: string;
  created_at: string;
};

export type QuestionType = "single_choice" | "multiple_choice" | "true_false" | "short_answer";

export type CourseQuestion = {
  id: number;
  question_type: string;
  text: string;
  options: string[];
  correct_indices?: number[] | null;
  exact_set_match?: boolean;
  correct_bool: boolean | null;
  sample_answer: string;
  accepted_answers?: string[] | null;
  order: number;
  /** Set only on a pending-edit draft course's questions: the live question this was cloned from. */
  source_question_id?: number | null;
};

export type CourseTest = {
  id: number;
  title: string;
  description: string;
  passing_score: number;
  order: number;
  questions: CourseQuestion[];
  duration_minutes?: number | null;
  allow_retakes?: boolean;
  max_attempts?: number | null;
  attempts_used?: number;
  can_attempt?: boolean;
  last_attempt?: {
    id: number;
    attempt_number: number;
    score: number;
    passed: boolean;
    submitted_at: string;
  } | null;
  /** Set only on a pending-edit draft course's tests: the live test this was cloned from. */
  source_test_id?: number | null;
};

export type LessonItemType = "text" | "video" | "test";

export type LessonItem = {
  id: number;
  item_type: LessonItemType;
  order: number;
  content?: string;
  body_html?: string | null;
  video_url?: string | null;
  original_video_name?: string;
  duration_minutes?: number | null;
  test?: CourseTest | null;
  created_at?: string;
  updated_at?: string;
  /** Set only on a pending-edit draft course's items: the live item this was cloned from. */
  source_lesson_item_id?: number | null;
};

export type CourseLesson = {
  id: number;
  title: string;
  order: number;
  duration_minutes: number | null;
  is_preview: boolean;
  min_score?: number | null;
  unlock_after_days?: number | null;
  requires_previous?: boolean;
  is_manually_locked?: boolean;
  documents?: LessonDocument[];
  items?: LessonItem[];
  /** Set only on a pending-edit draft course's lessons: the live lesson this was cloned from. */
  source_lesson_id?: number | null;
  /**
   * Live-class link on the lesson detail, exposed only to viewers with
   * enrollment access (backend gates it behind `has_enrollment_access`).
   * Absent on the list shape and for preview/non-enrolled viewers; null for
   * self-paced lessons.
   */
  meeting_url?: string | null;
};

export type CourseModule = {
  id: number;
  title: string;
  description: string;
  order: number;
  lessons: CourseLesson[];
  tests: CourseTest[];
  /** Set only on a pending-edit draft course's modules: the live module this was cloned from. */
  source_module_id?: number | null;
};
