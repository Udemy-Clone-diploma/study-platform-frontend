import type { CourseLevel } from "./types";

export type CourseCompletion = {
  id: number;
  course: number | null;
  slug?: string | null;
  title: string;
  teacher_name: string;
  level: CourseLevel;
  image_url: string | null;
  short_description?: string | null;
  category?: string | null;
  progress_percent: number;
  started_at: string;
  completed_at: string;
  final_score: string | null;
  certificate_url: string | null;
  certificate_thumbnail_url: string | null;
  paid_amount: string | null;
  paid_currency: string;
  purchased_at: string | null;
};
