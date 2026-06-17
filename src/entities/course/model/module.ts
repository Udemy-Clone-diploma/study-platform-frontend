export type CourseLesson = {
  id: number;
  title: string;
  order: number;
  duration_minutes: number | null;
  is_preview: boolean;
  content?: string;
  /** Present only on the list shape (teacher edit). Detail shape uses `LessonDetail.video_url` which is `string | null`. */
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

export type LessonContentType = "video" | "text";

/**
 * Downloadable file attached to a lesson (slides, exercise, reference PDF, etc.).
 * Returned in `LessonDetail.attachments`.
 */
export type LessonAttachment = {
  id: number;
  name: string;
  url: string;
  size_bytes: number;
  mime_type: string;
};

/**
 * Full lesson payload returned by `GET /courses/<slug>/lessons/<id>/`.
 * The short shape used inside `CourseModule.lessons[]` is `CourseLesson`.
 * `video_url` is overridden via `Omit` to be `string | null` per backend
 * convention (the list shape uses `string | undefined`).
 */
export type LessonDetail = Omit<CourseLesson, "video_url"> & {
  content_type: LessonContentType;
  video_url: string | null;
  body_html: string | null;
  attachments: LessonAttachment[];
  /**
   * Live session URL for synchronous courses (Zoom, Google Meet, etc.).
   * Null for self-paced lessons. Backend returns it only to enrolled students.
   */
  meeting_url: string | null;
};

export type CourseModule = {
  id: number;
  title: string;
  description: string;
  order: number;
  lessons: CourseLesson[];
  tests: CourseTest[];
};
