import { useEffect, useRef } from "react";

/**
 * Silently re-calls `callback` every `intervalMs` and whenever the browser tab
 * becomes visible again. Does NOT call on mount — pair with a `useEffect` for
 * the initial load so the loading state is separate from silent refreshes.
 */
export function useAutoRefresh(callback: () => void, intervalMs = 30_000) {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    const tick = () => cbRef.current();

    const id = setInterval(tick, intervalMs);

    const onVisible = () => {
      if (document.visibilityState === "visible") cbRef.current();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [intervalMs]);
}
