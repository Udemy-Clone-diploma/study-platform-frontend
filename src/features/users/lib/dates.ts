import { padTwo } from "@/shared/lib/time";

export function formatUserDate(iso: string): string {
  const d = new Date(iso);
  return `${padTwo(d.getDate())}.${padTwo(d.getMonth() + 1)}.${d.getFullYear()}`;
}
