import type { ApiError } from "@/shared/api/model/types";

/** Best human-readable text for a rejected API call, falling back to the caller's message. */
export function apiErrorMessage(error: unknown, fallback: string): string {
  const apiError = error as Partial<ApiError> | null | undefined;
  return apiError?.detail || apiError?.message || fallback;
}
