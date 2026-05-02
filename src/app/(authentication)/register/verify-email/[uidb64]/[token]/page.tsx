"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ResendEmailForm } from "@/features/auth/ui/forms/ResendEmailForm";
import { resendVerificationEmail, verifyEmail } from "@/features/auth/api/authApi";
import { AuthPanel } from "@/features/auth/ui/AuthPanel";
import { AccentButton } from "@/shared/ui/AccentButton";

export default function VerifyEmailPage() {
  const { uidb64, token } = useParams<{ uidb64: string; token: string }>();
  const router = useRouter();

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [showResend, setShowResend] = useState(false);

  useEffect(() => {
    if (!uidb64 || !token) return;
    async function verify() {
      try {
        const res = await verifyEmail(uidb64, token);
        setStatus("success");
        setMessage(res.detail);
        setTimeout(() => router.push("/login"), 3000);
      } catch (error: unknown) {
        const e = error as { detail?: string; message?: string };
        setStatus("error");
        setMessage(e?.detail || e?.message || "Invalid or expired link.");
      }
    }
    verify();
  }, [uidb64, token, router]);

  if (status === "loading") {
    return (
      <AuthPanel title="Checking Link" description="We are verifying your email address.">
        <p className="text-sm text-[#3e3840]">Please wait...</p>
      </AuthPanel>
    );
  }

  if (status === "success") {
    return (
      <AuthPanel
        title="Email Verified"
        description={message || "Your email has been verified successfully."}
      >
        <p className="text-sm text-[#3e3840]">Redirecting to sign in...</p>
      </AuthPanel>
    );
  }

  return (
    <AuthPanel title="Verification Failed" description={message}>
      <div className="space-y-5">
        {!showResend ? (
          <AccentButton
            type="button"
            onClick={() => setShowResend(true)}
          >
            Send Again
          </AccentButton>
        ) : (
          <ResendEmailForm
            onResend={async (email) => {
              await resendVerificationEmail(email);
              router.push(`/register/check-email?email=${encodeURIComponent(email)}`);
            }}
            submitLabel="Send Verification"
          />
        )}

        <p className="text-center text-[0.95rem] text-[#3e3840]">
          <Link href="/login" className="text-[#3557ff] transition hover:text-[#1937cb]">
            Back to sign in
          </Link>
        </p>
      </div>
    </AuthPanel>
  );
}
