"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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

type ActionCopy = { title: string; description: string; confirmLabel: string };

function getActionCopy(
  action: ReportAction,
  targetName: string,
  t: ReturnType<typeof useTranslations>,
): ActionCopy {
  return {
    title: t(`titles.${action}`),
    description: t(`descriptions.${action}`, { targetName }),
    confirmLabel: t(`confirmLabels.${action}`),
  };
}

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
  const t = useTranslations("UserReportActionModal");
  const tCommon = useTranslations("Common");
  const [note, setNote] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const copy = getActionCopy(action, targetName, t);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedNote = note.trim();
    if (trimmedNote.length < 10) {
      setValidationError(t("noteTooShort"));
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
          {copy.description}
        </p>

        <label className="flex flex-col gap-2 text-sm font-semibold text-(--color-text-primary)">
          {t("decisionNote")}
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
            placeholder={t("notePlaceholder")}
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
            {tCommon("cancel")}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-(--color-text-primary) px-5 py-2.5 font-semibold text-(--color-bg) transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-blue) disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? tCommon("saving") : copy.confirmLabel}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
