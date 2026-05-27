export type CourseLesson = {
  id: number;
  title: string;
  order: number;
  duration_minutes: number | null;
  is_preview: boolean;
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
};
