import { api } from "@/shared/api/base";
import type {
  HomeworkAssignment,
  HomeworkAssignmentInput,
  HomeworkAvailableRecipient,
  HomeworkAttachment,
  HomeworkSubmission,
} from "../model/types";

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

export async function getHomeworkRecipients(
  courseSlug: string,
): Promise<HomeworkAvailableRecipient[]> {
  const { data } = await api.get<HomeworkAvailableRecipient[]>(
    `courses/${courseSlug}/homework/recipients/`,
  );
  return data;
}

export async function publishHomeworkAssignment(
  courseSlug: string,
  assignmentId: number,
  enrollmentIds: number[],
): Promise<HomeworkAssignment> {
  const { data } = await api.post<HomeworkAssignment>(
    `courses/${courseSlug}/homework/${assignmentId}/publish/`,
    { enrollment_ids: enrollmentIds },
  );
  return data;
}

export async function uploadHomeworkAssignmentAttachment(
  courseSlug: string,
  assignmentId: number,
  file: File,
): Promise<HomeworkAttachment> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post<HomeworkAttachment>(
    `courses/${courseSlug}/homework/${assignmentId}/attachments/`,
    formData,
  );
  return data;
}

export async function getAssignedHomework(): Promise<HomeworkAssignment[]> {
  const { data } = await api.get<HomeworkAssignment[]>("homework/assigned/");
  return data;
}

export async function submitHomework(
  assignmentId: number,
  content: string,
): Promise<HomeworkSubmission> {
  const { data } = await api.post<HomeworkSubmission>(
    `homework/${assignmentId}/submission/`,
    { content },
  );
  return data;
}

export async function uploadHomeworkSubmissionAttachment(
  assignmentId: number,
  file: File,
): Promise<HomeworkSubmission> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post<HomeworkSubmission>(
    `homework/${assignmentId}/submission/attachments/`,
    formData,
  );
  return data;
}
