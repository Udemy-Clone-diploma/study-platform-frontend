import { api } from "@/shared/api/base";
import type { HomeworkAssignment, HomeworkAssignmentInput } from "../model/types";

export async function getHomeworkAssignments(courseSlug: string): Promise<HomeworkAssignment[]> {
  const { data } = await api.get<HomeworkAssignment[]>(`courses/${courseSlug}/homework/`);
  return data;
}

export async function createHomeworkAssignment(
  courseSlug: string,
  body: HomeworkAssignmentInput,
): Promise<HomeworkAssignment> {
  const { data } = await api.post<HomeworkAssignment>(`courses/${courseSlug}/homework/`, body);
  return data;
}
