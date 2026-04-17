"use client";

import { useState } from "react";
import { Input } from "@/shared/ui/Input";

interface ResendEmailFormProps {
  onResend: (email: string) => Promise<void>;
  submitLabel?: string;
  successMessage?: string;
}

export function ResendEmailForm({
  onResend,
  submitLabel = "Надіслати",
  successMessage = "Лист надіслано. Перевірте вхідні або спам.",
}: ResendEmailFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    setErrorMessage("");
    try {
      await onResend(email);
      setStatus("sent");
    } catch (err: unknown) {
      const typedErr = err as { detail?: string; message?: string };
      setErrorMessage(typedErr?.detail || typedErr?.message || "Щось пішло не так.");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return <p className="text-sm text-green-400 mt-2">{successMessage}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-2 text-left">
      <Input
        id="resend-email"
        name="resend-email"
        type="email"
        label="Email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      {status === "error" && <p className="text-sm text-red-500">{errorMessage}</p>}
      <button
        type="submit"
        disabled={!email || status === "loading"}
        className="align-middle mt-2 w-lg rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white transition duration-200 hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === "loading" ? "Надсилання..." : submitLabel}
      </button>
    </form>
  );
}
