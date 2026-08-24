"use server";
import { cookies } from "next/headers";
import {
  AUTH_COOKIE_CONFIG,
  PUBLIC_COOKIE_OPTIONS,
  SECURE_COOKIE_OPTIONS,
} from "@/shared/api/config/authCookies";
import { getJwtMaxAge } from "@/shared/api/lib/jwt";

function persistentOptions<T extends Record<string, unknown>>(options: T, maxAge: number) {
  return { ...options, maxAge };
}

export async function setAuthCookies(
  accessToken: string,
  refreshToken: string,
  rememberMe: boolean,
): Promise<void> {
  if (!accessToken || !refreshToken) {
    throw new Error("Both access and refresh tokens are required");
  }

  const jar = await cookies();
  const accessMaxAge = getJwtMaxAge(accessToken);

  jar.set(AUTH_COOKIE_CONFIG.access.name, accessToken, {
    ...PUBLIC_COOKIE_OPTIONS,
    ...(accessMaxAge !== undefined ? { maxAge: accessMaxAge } : {}),
  });

  jar.set(AUTH_COOKIE_CONFIG.refresh.name, refreshToken, {
    ...(rememberMe
      ? persistentOptions(SECURE_COOKIE_OPTIONS, AUTH_COOKIE_CONFIG.refresh.maxAge)
      : SECURE_COOKIE_OPTIONS),
  });
}

export async function setRoleCookie(role: string, rememberMe: boolean): Promise<void> {
  const jar = await cookies();

  jar.set(AUTH_COOKIE_CONFIG.role.name, role, {
    ...(rememberMe
      ? persistentOptions(PUBLIC_COOKIE_OPTIONS, AUTH_COOKIE_CONFIG.role.maxAge)
      : PUBLIC_COOKIE_OPTIONS),
  });
}

export async function setRememberMeCookie(rememberMe: boolean): Promise<void> {
  const jar = await cookies();

  jar.set(AUTH_COOKIE_CONFIG.remember.name, rememberMe ? "true" : "false", {
    ...(rememberMe
      ? persistentOptions(PUBLIC_COOKIE_OPTIONS, AUTH_COOKIE_CONFIG.remember.maxAge)
      : PUBLIC_COOKIE_OPTIONS),
  });
}

export async function clearAuthCookies(): Promise<void> {
  const jar = await cookies();

  jar.delete(AUTH_COOKIE_CONFIG.access.name);
  jar.delete(AUTH_COOKIE_CONFIG.refresh.name);
  jar.delete(AUTH_COOKIE_CONFIG.role.name);
  jar.delete(AUTH_COOKIE_CONFIG.remember.name);
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
