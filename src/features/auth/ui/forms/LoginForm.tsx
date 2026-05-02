"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginUser, getMe } from "@/features/auth/api/authApi";
import { validateLoginForm } from "@/features/auth/model/validation";
import { useAuthForm } from "@/features/auth/model/useAuthForm";
import { LoginFormData } from "@/features/auth/model/types/loginTypes";
import type { UserRole } from "@/features/auth/model/types/userData";
import { setAuthCookies, setRoleCookie } from "@/shared/api/authCookies";
import { AuthField } from "@/features/auth/ui/AuthField";
import { AuthShell } from "@/features/auth/ui/AuthShell";
import { AccentButton } from "@/shared/ui/AccentButton";
import type { UserRole } from "@/features/auth/model/types/userData";

const ROLE_HOME: Record<UserRole, string> = {
  administrator: "/admin",
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

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { formData, errors, apiError, isSubmitting, handleChange, handleSubmit } =
    useAuthForm<LoginFormData>({
      initial: initialForm,
      validate: validateLoginForm,
      fieldKeys: ["email", "password"],
      fallbackError: "We could not sign you in. Please try again.",
      submit: async (data) => {
        const loginResponse = await loginUser({
          email: data.email.trim(),
          password: data.password,
        });

        const user = await getMe(loginResponse.access);

        await setAuthCookies(loginResponse.access, loginResponse.refresh);
        await setRoleCookie(user.role);

        router.push(ROLE_HOME[user.role] ?? "/dashboard");
      },
    });

  return (
    <AuthShell contentClassName="max-w-[520px]">
      <form onSubmit={handleSubmit} className="mx-auto w-full">
        <div className="text-[#171417]">
        <div className="space-y-11">
          <div className="space-y-4 text-center">
            <h1 className="text-[2.45rem] font-medium tracking-[0.08em] text-[#171417] uppercase sm:text-[2.9rem]">
              Sign In
            </h1>
          </div>

          <div className="space-y-10">
            <AuthField
              id="email"
              name="email"
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              autoComplete="username"
            />

            <AuthField
              id="password"
              name="password"
              label="Password"
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

          <div className="flex flex-col items-center gap-5">
            <AccentButton
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing In" : "Sign In"}
            </AccentButton>

            <p className="text-center text-[0.95rem] text-[#3e3840]">
              New here?{" "}
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
              <span>Remember Me</span>
            </label>

            <Link href="/forgot-password" className="transition hover:text-black">
              Reset Password
            </Link>
          </div>
        </div>
        </div>
      </form>
    </AuthShell>
  );
}
