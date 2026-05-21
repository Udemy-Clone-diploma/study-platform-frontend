import type { Enrollment } from "@/entities/course";
import { api } from "@/shared/api/base";

const ENROLLMENTS_ENDPOINT = "enrollments/";

export async function enrollInCourse(courseId: number): Promise<Enrollment> {
  const { data } = await api.post<Enrollment>(ENROLLMENTS_ENDPOINT, { course_id: courseId });
  return data;
}
