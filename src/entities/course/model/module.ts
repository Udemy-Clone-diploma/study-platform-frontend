export type CourseLesson = {
  id: number;
  title: string;
  order: number;
  duration_minutes: number | null;
  content?: string;
  video_url?: string;
};

export type CourseModule = {
  id: number;
  title: string;
  description: string;
  order: number;
  lessons: CourseLesson[];
};
