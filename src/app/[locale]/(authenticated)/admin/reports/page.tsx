"use client";

import { withAuth } from "@/features/auth";
import { UserReportsWorkspace } from "@/features/users";

const ProtectedUserReportsWorkspace = withAuth(UserReportsWorkspace, {
  allowedRoles: ["administrator"],
});

export default function AdminUserReportsPage() {
  return <ProtectedUserReportsWorkspace mode="administrator" />;
}
