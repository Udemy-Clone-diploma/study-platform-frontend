"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AuthPanel, resendVerificationEmail } from "@/features/auth";
import { AccentButton } from "@/shared/ui/AccentButton";

function CheckEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  const t = useTranslations("Auth.checkEmail");
  const tCommon = useTranslations("Auth.common");

  async function handleResend() {
    setStatus("loading");
    try {
      await resendVerificationEmail(email);
      setStatus("sent");
      setMessage(t("resentMessage"));
    } catch {
      setStatus("error");
      setMessage(t("genericError"));
    }
  }

  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, "$1***$3");

  return (
    <AuthPanel
      title={t("title")}
      description={t.rich("description", {
        email: maskedEmail || t("yourEmailFallback"),
        bold: (chunks) => <strong>{chunks}</strong>,
      })}
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
          {status === "loading" ? tCommon("sending") : tCommon("sendAgain")}
        </AccentButton>

        <p className="text-center text-[0.95rem] text-[#3e3840]">
          {t("alreadyVerified")}{" "}
          <Link href="/login" className="text-[#3557ff] transition hover:text-[#1937cb]">
            {t("signIn")}
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
