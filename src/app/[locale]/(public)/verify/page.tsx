"use client";

import { Suspense } from "react";
import { CertificateVerifyView } from "@/features/certificates";

export default function VerifyCertificatePage() {
  return (
    <Suspense>
      <CertificateVerifyView />
    </Suspense>
  );
}
