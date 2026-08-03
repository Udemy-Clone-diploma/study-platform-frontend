import { api, type ApiError } from "@/shared/api/base";
import type {
  PaginatedUsers,
  TopTeacher,
  UserData,
  UserLanguage,
  UserNote,
  UserRole,
  UserStatus,
} from "../model/types";
import type { PublicUserProfile } from "../model/publicProfile";
import type { StaffUserProfile } from "../model/adminProfile";

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

export type GetUsersParams = {
  page?: number;
  pageSize?: number;
  role?: UserRole;
  status?: UserStatus;
  isBlocked?: boolean;
  isDeleted?: boolean;
  search?: string;
  ordering?: string;
};

export async function getUsers(params: GetUsersParams = {}): Promise<PaginatedUsers> {
  const { data } = await api.get<PaginatedUsers | UserData[]>("users/", {
    params: {
      page: params.page,
      page_size: params.pageSize,
      role: params.role,
      status: params.status,
      is_blocked: params.isBlocked,
      is_deleted: params.isDeleted,
      search: params.search,
      ordering: params.ordering,
    },
  });
  return Array.isArray(data)
    ? { count: data.length, next: null, previous: null, results: data }
    : data;
}

export async function getUserById(id: number): Promise<UserData> {
  const { data } = await api.get<UserData>(`users/${id}/`);
  return data;
}

export async function getPublicUserProfile(
  id: number,
  accessToken?: string,
): Promise<PublicUserProfile> {
  const { data } = await api.get<PublicUserProfile>(`users/${id}/public-profile/`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });
  return data;
}

export async function getAdminUserProfile(id: number): Promise<StaffUserProfile> {
  const { data } = await api.get<StaffUserProfile>(`users/${id}/admin-profile/`);
  return data;
}

export type CreateUserPayload = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  date_of_birth?: string;
  language?: UserLanguage;
};

export async function createUser(payload: CreateUserPayload): Promise<UserData> {
  const { data } = await api.post<UserData>("users/", payload);
  return data;
}

export type AdminUserUpdatePayload = {
  first_name?: string;
  last_name?: string;
  email?: string;
  avatar?: string | null;
  language?: UserLanguage;
  instagram?: string;
  linkedin?: string;
  facebook?: string;
  behance?: string;
  role?: UserRole;
};

export async function updateUser(id: number, patch: AdminUserUpdatePayload): Promise<UserData> {
  const { data } = await api.patch<UserData>(`users/${id}/`, patch);
  return data;
}

export async function deleteUser(id: number): Promise<void> {
  await api.delete(`users/${id}/`);
}

export async function setUserBlocked(id: number, isBlocked: boolean): Promise<UserData> {
  const { data } = await api.patch<UserData>(`users/${id}/block/`, { is_blocked: isBlocked });
  return data;
}

export async function restoreUser(id: number): Promise<UserData> {
  const { data } = await api.patch<UserData>(`users/${id}/restore/`);
  return data;
}

export async function resendVerificationEmail(email: string): Promise<void> {
  await api.post("auth/resend-verification/", { email });
}

export async function getUserNote(userId: number): Promise<UserNote | null> {
  try {
    const { data } = await api.get<UserNote>(`users/${userId}/note/`);
    return data;
  } catch (err) {
    if ((err as ApiError).status === 404) return null;
    throw err;
  }
}

export async function saveUserNote(userId: number, content: string): Promise<UserNote> {
  const { data } = await api.put<UserNote>(`users/${userId}/note/`, { content });
  return data;
}

export async function deleteUserNote(userId: number): Promise<void> {
  await api.delete(`users/${userId}/note/`);
}
