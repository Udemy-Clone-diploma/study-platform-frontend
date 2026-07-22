"use client";

import { Suspense } from "react";
import { withAuth } from "@/features/auth";
import { FinanceAdminView } from "@/features/finance";

const ProtectedFinanceAdminView = withAuth(FinanceAdminView, {
  allowedRoles: ["administrator"],
});

export default function AdminPaymentPage() {
  return (
    <Suspense>
      <ProtectedFinanceAdminView />
    </Suspense>
  );
}
