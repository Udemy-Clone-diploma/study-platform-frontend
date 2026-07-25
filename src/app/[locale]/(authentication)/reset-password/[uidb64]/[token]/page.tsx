"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AccentButton } from "@/shared/ui/AccentButton";
import {
  AuthField,
  AuthPanel,
  ResendEmailForm,
  confirmPasswordReset,
  requestPasswordReset,
  useAuthForm,
  validatePasswordResetForm,
  validatePasswordResetToken,
  type PasswordResetFormData,
} from "@/features/auth";

type PageStatus = "loading" | "invalid" | "form" | "success" | "error";

const initialForm: PasswordResetFormData = { password: "", confirmPassword: "" };

export default function ResetPasswordPage() {
  const { uidb64, token } = useParams<{ uidb64: string; token: string }>();
  const t = useTranslations("Auth.resetPassword");
  const tCommon = useTranslations("Auth.common");
  const tValidation = useTranslations("Auth.validation");

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
    validate: (data) => validatePasswordResetForm(data, tValidation),
    fieldKeys: ["password", "confirmPassword"],
    submit: async (data) => {
      try {
        await confirmPasswordReset(uidb64, token, { password: data.password });
        setPageStatus("success");
      } catch (err: unknown) {
        const e = err as { detail?: string; message?: string };
        setPageStatus("error");
        setPageMessage(e?.detail || e?.message || t("fallbackError"));
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
        setPageMessage(e?.detail || e?.message || t("invalidLinkMessage"));
      }
    }
    checkToken();
  }, [uidb64, token]);

  if (pageStatus === "loading") {
    return (
      <AuthPanel title={tCommon("checkingLink")} description={t("checkingDescription")}>
        <p className="text-sm text-[#3e3840]">{tCommon("pleaseWait")}</p>
      </AuthPanel>
    );
  }

  if (pageStatus === "invalid") {
    return (
      <AuthPanel title={t("invalidTitle")} description={pageMessage}>
        <div className="space-y-5">
          <ResendEmailForm
            onResend={async (email) => {
              await requestPasswordReset({ email });
            }}
            submitLabel={t("sendNewLink")}
            successMessage={t("resendSuccessMessage")}
          />
          <p className="text-center text-[0.95rem] text-[#3e3840]">
            <Link href="/login" className="text-[#3557ff] transition hover:text-[#1937cb]">
              {tCommon("backToSignIn")}
            </Link>
          </p>
        </div>
      </AuthPanel>
    );
  }

  if (pageStatus === "success") {
    return (
      <AuthPanel title={t("successTitle")} description={t("successDescription")}>
        <AccentButton href="/login">
          {tCommon("signIn")}
        </AccentButton>
      </AuthPanel>
    );
  }

  if (pageStatus === "error") {
    return (
      <AuthPanel title={tCommon("somethingWrong")} description={pageMessage}>
        <AccentButton
          type="button"
          onClick={() => {
            setPageStatus("form");
            setFormData(initialForm);
          }}
        >
          {tCommon("tryAgain")}
        </AccentButton>
      </AuthPanel>
    );
  }

  return (
    <AuthPanel
      title={t("newPasswordTitle")}
      description={t("newPasswordDescription")}
    >
      <form onSubmit={handleSubmit} className="space-y-7">
        <AuthField
          id="password"
          name="password"
          type="password"
          label={t("newPasswordLabel")}
          placeholder={t("passwordPlaceholder")}
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
          label={tCommon("confirmPassword")}
          placeholder={t("repeatPasswordPlaceholder")}
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
          {isSubmitting ? tCommon("saving") : t("savePassword")}
        </AccentButton>
      </form>
    </AuthPanel>
  );
}
