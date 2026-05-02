"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  validateRegisterForm,
  validateRegisterIdentityStep,
} from "@/features/auth/model/validation";
import { RegisterFormErrors, RegisterFormData } from "@/features/auth/model/types/registerTypes";
import { registerUser } from "@/features/auth/api/authApi";
import { AuthField } from "@/features/auth/ui/AuthField";
import { AuthShell } from "@/features/auth/ui/AuthShell";
import { DateOfBirthPicker } from "@/features/auth/ui/DateOfBirthPicker";
import { AccentButton } from "@/shared/ui/AccentButton";

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

  const [formData, setFormData] = useState<RegisterFormData>(initialForm);
  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));

    setApiError("");
  }

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (step === 1) {
      handleContinue();
      return;
    }

    const validationErrors = validateRegisterForm(formData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    setApiError("");

    try {
      await registerUser({
        email: formData.email.trim(),
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        date_of_birth: formData.dateOfBirth,
        password: formData.password,
        password_confirm: formData.password_confirm,
        role: "student",
        language: "en",
      });

      router.push(`/register/check-email?email=${encodeURIComponent(formData.email.trim())}`);
    } catch (error: unknown) {
      const typedError = error as {
        message?: string;
        fields?: Record<string, string | string[]>;
      };

      if (typedError?.fields && typeof typedError.fields === "object") {
        const backendFieldErrors: RegisterFormErrors = {};

        Object.entries(typedError.fields).forEach(([key, value]) => {
          const normalizedValue = Array.isArray(value) ? value[0] : String(value);

          if (key === "first_name") {
            backendFieldErrors.firstName = normalizedValue;
          } else if (key === "last_name") {
            backendFieldErrors.lastName = normalizedValue;
          } else if (
            key === "email" ||
            key === "firstName" ||
            key === "lastName" ||
            key === "password" ||
            key === "password_confirm"
          ) {
            backendFieldErrors[key] = normalizedValue;
          }
        });

        setErrors((prev) => ({
          ...prev,
          ...backendFieldErrors,
        }));
      }

      setApiError(typedError?.message || "We could not create your account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleContinue() {
    const validationErrors = validateRegisterIdentityStep(formData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setApiError("");
    setStep(2);
  }

  return (
    <AuthShell>
      <form onSubmit={handleSubmit} className="w-full">
        <div className="w-full space-y-8">
          <h1 className="text-center text-[2.05rem] font-normal tracking-[0.04em] text-[#0f0d10] uppercase">
            Sign Up
          </h1>

          {step === 1 ? (
            <div className="grid gap-x-[120px] gap-y-9 md:grid-cols-2">
              <AuthField
                id="firstName"
                name="firstName"
                type="text"
                label="First Name"
                placeholder="Text"
                value={formData.firstName}
                onChange={handleChange}
                error={errors.firstName}
                autoComplete="given-name"
              />

              <DateOfBirthPicker
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
                label="Last Name"
                placeholder="Text"
                value={formData.lastName}
                onChange={handleChange}
                error={errors.lastName}
                autoComplete="family-name"
              />

              <AuthField
                id="email"
                name="email"
                type="email"
                label="Email"
                placeholder="Text"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                autoComplete="email"
              />
            </div>
          ) : (
            <div className="space-y-6">
              <AuthField
                id="password"
                name="password"
                type="password"
                label="Password"
                placeholder="Text"
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
                label="Repeat Password"
                placeholder="Text"
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
            <AccentButton
              type="submit"
              disabled={isSubmitting}
            >
              {step === 1 ? "Continue" : isSubmitting ? "Creating" : "Sign Up"}
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
                Back
              </button>
            ) : null}

            <p className="text-center text-[0.78rem] text-[#3e3840]">
              Already have an account?{" "}
              <Link href="/login" className="text-[#3557ff] transition hover:text-[#1937cb]">
                Sign in now
              </Link>
            </p>
          </div>

        </div>
      </form>
    </AuthShell>
  );
}
