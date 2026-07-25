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
};

/** White card with a review quote and the author (avatar + name + role), with an optional star rating. */
export function CourseReviewCard({ review, showRating = true }: Props) {
  const initial = review.student.name.charAt(0);
  const [reporting, setReporting] = useState(false);
  const t = useTranslations("StudentReviewCard");
  const tCard = useTranslations("CourseReviewCard");

  return (
    <article className="relative flex h-full flex-col gap-2.5 rounded-[20px] bg-(--color-bg) px-5 pt-6 pb-6 shadow-(--shadow-testimonial) sm:px-6 sm:pt-7 sm:pb-8">
      <button
        type="button"
        onClick={() => setReporting(true)}
        aria-label={t("reportReview")}
        title={t("reportReview")}
        className="absolute top-3 right-3 flex items-center justify-center text-(--color-text-secondary) hover:text-(--color-text-primary)"
        style={{ border: "none", background: "transparent", cursor: "pointer" }}
      >
        <Flag size={16} />
      </button>

      <p className="flex-1 text-base text-(--color-text-secondary) sm:text-lg lg:text-xl">
        {review.text}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-(--color-placeholder) sm:h-13 sm:w-13">
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
              className="text-base font-semibold text-(--color-text-primary) hover:text-(--color-blue)"
            >
              {review.student.name}
            </Link>
            {review.student.role && (
              <span className="text-base text-(--color-text-secondary)">{review.student.role}</span>
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
                className="h-6 w-6 sm:h-8 sm:w-8 lg:h-9 lg:w-9"
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
