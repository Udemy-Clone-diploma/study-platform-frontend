"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "../api/authApi";
import { validateLoginForm } from "../model/validation";
import {
  LoginFormErrors,
  LoginFormData,
  LoginResponse,
} from "../model/types/loginTypes";
import { Input } from "../../../shared/ui/Input";
//import { saveTokensCookies } from "@/shared/api/cookieStorage";
import { saveTokens } from "@/shared/api/tokenStorage";

const initialForm: LoginFormData = {
  email: "",
  password: "",
};

export function LoginForm() {
  const router = useRouter();

  const [formData, setFormData] = useState<LoginFormData>(initialForm);
  const [errors, setErrors] = useState<LoginFormErrors>({});
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

    const validationErrors = validateLoginForm(formData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    setApiError("");

    try {
      const loginResponse: LoginResponse = await loginUser({
        email: formData.email.trim(),
        password: formData.password,
      });

      // await saveTokensCookies(loginResponse.access, loginResponse.refresh);
      saveTokens(loginResponse.access, loginResponse.refresh);

      router.push("/dashboard");
    } catch (error: unknown) {
      const typedError = error as {
        message?: string;
        fields?: Record<string, string | string[]>;
      };

      if (typedError?.fields && typeof typedError.fields === "object") {
        const backendFieldErrors: LoginFormErrors = {};

        Object.entries(typedError.fields).forEach(([key, value]) => {
          const normalizedValue = Array.isArray(value)
            ? value[0]
            : String(value);
          if (key === "email" || key === "password") {
            backendFieldErrors[key] = normalizedValue;
          }
        });

        setErrors((prev) => ({
          ...prev,
          ...backendFieldErrors,
        }));
      }

      setApiError(
        typedError?.message || "Відбулася помилка при вході. Спробуйте ще раз.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
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

      {apiError ? <div className="form-api-error">{apiError}</div> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="align-middle mt-2 w-lg rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white transition duration-200 hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "Вхід..." : "Увійти"}
      </button>
    </form>
  );
}
