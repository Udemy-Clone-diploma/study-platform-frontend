"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ResendEmailForm } from "@/features/auth/ui/forms/ResendEmailForm";
import { AuthField } from "@/features/auth/ui/AuthField";
import { AuthPanel } from "@/features/auth/ui/AuthPanel";
import { AccentButton } from "@/shared/ui/AccentButton";
import {
  validatePasswordResetToken,
  confirmPasswordReset,
  requestPasswordReset,
} from "@/features/auth/api/authApi";
import { validatePasswordResetForm } from "@/features/auth/model/validation";
import { useAuthForm } from "@/features/auth/model/useAuthForm";
import type { PasswordResetFormData } from "@/features/auth/model/types/passwordResetTypes";

type PageStatus = "loading" | "invalid" | "form" | "success" | "error";

const initialForm: PasswordResetFormData = { password: "", confirmPassword: "" };

export default function ResetPasswordPage() {
  const { uidb64, token } = useParams<{ uidb64: string; token: string }>();

  const [pageStatus, setPageStatus] = useState<PageStatus>("loading");
  const [pageMessage, setPageMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    formData,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    setFormData,
  } = useAuthForm<PasswordResetFormData>({
    initial: initialForm,
    validate: validatePasswordResetForm,
    fieldKeys: ["password", "confirmPassword"],
    submit: async (data) => {
      try {
        await confirmPasswordReset(uidb64, token, { password: data.password });
        setPageStatus("success");
      } catch (err: unknown) {
        const e = err as { detail?: string; message?: string };
        setPageStatus("error");
        setPageMessage(
          e?.detail || e?.message || "We could not update your password. Please try again.",
        );
      }
    },
  });

  useEffect(() => {
    if (!uidb64 || !token) return;
    async function checkToken() {
      try {
        await validatePasswordResetToken(uidb64, token);
        setPageStatus("form");
      } catch (err: unknown) {
        const e = err as { detail?: string; message?: string };
        setPageStatus("invalid");
        setPageMessage(e?.detail || e?.message || "This reset link is invalid or expired.");
      }
    }
    checkToken();
  }, [uidb64, token]);

  if (pageStatus === "loading") {
    return (
      <AuthPanel title="Checking Link" description="We are validating your password reset link.">
        <p className="text-sm text-[#3e3840]">Please wait...</p>
      </AuthPanel>
    );
  }

  if (pageStatus === "invalid") {
    return (
      <AuthPanel title="Invalid Link" description={pageMessage}>
        <div className="space-y-5">
          <ResendEmailForm
            onResend={async (email) => {
              await requestPasswordReset({ email });
            }}
            submitLabel="Send New Link"
            successMessage="If an account exists, we sent a new email. Please check your inbox or spam folder."
          />
          <p className="text-center text-[0.95rem] text-[#3e3840]">
            <Link href="/login" className="text-[#3557ff] transition hover:text-[#1937cb]">
              Back to sign in
            </Link>
          </p>
        </div>
      </AuthPanel>
    );
  }

  if (pageStatus === "success") {
    return (
      <AuthPanel title="Password Updated" description="Your password has been changed successfully.">
        <AccentButton href="/login">
          Sign In
        </AccentButton>
      </AuthPanel>
    );
  }

  if (pageStatus === "error") {
    return (
      <AuthPanel title="Something Went Wrong" description={pageMessage}>
        <AccentButton
          type="button"
          onClick={() => {
            setPageStatus("form");
            setFormData(initialForm);
          }}
        >
          Try Again
        </AccentButton>
      </AuthPanel>
    );
  }

  return (
    <AuthPanel
      title="New Password"
      description="Choose a password with at least 8 characters, one uppercase letter, one lowercase letter, and one number."
    >
      <form onSubmit={handleSubmit} className="space-y-7">
        <AuthField
          id="password"
          name="password"
          type="password"
          label="New Password"
          placeholder="At least 8 characters"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          autoComplete="new-password"
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword((prev) => !prev)}
        />

        <AuthField
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          label="Confirm Password"
          placeholder="Repeat your password"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          autoComplete="new-password"
          showPassword={showConfirmPassword}
          onTogglePassword={() => setShowConfirmPassword((prev) => !prev)}
        />

        <AccentButton
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving" : "Save Password"}
        </AccentButton>
      </form>
    </AuthPanel>
  );
}
