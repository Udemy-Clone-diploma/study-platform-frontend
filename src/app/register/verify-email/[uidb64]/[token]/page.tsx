"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  resendVerificationEmail,
  verifyEmail,
} from "@/features/auth/api/authApi";
import Link from "next/link";

export default function VerifyEmailPage() {
  const { uidb64, token } = useParams<{ uidb64: string; token: string }>();
  const router = useRouter();

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");

  const [showResendForm, setShowResendForm] = useState(false);

  const [resendEmail, setResendEmail] = useState("");
  const [resendMessage, setResendMessage] = useState("");
  const [resendStatus, setResendStatus] = useState<
    "idle" | "loading" | "sent" | "error"
  >("idle");

  async function handleResend() {
    if (!resendEmail) return;

    setResendStatus("loading");
    try {
      const res = await resendVerificationEmail(resendEmail);
      setResendMessage(res?.detail || "Email sent");
      setResendStatus("sent");
    } catch (error: unknown) {
      const typedError = error as { detail?: string; message?: string };
      setResendMessage(
        typedError?.detail || typedError?.message || "Something went wrong",
      );
      setResendStatus("error");
    }
  }

  useEffect(() => {
    if (!uidb64 || !token) return;

    async function verify() {
      try {
        const res = await verifyEmail(uidb64, token);
        setStatus("success");
        setMessage(res.detail);
        setTimeout(() => router.push("/login"), 3000);
      } catch (error: unknown) {
        const typedError = error as { detail?: string; message?: string };
        setStatus("error");
        setMessage(
          typedError?.detail ||
            typedError?.message ||
            "Invalid or expired link",
        );
      }
    }

    verify();
  }, [uidb64, token, router]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md text-center">
        {status === "loading" && <p>Checking...</p>}

        {status === "success" && (
          <>
            <h1 className="text-2xl font-semibold text-green-600 mb-3">
              Email confirmed ✓
            </h1>
            <p className="text-gray-600">{message}</p>
            <p className="text-sm text-gray-400 mt-2">
              Redirecting to login...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <h1 className="text-2xl font-semibold text-red-600 mb-3">
              Confirmation error
            </h1>

            {!showResendForm && (
              <>
                <p className="text-gray-600">{message}</p>
                <button
                  onClick={() => setShowResendForm(true)}
                  className="w-full mt-4 rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white hover:bg-gray-700 transition"
                >
                  Resend verification email
                </button>
              </>
            )}

            {showResendForm && (
              <>
                <p className="text-gray-600">
                  Enter your email address to resend it
                </p>

                {resendStatus !== "sent" ? (
                  <>
                    <input
                      type="email"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full rounded-lg text-gray-600 border border-gray-300 px-4 py-2 text-sm mb-4 mt-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />

                    <button
                      onClick={handleResend}
                      disabled={!resendEmail || resendStatus === "loading"}
                      className="w-full rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white hover:bg-gray-700 transition disabled:opacity-50"
                    >
                      {resendStatus === "loading"
                        ? "Sending..."
                        : "Send verification email"}
                    </button>

                    {resendStatus === "error" && resendMessage && (
                      <p className="text-red-500 text-sm mt-2">
                        {resendMessage}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-green-600 text-sm mt-2">{resendMessage}</p>
                )}
              </>
            )}

            <p className="mt-4 text-sm text-gray-400">
              <Link href="/login" className="text-blue-500 hover:underline">
                Back to login
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
