"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import { AuthField, AuthShell, useAuthForm } from "@/features/auth";
import { checkTeacherApplicationEmail, submitTeacherApplication } from "@/entities/teacher-application";
import { AccentButton } from "@/shared/ui/AccentButton";
import { DatePicker, todayISO } from "@/shared/ui/DatePicker";
import {
  validateApplicationBasicStep,
  validateApplicationProfileStep,
  validateTeacherApplicationForm,
} from "@/features/teacher-application/model/validation";
import type {
  TeacherApplicationFormData,
  TeacherApplicationFormErrors,
} from "@/features/teacher-application/model/types";
import { ApplicationTextareaField } from "./ApplicationTextareaField";
import { DirectionsPicker } from "./DirectionsPicker";

const initialForm: TeacherApplicationFormData = {
  firstName: "",
  lastName: "",
  email: "",
  dateOfBirth: "",
  phoneNumber: "",
  bio: "",
  experience: "",
  specialization: "",
  yearsExperience: "",
  directions: [],
  motivation: "",
  instagram: "",
  linkedin: "",
  behance: "",
};

type Step = 1 | 2 | 3;

/** Public "register as a teacher" application form — submitted for moderator review, no account is created yet. */
export function TeacherApplicationForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const t = useTranslations("TeacherApplication");
  const tAuth = useTranslations("Auth.register");
  const tValidationAuth = useTranslations("Auth.validation");
  const tValidation = useTranslations("TeacherApplication.validation");

  const { formData, errors, apiError, isSubmitting, handleChange, handleSubmit, setFormData, setErrors, setApiError } =
    useAuthForm<TeacherApplicationFormData>({
      initial: initialForm,
      validate: (data) => validateTeacherApplicationForm(data, tValidationAuth, tValidation),
      fieldKeys: [
        "email",
        "bio",
        "experience",
        "specialization",
        "directions",
        "motivation",
        "instagram",
        "linkedin",
        "behance",
      ],
      fieldKeyMap: {
        first_name: "firstName",
        last_name: "lastName",
        date_of_birth: "dateOfBirth",
        phone_number: "phoneNumber",
        years_experience: "yearsExperience",
      },
      fallbackError: t("fallbackError"),
      submit: async (data) => {
        await submitTeacherApplication({
          first_name: data.firstName.trim(),
          last_name: data.lastName.trim(),
          email: data.email.trim(),
          date_of_birth: data.dateOfBirth,
          phone_number: data.phoneNumber.trim(),
          bio: data.bio.trim(),
          experience: data.experience.trim(),
          specialization: data.specialization.trim(),
          years_experience: data.yearsExperience.trim() ? Number(data.yearsExperience) : null,
          directions: data.directions,
          motivation: data.motivation.trim(),
          instagram: data.instagram.trim(),
          linkedin: data.linkedin.trim(),
          behance: data.behance.trim(),
        });

        router.push(`/register/teacher/check-application?email=${encodeURIComponent(data.email.trim())}`);
      },
    });

  async function checkEmailAvailability(email: string): Promise<boolean> {
    const trimmed = email.trim();
    if (!trimmed) return true;

    setCheckingEmail(true);
    try {
      const result = await checkTeacherApplicationEmail(trimmed);
      if (!result.available) {
        setErrors((prev) => ({ ...prev, email: result.detail || t("emailUnavailable") }));
        return false;
      }
      return true;
    } catch {
      // Network hiccup: don't block the user here, the server re-validates on submit.
      return true;
    } finally {
      setCheckingEmail(false);
    }
  }

  function handleTextareaChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setApiError("");
  }

  function goToStep(
    next: Step,
    validator: (data: TeacherApplicationFormData) => TeacherApplicationFormErrors,
  ) {
    const validationErrors = validator(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setApiError("");
    setStep(next);
  }

  async function handleFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (step === 1) {
      event.preventDefault();
      const validationErrors = validateApplicationBasicStep(formData, tValidationAuth, tValidation);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }
      if (!(await checkEmailAvailability(formData.email))) return;
      setErrors({});
      setApiError("");
      setStep(2);
      return;
    }
    if (step === 2) {
      event.preventDefault();
      goToStep(3, (data) => validateApplicationProfileStep(data, tValidation));
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
            <div className="grid gap-x-[120px] gap-y-9 md:grid-cols-2">
              <AuthField
                id="firstName"
                name="firstName"
                type="text"
                label={t("firstNameLabel")}
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
                value={formData.email}
                onChange={handleChange}
                onBlur={(event) => checkEmailAvailability(event.target.value)}
                error={errors.email}
                autoComplete="email"
              />

              <AuthField
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                label={t("phoneNumberLabel")}
                value={formData.phoneNumber}
                onChange={handleChange}
                error={errors.phoneNumber}
                autoComplete="tel"
              />
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-6">
              <div className="grid gap-x-[120px] gap-y-9 md:grid-cols-2">
                <AuthField
                  id="specialization"
                  name="specialization"
                  type="text"
                  label={t("fieldOfStudyLabel")}
                  value={formData.specialization}
                  onChange={handleChange}
                  error={errors.specialization}
                />

                <AuthField
                  id="yearsExperience"
                  name="yearsExperience"
                  type="number"
                  min={0}
                  label={t("yearsExperienceLabel")}
                  value={formData.yearsExperience}
                  onChange={handleChange}
                  error={errors.yearsExperience}
                />
              </div>

              <ApplicationTextareaField
                id="experience"
                name="experience"
                label={t("workExperienceLabel")}
                value={formData.experience}
                onChange={handleTextareaChange}
                error={errors.experience}
              />

              <ApplicationTextareaField
                id="bio"
                name="bio"
                label={t("bioLabel")}
                value={formData.bio}
                onChange={handleTextareaChange}
                error={errors.bio}
              />
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-6">
              <DirectionsPicker
                value={formData.directions}
                onChange={(directions) => setFormData((prev) => ({ ...prev, directions }))}
              />

              <ApplicationTextareaField
                id="motivation"
                name="motivation"
                label={t("motivationLabel")}
                value={formData.motivation}
                onChange={handleTextareaChange}
                error={errors.motivation}
              />

              <div className="grid gap-x-[120px] gap-y-9 md:grid-cols-2">
                <AuthField
                  id="linkedin"
                  name="linkedin"
                  type="url"
                  label={t("linkedinLabel")}
                  value={formData.linkedin}
                  onChange={handleChange}
                  error={errors.linkedin}
                />

                <AuthField
                  id="instagram"
                  name="instagram"
                  type="url"
                  label={t("instagramLabel")}
                  value={formData.instagram}
                  onChange={handleChange}
                  error={errors.instagram}
                />

                <AuthField
                  id="behance"
                  name="behance"
                  type="url"
                  label={t("behanceLabel")}
                  value={formData.behance}
                  onChange={handleChange}
                  error={errors.behance}
                />
              </div>
            </div>
          ) : null}

          {apiError ? <p className="text-center text-sm text-[#be3b3b]">{apiError}</p> : null}

          <div className="flex flex-col items-center gap-5">
            <AccentButton type="submit" disabled={isSubmitting || checkingEmail}>
              {step < 3
                ? checkingEmail
                  ? t("checkingEmail")
                  : tAuth("continue")
                : isSubmitting
                  ? t("submitting")
                  : t("submitApplication")}
            </AccentButton>

            {step > 1 ? (
              <button
                type="button"
                onClick={() => {
                  setApiError("");
                  setErrors({});
                  setStep((prev) => (prev - 1) as Step);
                }}
                className="text-[0.68rem] font-medium tracking-[0.26em] text-[#2f2b30] uppercase transition hover:text-black"
              >
                {tAuth("back")}
              </button>
            ) : null}

            <p className="text-center text-[0.78rem] text-[#3e3840]">
              {tAuth("alreadyHaveAccount")}{" "}
              <Link href="/login" className="text-[#3557ff] transition hover:text-[#1937cb]">
                {tAuth("signInNow")}
              </Link>
            </p>
          </div>
        </div>
      </form>
    </AuthShell>
  );
}
