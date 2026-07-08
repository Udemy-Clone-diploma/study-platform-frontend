import { API_BASE_URL } from "@/shared/api/config/baseUrl";

const DEFAULT_API_BASE_URL = "http://localhost:8000/api/v1/";

function apiOrigin() {
  const fallbackOrigin =
    typeof window !== "undefined" ? window.location.origin : "http://localhost:8000";

  try {
    return new URL(API_BASE_URL || DEFAULT_API_BASE_URL, fallbackOrigin).origin;
  } catch {
    return fallbackOrigin;
  }
}

export function resolveMediaUrl(value?: string | null): string | null {
  const raw = value?.trim();
  if (!raw) return null;

  if (/^(data|blob):/i.test(raw)) return raw;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("//")) {
    const protocol = typeof window !== "undefined" ? window.location.protocol : "https:";
    return `${protocol}${raw}`;
  }

  const origin = apiOrigin();
  if (raw.startsWith("/")) return new URL(raw, origin).toString();

  const path = raw.replace(/^\/+/, "");
  return new URL(path.startsWith("media/") ? `/${path}` : `/media/${path}`, origin).toString();
}
