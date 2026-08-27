import { AUTH_COOKIE_NAMES } from "@/shared/api/config/authCookies";
import { getClientCookie } from "@/shared/lib/cookies";

export type SessionRefreshResult =
  | { status: "success"; accessToken: string }
  | { status: "invalid" }
  | { status: "unavailable"; httpStatus: number };

const REFRESH_LOCK_NAME = "nexo-auth-refresh";

let refreshPromise: Promise<SessionRefreshResult> | null = null;

async function requestRefreshedAccessToken(
  rejectedAccessToken?: string,
): Promise<SessionRefreshResult> {
  const currentAccessToken = getClientCookie(AUTH_COOKIE_NAMES.access);

  // Another tab may have refreshed the session while this caller was waiting
  // for the cross-tab lock. Reuse that token instead of rotating refresh again.
  if (currentAccessToken && (!rejectedAccessToken || currentAccessToken !== rejectedAccessToken)) {
    return { status: "success", accessToken: currentAccessToken };
  }

  try {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      cache: "no-store",
    });

    if (response.status === 401) {
      return { status: "invalid" };
    }

    if (!response.ok) {
      return { status: "unavailable", httpStatus: response.status || 503 };
    }

    const data = (await response.json()) as { access?: string };
    if (!data.access) {
      return { status: "unavailable", httpStatus: 503 };
    }

    return { status: "success", accessToken: data.access };
  } catch {
    return { status: "unavailable", httpStatus: 503 };
  }
}

async function refreshWithCrossTabLock(
  rejectedAccessToken?: string,
): Promise<SessionRefreshResult> {
  if (!("locks" in navigator)) {
    return requestRefreshedAccessToken(rejectedAccessToken);
  }

  return navigator.locks.request(REFRESH_LOCK_NAME, () =>
    requestRefreshedAccessToken(rejectedAccessToken),
  );
}

/** Refreshes the browser session once, sharing the result across requests and tabs. */
export function refreshBrowserSession(rejectedAccessToken?: string): Promise<SessionRefreshResult> {
  if (typeof window === "undefined") {
    return Promise.resolve({ status: "unavailable", httpStatus: 503 });
  }

  refreshPromise ??= refreshWithCrossTabLock(rejectedAccessToken).finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}
