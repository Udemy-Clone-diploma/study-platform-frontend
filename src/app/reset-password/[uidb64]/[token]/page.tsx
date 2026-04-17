"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/shared/ui/Input";
import {
  validatePasswordResetToken,
  confirmPasswordReset,
  requestPasswordReset,
} from "@/features/auth/api/authApi";
import { validatePasswordResetForm } from "@/features/auth/model/validation";
import type {
  PasswordResetFormData,
  PasswordResetFormErrors,
} from "@/features/auth/model/types/passwordResetTypes";

type PageStatus = "loading" | "invalid" | "form" | "success" | "error";

const initialForm: PasswordResetFormData = {
  password: "",
  confirmPassword: "",
};

export default function ResetPasswordPage() {
  const { uidb64, token } = useParams<{ uidb64: string; token: string }>();

  const [pageStatus, setPageStatus] = useState<PageStatus>("loading");
  const [pageMessage, setPageMessage] = useState("");

  const [formData, setFormData] = useState<PasswordResetFormData>(initialForm);
  const [errors, setErrors] = useState<PasswordResetFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showResendForm, setShowResendForm] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [resendStatus, setResendStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [resendMessage, setResendMessage] = useState("");

  useEffect(() => {
    if (!uidb64 || !token) return;

    async function checkToken() {
      try {
        await validatePasswordResetToken(uidb64, token);
        setPageStatus("form");
      } catch (err: unknown) {
        const e = err as { detail?: string; message?: string };
        setPageStatus("invalid");
        setPageMessage(e?.detail || e?.message || "Посилання недійсне або прострочене");
      }
    }

    checkToken();
  }, [uidb64, token]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const validationErrors = validatePasswordResetForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      await confirmPasswordReset(uidb64, token, { password: formData.password });
      setPageStatus("success");
    } catch (err: unknown) {
      const e = err as { detail?: string; message?: string };
      setPageStatus("error");
      setPageMessage(e?.detail || e?.message || "Не вдалося змінити пароль. Спробуйте ще раз.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!resendEmail) return;

    setResendStatus("loading");
    setResendMessage("");

    try {
      await requestPasswordReset({ email: resendEmail });
      setResendStatus("sent");
      setResendMessage(
        `Якщо акаунт з адресою ${resendEmail} існує, ми надіслали новий лист. Перевірте вхідні або спам.`,
      );
    } catch {
      setResendStatus("error");
      setResendMessage("Щось пішло не так. Спробуйте пізніше.");
    }
  }

  if (pageStatus === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Перевірка посилання...</p>
      </main>
    );
  }

  if (pageStatus === "invalid") {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md text-center">
          <h1 className="text-2xl font-semibold text-red-600 mb-3">Посилання недійсне</h1>
          <p className="text-gray-600 mb-6">{pageMessage}</p>

          {resendStatus === "sent" ? (
            <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 mb-4">
              <p className="text-gray-600 mb-6"> {resendMessage}</p>
            </div>
          ) : !showResendForm ? (
            <button
              onClick={() => setShowResendForm(true)}
              className="w-full rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white hover:bg-gray-700 transition"
            >
              Надіслати новий лист
            </button>
          ) : (
            <form onSubmit={handleResend} className="flex flex-col gap-3 text-left">
              <p className="text-sm text-gray-600">
                Введіть ваш email, щоб отримати нове посилання
              </p>
              <Input
                id="resendEmail"
                name="resendEmail"
                type="email"
                label="Email"
                placeholder="your@email.com"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
              />
              {resendStatus === "error" && <p className="text-sm text-red-500">{resendMessage}</p>}
              <button
                type="submit"
                disabled={!resendEmail || resendStatus === "loading"}
                className="w-full rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white hover:bg-gray-700 transition disabled:opacity-50"
              >
                {resendStatus === "loading" ? "Надсилання..." : "Надіслати"}
              </button>
            </form>
          )}

          <p className="mt-4 text-sm text-gray-400">
            <Link href="/login" className="text-blue-500 hover:underline">
              Повернутися до входу
            </Link>
          </p>
        </div>
      </main>
    );
  }

  if (pageStatus === "success") {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md text-center">
          <h1 className="text-2xl font-semibold text-green-600 mb-3">Пароль змінено!</h1>
          <p className="text-gray-600 mb-6">
            Ваш пароль успішно оновлено. Тепер ви можете увійти з новим паролем.
          </p>
          <Link
            href="/login"
            className="block w-full rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white text-center hover:bg-gray-700 transition"
          >
            Увійти
          </Link>
        </div>
      </main>
    );
  }

  if (pageStatus === "error") {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md text-center">
          <h1 className="text-2xl font-semibold text-red-600 mb-3">Помилка</h1>
          <p className="text-gray-600 mb-6">{pageMessage}</p>
          <button
            onClick={() => {
              setPageStatus("form");
              setFormData(initialForm);
            }}
            className="w-full rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white hover:bg-gray-700 transition"
          >
            Спробувати ще раз
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md">
        <h1 className="text-2xl font-semibold mb-2">Новий пароль</h1>
        <p className="text-sm text-gray-500 mb-6">
          Введіть новий пароль. Він має містити щонайменше 8 символів, велику та малу літеру і
          цифру.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="password"
            name="password"
            type="password"
            label="Новий пароль"
            placeholder="Введіть новий пароль"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
          />

          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            label="Підтвердіть пароль"
            placeholder="Повторіть новий пароль"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Збереження..." : "Зберегти пароль"}
          </button>
        </form>
      </div>
    </main>
  );
}
