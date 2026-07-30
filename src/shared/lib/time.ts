export function padTwo(n: number): string {
  return String(n).padStart(2, "0");
}

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(min: number): string {
  return `${padTwo(Math.floor(min / 60))}:${padTwo(min % 60)}`;
}

/** Strip seconds from "HH:MM:SS" → "HH:MM". */
export function fmtTime(t: string): string {
  return t.slice(0, 5);
}

const REFERENCE_SUNDAY = new Date(2023, 0, 1);

/** Locale-aware weekday names, starting Sunday. Uses a known-Sunday reference date instead of a translation key list. */
export function getWeekdayNames(locale: string, format: "long" | "short" = "long"): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(REFERENCE_SUNDAY);
    d.setDate(REFERENCE_SUNDAY.getDate() + i);
    return new Intl.DateTimeFormat(locale, { weekday: format }).format(d);
  });
}

export function formatDate(
  value: string | Date,
  locale: string,
  options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "2-digit", year: "numeric" },
): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString(locale, options);
}

export function formatDateTime(
  value: string | Date,
  locale: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleString(locale, options);
}

export function formatRelativeTime(iso: string, locale = "en-US"): string {
  const diffSec = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (diffSec < 45) return rtf.format(0, "second");
  const mins = Math.round(diffSec / 60);
  if (mins < 60) return rtf.format(-mins, "minute");
  const hours = Math.round(mins / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  const days = Math.round(hours / 24);
  if (days < 7) return rtf.format(-days, "day");
  if (days < 30) return rtf.format(-Math.round(days / 7), "week");

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}
