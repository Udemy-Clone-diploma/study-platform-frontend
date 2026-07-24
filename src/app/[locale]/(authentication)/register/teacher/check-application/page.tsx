"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Link } from "@/i18n/navigation";
import { AuthPanel } from "@/features/auth";

function CheckApplicationContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, "$1***$3");

  return (
    <AuthPanel
      title="Application Submitted"
      description={
        <>
          Thanks! Your application has been sent for review. We will email{" "}
          <strong>{maskedEmail || "you"}</strong> once a moderator makes a decision.
        </>
      }
    >
      <p className="text-center text-[0.95rem] text-[#3e3840]">
        <Link href="/login" className="text-[#3557ff] transition hover:text-[#1937cb]">
          Back to sign in
        </Link>
      </p>
    </AuthPanel>
  );
}

export default function CheckApplicationPage() {
  return (
    <Suspense>
      <CheckApplicationContent />
    </Suspense>
  );
}
