import { api } from "@/shared/api/base";
import { RegisterPayload, RegisterResponse } from "@/features/auth/model/types/registerTypes";

import {
  LoginPayload,
  LoginResponse,
  TokenRefreshResponse,
} from "@/features/auth/model/types/loginTypes";
import { UserData } from "@/features/auth/model/types/userData";
import { UserProfile } from "@/features/auth/model/types/profilesTypes";

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

export async function getMe(accessToken?: string): Promise<UserData> {
  const { data } = await api.get<UserData>("auth/me/", {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });
  return data;
}

export async function updateMe(data: Partial<UserData>): Promise<UserData> {
  const response = await api.patch<UserData>("auth/me/", data);
  return response.data;
}

export async function updateMeProfile(data: UserProfile): Promise<UserData> {
  const response = await api.patch<UserData>("auth/me/profile/", data);
  return response.data;
}

export async function verifyEmail(uidb64: string, token: string): Promise<{ detail: string }> {
  const { data } = await api.get<{ detail: string }>(`auth/verify-email/${uidb64}/${token}/`);
  return data;
}

export async function resendVerificationEmail(email: string): Promise<{ detail: string }> {
  const { data } = await api.post<{ detail: string }>("auth/resend-verification/", { email });
  return data;
}
