import type { CourseLevel } from "./types";

export type CourseCompletion = {
  id: number;
  course: number | null;
  title: string;
  teacher_name: string;
  level: CourseLevel;
  image_url: string | null;
  progress_percent: number;
  started_at: string;
  completed_at: string;
  final_score: string | null;
  certificate_url: string | null;
};
