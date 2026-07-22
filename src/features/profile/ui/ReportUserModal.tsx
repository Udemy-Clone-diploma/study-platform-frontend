"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Flag, Loader2 } from "lucide-react";
import { reportUser, type UserReportReason } from "@/entities/user";
import type { ApiError } from "@/shared/api/base";
import { ModalShell } from "@/shared/ui/ModalShell";
import { WhiteButton } from "@/shared/ui/WhiteButton";

const REPORT_REASONS: Array<{ value: UserReportReason; label: string }> = [
  { value: "spam", label: "Spam or advertising" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "hate", label: "Hate speech" },
  { value: "violence", label: "Violence or threats" },
  { value: "sexual", label: "Sexual content" },
  { value: "fraud", label: "Fraud or scam" },
  { value: "impersonation", label: "Impersonation or fake identity" },
  { value: "inappropriate_profile", label: "Inappropriate profile content" },
  { value: "other", label: "Other" },
];

type Props = {
  userId: number;
  userName: string;
  onClose: () => void;
  onReported: () => void;
};

/** Modal for submitting a categorized report about a public user profile. */
export function ReportUserModal({ userId, userName, onClose, onReported }: Props) {
  const [reason, setReason] = useState<UserReportReason | "">("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function requestClose() {
    if (!submitting) onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reason) {
      setError("Select a reason for the report.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await reportUser(userId, { reason, details: details.trim() });
      setSubmitted(true);
      onReported();
    } catch (requestError) {
      const apiError = requestError as Partial<ApiError>;
      if (apiError.status === 409) {
        setSubmitted(true);
        onReported();
        return;
      }
      setError(apiError.detail || apiError.message || "Could not send the report.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalShell
      onClose={requestClose}
      title="Report user"
      icon={<Flag aria-hidden="true" className="h-5 w-5 text-(--color-pink-dark)" />}
      width="clamp(320px, 92vw, 520px)"
      padding="clamp(20px, 3vw, 32px)"
      shadow="var(--shadow-modal)"
      closeOnOverlayClick={!submitting}
      zIndex={100}
    >
      {submitted ? (
        <div className="flex flex-col items-center text-center">
          <CheckCircle2 aria-hidden="true" className="h-12 w-12 text-(--color-blue-dark)" />
          <p role="status" className="mt-4 font-semibold text-(--color-text-primary)">
            Report sent
          </p>
          <p className="mt-2 text-sm leading-6 text-(--color-text-secondary)">
            Your report about {userName} is with the platform team for review.
          </p>
          <button
            type="button"
            onClick={onClose}
            autoFocus
            className="mt-6 h-11 w-full rounded-full bg-(--color-text-primary) px-6 font-(family-name:--font-accent) text-sm font-semibold uppercase text-(--color-bg) transition hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-blue)"
          >
            Done
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <p className="text-sm leading-6 text-(--color-text-secondary)">
            Why are you reporting {userName}? Your report will be sent to the platform team.
          </p>

          <fieldset className="mt-5 space-y-2">
            <legend className="mb-3 font-semibold text-(--color-text-primary)">
              Reason for reporting
            </legend>
            {REPORT_REASONS.map((item, index) => {
              const selected = reason === item.value;
              return (
                <label
                  key={item.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition ${
                    selected
                      ? "border-(--color-pink-dark) bg-(--color-error-surface)"
                      : "border-(--color-border-light) hover:bg-(--color-bg-surface)"
                  }`}
                >
                  <input
                    type="radio"
                    name="user-report-reason"
                    value={item.value}
                    checked={selected}
                    autoFocus={index === 0}
                    disabled={submitting}
                    onChange={() => {
                      setReason(item.value);
                      setError("");
                    }}
                    className="accent-(--color-pink-dark)"
                  />
                  <span className="text-(--color-text-primary)">{item.label}</span>
                </label>
              );
            })}
          </fieldset>

          <label className="mt-5 block text-sm font-semibold text-(--color-text-primary)">
            Additional details{" "}
            <span className="font-normal text-(--color-text-secondary)">(optional)</span>
            <textarea
              value={details}
              maxLength={500}
              rows={3}
              disabled={submitting}
              onChange={(event) => setDetails(event.target.value)}
              className="mt-2 w-full resize-none rounded-lg border border-(--color-border-light) bg-(--color-bg) px-3 py-2 font-normal text-(--color-text-primary) outline-none transition placeholder:text-(--color-text-muted) focus:border-(--color-blue) focus-visible:ring-2 focus-visible:ring-(--color-brand-lavender-soft)"
              placeholder="Add context that can help the platform team"
            />
          </label>
          <p className="mt-1 text-right text-xs text-(--color-text-secondary)">
            {details.length}/500
          </p>

          {error ? (
            <p role="alert" className="mt-3 text-sm text-(--color-pink-dark)">
              {error}
            </p>
          ) : null}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <WhiteButton icon={null} onClick={requestClose} disabled={submitting}>
              Cancel
            </WhiteButton>
            <button
              type="submit"
              disabled={submitting || !reason}
              className="inline-flex h-11 min-w-36 items-center justify-center rounded-full bg-(--color-pink-dark) px-6 font-(family-name:--font-accent) text-sm font-semibold uppercase text-(--color-bg) transition hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-blue) disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 aria-label="Sending report" className="h-5 w-5 animate-spin" />
              ) : (
                "Send report"
              )}
            </button>
          </div>
        </form>
      )}
    </ModalShell>
  );
}
