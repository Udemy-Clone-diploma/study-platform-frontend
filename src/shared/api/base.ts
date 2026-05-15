import axios, { AxiosHeaders } from "axios";
import { API_BASE_URL } from "@/shared/api/config/baseUrl";
import { AUTH_COOKIE_NAMES } from "@/shared/api/config/authCookies";
import { normalizeApiError } from "@/shared/api/lib/normalizeApiError";
export type { ApiError } from "@/shared/api/model/types";
import { getClientCookie } from "@/shared/lib/cookies";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

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
  (error: unknown) => Promise.reject(normalizeApiError(error, "Request failed")),
);
