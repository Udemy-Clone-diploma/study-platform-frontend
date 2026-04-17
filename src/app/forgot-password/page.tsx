"use client";
import { useState } from "react";
import Link from "next/link";
import { Input } from "@/shared/ui/Input";
import { requestPasswordReset } from "@/features/auth/api/authApi";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  function validateEmail(value: string): string {
    if (!value.trim()) return "Введіть email";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Введіть коректний email";
    return "";
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const error = validateEmail(email);
    if (error) {
      setEmailError(error);
      return;
    }

    setIsSubmitting(true);
    setEmailError("");

    try {
      await requestPasswordReset({ email: email.trim() });
      setIsSent(true);
    } catch {
      setIsSent(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSent) {
    return (
      <main className="flex min-h-screen bg-gray-900 items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md text-center">
          <h1 className="text-2xl font-semibold mb-3">Перевірте вхідні</h1>
          <p className="text-gray-600 mb-2">
            Якщо акаунт з адресою <strong>{email}</strong> існує, ми надіслали посилання для
            скидання пароля.
          </p>
          <p className="text-sm text-gray-400 mb-6">
            Не отримали? Перевірте папку&nbsp;
            <span className="font-medium">Спам</span>.
          </p>

          <button
            onClick={() => setIsSent(false)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition mb-3"
          >
            Надіслати повторно
          </button>

          <Link href="/login" className="block text-sm text-blue-500 hover:underline">
            Повернутися до входу
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md">
        <h1 className="text-gray-500 text-2xl font-semibold mb-2">Скидання пароля</h1>
        <p className="text-sm text-gray-500 mb-6">
          Введіть email, повязаний із вашим акаунтом, і ми надішлемо посилання для скидання пароля.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="email"
            className="text-sm text-gray-500 mb-6"
            name="email"
            type="email"
            label="Email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError("");
            }}
            error={emailError}
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Надсилання..." : "Надіслати посилання"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-400">
          <Link href="/login" className="text-blue-500 hover:underline">
            Повернутися до входу
          </Link>
        </p>
      </div>
    </main>
  );
}
