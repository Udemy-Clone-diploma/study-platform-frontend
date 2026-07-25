"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AuthPanel } from "@/features/auth";

function CheckApplicationContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, "$1***$3");
  const t = useTranslations("Auth.checkApplication");
  const tCommon = useTranslations("Auth.common");

  return (
    <AuthPanel
      title={t("title")}
      description={t.rich("description", {
        email: maskedEmail || t("youFallback"),
        bold: (chunks) => <strong>{chunks}</strong>,
      })}
    >
      <p className="text-center text-[0.95rem] text-[#3e3840]">
        <Link href="/login" className="text-[#3557ff] transition hover:text-[#1937cb]">
          {tCommon("backToSignIn")}
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
