import type { Category } from "./category";
import type { CourseModule } from "./module";
import type { Teacher } from "./teacher";

export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type CourseLevel = "beginner" | "intermediate" | "advanced";
export type CourseLanguage = "english" | "ukrainian" | "spanish";
export type CourseMode = "self_learning" | "with_teacher";
export type CourseDeliveryType = "self_paced" | "scheduled" | "individual" | "group";
export type CourseType = "profession" | "qualification" | "knowledge";
export type CoursePricingType = "free" | "full_payment" | "installment";
export type CourseStatus = "draft" | "review" | "published" | "archived";

export type CourseTag = {
  id: number;
  name: string;
};

export type CourseListItem = {
  id: number;
  image: string | null;
  title: string;
  short_description: string;
  slug: string;
  teacher_name: string;
  category: Category | null;
  level: CourseLevel;
  language: CourseLanguage;
  mode: CourseMode;
  delivery_type: CourseDeliveryType;
  course_type: CourseType;
  pricing_type: CoursePricingType;
  price: string;
  duration_hours: number;
  lessons_count: number;
  with_certificate: boolean;
  is_on_sale: boolean;
  rating_avg: string;
  students_count: number;
  status: CourseStatus;
  published_at: string | null;
  tags: CourseTag[];
};

export type CourseDetail = Omit<CourseListItem, "teacher_name"> & {
  full_description: string;
  teacher: Teacher;
  moderator_id: number | null;
  installment_count: number | null;
  installment_amount: string | null;
  modules: CourseModule[];
  created_at: string;
  updated_at: string;
};
