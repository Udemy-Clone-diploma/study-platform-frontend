"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { AuthPanel, ResendEmailForm, resendVerificationEmail, verifyEmail } from "@/features/auth";
import { AccentButton } from "@/shared/ui/AccentButton";

export default function VerifyEmailPage() {
  const { uidb64, token } = useParams<{ uidb64: string; token: string }>();
  const router = useRouter();
  const t = useTranslations("Auth.verifyEmail");
  const tCommon = useTranslations("Auth.common");

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
        setMessage(e?.detail || e?.message || t("invalidLinkMessage"));
      }
    }
    verify();
  }, [uidb64, token, router]);

  if (status === "loading") {
    return (
      <AuthPanel title={tCommon("checkingLink")} description={t("checkingDescription")}>
        <p className="text-sm text-[#3e3840]">{tCommon("pleaseWait")}</p>
      </AuthPanel>
    );
  }

  if (status === "success") {
    return (
      <AuthPanel title={t("successTitle")} description={message || t("successFallbackDescription")}>
        <p className="text-sm text-[#3e3840]">{t("redirecting")}</p>
      </AuthPanel>
    );
  }

  return (
    <AuthPanel title={t("failedTitle")} description={message}>
      <div className="space-y-5">
        {!showResend ? (
          <AccentButton type="button" onClick={() => setShowResend(true)}>
            {tCommon("sendAgain")}
          </AccentButton>
        ) : (
          <ResendEmailForm
            onResend={async (email) => {
              await resendVerificationEmail(email);
              router.push(`/register/check-email?email=${encodeURIComponent(email)}`);
            }}
            submitLabel={t("sendVerification")}
          />
        )}

        <p className="text-center text-[0.95rem] text-[#3e3840]">
          <Link href="/login" className="text-[#3557ff] transition hover:text-[#1937cb]">
            {tCommon("backToSignIn")}
          </Link>
        </p>
      </div>
    </AuthPanel>
  );
}
