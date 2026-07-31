import Image from "next/image";
import { getTranslations } from "next-intl/server";
import type { CourseDetail, CourseReview } from "@/entities/course";
import { SectionContainer } from "@/shared/ui/SectionContainer";
import { CourseCurriculum } from "./CourseCurriculum";
import { CourseFeedback } from "./CourseFeedback";
import { CourseHero } from "./CourseHero";
import { CoursePricingBlock } from "./CoursePricingBlock";
import { CourseScheduleCard } from "./CourseScheduleCard";
import { CourseTeacher } from "./CourseTeacher";
import { PRICING_ANCHOR_ID } from "./pricingAnchor";

type Props = { course: CourseDetail; reviews: CourseReview[] };

/** Top-level composition for the /courses/[slug] page. */
export async function CourseDetailView({ course, reviews }: Props) {
  const hasPricingPlans = course.delivery_formats.some(f => f.pricing);
  const t = await getTranslations("CourseCurriculum");

  return (
    <div className="relative isolate overflow-x-clip bg-(--color-bg)">
      <SectionContainer>
        <article className="flex flex-col gap-16 pt-12 sm:gap-20 sm:pt-16 lg:gap-32 lg:pt-24">
          <section>
            <CourseHero course={course} />
          </section>

          <section className="relative">
            {/* Full-bleed background image behind the instructor block. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-10"
              style={{
                backgroundImage: "url('/backgrounds/background-rectangle.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            {/* White gradient overlay on top — transparent in the center (image shows
                through) and opaque white toward the edges, so the image blends into
                the surrounding white page instead of showing a hard rectangular edge. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-10"
              style={{
                background: "radial-gradient(ellipse at center, rgba(255,255,255,0) 0%, rgba(255,255,255,0.9) 78%, rgba(255,255,255,1) 100%)",
              }}
              
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-10"
              style={{
                background: "radial-gradient(ellipse at center, rgba(255,255,255,0) 0%, rgba(255,255,255,0.9) 78%, rgba(255,255,255,1) 100%)",
              }}
            />
            <CourseTeacher teacher={course.teacher} quote={course.short_description} />
          </section>

          <section className="grid grid-cols-1 gap-x-8 gap-y-8 sm:gap-x-12 lg:grid-cols-[minmax(0,1fr)_369px] lg:gap-x-[111px] lg:gap-y-10">
            <div className="lg:col-span-2">
              <div className="flex flex-col gap-2">
                <h2 className="text-3xl text-(--color-text-primary) sm:text-4xl lg:text-6xl">
                  {t("heading")}
                </h2>
                <p className="text-xl text-(--color-text-secondary) sm:text-2xl lg:text-3xl">
                  {t("summary", { lessons: course.lessons_count, modules: course.modules.length })}
                </p>
              </div>
            </div>
            {course.cohorts.length > 0 && (
              <div className="relative self-start lg:col-start-2 lg:row-start-2">
                {/* Branded ellipses behind the schedule card. Resize with w-/h-, move with top-/left-/bottom-. */}
                <DecorBlob
                  className="top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 opacity-40 blur-[70px]"
                  gradient="var(--gradient-ellipse)"
                />
                <DecorBlob
                  className="bottom-[-50%] left-[-70%] h-[400px] w-[400px] opacity-50 blur-[70px]"
                  gradient="var(--gradient-ellipse)"
                />
                <CourseScheduleCard
                  cohorts={course.cohorts}
                  modules_count={course.modules.length}
                  lessons_count={course.lessons_count}
                />
              </div>
            )}
            <div className="lg:col-start-1 lg:row-start-2">
              <CourseCurriculum
                course={course}
                slug={course.slug}
                hasPricing={hasPricingPlans}
                hideHeading
              />
            </div>
          </section>
        </article>
      </SectionContainer>

      <div className="my-12 sm:my-16 lg:my-28">
        <CourseFeedback reviews={reviews} reviewsHref={`/courses/${course.slug}/reviews`} />
      </div>

      {hasPricingPlans && (
        <SectionContainer>
          <section
            id={PRICING_ANCHOR_ID}
            className="relative mb-20 scroll-mt-24 pb-12 sm:mb-32 sm:pb-16 lg:mb-[260px] lg:pb-24"
          >
            <DecorBlob
              className="top-1/2 left-1/2 aspect-[3/2] h-[140%] w-auto -translate-x-1/2 -translate-y-1/2"
              gradient="var(--gradient-glow-lavender)"
            />
            {/* Decorative molecule renders, arranged left / centre / right. Hidden below
                lg because the absolute positioning overlaps the stacked pricing cards.
                Anchored at top-1/2 + -translate-y-1/2 so they stay vertically centered on
                the section regardless of how tall it grows (e.g. 3-4 pricing cards).
                Move one with its left-/right- value; spin with rotate-[Ndeg]. */}
            <DecorImage
              src="/backgrounds/00 4.svg"
              className="absolute top-1/2 left-[-8%] -z-10 hidden -translate-y-1/2 rotate-[0deg] lg:block"
            />
            <DecorImage
              src="/backgrounds/00 3.svg"
              className="absolute top-1/2 left-[50%] -z-10 hidden -translate-x-1/2 -translate-y-1/2 scale-x-[-1] scale-y-[-1] rotate-[-20deg] lg:block"
            />
            <DecorImage
              src="/backgrounds/00 2.svg"
              className="absolute top-1/2 right-[-7%] -z-10 hidden -translate-y-1/2 rotate-[170deg] lg:block"
            />
            <CoursePricingBlock
              courseId={course.id}
              formats={course.delivery_formats}
              slug={course.slug}
              cohorts={course.cohorts}
              discountPercent={course.is_on_sale ? course.discount_percent : null}
            />
          </section>
        </SectionContainer>
      )}
    </div>
  );
}

/** Soft, fully-transparent-edged glow. Sits behind content (-z-10); never shows a clipped line. */
function DecorBlob({ className, gradient }: { className: string; gradient: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute -z-10 rounded-full ${className}`}
      style={{ background: gradient }}
    />
  );
}

/** Decorative molecule render, fixed at 477x403. Caller supplies absolute position + rotation. */
function DecorImage({ src, className }: { src: string; className: string }) {
  return (
    <Image
      src={src}
      alt=""
      width={477}
      height={403}
      aria-hidden="true"
      className={`pointer-events-none select-none object-contain ${className}`}
      sizes="477px"
    />
  );
}
