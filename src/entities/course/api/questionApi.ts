import { api } from "@/shared/api/base";
import type { CourseQuestion } from "../model/module";

const COURSES = "courses/";

export type QuestionPayload = {
  question_type?: string;
  text: string;
  options?: string[];
  correct_index?: number | null;
  correct_bool?: boolean | null;
  sample_answer?: string;
};

export async function createQuestion(
  courseSlug: string,
  moduleId: number,
  testId: number,
  data: QuestionPayload,
): Promise<CourseQuestion> {
  const { data: result } = await api.post<CourseQuestion>(
    `${COURSES}${courseSlug}/modules/${moduleId}/tests/${testId}/questions/`,
    data,
  );
  return result;
}

export async function updateQuestion(
  courseSlug: string,
  moduleId: number,
  testId: number,
  questionId: number,
  data: Partial<QuestionPayload>,
): Promise<CourseQuestion> {
  const { data: result } = await api.patch<CourseQuestion>(
    `${COURSES}${courseSlug}/modules/${moduleId}/tests/${testId}/questions/${questionId}/`,
    data,
  );
  return result;
}

export async function deleteQuestion(
  courseSlug: string,
  moduleId: number,
  testId: number,
  questionId: number,
): Promise<void> {
  await api.delete(
    `${COURSES}${courseSlug}/modules/${moduleId}/tests/${testId}/questions/${questionId}/`,
  );
}
