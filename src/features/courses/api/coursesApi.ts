import type { Enrollment } from "@/entities/course";
import { api } from "@/shared/api/base";

const COURSES_ENDPOINT = "courses/";

/**
 * Create an enrollment only when the course has a zero-price plan.
 */
export async function createFreeEnrollment(slug: string): Promise<Enrollment> {
  const { data } = await api.post<Enrollment>(`${COURSES_ENDPOINT}${slug}/enroll-free/`);
  return data;
}
