"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/features/auth/api/authApi";
import { AuthField } from "@/features/auth/ui/AuthField";
import { AuthPanel } from "@/features/auth/ui/AuthPanel";
import { AccentButton } from "@/shared/ui/AccentButton";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  function validateEmail(value: string): string {
    if (!value.trim()) return "Enter your email";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Enter a valid email";
    return "";
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const error = validateEmail(email);
    if (error) {
      setEmailError(error);
      return;
    }
    setIsSubmitting(true);
    setEmailError("");
    try {
      await requestPasswordReset({ email: email.trim() });
      setIsSent(true);
    } catch {
      setIsSent(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSent) {
    return (
      <AuthPanel
        title="Check Email"
        description={
          <>
            If an account exists for <strong>{email}</strong>, we sent a password reset link.
          </>
        }
      >
        <div className="space-y-5">
          <AccentButton
            type="button"
            onClick={() => setIsSent(false)}
          >
            Send Again
          </AccentButton>

          <p className="text-center text-[0.95rem] text-[#3e3840]">
            <Link href="/login" className="text-[#3557ff] transition hover:text-[#1937cb]">
              Back to sign in
            </Link>
          </p>
        </div>
      </AuthPanel>
    );
  }

  return (
    <AuthPanel
      title="Reset Password"
      description="Enter the email connected to your account and we will send a reset link."
    >
      <form onSubmit={handleSubmit} className="space-y-7">
        <AuthField
          id="email"
          name="email"
          type="email"
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setEmailError("");
          }}
          error={emailError}
          autoComplete="email"
        />

        <div className="flex flex-col items-center gap-5">
          <AccentButton
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Sending" : "Send Link"}
          </AccentButton>

          <p className="text-center text-[0.95rem] text-[#3e3840]">
            <Link href="/login" className="text-[#3557ff] transition hover:text-[#1937cb]">
              Back to sign in
            </Link>
          </p>
        </div>
      </form>
    </AuthPanel>
  );
}
