"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { getMe, getRoleHome } from "@/entities/user";
import { googleLogin } from "@/features/auth/api/authApi";
import { setAuthCookies, setRememberMeCookie, setRoleCookie } from "@/shared/api/authCookies";
import type { ApiError } from "@/shared/api/base";

interface UseGoogleAuthOptions {
  fallbackError: string;
}

/** Completes Google sign-in/sign-up: exchanges the ID token, sets session cookies, redirects. */
export function useGoogleAuth({ fallbackError }: UseGoogleAuthOptions) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleCredential(idToken: string) {
    setIsSubmitting(true);
    setError("");

    try {
      const tokens = await googleLogin(idToken);
      const user = await getMe(tokens.access);

      await setAuthCookies(tokens.access, tokens.refresh, true);
      await setRoleCookie(user.role, true);
      await setRememberMeCookie(true);

      router.push(getRoleHome(user.role), { locale: user.language });
    } catch (err: unknown) {
      const typedError = err as Partial<ApiError>;
      setError(typedError?.message || fallbackError);
      setIsSubmitting(false);
    }
  }

  return { handleCredential, isSubmitting, error };
}
