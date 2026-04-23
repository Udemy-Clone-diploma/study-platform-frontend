"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ResendEmailForm } from "@/features/auth/ui/ResendEmailForm";
import { resendVerificationEmail, verifyEmail } from "@/features/auth/api/authApi";

export default function VerifyEmailPage() {
  const { uidb64, token } = useParams<{ uidb64: string; token: string }>();
  const router = useRouter();

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [showResend, setShowResend] = useState(false);

  useEffect(() => {
    if (!uidb64 || !token) return;
    async function verify() {
      try {
        const res = await verifyEmail(uidb64, token);
        setStatus("success");
        setMessage(res.detail);
        setTimeout(() => router.push("/login"), 3000);
      } catch (error: unknown) {
        const e = error as { detail?: string; message?: string };
        setStatus("error");
        setMessage(e?.detail || e?.message || "Invalid or expired link");
      }
    }
    verify();
  }, [uidb64, token, router]);

  if (status === "loading") {
    return (
      <main className="flex justify-center items-center h-screen flex-col gap-4">
        <section className="items-center text-center bg-gray-800 p-8 rounded-lg">
          <p className="text-gray-400">Перевірка...</p>
        </section>
      </main>
    );
  }

  if (status === "success") {
    return (
      <main className="flex justify-center items-center h-screen flex-col gap-4">
        <section className="items-center text-center bg-gray-800 p-8 rounded-lg">
          <h1>Email підтверджено ✓</h1>
          <p className="text-sm text-gray-400 mt-2">{message}</p>
          <p className="text-xs text-gray-500 mt-1">Перенаправлення на сторінку входу...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="flex justify-center items-center h-screen flex-col gap-4">
      <section className="items-center text-center bg-gray-800 p-8 rounded-lg">
        <h1>Помилка підтвердження</h1>

        {!showResend ? (
          <>
            <p className="text-sm text-gray-400 mt-1 mb-4">{message}</p>
            <button
              onClick={() => setShowResend(true)}
              className="align-middle mt-2 w-lg rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white transition duration-200 hover:bg-gray-900"
            >
              Надіслати лист повторно
            </button>
          </>
        ) : (
          <ResendEmailForm
            onResend={async (email) => {
              await resendVerificationEmail(email);
              router.push(`/register/check-email?email=${encodeURIComponent(email)}`);
            }}
            submitLabel="Надіслати лист підтвердження"
          />
        )}

        <p className="mt-4 text-sm text-gray-400">
          <Link href="/login" className="text-blue-400 hover:underline">
            Повернутися до входу
          </Link>
        </p>
      </section>
    </main>
  );
}
