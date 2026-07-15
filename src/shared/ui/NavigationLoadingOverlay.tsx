"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { LoadingLogo } from "@/shared/ui/LoadingLogo";
import { subscribePageLoading } from "@/shared/lib/pageLoadingSignal";

const SHOW_DELAY = 150;
const MIN_VISIBLE = 500;
const SAFETY = 8000;

type TimerRef = { current: ReturnType<typeof setTimeout> | null };

function clearTimer(ref: TimerRef) {
  if (ref.current) {
    clearTimeout(ref.current);
    ref.current = null;
  }
}

function toUrl(href: string): URL | null {
  try {
    return new URL(href, window.location.href);
  } catch {
    return null;
  }
}

function isSameOrigin(url: URL) {
  return url.origin === window.location.origin;
}

export function NavigationLoadingOverlay() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  const pending = useRef(false);
  const pageLoading = useRef(false);
  const visibleRef = useRef(false);
  const shownAt = useRef(0);
  const currentPath = useRef(pathname);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    visibleRef.current = true;
    shownAt.current = Date.now();
    setVisible(true);
  }, []);

  const hide = useCallback(() => {
    visibleRef.current = false;
    setVisible(false);
  }, []);

  const finish = useCallback(() => {
    pending.current = false;
    clearTimer(showTimer);
    clearTimer(safetyTimer);
    if (!visibleRef.current) return;
    // A page can hold the overlay open past the route transition itself
    // (e.g. it's still creating a draft copy server-side) via usePageLoadingOverlay.
    if (pageLoading.current) return;
    const remaining = Math.max(0, MIN_VISIBLE - (Date.now() - shownAt.current));
    clearTimer(hideTimer);
    hideTimer.current = setTimeout(hide, remaining);
  }, [hide]);

  // Lets in-page async work (see usePageLoadingOverlay) show the overlay
  // immediately and keep it open even after the route itself has finished
  // transitioning.
  useEffect(() => {
    return subscribePageLoading((loading) => {
      pageLoading.current = loading;
      if (loading) {
        clearTimer(hideTimer);
        show();
      } else {
        finish();
      }
    });
  }, [show, finish]);

  const start = useCallback(
    (nextPath: string) => {
      if (nextPath === currentPath.current || pending.current) return;
      pending.current = true;
      clearTimer(hideTimer);
      clearTimer(showTimer);
      showTimer.current = setTimeout(() => {
        if (pending.current) show();
      }, SHOW_DELAY);
      clearTimer(safetyTimer);
      safetyTimer.current = setTimeout(finish, SAFETY);
    },
    [show, finish],
  );

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href) return;
      const target = anchor.getAttribute("target");
      if (target && target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      if (anchor.getAttribute("rel")?.includes("external")) return;
      const url = toUrl(href);
      if (!url || !isSameOrigin(url) || url.pathname === window.location.pathname) return;
      start(url.pathname);
    };

    const onPopState = () => start(window.location.pathname);

    const nativePush = window.history.pushState;
    const nativeReplace = window.history.replaceState;

    const patch = (native: History["pushState"]) =>
      function (this: History, ...args: Parameters<History["pushState"]>) {
        const result = native.apply(this, args);
        const next = args[2];
        if (next != null) {
          const url = toUrl(String(next));
          if (url && isSameOrigin(url) && url.pathname !== currentPath.current) start(url.pathname);
        }
        return result;
      };

    window.history.pushState = patch(nativePush);
    window.history.replaceState = patch(nativeReplace);
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);

    return () => {
      window.history.pushState = nativePush;
      window.history.replaceState = nativeReplace;
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
      clearTimer(showTimer);
      clearTimer(hideTimer);
      clearTimer(safetyTimer);
    };
  }, [start]);

  useEffect(() => {
    if (pathname === currentPath.current) return;
    currentPath.current = pathname;
    finish();
  }, [pathname, finish]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      style={{ background: "var(--gradient-brand)" }}
    >
      <Image
        src="/backgrounds/learn-page-bg.png"
        alt=""
        fill
        sizes="100vw"
        priority
        className="object-cover"
      />
      <LoadingLogo />
    </div>
  );
}
