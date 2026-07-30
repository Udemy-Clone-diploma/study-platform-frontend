import { formatDate } from "@/shared/lib/time";

export function formatUserDate(iso: string, locale: string): string {
  return formatDate(iso, locale);
}
