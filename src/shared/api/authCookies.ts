"use server";
import { cookies } from "next/headers";

const TOKEN_CONFIG = {
  access: {
    name: "access_token",
    maxAge: 60 * 15, // 15 min
  },
  refresh: {
    name: "refresh_token",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
  role: {
    name: "user_role",
    maxAge: 60 * 60 * 24 * 7, // 7 days, matches refresh
  },
} as const;

const SECURE_COOKIE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

const PUBLIC_COOKIE = {
  httpOnly: false,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function setAuthCookies(accessToken: string, refreshToken: string): Promise<void> {
  if (!accessToken || !refreshToken) {
    throw new Error("Both access and refresh tokens are required");
  }

  const jar = await cookies();

  jar.set(TOKEN_CONFIG.access.name, accessToken, {
    ...PUBLIC_COOKIE,
    maxAge: TOKEN_CONFIG.access.maxAge,
  });

  jar.set(TOKEN_CONFIG.refresh.name, refreshToken, {
    ...SECURE_COOKIE,
    maxAge: TOKEN_CONFIG.refresh.maxAge,
  });
}

export async function setRoleCookie(role: string): Promise<void> {
  const jar = await cookies();

  jar.set(TOKEN_CONFIG.role.name, role, {
    ...PUBLIC_COOKIE,
    maxAge: TOKEN_CONFIG.role.maxAge,
  });
}

export async function clearAuthCookies(): Promise<void> {
  const jar = await cookies();

  jar.delete(TOKEN_CONFIG.access.name);
  jar.delete(TOKEN_CONFIG.refresh.name);
  jar.delete(TOKEN_CONFIG.role.name);
}

export async function getAccessToken(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(TOKEN_CONFIG.access.name)?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(TOKEN_CONFIG.refresh.name)?.value;
}
