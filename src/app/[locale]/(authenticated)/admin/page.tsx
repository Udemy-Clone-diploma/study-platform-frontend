"use client";

import { withAuth } from "@/features/auth";
import { AdminDashboard } from "@/widgets/dashboard";

const ProtectedAdminDashboard = withAuth(AdminDashboard, { allowedRoles: ["administrator"] });

export default function AdminDashboardPage() {
  return <ProtectedAdminDashboard />;
}
