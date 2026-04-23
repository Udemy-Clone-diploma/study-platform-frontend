import axios, { AxiosHeaders } from "axios";
import { getClientCookie } from "@/shared/lib/cookies";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1/";

export type ApiError = {
  message: string;
  detail?: string;
  fields: Record<string, string | string[]>;
  status?: number;
};

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const accessToken = getClientCookie("access_token");
  const headers = AxiosHeaders.from(config.headers);

  if (!headers.has("Content-Type")) {
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

function normalizeApiError(error: unknown, fallbackMessage: string): ApiError {
  if (!axios.isAxiosError(error)) {
    return {
      message: error instanceof Error ? error.message : fallbackMessage,
      fields: {},
    };
  }

  const status = error.response?.status;
  const data = error.response?.data;

  if (!data) {
    return {
      message: error.message || fallbackMessage,
      fields: {},
      status,
    };
  }

  if (typeof data === "string") {
    return {
      message: data,
      detail: data,
      fields: {},
      status,
    };
  }

  if (typeof data === "object") {
    const typedData = data as Record<string, unknown>;
    const detail = typeof typedData.detail === "string" ? typedData.detail : undefined;
    const message =
      typeof typedData.message === "string"
        ? typedData.message
        : detail
          ? detail
          : error.message || fallbackMessage;

    return {
      message,
      detail,
      fields:
        typedData.errors && typeof typedData.errors === "object"
          ? (typedData.errors as Record<string, string | string[]>)
          : (typedData as Record<string, string | string[]>),
      status,
    };
  }

  return {
    message: error.message || fallbackMessage,
    fields: {},
    status,
  };
}
