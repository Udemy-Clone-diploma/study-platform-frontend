export type CourseCohort = {
  duration_months: number;
  hours_per_week_min: number;
  hours_per_week_max: number;
  group_size: number | null;
  delivery_mode: "group" | "individual" | "both";
  start_date: string | null;
};
