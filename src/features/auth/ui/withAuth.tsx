"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getClientCookie } from "@/shared/lib/cookies";
import type { UserRole } from "@/features/auth/model/types/userData";

type WithAuthOptions = {
  allowedRoles: UserRole[];
};

export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  { allowedRoles }: WithAuthOptions,
) {
  function ProtectedComponent(props: P) {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

    useEffect(() => {
      const role = getClientCookie("user_role") as UserRole | undefined;

      if (!role) {
        router.replace("/login");
        return;
      }

      if (!allowedRoles.includes(role)) {
        router.replace("/403");
        return;
      }

      setIsAuthorized(true);
    }, [router]);

    if (isAuthorized === null) {
      return null;
    }

    return <Component {...props} />;
  }

  ProtectedComponent.displayName = `withAuth(${Component.displayName ?? Component.name ?? "Component"})`;

  return ProtectedComponent;
}
