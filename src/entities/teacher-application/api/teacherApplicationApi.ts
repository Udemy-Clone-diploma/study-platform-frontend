import { api } from "@/shared/api/base";
import type {
  PaginatedTeacherApplications,
  SubmitTeacherApplicationPayload,
  TeacherApplication,
  TeacherApplicationStatus,
} from "../model/types";

export async function submitTeacherApplication(
  payload: SubmitTeacherApplicationPayload,
): Promise<TeacherApplication> {
  const { data } = await api.post<TeacherApplication>("teacher-applications/submit/", payload);
  return data;
}

export async function checkTeacherApplicationEmail(
  email: string,
): Promise<{ available: boolean; detail?: string }> {
  const { data } = await api.get<{ available: boolean; detail?: string }>(
    "teacher-applications/check-email/",
    { params: { email } },
  );
  return data;
}

export type GetTeacherApplicationsParams = {
  page?: number;
  pageSize?: number;
  status?: TeacherApplicationStatus;
  search?: string;
  ordering?: string;
};

export async function getTeacherApplications(
  params: GetTeacherApplicationsParams = {},
): Promise<PaginatedTeacherApplications> {
  const { data } = await api.get<PaginatedTeacherApplications | TeacherApplication[]>(
    "teacher-applications/",
    {
      params: {
        page: params.page,
        page_size: params.pageSize,
        status: params.status,
        search: params.search,
        ordering: params.ordering,
      },
    },
  );
  return Array.isArray(data)
    ? { count: data.length, next: null, previous: null, results: data }
    : data;
}

export async function approveTeacherApplication(
  id: number,
  comment = "",
): Promise<TeacherApplication> {
  const { data } = await api.post<TeacherApplication>(`teacher-applications/${id}/approve/`, {
    comment,
  });
  return data;
}

export async function cancelTeacherApplication(
  id: number,
  comment: string,
): Promise<TeacherApplication> {
  const { data } = await api.post<TeacherApplication>(`teacher-applications/${id}/cancel/`, {
    comment,
  });
  return data;
}
