import Image from "next/image";
import { Star } from "lucide-react";
import type { CourseDetail } from "@/entities/course";
import { CourseDescription } from "./CourseDescription";
import { CourseHeroCTA } from "./CourseHeroCTA";

type Props = { course: CourseDetail };

const LEVEL_LABEL: Record<CourseDetail["level"], string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const LEVEL_BADGE: Record<CourseDetail["level"], string> = {
  beginner: "bg-(--color-brand-yellow) text-(--color-yellow-dark)",
  intermediate: "bg-(--color-brand-lavender) text-(--color-blue-dark)",
  advanced: "bg-(--color-brand-pink) text-(--color-pink-dark)",
};

const LEVEL_META_LABEL: Record<CourseDetail["level"], string> = {
  beginner: "Foundational training",
  intermediate: "Intermediate training",
  advanced: "Advanced training",
};

const LANGUAGE_LABEL: Record<CourseDetail["language"], string> = {
  english: "English",
  ukrainian: "Ukrainian",
  spanish: "Spanish",
};

const MODE_LABEL: Record<CourseDetail["mode"], string> = {
  with_teacher: "With a teacher",
  self_learning: "Self-paced",
};

/** Top hero: level badge, title/subtitle/description, rating row, meta pills, CTA. Right column: instructor cutout with a floating name pill. */
export function CourseHero({ course }: Props) {
  const ratingValue = Number(course.rating_avg).toFixed(1);
  const reviewsLabel = new Intl.NumberFormat("en-US").format(course.rating_count);
  const hasReviews = course.rating_count > 0;

  return (
    <section className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,600px)] lg:gap-12">
      <div className="flex flex-col gap-[60px]">
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-5">
            <span
              className={`inline-flex w-fit items-center rounded-md px-3 py-0.5 font-(family-name:--font-accent) text-sm uppercase ${LEVEL_BADGE[course.level]}`}
            >
              {LEVEL_LABEL[course.level]}
            </span>

            <div className="flex flex-col gap-1">
              <h1 className="text-5xl leading-tight text-(--color-text-primary) lg:text-6xl xl:text-7xl">
                {course.title}
              </h1>
              {course.subtitle && (
                <p className="text-2xl text-(--color-text-secondary) lg:text-4xl">
                  {course.subtitle}
                </p>
              )}
            </div>

            <div className="max-w-[700px]">
              <CourseDescription html={course.full_description} />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-1 text-xl text-(--color-text-primary)">
              <Star
                aria-hidden="true"
                className="h-9 w-9 flex-shrink-0"
                fill={hasReviews ? "var(--color-gold)" : "transparent"}
                stroke="var(--color-gold)"
              />
              {hasReviews ? (
                <span>
                  {ratingValue} (based on {reviewsLabel}+ global reviews)
                </span>
              ) : (
                <span className="text-(--color-text-secondary)">No reviews yet</span>
              )}
            </div>

            <ul className="flex flex-wrap items-center gap-3">
              <MetaPill>Language: {LANGUAGE_LABEL[course.language]}</MetaPill>
              <MetaPill>{MODE_LABEL[course.mode]}</MetaPill>
              <MetaPill>{LEVEL_META_LABEL[course.level]}</MetaPill>
            </ul>
          </div>
        </div>

        <CourseHeroCTA slug={course.slug} isEnrolled={course.is_enrolled} />
      </div>

      <div className="relative mx-auto w-full max-w-[600px] lg:mx-0">
        {/* Decorative ellipses behind the image. Resize with w-/h-, reposition with top-/left-/right-. */}
        <HeroEllipse className="top-[-16%] right-[-35%] h-[650px] w-[650px]" />
        <HeroEllipse className="top-[-7%] left-[-10%] h-[540px] w-[540px]" />
        {course.image ? (
          <Image
            src={course.image}
            alt={course.title}
            width={600}
            height={596}
            priority
            className="h-auto w-full object-contain"
            sizes="(min-width: 1024px) 600px, 90vw"
          />
        ) : (
          <div
            className="flex aspect-square w-full items-center justify-center rounded-3xl bg-(--color-placeholder) px-6 text-center text-2xl text-(--color-text-primary)/50"
            aria-hidden="true"
          >
            {course.title}
          </div>
        )}
        <div className="absolute bottom-[12%] left-[6%] inline-flex items-center rounded-[20px] border border-(--color-blue) bg-(--color-brand-lavender) px-8 py-2 shadow-(--shadow-card)">
          <span className="text-2xl font-semibold text-(--color-blue)">{course.teacher.name}</span>
        </div>
      </div>
    </section>
  );
}

function MetaPill({ children }: { children: React.ReactNode }) {
  return (
    <li className="rounded-full border border-(--color-brand-pink) bg-(--color-bg-surface) px-3 py-1 text-xl text-(--color-text-primary)">
      {children}
    </li>
  );
}

/**
 * Soft brand-gradient ellipse behind the hero image. One shared gradient
 * (--gradient-ellipse); pass size + position via className (w-/h-/top-/left-/right-).
 */
function HeroEllipse({ className }: { className: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute -z-10 rounded-full blur-[70px] ${className}`}
      style={{ background: "var(--gradient-ellipse)" }}
    />
  );
}
