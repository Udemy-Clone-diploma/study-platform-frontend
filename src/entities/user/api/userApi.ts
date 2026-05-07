import { api } from "@/shared/api/base";
import type { TopTeacher, UserData } from "../model/types";

export async function getMe(accessToken?: string): Promise<UserData> {
  const { data } = await api.get<UserData>("auth/me/", {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });
  return data;
}

export async function getTopTeachers(limit = 4): Promise<TopTeacher[]> {
  const { data } = await api.get<TopTeacher[]>("users/top-teachers/", {
    params: { limit },
  });
  return data;
}
