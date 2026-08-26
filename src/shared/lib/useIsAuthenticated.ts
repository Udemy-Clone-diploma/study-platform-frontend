"use client";

import { useSyncExternalStore } from "react";
import { AUTH_COOKIE_NAMES } from "@/shared/api/config/authCookies";
import { getClientCookie } from "./cookies";

const subscribe = () => () => undefined;

/** Hydration-safe check for the public role cookie set for signed-in users. */
export function useIsAuthenticated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => Boolean(getClientCookie(AUTH_COOKIE_NAMES.role)),
    () => false,
  );
}
