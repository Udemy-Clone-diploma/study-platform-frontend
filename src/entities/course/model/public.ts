import type { Category } from "./category";
import type {
  DeliveryFormatPricing,
  DeliveryFormatType,
  DeliveryStartType,
  DeliveryUnlockMode,
} from "./delivery-format";
import type {
  CourseDeliveryType,
  CourseLanguage,
  CourseLevel,
  CourseMode,
  CourseType,
} from "./types";
import type { CourseTag } from "./tag";
import type { Teacher } from "./teacher";

export type PublicCourseListItem = {
  id: number;
  image: string | null;
  title: string;
  subtitle: string | null;
  short_description: string;
  slug: string;
  teacher_name: string;
  category: Category | null;
  level: CourseLevel;
  language: CourseLanguage;
  mode: CourseMode;
  delivery_type: CourseDeliveryType;
  course_type: CourseType;
  price: string | null;
  currency: DeliveryFormatPricing["currency"] | null;
  duration_hours: number | null;
  lessons_count: number;
  with_certificate: boolean;
  is_on_sale: boolean;
  rating_avg: string;
  rating_count: number;
  students_count: number;
  students_enrolled_last_30_days: number;
  published_at: string | null;
  created_at: string;
  tags: CourseTag[];
};

export type PublicCourseLesson = {
  id: number;
  title: string;
  order: number;
  duration_minutes: number | null;
  is_preview: boolean;
  unlock_after_days: number | null;
  requires_previous: boolean;
  is_mandatory: boolean;
};

export type PublicCourseModule = {
  id: number;
  title: string;
  description: string;
  order: number;
  lessons: PublicCourseLesson[];
};

export type PublicCourseDeliveryFormat = {
  id: number;
  format_type: DeliveryFormatType;
  start_type: DeliveryStartType | null;
  course_start_date: string | null;
  access_duration_days: number | null;
  start_date: string | null;
  enrollment_deadline: string | null;
  unlock_mode: DeliveryUnlockMode | null;
  max_students: number | null;
  enrolled_count: number;
  pricing: DeliveryFormatPricing | null;
};

export type PublicCourseCohort = {
  id: number;
  delivery_format: number | null;
  name: string | null;
  duration_months: number;
  hours_per_week: number;
  group_size: number | null;
  start_date: string | null;
  enrollment_deadline: string | null;
  is_enrollment_open: boolean;
  members_count: number;
};

export type PublicCourseDetail = {
  id: number;
  image: string | null;
  title: string;
  subtitle: string | null;
  short_description: string;
  full_description: string;
  slug: string;
  teacher: Teacher;
  category: Category | null;
  level: CourseLevel;
  language: CourseLanguage;
  mode: CourseMode;
  delivery_type: CourseDeliveryType;
  course_type: CourseType;
  duration_hours: number | null;
  lessons_count: number;
  total_duration_minutes: number;
  with_certificate: boolean;
  certificate_description: string;
  is_on_sale: boolean;
  passing_score: number;
  rating_avg: string;
  rating_count: number;
  students_count: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  tags: CourseTag[];
  modules: PublicCourseModule[];
  delivery_formats: PublicCourseDeliveryFormat[];
  cohorts: PublicCourseCohort[];
};

export type PublicCourseDetailView = PublicCourseDetail & {
  is_enrolled: boolean;
};

export type EnrolledCourseListItem = PublicCourseListItem & {
  enrolled_at: string | null;
  progress_percent: number;
};
