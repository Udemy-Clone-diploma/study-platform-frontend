"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { UserData } from "@/entities/user";

type Props = {
  user: Pick<UserData, "status" | "is_blocked" | "is_deleted" | "is_email_verified">;
  onResendVerification?: () => Promise<unknown>;
};

/** Single status pill with priority Deleted > Blocked > Unverified > Active/Inactive; the Unverified pill resends the verification email on click. */
export function UserStatusBadge({ user, onResendVerification }: Props) {
  const t = useTranslations("UserStatusBadge");
  const [resend, setResend] = useState<"idle" | "sending" | "sent">("idle");

  const state = user.is_deleted
    ? "deleted"
    : user.is_blocked
      ? "blocked"
      : !user.is_email_verified
        ? "unverified"
        : user.status === "active"
          ? "active"
          : "inactive";

  const label =
    state === "unverified"
      ? { idle: t("unverified"), sending: t("sending"), sent: t("emailSent") }[resend]
      : {
          deleted: t("deleted"),
          blocked: t("blocked"),
          active: t("active"),
          inactive: t("inactive"),
        }[state];

  const accent =
    state === "deleted"
      ? "var(--color-text-secondary)"
      : state === "unverified"
        ? "var(--color-warning)"
        : state === "active"
          ? "var(--color-success)"
          : "var(--color-rejected)";
  const filled = state === "blocked";

  const badgeClass =
    "inline-flex shrink-0 items-center justify-center rounded-full font-(family-name:--font-accent) font-medium whitespace-nowrap";
  const badgeStyle = {
    fontSize: "clamp(11px, 0.83vw, 14px)",
    padding: "2px 12px",
    color: filled ? "white" : accent,
    border: `1px solid ${filled ? "var(--color-rejected)" : accent}`,
    background: filled ? "var(--color-rejected)" : "white",
  };

  async function handleResend() {
    if (!onResendVerification || resend !== "idle") return;
    setResend("sending");
    try {
      await onResendVerification();
      setResend("sent");
    } catch {
      setResend("idle");
    }
  }

  if (state === "unverified" && onResendVerification) {
    return (
      <button
        type="button"
        title={t("resendVerification")}
        onClick={handleResend}
        disabled={resend !== "idle"}
        className={`${badgeClass} transition enabled:cursor-pointer enabled:hover:opacity-75`}
        style={{
          ...badgeStyle,
          boxShadow: resend === "idle" ? "var(--shadow-unverified-glow)" : undefined,
        }}
      >
        {label}
      </button>
    );
  }

  return (
    <span className={badgeClass} style={badgeStyle}>
      {label}
    </span>
  );
}
