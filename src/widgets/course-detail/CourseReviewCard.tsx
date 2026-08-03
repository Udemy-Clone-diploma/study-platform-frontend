"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Flag, Star } from "lucide-react";
import { reportReview, type CourseReview } from "@/entities/course";
import { ReportReviewModal } from "@/shared/ui/ReportReviewModal";

type Props = {
  review: CourseReview;
  showRating?: boolean;
  variant?: "compact" | "full";
};

/** White card with a review quote and the author (avatar + name + role), with an optional star rating. */
export function CourseReviewCard({ review, showRating = true, variant = "compact" }: Props) {
  const initial = review.student.name.charAt(0);
  const [reporting, setReporting] = useState(false);
  const t = useTranslations("StudentReviewCard");
  const tCard = useTranslations("CourseReviewCard");
  const isFull = variant === "full";

  return (
    <article
      className={`relative flex h-full flex-col bg-(--color-bg) shadow-(--shadow-testimonial) ${
        isFull
          ? "gap-8 rounded-[20px] px-5 pt-6 pb-6 sm:px-6 sm:pt-7 sm:pb-8"
          : "gap-3 rounded-[14px] px-3 pt-4 pb-3 sm:gap-2.5 sm:rounded-[20px] sm:px-6 sm:pt-7 sm:pb-8"
      }`}
    >
      <button
        type="button"
        onClick={() => setReporting(true)}
        aria-label={t("reportReview")}
        title={t("reportReview")}
        className="absolute top-2 right-2 flex items-center justify-center text-(--color-text-secondary) hover:text-(--color-text-primary) sm:top-3 sm:right-3"
        style={{ border: "none", background: "transparent", cursor: "pointer" }}
      >
        <Flag className="h-3 w-3 sm:h-4 sm:w-4" />
      </button>

      <p
        className={`flex-1 text-(--color-text-secondary) ${
          isFull
            ? "pr-3 text-sm leading-[1.25] sm:pr-0 sm:text-lg sm:leading-normal lg:text-xl"
            : "pr-3 text-[10px] leading-[1.25] sm:pr-0 sm:text-lg sm:leading-normal lg:text-xl"
        }`}
      >
        {review.text}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className={`relative flex-shrink-0 overflow-hidden rounded-full bg-(--color-placeholder) ${
              isFull ? "h-10 w-10 sm:h-13 sm:w-13" : "h-7 w-7 sm:h-13 sm:w-13"
            }`}
          >
            {review.student.avatar ? (
              <Image
                src={review.student.avatar}
                alt={review.student.name}
                fill
                className="object-cover"
                sizes="52px"
              />
            ) : (
              <span
                className="flex h-full w-full items-center justify-center text-base font-semibold text-(--color-text-primary)"
                aria-hidden="true"
              >
                {initial}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <Link
              href={`/profile/${review.student.id}?view=review&from=teacher-reviews`}
              className={`${isFull ? "text-sm" : "text-[10px]"} font-semibold text-(--color-text-primary) hover:text-(--color-blue) sm:text-base`}
            >
              {review.student.name}
            </Link>
            {review.student.role && (
              <span
                className={`${isFull ? "text-xs" : "text-[9px]"} text-(--color-text-secondary) sm:text-base`}
              >
                {review.student.role}
              </span>
            )}
          </div>
        </div>

        {showRating && (
          <div
            role="img"
            aria-label={tCard("ratingLabel", { rating: review.rating })}
            className="flex items-center gap-1"
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                aria-hidden="true"
                className={`${isFull ? "h-5 w-5" : "h-3.5 w-3.5"} sm:h-8 sm:w-8 lg:h-9 lg:w-9`}
                fill={i < review.rating ? "var(--color-gold)" : "transparent"}
                stroke="var(--color-gold)"
                strokeWidth={1.5}
              />
            ))}
          </div>
        )}
      </div>

      {reporting && (
        <ReportReviewModal
          onClose={() => setReporting(false)}
          onSubmit={(reason) => reportReview(review.id, reason)}
        />
      )}
    </article>
  );
}
