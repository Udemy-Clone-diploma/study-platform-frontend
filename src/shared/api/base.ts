import axios, { AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import { API_BASE_URL } from "@/shared/api/config/baseUrl";
import { AUTH_COOKIE_NAMES } from "@/shared/api/config/authCookies";
import { normalizeApiError } from "@/shared/api/lib/normalizeApiError";
export type { ApiError } from "@/shared/api/model/types";
import { getClientCookie } from "@/shared/lib/cookies";

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const REQUEST_TIMEOUT_MS = 10_000;

/** File uploads travel over the network in deployed environments, where a few megabytes
 *  routinely take longer than the 10s that suits a JSON round trip. */
const UPLOAD_TIMEOUT_MS = 120_000;

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
});

let refreshPromise: Promise<string | null> | null = null;

function isAuthRefreshAllowed(url?: string): boolean {
  if (!url) return true;
  return !["auth/login/", "auth/logout/", "auth/refresh/", "auth/google/"].some((path) =>
    url.includes(path),
  );
}

async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  refreshPromise ??= fetch("/api/auth/refresh", {
    method: "POST",
    cache: "no-store",
  })
    .then(async (response) => {
      if (!response.ok) return null;
      const data = (await response.json()) as { access?: string };
      return data.access ?? null;
    })
    .catch(() => null)
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

api.interceptors.request.use((config) => {
  const accessToken = getClientCookie(AUTH_COOKIE_NAMES.access);
  const headers = AxiosHeaders.from(config.headers);

  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    headers.delete("Content-Type");
    config.timeout = UPLOAD_TIMEOUT_MS;
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
    const accessToken = await refreshAccessToken();

    if (!accessToken) {
      return Promise.reject(normalizeApiError(error, "Request failed"));
    }

    const headers = AxiosHeaders.from(originalRequest.headers);
    headers.set("Authorization", `Bearer ${accessToken}`);
    originalRequest.headers = headers;

    return api(originalRequest);
  },
);
