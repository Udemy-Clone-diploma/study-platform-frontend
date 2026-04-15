"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { validateRegisterForm } from "@/features/auth/model/validation";
import {
  RegisterFormErrors,
  RegisterFormData,
} from "@/features/auth/model/types/registerTypes";
import { Input } from "@/shared/ui/Input";
import { registerUser } from "@/features/auth/api/authApi";

const initialForm: RegisterFormData = {
  email: "",
  firstName: "",
  lastName: "",
  password: "",
  confirmPassword: "",
  role: "student",
  language: "en",
};

export function RegisterForm() {
  const router = useRouter();

  const [formData, setFormData] = useState<RegisterFormData>(initialForm);
  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        password: formData.password,
        role: "student",
        language: "en",
      });

      router.push(
        `/register/check-email?email=${encodeURIComponent(formData.email.trim())}`,
      );
    } catch (error: unknown) {
      const typedError = error as {
        message?: string;
        fields?: Record<string, string | string[]>;
      };

      if (typedError?.fields && typeof typedError.fields === "object") {
        const backendFieldErrors: RegisterFormErrors = {};

        Object.entries(typedError.fields).forEach(([key, value]) => {
          const normalizedValue = Array.isArray(value)
            ? value[0]
            : String(value);

          if (key === "confirm_password") {
            backendFieldErrors.confirmPassword = normalizedValue;
          } else if (
            key === "email" ||
            key === "password" ||
            key === "confirmPassword"
          ) {
            backendFieldErrors[key] = normalizedValue;
          }
        });

        setErrors((prev) => ({
          ...prev,
          ...backendFieldErrors,
        }));
      }

      setApiError(
        typedError?.message ||
          "Відбулася помилка при реєстрації. Спробуйте ще раз.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="register-form" onSubmit={handleSubmit}>
      <Input
        id="firstName"
        name="firstName"
        type="text"
        label="First Name"
        placeholder="Введіть ім'я"
        value={formData.firstName}
        onChange={handleChange}
        error={errors.firstName}
      />

      <Input
        id="lastName"
        name="lastName"
        type="text"
        label="Last Name"
        placeholder="Введіть прізвище"
        value={formData.lastName}
        onChange={handleChange}
        error={errors.lastName}
      />

      <Input
        id="email"
        name="email"
        type="email"
        label="Email"
        placeholder="Введіть email"
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
      />

      <Input
        id="password"
        name="password"
        type="password"
        label="Password"
        placeholder="Введіть пароль"
        value={formData.password}
        onChange={handleChange}
        error={errors.password}
      />

      <Input
        id="confirmPassword"
        name="confirmPassword"
        type="password"
        label="Confirm password"
        placeholder="Підтвердіть пароль"
        value={formData.confirmPassword}
        onChange={handleChange}
        error={errors.confirmPassword}
      />

      <Input
        id="language"
        name="language"
        type="text"
        label="Language"
        placeholder="Введіть мову"
        defaultValue={"en"}
        value={formData.language}
        onChange={handleChange}
        error={errors.language}
      />
      {apiError ? <div className="form-api-error">{apiError}</div> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="align-middle mt-2 w-lg rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white transition duration-200 hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "Реєстрація..." : "Зареєструватися"}
      </button>
    </form>
  );
}
