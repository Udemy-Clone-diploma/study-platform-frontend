"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import { getMe, getRoleHome } from "@/entities/user";
import { loginUser } from "@/features/auth/api/authApi";
import { validateLoginForm } from "@/features/auth/model/validation";
import { useAuthForm } from "@/features/auth/model/useAuthForm";
import { useGoogleAuth } from "@/features/auth/model/useGoogleAuth";
import { LoginFormData } from "@/features/auth/model/types/loginTypes";
import { setAuthCookies, setRememberMeCookie, setRoleCookie } from "@/shared/api/authCookies";
import { AuthField } from "@/features/auth/ui/AuthField";
import { AuthShell } from "@/features/auth/ui/AuthShell";
import { GoogleSignInButton } from "@/features/auth/ui/GoogleSignInButton";
import { AccentButton } from "@/shared/ui/AccentButton";

const initialForm: LoginFormData = {
  email: "",
  password: "",
};

export function LoginForm() {
  const router = useRouter();
  const t = useTranslations("Auth.login");
  const tValidation = useTranslations("Auth.validation");
  const tSocial = useTranslations("Auth.social");

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const {
    handleCredential: handleGoogleCredential,
    isSubmitting: isGoogleSubmitting,
    error: googleError,
  } = useGoogleAuth({ fallbackError: tSocial("fallbackError") });

  const { formData, errors, apiError, isSubmitting, handleChange, handleSubmit } =
    useAuthForm<LoginFormData>({
      initial: initialForm,
      validate: (data) => validateLoginForm(data, tValidation),
      fieldKeys: ["email", "password"],
      fallbackError: t("fallbackError"),
      submit: async (data) => {
        const loginResponse = await loginUser({
          email: data.email.trim(),
          password: data.password,
        });

        const user = await getMe(loginResponse.access);

        await setAuthCookies(loginResponse.access, loginResponse.refresh, rememberMe);
        await setRoleCookie(user.role, rememberMe);
        await setRememberMeCookie(rememberMe);

        router.push(getRoleHome(user.role), { locale: user.language });
      },
    });

  return (
    <AuthShell contentClassName="max-w-[580px]" imageSrc="/backgrounds/login pic.svg">
      <form onSubmit={handleSubmit} className="mx-auto w-full">
        <div className="text-[#171417]">
          <div className="space-y-11">
            <div className="space-y-4 text-center">
              <h1 className="text-[2.45rem] font-medium tracking-[0.08em] text-[#171417] uppercase sm:text-[2.9rem]">
                {t("title")}
              </h1>
            </div>

            <div className="space-y-10">
              <AuthField
                id="email"
                name="email"
                label={t("emailLabel")}
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                autoComplete="username"
              />

              <AuthField
                id="password"
                name="password"
                label={t("passwordLabel")}
                type="password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                autoComplete="current-password"
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword((prev) => !prev)}
              />
            </div>

            {apiError ? <p className="text-center text-sm text-[#be3b3b]">{apiError}</p> : null}
            {googleError ? (
              <p className="text-center text-sm text-[#be3b3b]">{googleError}</p>
            ) : null}

            <div className="flex flex-col items-center gap-5">
              <AccentButton type="submit" disabled={isSubmitting}>
                {isSubmitting ? t("signingIn") : t("title")}
              </AccentButton>

              <div className="flex w-full max-w-[320px] items-center gap-4 text-[0.68rem] font-medium tracking-[0.2em] text-[#8a8590] uppercase">
                <span className="h-px flex-1 bg-black/10" />
                {tSocial("orContinueWith")}
                <span className="h-px flex-1 bg-black/10" />
              </div>

              <GoogleSignInButton
                onCredential={handleGoogleCredential}
                disabled={isGoogleSubmitting}
              />

              <p className="text-center text-[0.95rem] text-[#3e3840]">
                {t("newHere")}{" "}
                <Link href="/register" className="text-[#3557ff] transition hover:text-[#1937cb]">
                  {t("signUpNow")}
                </Link>
              </p>
            </div>

            <div className="flex flex-row items-center justify-between gap-5 text-[0.68rem] font-medium tracking-[0.26em] text-[#2f2b30] uppercase">
              <label className="inline-flex cursor-pointer items-center gap-3">
                <span className="relative flex h-4 w-4 items-center justify-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="peer sr-only"
                  />
                  <span className="h-4 w-4 border border-black/35 bg-white/35 transition peer-checked:border-black peer-checked:bg-black" />
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 12 12"
                    className="pointer-events-none absolute h-2.5 w-2.5 text-white opacity-0 transition peer-checked:opacity-100"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m2 6 2.2 2.2L10 2.5" />
                  </svg>
                </span>
                <span>{t("rememberMe")}</span>
              </label>

              <Link href="/forgot-password" className="transition hover:text-black">
                {t("resetPassword")}
              </Link>
            </div>
          </div>
        </div>
      </form>
    </AuthShell>
  );
}
