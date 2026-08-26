"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { ModalShell } from "@/shared/ui/ModalShell";
import { GradientButton } from "@/shared/ui/GradientButton";
import { submitCourseReview } from "@/entities/course";
import type { ApiError } from "@/shared/api/base";

type Props = {
  slug: string;
  /** Called once the student is done here (submitted, skipped, or closed) so the caller can finish completing the course. */
  onDone: () => void;
};

/** Shown right before a course is marked complete: lets the student rate/review it, or skip straight to finishing. */
export function CompleteCourseReviewModal({ slug, onDone }: Props) {
  const t = useTranslations("CompleteCourseReview");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await submitCourseReview(slug, { rating, text: text.trim() });
      onDone();
    } catch (err) {
      const apiError = err as Partial<ApiError>;
      if (apiError.status === 409) {
        onDone();
        return;
      }
      setError(apiError.message ?? t("errorGeneric"));
      setSubmitting(false);
    }
  }

  const displayRating = hoverRating || rating;

  return (
    <ModalShell onClose={onDone} title={t("title")} width="clamp(360px, 40vw, 520px)">
      <div className="flex flex-col items-center gap-6">
        <p className="text-center font-(family-name:--font-base) text-base text-(--color-text-secondary)">
          {t("prompt")}
        </p>

        <div
          className="flex items-center gap-1"
          role="radiogroup"
          aria-label={t("ratingAriaLabel")}
        >
          {Array.from({ length: 5 }).map((_, i) => {
            const value = i + 1;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                onMouseEnter={() => setHoverRating(value)}
                onMouseLeave={() => setHoverRating(0)}
                aria-label={t("starAriaLabel", { value })}
                aria-pressed={rating === value}
                className="p-1"
                style={{ background: "transparent", border: "none", cursor: "pointer" }}
              >
                <Star
                  className="h-9 w-9"
                  fill={value <= displayRating ? "var(--color-gold)" : "transparent"}
                  stroke="var(--color-gold)"
                  strokeWidth={1.5}
                />
              </button>
            );
          })}
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("placeholder")}
          rows={4}
          className="w-full resize-none rounded-2xl border border-(--color-border-light) p-4 font-(family-name:--font-base) text-sm text-(--color-text-primary) outline-none focus:border-(--color-blue)"
        />

        {error && (
          <p role="status" className="text-sm text-(--color-pink-dark)">
            {error}
          </p>
        )}

        <div className="flex w-full items-center justify-center gap-6">
          <button
            type="button"
            onClick={onDone}
            disabled={submitting}
            className="font-(family-name:--font-accent) text-sm uppercase text-(--color-text-secondary) transition-colors hover:text-(--color-text-primary)"
            style={{ background: "transparent", border: "none", cursor: "pointer" }}
          >
            {t("skip")}
          </button>
          <GradientButton
            type="button"
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
          >
            {submitting ? t("submitting") : t("submitAndFinish")}
          </GradientButton>
        </div>
      </div>
    </ModalShell>
  );
}
