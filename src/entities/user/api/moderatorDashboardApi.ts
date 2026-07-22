import { api } from "@/shared/api/base";
import type { ModeratorDashboardData } from "../model/moderatorDashboard";

export async function getModeratorDashboard(): Promise<ModeratorDashboardData> {
  const { data } = await api.get<ModeratorDashboardData>("users/moderation/dashboard/");
  return data;
}

export async function getAdminModeratorDashboard(
  moderatorId: number,
): Promise<ModeratorDashboardData> {
  const { data } = await api.get<ModeratorDashboardData>(
    `users/moderation/moderators/${moderatorId}/dashboard/`,
  );
  return data;
}
