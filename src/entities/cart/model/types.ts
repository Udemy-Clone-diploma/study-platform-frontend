import type { CourseLevel, DeliveryFormatType, PricingPlan } from "@/entities/course";

export type CartCourse = {
  id: number;
  title: string;
  slug: string;
  image: string | null;
  level: CourseLevel;
  price: string;
  currency: PricingPlan["currency"] | null;
};

export type CartScheduleSlot = {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
};

export type CartCohort = {
  id: number;
  name: string | null;
  start_date: string | null;
};

export type CartItem = {
  id: number;
  course_id: number;
  course: CartCourse;
  pricing_plan_id: number | null;
  pricing_plan_kind: DeliveryFormatType | null;
  installment_count: number | null;
  installment_amount: string | null;
  currency: PricingPlan["currency"] | null;
  unit_price: string;
  /** Pre-discount unit price. Present only when the course's sale actually lowers this item's price. */
  original_unit_price: string | null;
  subtotal: string;
  schedule_slots: CartScheduleSlot[];
  cohort: CartCohort | null;
  added_at: string;
};

export type Cart = {
  id: number;
  student_profile_id: number;
  items: CartItem[];
  items_count: number;
  total_price: string;
  currency: PricingPlan["currency"] | null;
  created_at: string;
  updated_at: string;
};
