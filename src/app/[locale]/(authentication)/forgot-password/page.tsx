"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AuthField, AuthPanel, requestPasswordReset } from "@/features/auth";
import { AccentButton } from "@/shared/ui/AccentButton";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const t = useTranslations("Auth.forgotPassword");
  const tCommon = useTranslations("Auth.common");
  const tValidation = useTranslations("Auth.validation");

  function validateEmail(value: string): string {
    if (!value.trim()) return tValidation("enterEmail");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return tValidation("enterValidEmail");
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
        title={t("checkEmailTitle")}
        description={t.rich("checkEmailDescription", {
          email,
          bold: (chunks) => <strong>{chunks}</strong>,
        })}
      >
        <div className="space-y-5">
          <AccentButton type="button" onClick={() => setIsSent(false)}>
            {tCommon("sendAgain")}
          </AccentButton>

          <p className="text-center text-[0.95rem] text-[#3e3840]">
            <Link href="/login" className="text-[#3557ff] transition hover:text-[#1937cb]">
              {tCommon("backToSignIn")}
            </Link>
          </p>
        </div>
      </AuthPanel>
    );
  }

  return (
    <AuthPanel title={t("resetTitle")} description={t("resetDescription")}>
      <form onSubmit={handleSubmit} className="space-y-7">
        <AuthField
          id="email"
          name="email"
          type="email"
          label={tCommon("email")}
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
          <AccentButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? tCommon("sending") : t("sendLink")}
          </AccentButton>

          <p className="text-center text-[0.95rem] text-[#3e3840]">
            <Link href="/login" className="text-[#3557ff] transition hover:text-[#1937cb]">
              {tCommon("backToSignIn")}
            </Link>
          </p>
        </div>
      </form>
    </AuthPanel>
  );
}
