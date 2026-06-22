import Image from "next/image";
import type { CourseDetail, CourseReview } from "@/entities/course";
import { SectionContainer } from "@/shared/ui/SectionContainer";
import { CourseCurriculum } from "./CourseCurriculum";
import { CourseFeedback } from "./CourseFeedback";
import { CourseHero } from "./CourseHero";
import { CoursePricingBlock } from "./CoursePricingBlock";
import { CourseScheduleCard } from "./CourseScheduleCard";
import { CourseTeacher } from "./CourseTeacher";

type Props = { course: CourseDetail; reviews: CourseReview[] };

/** Top-level composition for the /courses/[slug] page. */
export function CourseDetailView({ course, reviews }: Props) {
  const hasPricingPlans = course.delivery_formats.some(f => f.pricing);

  return (
    <div className="relative isolate overflow-x-clip bg-(--color-bg)">
      <SectionContainer>
        <article className="flex flex-col gap-16 pt-12 sm:gap-20 sm:pt-16 lg:gap-32 lg:pt-24">
          <section>
            <CourseHero course={course} />
          </section>

          <section className="relative">
            {/* Pink/purple glow behind the instructor text. Move with top-/left-, resize with w-/h-. */}
            <DecorBlob
              className="top-[28%] left-[25%] h-[500px] w-[700px] blur-[40px]"
              gradient="var(--gradient-glow-teacher)"
            />
            <CourseTeacher teacher={course.teacher} quote={course.quote} />
          </section>

          <section className="grid grid-cols-1 gap-x-8 gap-y-8 sm:gap-x-12 lg:grid-cols-[minmax(0,1fr)_369px] lg:gap-x-[111px] lg:gap-y-10">
            <div className="lg:col-span-2">
              <div className="flex flex-col gap-2">
                <h2 className="text-3xl text-(--color-text-primary) sm:text-4xl lg:text-6xl">
                  Course Curriculum
                </h2>
                <p className="text-xl text-(--color-text-secondary) sm:text-2xl lg:text-3xl">
                  {course.lessons_count} Video Lessons | {course.modules.length}{" "}
                  {course.modules.length === 1 ? "Module" : "Modules"}
                </p>
              </div>
            </div>
            <div className="lg:col-start-1">
              <CourseCurriculum course={course} hideHeading />
            </div>
            {course.cohorts.length > 0 && (
              <div className="relative self-start lg:col-start-2">
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
          </section>
        </article>
      </SectionContainer>

      <div className="my-12 sm:my-16 lg:my-28">
        <CourseFeedback reviews={reviews} reviewsHref={`/courses/${course.slug}/reviews`} />
      </div>

      {hasPricingPlans && (
        <SectionContainer>
          <section className="relative mb-20 pb-12 sm:mb-32 sm:pb-16 lg:mb-[260px] lg:pb-24">
            <DecorBlob
              className="top-[-25%] left-1/2 h-[1000px] w-[1600px] -translate-x-1/2"
              gradient="var(--gradient-glow-lavender)"
            />
            {/* Decorative molecule renders, arranged left / centre / right. Hidden below
                lg because the absolute positioning overlaps the stacked pricing cards.
                Move one with its left-/right-/top- value; spin with rotate-[Ndeg]. */}
            <DecorImage
              src="/backgrounds/00 4.png"
              className="absolute top-[10%] left-[-8%] -z-10 hidden rotate-[0deg] lg:block"
            />
            <DecorImage
              src="/backgrounds/00 3.png"
              className="absolute top-[20%] left-[50%] -z-10 hidden -translate-x-1/2 scale-x-[-1] scale-y-[-1] rotate-[-20deg] lg:block"
            />
            <DecorImage
              src="/backgrounds/00 2.png"
              className="absolute top-[1%] right-[-7%] -z-10 hidden rotate-[170deg] lg:block"
            />
            <CoursePricingBlock
              courseId={course.id}
              formats={course.delivery_formats}
              slug={course.slug}
              cohorts={course.cohorts}
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
