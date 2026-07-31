import type { CohortMember } from "./cohortGroup";

export type CourseCohort = {
  id: number;
  /** ID of the linked CourseDeliveryFormat (format_type=group), or null for legacy cohorts. */
  delivery_format: number | null;
  chat_id?: number | null;
  name: string | null;
  duration_months: number;
  hours_per_week: number;
  hours_per_week_min?: number;
  hours_per_week_max?: number;
  group_size: number | null;
  start_date: string | null;
  enrollment_deadline: string | null;
  is_enrollment_open: boolean;
  members_count: number;
  members: CohortMember[];
};
