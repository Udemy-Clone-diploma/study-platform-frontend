import { request } from "@/shared/api/base";
import {
  RegisterPayload,
  RegisterResponse,
} from "../model/types/registerTypes";

import {
  LoginPayload,
  LoginResponse,
  TokenRefreshResponse,
} from "../model/types/loginTypes";
import { UserData } from "../model/types/userData";
import { UserProfile } from "../model/types/profilesTypes";

export async function registerUser(
  payload: RegisterPayload,
): Promise<RegisterResponse> {
  return request<RegisterResponse>("auth/register/", {
    method: "POST",
    body: payload,
  });
}

export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  return request<LoginResponse>("auth/login/", {
    method: "POST",
    body: payload,
  });
}

export async function refreshToken(
  refresh: string,
): Promise<TokenRefreshResponse> {
  return request<TokenRefreshResponse>("auth/refresh/", {
    method: "POST",
    body: { refresh },
  });
}

export async function getMe(): Promise<UserData> {
  return request<UserData>("auth/me/", {
    method: "GET",
  });
}

export async function updateMe(data: Partial<UserData>): Promise<UserData> {
  return request<UserData>("auth/me/", {
    method: "PATCH",
    body: data,
  });
}

export async function updateMeProfile(data: UserProfile): Promise<UserData> {
  return request<UserData>("auth/me/profile/", {
    method: "PATCH",
    body: data,
  });
}

export async function verifyEmail(
  uidb64: string,
  token: string,
): Promise<{ detail: string }> {
  return request<{ detail: string }>(`auth/verify-email/${uidb64}/${token}/`, {
    method: "GET",
  });
}

export async function resendVerificationEmail(
  email: string,
): Promise<{ detail: string }> {
  return request<{ detail: string }>("auth/resend-verification/", {
    method: "POST",
    body: { email },
  });
}
