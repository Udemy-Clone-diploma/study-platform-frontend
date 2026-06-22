export type LessonDocument = {
  id: number;
  original_name: string;
  url: string;
  created_at: string;
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
};

export type CourseLesson = {
  id: number;
  title: string;
  order: number;
  duration_minutes: number | null;
  is_preview: boolean;
  min_score?: number | null;
  documents?: LessonDocument[];
  items?: LessonItem[];
};

export type CourseModule = {
  id: number;
  title: string;
  description: string;
  order: number;
  lessons: CourseLesson[];
  tests: CourseTest[];
};
