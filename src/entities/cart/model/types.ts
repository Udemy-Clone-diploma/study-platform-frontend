import type { CourseLevel, PricingPlan } from "@/entities/course";

export type CartCourse = {
  id: number;
  title: string;
  slug: string;
  image: string | null;
  level: CourseLevel;
  price: string;
  currency: PricingPlan["currency"] | null;
};

export type CartItem = {
  id: number;
  course_id: number;
  course: CartCourse;
  pricing_plan_id: number | null;
  pricing_plan_kind: PricingPlan["kind"] | null;
  installment_count: number | null;
  installment_amount: string | null;
  currency: PricingPlan["currency"] | null;
  unit_price: string;
  subtotal: string;
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
