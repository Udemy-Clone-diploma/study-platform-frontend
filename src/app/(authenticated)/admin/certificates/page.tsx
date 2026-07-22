"use client";

import { Suspense } from "react";
import { withAuth } from "@/features/auth";
import { CertificatesAdminView } from "@/features/certificates";

const ProtectedCertificatesAdminView = withAuth(CertificatesAdminView, {
  allowedRoles: ["administrator"],
});

export default function AdminCertificatesPage() {
  return (
    <Suspense>
      <ProtectedCertificatesAdminView />
    </Suspense>
  );
}
