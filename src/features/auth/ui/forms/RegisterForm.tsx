"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import {
  validateRegisterForm,
  validateRegisterIdentityStep,
} from "@/features/auth/model/validation";
import { RegisterFormData } from "@/features/auth/model/types/registerTypes";
import type { UserLanguage } from "@/entities/user";
import { registerUser } from "@/features/auth/api/authApi";
import { useAuthForm } from "@/features/auth/model/useAuthForm";
import { useGoogleAuth } from "@/features/auth/model/useGoogleAuth";
import { AuthField } from "@/features/auth/ui/AuthField";
import { AuthShell } from "@/features/auth/ui/AuthShell";
import { GoogleSignInButton } from "@/features/auth/ui/GoogleSignInButton";
import { AccentButton } from "@/shared/ui/AccentButton";
import { DatePicker, todayISO } from "@/shared/ui/DatePicker";

const initialForm: RegisterFormData = {
  email: "",
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  password: "",
  password_confirm: "",
  role: "student",
  language: "en",
};

export function RegisterForm() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Auth.register");
  const tValidation = useTranslations("Auth.validation");
  const tSocial = useTranslations("Auth.social");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const {
    handleCredential: handleGoogleCredential,
    isSubmitting: isGoogleSubmitting,
    error: googleError,
  } = useGoogleAuth({ fallbackError: tSocial("fallbackError") });

  const {
    formData,
    errors,
    apiError,
    isSubmitting,
    handleChange,
    handleSubmit,
    setFormData,
    setErrors,
    setApiError,
  } = useAuthForm<RegisterFormData>({
    initial: initialForm,
    validate: (data) => validateRegisterForm(data, tValidation),
    fieldKeys: ["email", "firstName", "lastName", "password", "password_confirm"],
    fieldKeyMap: { first_name: "firstName", last_name: "lastName" },
    fallbackError: t("fallbackError"),
    submit: async (data) => {
      await registerUser({
        email: data.email.trim(),
        first_name: data.firstName.trim(),
        last_name: data.lastName.trim(),
        date_of_birth: data.dateOfBirth,
        password: data.password,
        password_confirm: data.password_confirm,
        role: "student",
        language: locale as UserLanguage,
      });

      router.push(`/register/check-email?email=${encodeURIComponent(data.email.trim())}`);
    },
  });

  function handleFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (step === 1) {
      event.preventDefault();
      const validationErrors = validateRegisterIdentityStep(formData, tValidation);

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }

      setErrors({});
      setApiError("");
      setStep(2);
      return;
    }

    handleSubmit(event);
  }

  return (
    <AuthShell>
      <form onSubmit={handleFormSubmit} className="w-full">
        <div className="w-full space-y-8">
          <h1 className="text-center text-[2.05rem] font-normal tracking-[0.04em] text-[#0f0d10] uppercase">
            {t("title")}
          </h1>

          {step === 1 ? (
            <>
              <div className="flex flex-col items-center gap-5">
                <GoogleSignInButton
                  onCredential={handleGoogleCredential}
                  disabled={isGoogleSubmitting}
                />
                {googleError ? (
                  <p className="text-center text-sm text-[#be3b3b]">{googleError}</p>
                ) : null}

                <div className="flex w-full max-w-[320px] items-center gap-4 text-[0.68rem] font-medium tracking-[0.2em] text-[#8a8590] uppercase">
                  <span className="h-px flex-1 bg-black/10" />
                  {tSocial("orContinueWith")}
                  <span className="h-px flex-1 bg-black/10" />
                </div>
              </div>

              <div className="grid gap-x-[120px] gap-y-9 md:grid-cols-2">
                <AuthField
                  id="firstName"
                  name="firstName"
                  type="text"
                  label={t("firstNameLabel")}
                  placeholder={t("textPlaceholder")}
                  value={formData.firstName}
                  onChange={handleChange}
                  error={errors.firstName}
                  autoComplete="given-name"
                />

                <DatePicker
                  variant="underline"
                  allowTyping
                  label={t("dateOfBirthLabel")}
                  max={todayISO()}
                  value={formData.dateOfBirth}
                  error={errors.dateOfBirth}
                  onChange={(dateOfBirth) => {
                    setFormData((prev) => ({ ...prev, dateOfBirth }));
                    setErrors((prev) => ({ ...prev, dateOfBirth: "" }));
                    setApiError("");
                  }}
                />

                <AuthField
                  id="lastName"
                  name="lastName"
                  type="text"
                  label={t("lastNameLabel")}
                  placeholder={t("textPlaceholder")}
                  value={formData.lastName}
                  onChange={handleChange}
                  error={errors.lastName}
                  autoComplete="family-name"
                />

                <AuthField
                  id="email"
                  name="email"
                  type="email"
                  label={t("emailLabel")}
                  placeholder={t("textPlaceholder")}
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                  autoComplete="email"
                />
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <AuthField
                id="password"
                name="password"
                type="password"
                label={t("passwordLabel")}
                placeholder={t("textPlaceholder")}
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                autoComplete="new-password"
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword((prev) => !prev)}
              />

              <AuthField
                id="password_confirm"
                name="password_confirm"
                type="password"
                label={t("repeatPasswordLabel")}
                placeholder={t("textPlaceholder")}
                value={formData.password_confirm}
                onChange={handleChange}
                error={errors.password_confirm}
                autoComplete="new-password"
                showPassword={showConfirmPassword}
                onTogglePassword={() => setShowConfirmPassword((prev) => !prev)}
              />
            </div>
          )}

          {apiError ? <p className="text-center text-sm text-[#be3b3b]">{apiError}</p> : null}

          <div className="flex flex-col items-center gap-5">
            <AccentButton type="submit" disabled={isSubmitting}>
              {step === 1 ? t("continue") : isSubmitting ? t("creating") : t("signUp")}
            </AccentButton>

            {step === 2 ? (
              <button
                type="button"
                onClick={() => {
                  setApiError("");
                  setErrors({});
                  setStep(1);
                }}
                className="text-[0.68rem] font-medium tracking-[0.26em] text-[#2f2b30] uppercase transition hover:text-black"
              >
                {t("back")}
              </button>
            ) : null}

            <p className="text-center text-[0.78rem] text-[#3e3840]">
              {t("alreadyHaveAccount")}{" "}
              <Link href="/login" className="text-[#3557ff] transition hover:text-[#1937cb]">
                {t("signInNow")}
              </Link>
            </p>

            <p className="text-center text-[0.78rem] text-[#3e3840]">
              {t("wantToTeach")}{" "}
              <Link
                href="/register/teacher"
                className="text-[#3557ff] transition hover:text-[#1937cb]"
              >
                {t("applyAsTeacher")}
              </Link>
            </p>
          </div>
        </div>
      </form>
    </AuthShell>
  );
}
