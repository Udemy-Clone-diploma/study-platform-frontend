"use server";

import { clearAuthCookies, getRefreshToken } from "@/shared/api/authCookies";
import { logoutUser } from "@/features/auth/api/authApi";

export async function logout(): Promise<void> {
  const refreshToken = await getRefreshToken();

  if (refreshToken) {
    try {
      await logoutUser(refreshToken);
    } catch {}
  }

  await clearAuthCookies();
}
