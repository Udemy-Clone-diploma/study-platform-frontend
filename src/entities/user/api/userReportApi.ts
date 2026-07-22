import { api } from "@/shared/api/base";
import type {
  AdminUserReportAction,
  ModeratedUserReport,
  ModeratorUserReportAction,
  PaginatedUserReports,
  ReportUserPayload,
  UserReportActionPayload,
  UserReportListParams,
} from "../model/userReport";

type UnassignedReportListParams = Pick<
  UserReportListParams,
  "page" | "page_size" | "reason" | "search"
>;

function toQueryParams(params: UserReportListParams) {
  return {
    page: params.page,
    page_size: params.page_size,
    status: params.status,
    resolution: params.resolution,
    reason: params.reason,
    search: params.search || undefined,
  };
}

export async function reportUser(id: number, payload: ReportUserPayload): Promise<void> {
  await api.post(`users/${id}/report/`, payload);
}

export async function getUnassignedUserReports(
  params: UnassignedReportListParams = {},
): Promise<PaginatedUserReports> {
  const { data } = await api.get<PaginatedUserReports>("users/moderation/reports/unassigned/", {
    params: toQueryParams(params),
  });
  return data;
}

export async function getMyUserReports(
  params: UserReportListParams = {},
): Promise<PaginatedUserReports> {
  const { data } = await api.get<PaginatedUserReports>("users/moderation/reports/mine/", {
    params: toQueryParams(params),
  });
  return data;
}

export async function getEscalatedUserReports(
  params: UserReportListParams = {},
): Promise<PaginatedUserReports> {
  const { data } = await api.get<PaginatedUserReports>("users/moderation/reports/escalated/", {
    params: toQueryParams(params),
  });
  return data;
}

export async function getAllUserReports(
  params: UserReportListParams = {},
): Promise<PaginatedUserReports> {
  const { data } = await api.get<PaginatedUserReports>("users/moderation/reports/all/", {
    params: toQueryParams(params),
  });
  return data;
}

export async function claimUserReport(id: number): Promise<ModeratedUserReport> {
  const { data } = await api.post<ModeratedUserReport>(`users/moderation/reports/${id}/claim/`);
  return data;
}

export async function takeModeratorUserReportAction(
  id: number,
  payload: UserReportActionPayload<ModeratorUserReportAction>,
): Promise<ModeratedUserReport> {
  const { data } = await api.post<ModeratedUserReport>(
    `users/moderation/reports/${id}/moderator-action/`,
    payload,
  );
  return data;
}

export async function takeAdminUserReportAction(
  id: number,
  payload: UserReportActionPayload<AdminUserReportAction>,
): Promise<ModeratedUserReport> {
  const { data } = await api.post<ModeratedUserReport>(
    `users/moderation/reports/${id}/admin-action/`,
    payload,
  );
  return data;
}
