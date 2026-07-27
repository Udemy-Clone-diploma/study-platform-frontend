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
