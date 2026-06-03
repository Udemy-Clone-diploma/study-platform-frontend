export type LessonDocument = {
  id: number;
  original_name: string;
  url: string;
  created_at: string;
};

export type CourseLesson = {
  id: number;
  title: string;
  order: number;
  duration_minutes: number | null;
  is_preview: boolean;
  content?: string;
  video_url?: string;
  original_video_name?: string;
  min_score?: number | null;
  documents?: LessonDocument[];
};

export type CourseQuestion = {
  id: number;
  question_type: string;
  text: string;
  options: string[];
  correct_index: number | null;
  correct_bool: boolean | null;
  sample_answer: string;
  order: number;
};

export type CourseTest = {
  id: number;
  title: string;
  description: string;
  passing_score: number;
  order: number;
  questions: CourseQuestion[];
};

export type LessonContentType = "video" | "text";

/**
 * Full lesson payload returned by `GET /courses/<slug>/lessons/<id>/`.
 * The short shape used inside `CourseModule.lessons[]` is `CourseLesson`.
 */
export type LessonDetail = CourseLesson & {
  content_type: LessonContentType;
  video_url: string | null;
  body_html: string | null;
};

export type CourseModule = {
  id: number;
  title: string;
  description: string;
  order: number;
  lessons: CourseLesson[];
  tests: CourseTest[];
};
