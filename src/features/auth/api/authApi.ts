import { api } from "@/shared/api/base";
import { RegisterPayload, RegisterResponse } from "@/features/auth/model/types/registerTypes";

import {
  LoginPayload,
  LoginResponse,
  TokenRefreshResponse,
} from "@/features/auth/model/types/loginTypes";
import type { StudentProfile, TeacherProfile, ModeratorProfile, UserData } from "@/entities/user";

import type {
  PasswordResetRequestPayload,
  PasswordResetConfirmPayload,
} from "@/features/auth/model/types/passwordResetTypes";

export async function registerUser(payload: RegisterPayload): Promise<RegisterResponse> {
  const { data } = await api.post<RegisterResponse>("auth/register/", payload);
  return data;
}

export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("auth/login/", payload);
  return data;
}

export async function logoutUser(refresh: string): Promise<{ detail: string }> {
  const { data } = await api.post<{ detail: string }>("auth/logout/", { refresh });
  return data;
}

export async function refreshToken(refresh: string): Promise<TokenRefreshResponse> {
  const { data } = await api.post<TokenRefreshResponse>("auth/refresh/", { refresh });
  return data;
}

export async function updateMe(data: Partial<UserData>): Promise<UserData> {
  const response = await api.patch<UserData>("auth/me/", data);
  return response.data;
}

export async function updateTeacherProfile(data: Partial<TeacherProfile>): Promise<TeacherProfile> {
  const response = await api.patch<TeacherProfile>("auth/me/profile/teacher/", data);
  return response.data;
}

export async function updateStudentProfile(data: Partial<StudentProfile>): Promise<StudentProfile> {
  const response = await api.patch<StudentProfile>("auth/me/profile/student/", data);
  return response.data;
}

export async function updateModeratorProfile(
  data: Partial<ModeratorProfile>,
): Promise<ModeratorProfile> {
  const response = await api.patch<ModeratorProfile>("auth/me/profile/moderator/", data);
  return response.data;
}

export async function uploadAvatar(file: File): Promise<UserData> {
  const form = new FormData();
  form.append("avatar", file);
  const response = await api.patch<UserData>("auth/me/", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function changePassword(payload: { old_password: string; new_password: string }): Promise<void> {
  await api.post("auth/change-password/", payload);
}

export async function verifyEmail(uidb64: string, token: string): Promise<{ detail: string }> {
  const { data } = await api.get<{ detail: string }>(`auth/verify-email/${uidb64}/${token}/`);
  return data;
}

export async function resendVerificationEmail(email: string): Promise<{ detail: string }> {
  const { data } = await api.post<{ detail: string }>("auth/resend-verification/", { email });
  return data;
}

export async function requestPasswordReset(
  payload: PasswordResetRequestPayload,
): Promise<{ detail: string }> {
  const { data } = await api.post<{ detail: string }>("auth/password-reset/", payload);
  return data;
}

export async function validatePasswordResetToken(
  uidb64: string,
  token: string,
): Promise<{ valid: boolean }> {
  const { data } = await api.get<{ valid: boolean }>(
    `auth/password-reset/${uidb64}/${token}/validate/`,
  );
  return data;
}

export async function confirmPasswordReset(
  uidb64: string,
  token: string,
  payload: PasswordResetConfirmPayload,
): Promise<{ detail: string }> {
  const { data } = await api.post<{ detail: string }>(
    `auth/password-reset/${uidb64}/${token}/`,
    payload,
  );
  return data;
}
