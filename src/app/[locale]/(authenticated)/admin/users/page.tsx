"use client";

import { Suspense } from "react";
import { withAuth } from "@/features/auth";
import { UsersAdminView } from "@/features/users";

const ProtectedUsersAdminView = withAuth(UsersAdminView, { allowedRoles: ["administrator"] });

export default function AdminUsersPage() {
  return (
    <Suspense>
      <ProtectedUsersAdminView />
    </Suspense>
  );
}
