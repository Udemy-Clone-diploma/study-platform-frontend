export type GrowthPeriod = "weekly" | "yearly";
export type GrowthPoint = { label: string; value: number };
export type GrowthCourseOption = { slug: string; title: string };

export type EnrollmentGrowthData = {
  total: number;
  points: GrowthPoint[];
  courses: GrowthCourseOption[];
};
