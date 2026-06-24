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
