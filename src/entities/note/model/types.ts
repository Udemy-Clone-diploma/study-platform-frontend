export type NoteCourseLevel = "beginner" | "intermediate" | "advanced";

export type NoteListItem = {
  id: number;
  content: string;
  updated_at: string;
  lesson_id: number | null;
  lesson_title: string;
  lesson_order: number | null;
  module_title: string;
  course_slug: string;
  course_title: string;
  course_level: NoteCourseLevel;
  is_course_completed: boolean;
};

export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};
