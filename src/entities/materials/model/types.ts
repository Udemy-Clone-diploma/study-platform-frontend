export type MaterialDocument = {
  id: number;
  title: string;
  url: string | null;
};

export type MaterialLessonCard = {
  lesson_id: number;
  lesson_title: string;
  lesson_date: string;
  module_order: number;
  module_title: string;
  course_slug: string;
  course_title: string;
  materials: MaterialDocument[];
};
