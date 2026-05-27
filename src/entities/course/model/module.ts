export type CourseLesson = {
  id: number;
  title: string;
  order: number;
  duration_minutes: number | null;
  content?: string;
  video_url?: string;
  min_score?: number | null;
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

export type CourseModule = {
  id: number;
  title: string;
  description: string;
  order: number;
  lessons: CourseLesson[];
  tests: CourseTest[];
};
