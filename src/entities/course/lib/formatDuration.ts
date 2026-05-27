/** Format a lesson duration in minutes as "45m" or "1h 15m". Returns null for null input. */
export function formatLessonDuration(minutes: number | null): string | null {
  if (minutes == null || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** Format a course duration in hours as "12h" or "1h". */
export function formatCourseDuration(hours: number): string {
  return `${hours}h`;
}
