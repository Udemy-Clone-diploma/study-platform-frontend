import { api } from "@/shared/api/base";
import type { CourseTest } from "../model/module";

const COURSES = "courses/";

export type TestPayload = {
  title: string;
  description?: string;
  passing_score?: number;
  allow_retakes?: boolean;
  max_attempts?: number | null;
};

export async function createTest(
  courseSlug: string,
  moduleId: number,
  data: TestPayload,
): Promise<CourseTest> {
  const { data: result } = await api.post<CourseTest>(
    `${COURSES}${courseSlug}/modules/${moduleId}/tests/`,
    data,
  );
  return result;
}

export async function updateTest(
  courseSlug: string,
  moduleId: number,
  testId: number,
  data: Partial<TestPayload>,
): Promise<CourseTest> {
  const { data: result } = await api.patch<CourseTest>(
    `${COURSES}${courseSlug}/modules/${moduleId}/tests/${testId}/`,
    data,
  );
  return result;
}

export async function deleteTest(
  courseSlug: string,
  moduleId: number,
  testId: number,
): Promise<void> {
  await api.delete(`${COURSES}${courseSlug}/modules/${moduleId}/tests/${testId}/`);
}
