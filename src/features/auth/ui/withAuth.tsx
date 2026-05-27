"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { AUTH_COOKIE_NAMES } from "@/shared/api/config/authCookies";
import { getClientCookie } from "@/shared/lib/cookies";
import type { UserRole } from "@/entities/user";

type WithAuthOptions = {
  allowedRoles: UserRole[];
};

const HYDRATING = Symbol("withAuth.hydrating");
type Hydrating = typeof HYDRATING;

/** Cookies don't change without a navigation, so subscribe is a no-op. */
const subscribe = () => () => {};

/** Server snapshot: signal "hydrating" so SSR + first client render match. */
const getServerRole = (): Hydrating => HYDRATING;

/** Client snapshot, re-read after hydration to swap in the real role. */
const getClientRole = (): UserRole | undefined =>
  getClientCookie(AUTH_COOKIE_NAMES.role) as UserRole | undefined;

export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  { allowedRoles }: WithAuthOptions,
) {
  function ProtectedComponent(props: P) {
    const router = useRouter();
    const role = useSyncExternalStore<UserRole | undefined | Hydrating>(
      subscribe,
      getClientRole,
      getServerRole,
    );

    const isHydrating = role === HYDRATING;
    const isAuthorized = !isHydrating && !!role && allowedRoles.includes(role);

    useEffect(() => {
      if (isHydrating) return;
      if (!role) {
        router.replace("/login");
      } else if (!isAuthorized) {
        router.replace("/403");
      }
    }, [isHydrating, role, isAuthorized, router]);

    if (isHydrating || !isAuthorized) {
      return null;
    }

    return <Component {...props} />;
  }

  ProtectedComponent.displayName = `withAuth(${Component.displayName ?? Component.name ?? "Component"})`;

  return ProtectedComponent;
}
