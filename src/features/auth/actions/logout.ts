"use server";

import { clearAuthCookies, getRefreshToken } from "@/shared/api/authCookies";
import { logoutUser } from "@/features/auth/api/authApi";

export async function logout(): Promise<void> {
  const refreshToken = await getRefreshToken();

  if (refreshToken) {
    try {
      await logoutUser(refreshToken);
    } catch {
      // Swallowed on purpose: whether or not the server revokes the refresh token,
      // the local session must still be cleared below, or the user stays logged in.
    }
  }

  await clearAuthCookies();
}
