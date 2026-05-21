import Image from "next/image";
import { Star } from "lucide-react";
import type { CourseReview } from "@/entities/course";

type Props = {
  review: CourseReview;
  showRating?: boolean;
};

/** White card with a review quote and the author (avatar + name + role), with an optional star rating. */
export function CourseReviewCard({ review, showRating = true }: Props) {
  const initial = review.student.name.charAt(0);

  return (
    <article className="flex h-full flex-col gap-2.5 rounded-[20px] bg-(--color-bg) px-6 pt-7 pb-8 shadow-(--shadow-testimonial)">
      <p className="flex-1 text-xl text-(--color-text-secondary)">{review.text}</p>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative h-13 w-13 flex-shrink-0 overflow-hidden rounded-full bg-(--color-placeholder)">
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
            <span className="text-base font-semibold text-(--color-text-primary)">
              {review.student.name}
            </span>
            {review.student.role && (
              <span className="text-base text-(--color-text-secondary)">{review.student.role}</span>
            )}
          </div>
        </div>

        {showRating && (
          <div
            role="img"
            aria-label={`${review.rating} out of 5 stars`}
            className="flex items-center gap-1"
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                aria-hidden="true"
                className="h-9 w-9"
                fill={i < review.rating ? "var(--color-gold)" : "transparent"}
                stroke="var(--color-gold)"
                strokeWidth={1.5}
              />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
