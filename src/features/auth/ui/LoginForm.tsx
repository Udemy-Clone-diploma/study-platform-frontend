"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginUser, getMe } from "@/features/auth/api/authApi";
import { validateLoginForm } from "@/features/auth/model/validation";
import {
  LoginFormErrors,
  LoginFormData,
  LoginResponse,
} from "@/features/auth/model/types/loginTypes";
import { setAuthCookies, setRoleCookie } from "@/shared/api/authCookies";

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

interface AuthFieldProps {
  id: keyof LoginFormData;
  label: string;
  type: "email" | "password";
  value: string;
  error?: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  showPassword?: boolean;
  onTogglePassword?: () => void;
}

function AuthField({
  id,
  label,
  type,
  value,
  error,
  onChange,
  showPassword = false,
  onTogglePassword,
}: AuthFieldProps) {
  const resolvedType = type === "password" && showPassword ? "text" : type;

  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="block font-display text-[1.1rem] font-medium tracking-[0.01em] text-[#1a171b]"
      >
        {label}
      </label>

      <div className="flex items-end gap-3 border-b border-black/35 pb-2 transition focus-within:border-black/70">
        <div className="min-w-0 flex-1">
          <span className="mb-1 block text-[0.68rem] tracking-[0.22em] text-[#7f7882] uppercase">
            Text
          </span>
          <input
            id={id}
            name={id}
            type={resolvedType}
            value={value}
            onChange={onChange}
            autoComplete={type === "password" ? "current-password" : "username"}
            className="w-full border-0 bg-transparent text-base text-[#1a171b] outline-none placeholder:text-[#aaa4ab]"
            placeholder=""
          />
        </div>

        {type === "password" && onTogglePassword ? (
          <button
            type="button"
            onClick={onTogglePassword}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="mb-1 inline-flex h-8 w-8 items-center justify-center rounded-full text-[#78717a] transition hover:bg-black/5 hover:text-black"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-[1.1rem] w-[1.1rem]"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 12s3.8-6 10-6 10 6 10 6-3.8 6-10 6S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
              {showPassword ? null : <path d="M4 20 20 4" />}
            </svg>
          </button>
        ) : null}
      </div>

      {error ? <p className="text-sm text-[#be3b3b]">{error}</p> : null}
    </div>
  );
}

export function LoginForm() {
  const router = useRouter();

  const [formData, setFormData] = useState<LoginFormData>(initialForm);
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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

      setApiError(typedError?.message || "We could not sign you in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-[520px]">
      <div className="rounded-[2rem] px-4 py-6 text-[#171417] sm:px-6">
        <div className="space-y-11">
          <div className="space-y-4 text-center">
            <h1 className="font-display text-[2.45rem] font-medium tracking-[0.08em] text-[#171417] uppercase sm:text-[2.9rem]">
              Sign In
            </h1>
          </div>

          <div className="space-y-10">
            <AuthField
              id="email"
              label="Username"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
            />

            <AuthField
              id="password"
              label="Password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword((prev) => !prev)}
            />
          </div>

          {apiError ? <p className="text-center text-sm text-[#be3b3b]">{apiError}</p> : null}

          <div className="flex flex-col items-center gap-5">
            <button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[8.4rem] rounded-full bg-[#09070a] px-9 py-3 text-[0.73rem] font-medium tracking-[0.32em] text-white uppercase transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Signing In" : "Sign In"}
            </button>

            <p className="text-center text-[0.95rem] text-[#3e3840]">
              Already a member?{" "}
              <Link href="/register" className="text-[#3557ff] transition hover:text-[#1937cb]">
                Sign up now
              </Link>
            </p>
          </div>

          <div className="flex flex-col gap-5 text-[0.68rem] font-medium tracking-[0.26em] text-[#2f2b30] uppercase sm:flex-row sm:items-center sm:justify-between">
            <label className="inline-flex cursor-pointer items-center gap-3 self-start">
              <span className="relative flex h-4 w-4 items-center justify-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="peer sr-only"
                />
                <span className="h-4 w-4 border border-black/35 bg-white/35 transition peer-checked:bg-black peer-checked:border-black" />
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
              <span>Remember Me</span>
            </label>

            <Link href="/forgot-password" className="transition hover:text-black">
              Reset Password
            </Link>
          </div>
        </div>
      </div>
    </form>
  );
}
