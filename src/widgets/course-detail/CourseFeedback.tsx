import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowUpRight } from "lucide-react";
import type { CourseReview } from "@/entities/course";
import { CourseReviewCard } from "./CourseReviewCard";
import { SectionBadge } from "./SectionBadge";

type Props = {
  reviews: CourseReview[];
  reviewsHref: string;
};

/** Full-bleed feedback band: gradient background, badge, view-more link, and the first two reviews. */
export async function CourseFeedback({ reviews, reviewsHref }: Props) {
  const featured = reviews.slice(0, 2);
  const hasReviews = featured.length > 0;
  const t = await getTranslations("CourseFeedback");

  return (
    <section className="w-full" style={{ background: "var(--gradient-feedback)" }}>
      <div
        className="flex flex-col gap-5 py-8 sm:gap-7 sm:py-16 lg:py-[100px]"
        style={{ width: "min(1420px, 100% - max(32px, 7vw))", marginInline: "auto" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 sm:items-start sm:gap-7">
          <SectionBadge>{t("badge")}</SectionBadge>

          {hasReviews && (
            <Link
              href={reviewsHref}
              className="inline-flex items-center gap-1.5 font-(family-name:--font-accent) text-[9px] font-medium uppercase text-(--color-text-primary) transition hover:text-(--color-blue) sm:gap-3 sm:text-xl"
            >
              {t("viewMore")}
              <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5 sm:h-7 sm:w-7" />
            </Link>
          )}
        </div>

        {hasReviews ? (
          <div className="flex flex-col gap-3 sm:gap-5 lg:flex-row">
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
          <p className="text-xs text-(--color-text-secondary) sm:text-xl">{t("noReviewsFull")}</p>
        )}
      </div>
    </section>
  );
}
