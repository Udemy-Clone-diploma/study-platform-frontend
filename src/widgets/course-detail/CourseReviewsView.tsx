import Image from "next/image";
import type { CourseReview } from "@/entities/course";
import { SectionContainer } from "@/shared/ui/SectionContainer";
import { CourseReviewCard } from "./CourseReviewCard";

type Props = { courseTitle: string; reviews: CourseReview[] };

/** Full reviews page: title + a single column of wide review cards that zigzag left/right. */
export function CourseReviewsView({ courseTitle, reviews }: Props) {
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
        className="pointer-events-none absolute -left-[14%] bottom-[10%] -z-10 w-[45vw] min-w-[160px] max-w-[280px] select-none sm:min-w-[240px] sm:max-w-[420px] lg:w-[60vw] lg:min-w-[420px] lg:max-w-[820px]"
      />
      <Image
        src="/backgrounds/crystal.png"
        alt=""
        aria-hidden="true"
        width={1000}
        height={1000}
        sizes="50vw"
        className="pointer-events-none absolute -right-[8%] top-[18%] -z-10 w-[32vw] min-w-[120px] max-w-[200px] select-none sm:min-w-[180px] sm:max-w-[320px] lg:w-[44vw] lg:min-w-[320px] lg:max-w-[620px]"
      />

      <SectionContainer>
        <article className="flex flex-col gap-8 py-12 sm:gap-12 sm:py-16 lg:gap-16 lg:py-28">
          <h1 className="text-2xl text-(--color-text-primary) sm:text-3xl lg:text-5xl">
            Reviews of the &ldquo;{courseTitle}&rdquo; course
          </h1>

          {reviews.length > 0 ? (
            <ul className="flex flex-col gap-4">
              {reviews.map((review, i) => (
                <li
                  key={review.id}
                  className={`w-full max-w-[1180px] ${i % 2 === 0 ? "self-start" : "lg:self-end"}`}
                >
                  <CourseReviewCard review={review} showRating={false} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-base text-(--color-text-secondary) sm:text-lg">No reviews yet.</p>
          )}
        </article>
      </SectionContainer>
    </div>
  );
}
