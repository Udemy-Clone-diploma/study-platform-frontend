import { api } from "@/shared/api/base";
import type { TestAnswerInput, TestAttemptListItem, TestAttemptResult } from "../model/attempt";

const COURSES = "courses/";

export async function submitTestAttempt(
  courseSlug: string,
  testId: number,
  answers: TestAnswerInput[],
): Promise<TestAttemptResult> {
  const { data } = await api.post<TestAttemptResult>(
    `${COURSES}${courseSlug}/tests/${testId}/attempts/`,
    { answers },
  );
  return data;
}

export async function getTestAttempts(
  courseSlug: string,
  testId: number,
): Promise<TestAttemptListItem[]> {
  const { data } = await api.get(`${COURSES}${courseSlug}/tests/${testId}/attempts/`);
  return Array.isArray(data) ? data : (data?.results ?? []);
}

export async function getTestAttempt(
  courseSlug: string,
  testId: number,
  attemptId: number,
): Promise<TestAttemptResult> {
  const { data } = await api.get<TestAttemptResult>(
    `${COURSES}${courseSlug}/tests/${testId}/attempts/${attemptId}/`,
  );
  return data;
}
