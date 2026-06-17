"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { ApiError } from "@/shared/api/base";
import { getCourseProgress } from "../api/progressApi";
import { getMockProgressSnapshot, subscribeMockProgress } from "./mockProgress";
import type { CourseProgress } from "../model/progress";

/**
 * Client-side course progress. Real courses fetch from the API (skipped when
 * `initialProgress` is supplied). The dev-mock course reads a localStorage
 * snapshot (seeded by `initialProgress`) via `useSyncExternalStore`, so mock
 * completions persist and stay in sync across the three lesson-player views.
 * 401/403 stay silent (nothing to show); other failures surface via `error`.
 */
export function useCourseProgress(
  slug: string,
  initialProgress: CourseProgress | null = null,
  isMock = false,
) {
  const mockProgress = useSyncExternalStore(
    subscribeMockProgress,
    () => (isMock ? getMockProgressSnapshot(slug, initialProgress) : initialProgress),
    () => initialProgress,
  );

  const [fetched, setFetched] = useState<CourseProgress | null>(initialProgress);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isMock || initialProgress) return;
    let cancelled = false;
    getCourseProgress(slug)
      .then((p) => {
        if (!cancelled) setFetched(p);
      })
      .catch((err: Partial<ApiError>) => {
        if (cancelled) return;
        if (err.status !== 401 && err.status !== 403) {
          setError(err.message ?? "Could not load progress.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [slug, initialProgress, isMock]);

  return { progress: isMock ? mockProgress : fetched, error };
}
