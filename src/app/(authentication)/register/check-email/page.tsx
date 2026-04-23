"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import Link from "next/link";
import { resendVerificationEmail } from "@/features/auth/api/authApi";

function CheckEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleResend() {
    setStatus("loading");
    try {
      await resendVerificationEmail(email);
      setStatus("sent");
      setMessage("Лист надіслано повторно. Перевірте вхідні.");
    } catch {
      setStatus("error");
      setMessage("Щось пішло не так. Спробуйте пізніше.");
    }
  }

  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, "$1***$3");

  return (
    <main className="flex justify-center items-center h-screen flex-col gap-4">
      <section className="items-center text-center bg-gray-800 p-8 rounded-lg">
        <h1>Перевірте вхідні</h1>
        <p className="text-sm text-gray-400 mt-1 mb-6">
          Ми надіслали лист на <strong className="text-white">{maskedEmail}</strong>. Перейдіть за
          посиланням, щоб підтвердити акаунт.
        </p>

        {message && (
          <p className={`text-sm mb-4 ${status === "error" ? "text-red-500" : "text-green-400"}`}>
            {message}
          </p>
        )}

        <button
          onClick={handleResend}
          disabled={status === "loading" || status === "sent"}
          className="align-middle mt-2 w-lg rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white transition duration-200 hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "loading" ? "Надсилання..." : "Надіслати повторно"}
        </button>

        <p className="mt-4 text-sm text-gray-400">
          Вже підтвердили?{" "}
          <Link href="/login" className="text-blue-400 hover:underline">
            Увійти
          </Link>
        </p>
      </section>
    </main>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense>
      <CheckEmailContent />
    </Suspense>
  );
}
