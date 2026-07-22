"use client";

import { useParams } from "next/navigation";
import { withAuth } from "@/features/auth";
import { AdminModeratorProfile } from "@/widgets/dashboard";

const ProtectedAdminModeratorProfile = withAuth(AdminModeratorProfile, {
  allowedRoles: ["administrator"],
});

export default function AdminModeratorProfilePage() {
  const { moderatorId } = useParams<{ moderatorId: string }>();
  const numericModeratorId = Number(moderatorId);

  if (!Number.isInteger(numericModeratorId) || numericModeratorId <= 0) return null;

  return <ProtectedAdminModeratorProfile moderatorId={numericModeratorId} />;
}
