import { request } from "@/shared/api/base";
import { RegisterPayload, RegisterResponse } from "@/features/auth/model/types/registerTypes";

import {
  LoginPayload,
  LoginResponse,
  TokenRefreshResponse,
} from "@/features/auth/model/types/loginTypes";
import { UserData } from "@/features/auth/model/types/userData";
import { UserProfile } from "@/features/auth/model/types/profilesTypes";

import type {
  PasswordResetRequestPayload,
  PasswordResetConfirmPayload,
} from "@/features/auth/model/types/passwordResetTypes";
 

export async function registerUser(payload: RegisterPayload): Promise<RegisterResponse> {
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

export async function refreshToken(refresh: string): Promise<TokenRefreshResponse> {
  return request<TokenRefreshResponse>("auth/refresh/", {
    method: "POST",
    body: { refresh },
  });
}

export async function getMe(accessToken?: string): Promise<UserData> {
  return request<UserData>("auth/me/", {
    method: "GET",
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
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

export async function verifyEmail(uidb64: string, token: string): Promise<{ detail: string }> {
  return request<{ detail: string }>(`auth/verify-email/${uidb64}/${token}/`, {
    method: "GET",
  });
}

export async function resendVerificationEmail(email: string): Promise<{ detail: string }> {
  return request<{ detail: string }>("auth/resend-verification/", {
    method: "POST",
    body: { email },
  });
}



export async function requestPasswordReset(payload: PasswordResetRequestPayload): Promise<{ detail: string }> {
  return request<{ detail: string }>("auth/password-reset/", {
    method: "POST",
    body: payload,
  });
}
 

export async function validatePasswordResetToken(uidb64: string, token: string): Promise<{ valid: boolean }> {
  return request<{ valid: boolean }>(
    `auth/password-reset/${uidb64}/${token}/validate/`,
    { method: "GET" }
  );
}
 

export async function confirmPasswordReset(uidb64: string, token: string, payload: PasswordResetConfirmPayload
): Promise<{ detail: string }> {
  return request<{ detail: string }>(
    `auth/password-reset/${uidb64}/${token}/`,
    { method: "POST", body: payload }
  );
}