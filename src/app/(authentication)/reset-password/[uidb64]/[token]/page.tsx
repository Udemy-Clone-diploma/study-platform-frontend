"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/shared/ui/Input";
import { ResendEmailForm } from "@/features/auth/ui/ResendEmailForm";
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

const initialForm: PasswordResetFormData = { password: "", confirmPassword: "" };

export default function ResetPasswordPage() {
  const { uidb64, token } = useParams<{ uidb64: string; token: string }>();

  const [pageStatus, setPageStatus] = useState<PageStatus>("loading");
  const [pageMessage, setPageMessage] = useState("");
  const [formData, setFormData] = useState<PasswordResetFormData>(initialForm);
  const [errors, setErrors] = useState<PasswordResetFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  if (pageStatus === "loading") {
    return (
      <main className="flex justify-center items-center h-screen flex-col gap-4">
        <section className="items-center text-center bg-gray-800 p-8 rounded-lg">
          <p className="text-gray-400">Перевірка посилання...</p>
        </section>
      </main>
    );
  }

  if (pageStatus === "invalid") {
    return (
      <main className="flex justify-center items-center h-screen flex-col gap-4">
        <section className="items-center text-center bg-gray-800 p-8 rounded-lg">
          <h1>Посилання недійсне</h1>
          <p className="text-sm text-gray-400 mt-1 mb-4">{pageMessage}</p>
          <ResendEmailForm
            onResend={async (email) => {
              await requestPasswordReset({ email });
            }}
            submitLabel="Надіслати новий лист"
            successMessage="Якщо акаунт існує, ми надіслали новий лист. Перевірте вхідні або спам."
          />
          <p className="mt-4 text-sm text-gray-400">
            <Link href="/login" className="text-blue-400 hover:underline">
              Повернутися до входу
            </Link>
          </p>
        </section>
      </main>
    );
  }

  if (pageStatus === "success") {
    return (
      <main className="flex justify-center items-center h-screen flex-col gap-4">
        <section className="items-center text-center bg-gray-800 p-8 rounded-lg">
          <h1>Пароль змінено!</h1>
          <p className="text-sm text-gray-400 mt-1 mb-6">Ваш пароль успішно оновлено.</p>
          <Link
            href="/login"
            className="align-middle mt-2 w-lg rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white transition duration-200 hover:bg-gray-900 block"
          >
            Увійти
          </Link>
        </section>
      </main>
    );
  }

  if (pageStatus === "error") {
    return (
      <main className="flex justify-center items-center h-screen flex-col gap-4">
        <section className="items-center text-center bg-gray-800 p-8 rounded-lg">
          <h1>Помилка</h1>
          <p className="text-sm text-gray-400 mt-1 mb-6">{pageMessage}</p>
          <button
            onClick={() => {
              setPageStatus("form");
              setFormData(initialForm);
            }}
            className="align-middle mt-2 w-lg rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white transition duration-200 hover:bg-gray-900"
          >
            Спробувати ще раз
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="flex justify-center items-center h-screen flex-col gap-4">
      <section className="items-center text-center bg-gray-800 p-8 rounded-lg">
        <h1>Новий пароль</h1>
        <p className="text-sm text-gray-400 mt-1 mb-6">
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
            className="align-middle mt-2 w-full rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white transition duration-200 hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Збереження..." : "Зберегти пароль"}
          </button>
        </form>
      </section>
    </main>
  );
}
