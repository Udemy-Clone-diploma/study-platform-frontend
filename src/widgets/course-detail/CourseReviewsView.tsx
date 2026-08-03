import Image from "next/image";
import { getTranslations } from "next-intl/server";
import type { CourseReview } from "@/entities/course";
import { SectionContainer } from "@/shared/ui/SectionContainer";
import { CourseReviewCard } from "./CourseReviewCard";

type Props = { courseTitle: string; reviews: CourseReview[] };

/** Full reviews page: title + a single column of wide review cards that zigzag left/right. */
export async function CourseReviewsView({ courseTitle, reviews }: Props) {
  const t = await getTranslations("CourseReviewsView");

  return (
    <div
      className="relative isolate flex-1 overflow-hidden"
      style={{ background: "var(--gradient-feedback)" }}
    >
      <Image
        src="/backgrounds/stain.png"
        alt=""
        aria-hidden="true"
        width={1200}
        height={1200}
        sizes="80vw"
        className="pointer-events-none absolute -left-[35%] bottom-[3%] -z-10 w-[85vw] select-none sm:-left-[14%] sm:bottom-[10%] sm:w-[45vw] sm:min-w-[240px] sm:max-w-[420px] lg:w-[60vw] lg:min-w-[420px] lg:max-w-[820px]"
      />
      <Image
        src="/backgrounds/crystal.png"
        alt=""
        aria-hidden="true"
        width={1000}
        height={1000}
        sizes="50vw"
        className="pointer-events-none absolute -right-[24%] top-[8%] -z-10 w-[72vw] select-none sm:-right-[8%] sm:top-[18%] sm:w-[32vw] sm:min-w-[180px] sm:max-w-[320px] lg:w-[44vw] lg:min-w-[320px] lg:max-w-[620px]"
      />

      <SectionContainer>
        <article className="flex flex-col gap-8 py-10 sm:gap-12 sm:py-16 lg:gap-16 lg:py-28">
          <h1 className="max-w-[560px] text-[34px] leading-[1.28] text-(--color-text-primary) sm:text-3xl lg:text-5xl">
            {t("title", { course: courseTitle })}
          </h1>

          {reviews.length > 0 ? (
            <ul className="flex flex-col gap-6 sm:gap-4">
              {reviews.map((review, i) => (
                <li
                  key={review.id}
                  className={`w-full max-w-[1180px] ${i % 2 === 0 ? "self-start" : "lg:self-end"}`}
                >
                  <CourseReviewCard review={review} variant="full" />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-base text-(--color-text-secondary) sm:text-lg">{t("noReviews")}</p>
          )}
        </article>
      </SectionContainer>
    </div>
  );
}
