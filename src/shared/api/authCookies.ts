"use server";
import { cookies } from "next/headers";
import {
  AUTH_COOKIE_CONFIG,
  PUBLIC_COOKIE_OPTIONS,
  SECURE_COOKIE_OPTIONS,
} from "@/shared/api/config/authCookies";

export async function setAuthCookies(accessToken: string, refreshToken: string): Promise<void> {
  if (!accessToken || !refreshToken) {
    throw new Error("Both access and refresh tokens are required");
  }

  const jar = await cookies();

  jar.set(AUTH_COOKIE_CONFIG.access.name, accessToken, {
    ...PUBLIC_COOKIE_OPTIONS,
    maxAge: AUTH_COOKIE_CONFIG.access.maxAge,
  });

  jar.set(AUTH_COOKIE_CONFIG.refresh.name, refreshToken, {
    ...SECURE_COOKIE_OPTIONS,
    maxAge: AUTH_COOKIE_CONFIG.refresh.maxAge,
  });
}

export async function setRoleCookie(role: string): Promise<void> {
  const jar = await cookies();

  jar.set(AUTH_COOKIE_CONFIG.role.name, role, {
    ...PUBLIC_COOKIE_OPTIONS,
    maxAge: AUTH_COOKIE_CONFIG.role.maxAge,
  });
}

export async function clearAuthCookies(): Promise<void> {
  const jar = await cookies();

  jar.delete(AUTH_COOKIE_CONFIG.access.name);
  jar.delete(AUTH_COOKIE_CONFIG.refresh.name);
  jar.delete(AUTH_COOKIE_CONFIG.role.name);
}

export async function getAccessToken(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(AUTH_COOKIE_CONFIG.access.name)?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(AUTH_COOKIE_CONFIG.refresh.name)?.value;
}

export async function getUserRoleCookie(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(AUTH_COOKIE_CONFIG.role.name)?.value;
}
