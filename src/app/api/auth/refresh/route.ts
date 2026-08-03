import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_CONFIG,
  PUBLIC_COOKIE_OPTIONS,
  SECURE_COOKIE_OPTIONS,
} from "@/shared/api/config/authCookies";
import { API_BASE_URL } from "@/shared/api/config/baseUrl";
import { decodeJwtPayload, getJwtMaxAge } from "@/shared/api/lib/jwt";
import type { TokenRefreshResponse } from "@/features/auth/model/types/loginTypes";

function refreshEndpoint(request: NextRequest): string {
  const base = API_BASE_URL.startsWith("http")
    ? API_BASE_URL
    : new URL(API_BASE_URL, request.nextUrl.origin).toString();

  return new URL("auth/refresh/", base).toString();
}

function persistentOptions<T extends Record<string, unknown>>(options: T, maxAge: number) {
  return { ...options, maxAge };
}

function clearSession(response: NextResponse) {
  response.cookies.delete(AUTH_COOKIE_CONFIG.access.name);
  response.cookies.delete(AUTH_COOKIE_CONFIG.refresh.name);
  response.cookies.delete(AUTH_COOKIE_CONFIG.role.name);
  response.cookies.delete(AUTH_COOKIE_CONFIG.remember.name);
}

function setSessionCookies(
  response: NextResponse,
  {
    access,
    refresh,
    rememberMe,
    fallbackRole,
  }: {
    access: string;
    refresh: string;
    rememberMe: boolean;
    fallbackRole?: string;
  },
) {
  const accessMaxAge = getJwtMaxAge(access);
  const role = decodeJwtPayload(access)?.role ?? fallbackRole;

  response.cookies.set(AUTH_COOKIE_CONFIG.access.name, access, {
    ...PUBLIC_COOKIE_OPTIONS,
    ...(accessMaxAge !== undefined ? { maxAge: accessMaxAge } : {}),
  });

  response.cookies.set(AUTH_COOKIE_CONFIG.refresh.name, refresh, {
    ...(rememberMe
      ? persistentOptions(SECURE_COOKIE_OPTIONS, AUTH_COOKIE_CONFIG.refresh.maxAge)
      : SECURE_COOKIE_OPTIONS),
  });

  if (role) {
    response.cookies.set(AUTH_COOKIE_CONFIG.role.name, role, {
      ...(rememberMe
        ? persistentOptions(PUBLIC_COOKIE_OPTIONS, AUTH_COOKIE_CONFIG.role.maxAge)
        : PUBLIC_COOKIE_OPTIONS),
    });
  }

  response.cookies.set(AUTH_COOKIE_CONFIG.remember.name, rememberMe ? "true" : "false", {
    ...(rememberMe
      ? persistentOptions(PUBLIC_COOKIE_OPTIONS, AUTH_COOKIE_CONFIG.remember.maxAge)
      : PUBLIC_COOKIE_OPTIONS),
  });
}

async function refreshSession(request: NextRequest) {
  const currentRefresh = request.cookies.get(AUTH_COOKIE_CONFIG.refresh.name)?.value;
  if (!currentRefresh) return null;

  const response = await fetch(refreshEndpoint(request), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh: currentRefresh }),
    cache: "no-store",
  });

  if (!response.ok) return null;

  const data = (await response.json()) as TokenRefreshResponse;
  if (!data.access) return null;

  return {
    access: data.access,
    refresh: data.refresh ?? currentRefresh,
  };
}

export async function POST(request: NextRequest) {
  const rememberMe = request.cookies.get(AUTH_COOKIE_CONFIG.remember.name)?.value === "true";
  const fallbackRole = request.cookies.get(AUTH_COOKIE_CONFIG.role.name)?.value;
  const refreshed = await refreshSession(request);

  if (!refreshed) {
    const response = NextResponse.json({ detail: "Could not refresh session." }, { status: 401 });
    clearSession(response);
    return response;
  }

  const response = NextResponse.json({ access: refreshed.access });
  setSessionCookies(response, {
    access: refreshed.access,
    refresh: refreshed.refresh,
    rememberMe,
    fallbackRole,
  });
  return response;
}

export async function GET(request: NextRequest) {
  const rememberMe = request.cookies.get(AUTH_COOKIE_CONFIG.remember.name)?.value === "true";
  const fallbackRole = request.cookies.get(AUTH_COOKIE_CONFIG.role.name)?.value;
  const next = request.nextUrl.searchParams.get("next") || "/";
  const redirectTarget = next.startsWith("/") ? next : "/";
  const refreshed = await refreshSession(request);
  const baseUrl = process.env.APP_URL || request.url;

  if (!refreshed) {
    const response = NextResponse.redirect(new URL("/login", baseUrl));
    clearSession(response);
    return response;
  }

  const response = NextResponse.redirect(new URL(redirectTarget, baseUrl));
  setSessionCookies(response, {
    access: refreshed.access,
    refresh: refreshed.refresh,
    rememberMe,
    fallbackRole,
  });
  return response;
}
