"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { resendVerificationEmail } from "@/features/auth/api/authApi";
import { Suspense } from "react";
import Link from "next/link";

function CheckEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleResend() {
    console.log("email:", email);
    setStatus("loading");
    try {
      await resendVerificationEmail(email);
      setStatus("sent");
      setMessage("The email has been resent. Please check your email");
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again later");
    }
  }

  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, "$1***$3");

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md text-center">
        <h1 className="text-2xl font-semibold mb-3">Check your email.</h1>
        <p className="text-gray-600 mb-6">
          We sent a letter to <strong>{maskedEmail}</strong>. Follow the link in the email to verify
          your account.
        </p>

        {message && (
          <p className={`text-sm mb-4 ${status === "error" ? "text-red-500" : "text-green-600"}`}>
            {message}
          </p>
        )}

        <button
          onClick={handleResend}
          disabled={status === "loading" || status === "sent"}
          className="w-full rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "loading" ? "Sending..." : "Resend"}
        </button>

        <p className="mt-4 text-sm text-gray-400">
          Already confirmed?{" "}
          <Link href="/login" className="text-blue-500 hover:underline">
            Log in
          </Link>
        </p>
      </div>
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
