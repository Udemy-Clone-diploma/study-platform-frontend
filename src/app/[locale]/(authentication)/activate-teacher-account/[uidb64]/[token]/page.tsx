"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { AccentButton } from "@/shared/ui/AccentButton";
import {
  AuthField,
  AuthPanel,
  confirmTeacherInvitation,
  resendTeacherInvitation,
  ResendEmailForm,
  useAuthForm,
  validatePasswordResetForm,
  validateTeacherInvitationToken,
  type PasswordResetFormData,
} from "@/features/auth";

type PageStatus = "loading" | "invalid" | "form" | "success" | "error";

const initialForm: PasswordResetFormData = { password: "", confirmPassword: "" };

export default function ActivateTeacherAccountPage() {
  const { uidb64, token } = useParams<{ uidb64: string; token: string }>();

  const [pageStatus, setPageStatus] = useState<PageStatus>("loading");
  const [pageMessage, setPageMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showResend, setShowResend] = useState(false);

  const { formData, errors, isSubmitting, handleChange, handleSubmit } =
    useAuthForm<PasswordResetFormData>({
      initial: initialForm,
      validate: validatePasswordResetForm,
      fieldKeys: ["password", "confirmPassword"],
      submit: async (data) => {
        try {
          await confirmTeacherInvitation(uidb64, token, { password: data.password });
          setPageStatus("success");
        } catch (err: unknown) {
          const e = err as { detail?: string; message?: string };
          setPageStatus("error");
          setPageMessage(
            e?.detail || e?.message || "We could not activate your account. Please try again.",
          );
        }
      },
    });

  useEffect(() => {
    if (!uidb64 || !token) return;
    async function checkToken() {
      try {
        await validateTeacherInvitationToken(uidb64, token);
        setPageStatus("form");
      } catch (err: unknown) {
        const e = err as { detail?: string; message?: string };
        setPageStatus("invalid");
        setPageMessage(e?.detail || e?.message || "This invitation link is invalid or expired.");
      }
    }
    checkToken();
  }, [uidb64, token]);

  if (pageStatus === "loading") {
    return (
      <AuthPanel title="Checking Link" description="We are validating your invitation link.">
        <p className="text-sm text-[#3e3840]">Please wait...</p>
      </AuthPanel>
    );
  }

  if (pageStatus === "invalid") {
    return (
      <AuthPanel title="Invalid Link" description={pageMessage}>
        <div className="space-y-5">
          {!showResend ? (
            <AccentButton type="button" onClick={() => setShowResend(true)}>
              Send Again
            </AccentButton>
          ) : (
            <ResendEmailForm
              onResend={async (email) => {
                await resendTeacherInvitation(email);
              }}
              submitLabel="Resend Invitation"
              successMessage="If a pending invitation exists for this email, it has been resent. Please check your inbox or spam folder."
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

  if (pageStatus === "success") {
    return (
      <AuthPanel
        title="Account Activated"
        description="Your email is confirmed and your password is set. You can now sign in as a teacher."
      >
        <AccentButton href="/login">Sign In</AccentButton>
      </AuthPanel>
    );
  }

  if (pageStatus === "error") {
    return (
      <AuthPanel title="Something Went Wrong" description={pageMessage}>
        <AccentButton type="button" onClick={() => setPageStatus("form")}>
          Try Again
        </AccentButton>
      </AuthPanel>
    );
  }

  return (
    <AuthPanel
      title="Set Your Password"
      description="Choose a password with at least 8 characters, one uppercase letter, one lowercase letter, and one number. This also confirms your email."
    >
      <form onSubmit={handleSubmit} className="space-y-7">
        <AuthField
          id="password"
          name="password"
          type="password"
          label="Password"
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

        <AccentButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving" : "Activate Account"}
        </AccentButton>
      </form>
    </AuthPanel>
  );
}
