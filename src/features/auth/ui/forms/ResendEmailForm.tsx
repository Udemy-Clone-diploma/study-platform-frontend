"use client";

import { useState } from "react";
import { AuthField } from "@/features/auth/ui/AuthField";
import { AccentButton } from "@/shared/ui/AccentButton";

interface ResendEmailFormProps {
  onResend: (email: string) => Promise<void>;
  submitLabel?: string;
  successMessage?: string;
}

export function ResendEmailForm({
  onResend,
  submitLabel = "Send",
  successMessage = "Email sent. Please check your inbox or spam folder.",
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
      setErrorMessage(typedErr?.detail || typedErr?.message || "Something went wrong.");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return <p className="text-sm text-[#247a4d]">{successMessage}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-left">
      <AuthField
        id="resend-email"
        name="resend-email"
        type="email"
        label="Email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
      />

      {status === "error" ? <p className="text-sm text-[#be3b3b]">{errorMessage}</p> : null}

      <div className="text-center">
        <AccentButton
          type="submit"
          disabled={!email || status === "loading"}
        >
          {status === "loading" ? "Sending" : submitLabel}
        </AccentButton>
      </div>
    </form>
  );
}
