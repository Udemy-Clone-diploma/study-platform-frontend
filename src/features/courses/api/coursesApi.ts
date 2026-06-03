import type { Enrollment } from "@/entities/course";
import { api } from "@/shared/api/base";

const ENROLLMENTS_ENDPOINT = "enrollments/";

/**
 * Create an Enrollment via the CRUD endpoint. Returns the full Enrollment record.
 * Distinct from `enrollInCourse(slug)` in `entities/course/api/courseApi.ts` which
 * uses the convenience `/courses/<slug>/enroll/` endpoint and returns a status payload.
 */
export async function createEnrollment(courseId: number): Promise<Enrollment> {
  const { data } = await api.post<Enrollment>(ENROLLMENTS_ENDPOINT, { course_id: courseId });
  return data;
}
