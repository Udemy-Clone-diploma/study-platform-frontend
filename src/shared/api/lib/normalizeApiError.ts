import axios from "axios";
import type { ApiError } from "@/shared/api/model/types";

export function normalizeApiError(error: unknown, fallbackMessage: string): ApiError {
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
