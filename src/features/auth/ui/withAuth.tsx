"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AUTH_COOKIE_NAMES } from "@/shared/api/config/authCookies";
import { getClientCookie } from "@/shared/lib/cookies";
import type { UserRole } from "@/entities/user";

type WithAuthOptions = {
  allowedRoles: UserRole[];
};

export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  { allowedRoles }: WithAuthOptions,
) {
  function ProtectedComponent(props: P) {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      setMounted(true);
    }, []);

    const role = mounted ? (getClientCookie(AUTH_COOKIE_NAMES.role) as UserRole | undefined) : undefined;
    const isAuthorized = !!role && allowedRoles.includes(role);

    useEffect(() => {
      if (!mounted) return;
      if (!role) {
        router.replace("/login");
        return;
      }

      if (!isAuthorized) {
        router.replace("/403");
      }
    }, [mounted, isAuthorized, role, router]);

    if (!mounted || !isAuthorized) {
      return null;
    }

    return <Component {...props} />;
  }

  ProtectedComponent.displayName = `withAuth(${Component.displayName ?? Component.name ?? "Component"})`;

  return ProtectedComponent;
}
