import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { CourseReview } from "@/entities/course";
import { CourseReviewCard } from "./CourseReviewCard";
import { SectionBadge } from "./SectionBadge";

type Props = {
  reviews: CourseReview[];
  reviewsHref: string;
};

/** Full-bleed feedback band: gradient background, badge, view-more link, and the first two reviews. */
export function CourseFeedback({ reviews, reviewsHref }: Props) {
  const featured = reviews.slice(0, 2);
  const hasReviews = featured.length > 0;

  return (
    <section className="w-full" style={{ background: "var(--gradient-feedback)" }}>
      <div
        className="flex flex-col gap-7 py-[100px]"
        style={{ width: "min(1420px, 100% - 32px)", marginInline: "auto" }}
      >
        <div className="flex flex-wrap items-start justify-between gap-7">
          <SectionBadge>Feedback</SectionBadge>

          {hasReviews && (
            <Link
              href={reviewsHref}
              className="inline-flex items-center gap-3 font-(family-name:--font-accent) text-xl font-medium uppercase text-(--color-text-primary) transition hover:text-(--color-blue)"
            >
              View more
              <ArrowUpRight aria-hidden="true" className="h-7 w-7" />
            </Link>
          )}
        </div>

        {hasReviews ? (
          <div className="flex flex-col gap-5 lg:flex-row">
            <div className="lg:w-[580px] lg:flex-shrink-0">
              <CourseReviewCard review={featured[0]} />
            </div>
            {featured[1] && (
              <div className="lg:flex-1">
                <CourseReviewCard review={featured[1]} />
              </div>
            )}
          </div>
        ) : (
          <p className="text-xl text-(--color-text-secondary)">
            No reviews yet. Be the first to share your experience.
          </p>
        )}
      </div>
    </section>
  );
}
