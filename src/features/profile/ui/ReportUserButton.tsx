"use client";

import { useState } from "react";
import { Check, Flag } from "lucide-react";
import { ReportUserModal } from "./ReportUserModal";

type Props = {
  userId: number;
  userName: string;
  initiallyReported?: boolean;
  variant?: "default" | "corner";
};

/** Opens the user-report flow and prevents another submission after success. */
export function ReportUserButton({
  userId,
  userName,
  initiallyReported = false,
  variant = "default",
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [reported, setReported] = useState(initiallyReported);

  return (
    <>
      <button
        type="button"
        aria-disabled={reported}
        aria-haspopup="dialog"
        onClick={() => {
          if (!reported) setModalOpen(true);
        }}
        className={`inline-flex items-center justify-center gap-2 rounded-full bg-(--color-bg) font-(family-name:--font-accent) font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-blue) ${
          variant === "corner" ? "h-7 border-0 px-2 text-xs" : "h-11 border px-5 text-sm"
        } ${
          reported
            ? "cursor-default border-(--color-blue-dark) text-(--color-blue-dark)"
            : "border-(--color-pink-dark) text-(--color-pink-dark) hover:bg-(--color-error-surface)"
        }`}
      >
        {reported ? (
          <Check aria-hidden="true" className="h-4 w-4" />
        ) : (
          <Flag aria-hidden="true" className="h-4 w-4" />
        )}
        {reported ? "Report sent" : "Report user"}
      </button>

      {modalOpen ? (
        <ReportUserModal
          userId={userId}
          userName={userName}
          onClose={() => setModalOpen(false)}
          onReported={() => setReported(true)}
        />
      ) : null}
    </>
  );
}
