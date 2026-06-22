export type CourseCohort = {
  id: number;
  /** ID of the linked CourseDeliveryFormat (format_type=group), or null for legacy cohorts. */
  delivery_format: number | null;
  duration_months: number;
  hours_per_week_min: number;
  hours_per_week_max: number;
  group_size: number | null;
  start_date: string | null;
  enrollment_deadline: string | null;
};
