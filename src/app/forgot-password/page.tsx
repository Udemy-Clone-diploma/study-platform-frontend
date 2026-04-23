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
      <main className="flex justify-center items-center h-screen flex-col gap-4">
        <section className="items-center text-center bg-gray-800 p-8 rounded-lg">
          <h1>Перевірте вхідні</h1>
          <p className="text-sm text-gray-400 mt-2 mb-6">
            Якщо акаунт з адресою <strong className="text-white">{email}</strong> існує, ми
            надіслали посилання для скидання пароля.
          </p>

          <button
            onClick={() => setIsSent(false)}
            className="w-full rounded-lg border border-gray-600 px-4 py-3 text-sm font-medium text-gray-300 hover:bg-gray-700 transition mb-3"
          >
            Надіслати повторно
          </button>

          <Link href="/login" className="text-sm text-blue-400 hover:underline">
            Повернутися до входу
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="flex justify-center items-center h-screen flex-col gap-4">
      <section className="items-center text-center bg-gray-800 p-8 rounded-lg">
        <h1>Скидання пароля</h1>
        <p className="text-sm text-gray-400 mt-1 mb-6">
          Введіть email, повязаний із вашим акаунтом, і ми надішлемо посилання.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="email"
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
            className="align-middle mt-2 w-lg rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white transition duration-200 hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Надсилання..." : "Надіслати посилання"}
          </button>
        </form>

        <p className="mt-4 text-sm text-gray-400">
          <Link href="/login" className="text-blue-400 hover:underline">
            Повернутися до входу
          </Link>
        </p>
      </section>
    </main>
  );
}
