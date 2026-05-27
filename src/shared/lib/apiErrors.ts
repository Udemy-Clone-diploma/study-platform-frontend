import type { ApiError } from "@/shared/api/base";

/** Converts ApiError.fields into a flat Record<fieldName, message> for form state. */
export function mapApiFieldErrors(
  fields: ApiError["fields"],
): Record<string, string> {
  const mapped: Record<string, string> = {};
  for (const [k, v] of Object.entries(fields ?? {}))
    mapped[k] = Array.isArray(v) ? v.join(" ") : String(v);
  return mapped;
}
