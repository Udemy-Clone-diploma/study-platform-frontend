import type { CourseProgress } from "../model/progress";

/**
 * Client-side stand-in for the progress backend, used only by the dev-mock
 * course (`MOCK_COURSE_DETAIL_SLUG`). Completions are written to localStorage so
 * the lesson player, the Course overview and the Progress tab stay in sync and
 * survive reloads without a server. Real courses go through `progressApi`.
 *
 * Reads go through a cache + subscription so `useSyncExternalStore` can consume
 * them without tearing or infinite re-renders.
 */
const key = (slug: string) => `nexo:mock-progress:${slug}`;

const cache = new Map<string, { raw: string; value: CourseProgress }>();
const listeners = new Set<() => void>();

function rawFor(slug: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key(slug));
  } catch {
    return null;
  }
}

/** Stored snapshot (cached, stable reference) if present, otherwise the seed. */
export function getMockProgressSnapshot(
  slug: string,
  seed: CourseProgress | null,
): CourseProgress | null {
  const raw = rawFor(slug);
  if (raw === null) return seed;
  const cached = cache.get(slug);
  if (cached && cached.raw === raw) return cached.value;
  try {
    const value = JSON.parse(raw) as CourseProgress;
    cache.set(slug, { raw, value });
    return value;
  } catch {
    return seed;
  }
}

/** Subscribe to cross-tab (`storage` event) and same-tab mock-progress writes. */
export function subscribeMockProgress(onChange: () => void): () => void {
  listeners.add(onChange);
  if (typeof window !== "undefined") window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    if (typeof window !== "undefined") window.removeEventListener("storage", onChange);
  };
}

/** Non-hook read (e.g. the lesson player's seed); same source as the snapshot. */
export function readMockProgress(slug: string, seed: CourseProgress | null): CourseProgress | null {
  return getMockProgressSnapshot(slug, seed);
}

function write(slug: string, progress: CourseProgress): CourseProgress {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(key(slug), JSON.stringify(progress));
    } catch {
      /* storage unavailable: keep the in-memory value */
    }
  }
  listeners.forEach((l) => l());
  return progress;
}

/** Toggle a lesson's completion and persist the new snapshot. */
export function toggleMockLessonComplete(
  slug: string,
  lessonId: number,
  current: CourseProgress,
): CourseProgress {
  const isDone = current.completed_lesson_ids.includes(lessonId);
  const completed_lesson_ids = isDone
    ? current.completed_lesson_ids.filter((id) => id !== lessonId)
    : [...current.completed_lesson_ids, lessonId].sort((a, b) => a - b);
  return write(slug, {
    ...current,
    completed_lesson_ids,
    lessons_completed_count: completed_lesson_ids.length,
  });
}

/** Record the last opened lesson so the resume CTA points here. */
export function recordMockOpen(
  slug: string,
  lessonId: number,
  current: CourseProgress,
): CourseProgress {
  return write(slug, {
    ...current,
    last_lesson_id: lessonId,
    last_opened_at: new Date().toISOString(),
  });
}
