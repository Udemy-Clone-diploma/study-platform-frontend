"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser, getMe } from "@/features/auth/api/authApi";
import { validateLoginForm } from "@/features/auth/model/validation";
import {
  LoginFormErrors,
  LoginFormData,
  LoginResponse,
} from "@/features/auth/model/types/loginTypes";
import { Input } from "@/shared/ui/Input";
import { setAuthCookies, setRoleCookie } from "@/shared/api/authCookies";
import Link from "next/link";

const ROLE_HOME: Record<string, string> = {
  admin: "/admin",
  moderator: "/admin",
  teacher: "/teacher",
  student: "/dashboard",
};

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

      // Fetch user before cookies are set so we pass the token explicitly
      const user = await getMe(loginResponse.access);

      await setAuthCookies(loginResponse.access, loginResponse.refresh);
      await setRoleCookie(user.role);

      router.push(ROLE_HOME[user.role] ?? "/dashboard");
    } catch (error: unknown) {
      const typedError = error as {
        message?: string;
        fields?: Record<string, string | string[]>;
      };

      if (typedError?.fields && typeof typedError.fields === "object") {
        const backendFieldErrors: LoginFormErrors = {};

        Object.entries(typedError.fields).forEach(([key, value]) => {
          const normalizedValue = Array.isArray(value) ? value[0] : String(value);
          if (key === "email" || key === "password") {
            backendFieldErrors[key] = normalizedValue;
          }
        });

        setErrors((prev) => ({
          ...prev,
          ...backendFieldErrors,
        }));
      }

      setApiError(typedError?.message || "Відбулася помилка при вході. Спробуйте ще раз.");
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
      <div className="flex flex-col gap-1">
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
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-xs text-blue-500 hover:underline">
            Забули пароль?
          </Link>
        </div>
      </div>

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
