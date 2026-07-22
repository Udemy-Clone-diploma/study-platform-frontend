"use client";

import { useState } from "react";
import { Ban, CircleAlert, LockOpen, ShieldAlert, TriangleAlert } from "lucide-react";
import type { AdminUserReportAction, ModeratorUserReportAction } from "@/entities/user";
import { ModalShell } from "@/shared/ui/ModalShell";

type ReportAction = ModeratorUserReportAction | AdminUserReportAction;

type Props = {
  action: ReportAction;
  targetName: string;
  loading: boolean;
  error: string | null;
  onSubmit: (note: string) => void;
  onClose: () => void;
};

const ACTION_COPY: Record<
  ReportAction,
  { title: string; description: (targetName: string) => string; confirmLabel: string }
> = {
  warning: {
    title: "Issue warning",
    description: (targetName) =>
      `Explain why ${targetName} is receiving a formal platform warning.`,
    confirmLabel: "Issue warning",
  },
  block: {
    title: "Block site access",
    description: (targetName) => `Explain why ${targetName} should lose access to the platform.`,
    confirmLabel: "Block access",
  },
  unblock: {
    title: "Restore site access",
    description: (targetName) =>
      `Explain why the block decision for ${targetName} is being reversed.`,
    confirmLabel: "Restore access",
  },
  escalate: {
    title: "Escalate to administrator",
    description: () =>
      "Summarize the evidence and explain what requires an administrator's decision.",
    confirmLabel: "Escalate",
  },
  dismiss: {
    title: "Close without action",
    description: () =>
      "Explain why this report does not justify a warning, access block, or escalation.",
    confirmLabel: "Close report",
  },
};

function ActionIcon({ action }: { action: ReportAction }) {
  const className = "h-5 w-5 text-(--color-text-primary)";
  if (action === "block") return <Ban className={className} aria-hidden="true" />;
  if (action === "unblock") return <LockOpen className={className} aria-hidden="true" />;
  if (action === "escalate") return <ShieldAlert className={className} aria-hidden="true" />;
  if (action === "dismiss") return <CircleAlert className={className} aria-hidden="true" />;
  return <TriangleAlert className={className} aria-hidden="true" />;
}

/** Collects the mandatory decision note before a moderator or administrator acts on a report. */
export function UserReportActionModal({
  action,
  targetName,
  loading,
  error,
  onSubmit,
  onClose,
}: Props) {
  const [note, setNote] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const copy = ACTION_COPY[action];

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedNote = note.trim();
    if (trimmedNote.length < 10) {
      setValidationError("Add at least 10 characters so the decision can be audited.");
      return;
    }
    setValidationError(null);
    onSubmit(trimmedNote);
  }

  return (
    <ModalShell
      title={copy.title}
      icon={<ActionIcon action={action} />}
      ariaLabel={copy.title}
      width="min(100%, var(--container-xl))"
      closeOnOverlayClick={!loading}
      onClose={onClose}
    >
      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <p id="report-action-description" className="text-sm text-(--color-text-secondary)">
          {copy.description(targetName)}
        </p>

        <label className="flex flex-col gap-2 text-sm font-semibold text-(--color-text-primary)">
          Decision note
          <textarea
            autoFocus
            required
            minLength={10}
            maxLength={500}
            value={note}
            disabled={loading}
            aria-describedby="report-action-description report-action-counter"
            aria-invalid={Boolean(validationError || error)}
            onChange={(event) => {
              setNote(event.target.value);
              if (validationError) setValidationError(null);
            }}
            className="min-h-32 resize-y rounded-xl border border-(--color-border-light) bg-(--color-bg-surface) p-3 text-base font-normal text-(--color-text-primary) outline-none transition focus:border-(--color-blue) focus:ring-2 focus:ring-(--color-blue) disabled:cursor-not-allowed disabled:opacity-60"
            placeholder="Record the evidence and reasoning behind this decision."
          />
        </label>

        <div className="flex items-start justify-between gap-4 text-sm">
          <p className="text-(--color-danger)" role="alert">
            {validationError ?? error}
          </p>
          <span id="report-action-counter" className="shrink-0 text-(--color-text-secondary)">
            {note.length}/500
          </span>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="rounded-full border border-(--color-border-light) bg-(--color-bg) px-5 py-2.5 font-semibold text-(--color-text-primary) transition hover:border-(--color-text-secondary) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-blue) disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-(--color-text-primary) px-5 py-2.5 font-semibold text-(--color-bg) transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-blue) disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Saving…" : copy.confirmLabel}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
