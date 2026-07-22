import { api } from "@/shared/api/base";
import type {
  GrowthData,
  GrowthPeriod,
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

export async function getGrowth(params: {
  course?: string;
  period: GrowthPeriod;
  studentId?: number;
}): Promise<GrowthData> {
  const { data } = await api.get<GrowthData>("homework/growth/", {
    params: {
      course: params.course,
      period: params.period,
      student_id: params.studentId,
    },
  });
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
  const { data } = await api.post<HomeworkSubmission>(`homework/${assignmentId}/submission/`, {
    content,
  });
  return data;
}

export async function reviewHomeworkSubmission(
  courseSlug: string,
  assignmentId: number,
  submissionId: number,
  body: { score: number | null; feedback: string },
): Promise<HomeworkSubmission> {
  const { data } = await api.patch<HomeworkSubmission>(
    `courses/${courseSlug}/homework/${assignmentId}/submissions/${submissionId}/`,
    body,
  );
  return data;
}

export async function retrieveHomeworkSubmission(
  courseSlug: string,
  assignmentId: number,
  submissionId: number,
): Promise<HomeworkSubmission> {
  const { data } = await api.post<HomeworkSubmission>(
    `courses/${courseSlug}/homework/${assignmentId}/submissions/${submissionId}/retrieve/`,
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
