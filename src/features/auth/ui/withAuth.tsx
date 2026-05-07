"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
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
    const role = getClientCookie("user_role") as UserRole | undefined;
    const isAuthorized = !!role && allowedRoles.includes(role);

    useEffect(() => {
      if (!role) {
        router.replace("/login");
        return;
      }

      if (!isAuthorized) {
        router.replace("/403");
      }
    }, [isAuthorized, role, router]);

    if (!isAuthorized) {
      return null;
    }

    return <Component {...props} />;
  }

  ProtectedComponent.displayName = `withAuth(${Component.displayName ?? Component.name ?? "Component"})`;

  return ProtectedComponent;
}
