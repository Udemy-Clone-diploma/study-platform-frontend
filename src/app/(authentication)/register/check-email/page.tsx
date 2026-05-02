"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import Link from "next/link";
import { resendVerificationEmail } from "@/features/auth/api/authApi";
import { AuthPanel } from "@/features/auth/ui/AuthPanel";
import { AccentButton } from "@/shared/ui/AccentButton";

function CheckEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleResend() {
    setStatus("loading");
    try {
      await resendVerificationEmail(email);
      setStatus("sent");
      setMessage("Verification email sent again. Please check your inbox.");
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again later.");
    }
  }

  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, "$1***$3");

  return (
    <AuthPanel
      title="Check Email"
      description={
        <>
          We sent a verification link to <strong>{maskedEmail || "your email"}</strong>.
        </>
      }
    >
      <div className="space-y-5">
        {message ? (
          <p className={`text-sm ${status === "error" ? "text-[#be3b3b]" : "text-[#247a4d]"}`}>
            {message}
          </p>
        ) : null}

        <AccentButton
          type="button"
          onClick={handleResend}
          disabled={!email || status === "loading" || status === "sent"}
        >
          {status === "loading" ? "Sending" : "Send Again"}
        </AccentButton>

        <p className="text-center text-[0.95rem] text-[#3e3840]">
          Already verified?{" "}
          <Link href="/login" className="text-[#3557ff] transition hover:text-[#1937cb]">
            Sign in
          </Link>
        </p>
      </div>
    </AuthPanel>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense>
      <CheckEmailContent />
    </Suspense>
  );
}
