"use client";

import { useEffect } from "react";

type Listener = (loading: boolean) => void;

const listeners = new Set<Listener>();
let activeCount = 0;

function notify() {
  const loading = activeCount > 0;
  listeners.forEach((listener) => listener(loading));
}

export function beginPageLoading() {
  activeCount++;
  notify();
}

export function endPageLoading() {
  activeCount = Math.max(0, activeCount - 1);
  notify();
}

export function subscribePageLoading(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Keeps the global NavigationLoadingOverlay visible for as long as `loading`
 * is true -- for slow in-page async work (e.g. creating a draft copy on
 * course edit) that finishes after the route transition itself has already
 * completed, so the route-change-only overlay would otherwise hide too early.
 */
export function usePageLoadingOverlay(loading: boolean) {
  useEffect(() => {
    if (!loading) return;
    beginPageLoading();
    return () => endPageLoading();
  }, [loading]);
}
