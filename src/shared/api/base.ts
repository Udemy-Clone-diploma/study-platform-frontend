import axios, { AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import { API_BASE_URL } from "@/shared/api/config/baseUrl";
import { AUTH_COOKIE_NAMES } from "@/shared/api/config/authCookies";
import { normalizeApiError } from "@/shared/api/lib/normalizeApiError";
import type { ApiError } from "@/shared/api/model/types";
import { refreshBrowserSession } from "@/shared/api/sessionManager";
import { getClientCookie } from "@/shared/lib/cookies";

export type { ApiError } from "@/shared/api/model/types";

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

function isAuthRefreshAllowed(url?: string): boolean {
  if (!url) return true;
  return !["auth/login/", "auth/logout/", "auth/refresh/", "auth/google/"].some((path) =>
    url.includes(path),
  );
}

function getBearerToken(headers: AxiosHeaders): string | undefined {
  const authorization = headers.get("Authorization");
  if (typeof authorization !== "string" || !authorization.startsWith("Bearer ")) {
    return undefined;
  }

  return authorization.slice("Bearer ".length);
}

function refreshUnavailableError(status: number): ApiError {
  return {
    message: "Session refresh is temporarily unavailable.",
    detail: "Please try again in a moment.",
    fields: {},
    status,
  };
}

api.interceptors.request.use((config) => {
  const accessToken = getClientCookie(AUTH_COOKIE_NAMES.access);
  const headers = AxiosHeaders.from(config.headers);

  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    headers.delete("Content-Type");
  } else if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  config.headers = headers;

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(normalizeApiError(error, "Request failed"));
    }

    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const status = error.response?.status;

    if (
      status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      !isAuthRefreshAllowed(originalRequest.url)
    ) {
      return Promise.reject(normalizeApiError(error, "Request failed"));
    }

    originalRequest._retry = true;
    const originalHeaders = AxiosHeaders.from(originalRequest.headers);
    const rejectedAccessToken = getBearerToken(originalHeaders);
    const refreshResult = await refreshBrowserSession(rejectedAccessToken);

    if (refreshResult.status === "invalid") {
      return Promise.reject(normalizeApiError(error, "Request failed"));
    }

    if (refreshResult.status === "unavailable") {
      return Promise.reject(refreshUnavailableError(refreshResult.httpStatus));
    }

    originalHeaders.set("Authorization", `Bearer ${refreshResult.accessToken}`);
    originalRequest.headers = originalHeaders;

    return api(originalRequest);
  },
);
