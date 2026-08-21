import type { PricingPlan } from "@/entities/course";

export type TeacherOrderStatus = 
|"paid" 
| "unpaid" 
| "overdue"   
| "refunded"
| "partially_refunded";

export type TeacherOrderRow = {
  order_id: number;
  student_id: number;
  student_name: string;
  student_avatar: string | null;
  course_slug: string;
  course_title: string;
  cohort_id: number | null;
  cohort_name: string | null;
  payment_plan: string;
  status: TeacherOrderStatus;
  amount: string;
  currency: PricingPlan["currency"];
  date: string;
  due_date: string | null;
  has_receipt: boolean;
};

export type TeacherOrdersCourseOption = { slug: string; title: string };
export type TeacherOrdersCohortOption = { id: number; name: string };

export type TeacherOrdersData = {
  results: TeacherOrderRow[];
  courses: TeacherOrdersCourseOption[];
  cohorts: TeacherOrdersCohortOption[];
};
