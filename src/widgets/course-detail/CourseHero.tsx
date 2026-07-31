import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Star } from "lucide-react";
import type { PublicCourseDetailView } from "@/entities/course";
import { CourseDescription } from "./CourseDescription";
import { CourseHeroCTA } from "./CourseHeroCTA";

type Props = { course: PublicCourseDetailView };

const LEVEL_BADGE: Record<PublicCourseDetailView["level"], string> = {
  beginner: "bg-(--color-brand-yellow) text-(--color-yellow-dark)",
  intermediate: "bg-(--color-brand-lavender) text-(--color-blue-dark)",
  advanced: "bg-(--color-brand-pink) text-(--color-pink-dark)",
};

/** Top hero: level badge, title/subtitle/description, rating row, meta pills, CTA. Right column: instructor cutout with a floating name pill. */
export async function CourseHero({ course }: Props) {
  const ratingValue = Number(course.rating_avg).toFixed(1);
  const reviewsLabel = new Intl.NumberFormat("en-US").format(course.rating_count);
  const hasReviews = course.rating_count > 0;
  const [t, tEnums] = await Promise.all([
    getTranslations("CourseHero"),
    getTranslations("CatalogEnums"),
  ]);
  const LEVEL_LABEL = {
    beginner: tEnums("level.beginner"),
    intermediate: tEnums("level.intermediate"),
    advanced: tEnums("level.advanced"),
  };
  const LEVEL_META_LABEL = {
    beginner: t("levelMeta.beginner"),
    intermediate: t("levelMeta.intermediate"),
    advanced: t("levelMeta.advanced"),
  };
  const LANGUAGE_LABEL = {
    english: tEnums("language.english"),
    ukrainian: tEnums("language.ukrainian"),
    spanish: tEnums("language.spanish"),
  };
  const MODE_LABEL = {
    with_teacher: t("mode.with_teacher"),
    self_learning: t("mode.self_learning"),
  };

  return (
    <section className="grid grid-cols-1 items-center gap-8 sm:gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,600px)] lg:gap-12">
      <div className="order-2 flex flex-col gap-10 lg:order-none lg:gap-[60px]">
        <div className="flex flex-col gap-6 sm:gap-10">
          <div className="flex flex-col gap-4 sm:gap-5">
            <span
              className={`inline-flex w-fit items-center rounded-md px-3 py-0.5 font-(family-name:--font-accent) text-sm uppercase ${LEVEL_BADGE[course.level]}`}
            >
              {LEVEL_LABEL[course.level]}
            </span>

            <div className="flex flex-col gap-1">
              <h1 className="text-3xl leading-tight text-(--color-text-primary) sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
                {course.title}
              </h1>
              {course.subtitle && (
                <p className="text-xl text-(--color-text-secondary) sm:text-2xl md:text-3xl lg:text-4xl">
                  {course.subtitle}
                </p>
              )}
            </div>

            <div className="max-w-[700px]">
              <CourseDescription html={course.full_description} />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-1 text-base text-(--color-text-primary) sm:text-xl">
              <Star
                aria-hidden="true"
                className="h-6 w-6 flex-shrink-0 sm:h-9 sm:w-9"
                fill={hasReviews ? "var(--color-gold)" : "transparent"}
                stroke="var(--color-gold)"
              />
              {hasReviews ? (
                <span>{t("ratingLabel", { rating: ratingValue, count: reviewsLabel })}</span>
              ) : (
                <span className="text-(--color-text-secondary)">{t("noReviewsYet")}</span>
              )}
            </div>

            <ul className="flex flex-wrap items-center gap-2 sm:gap-3">
              <MetaPill>
                {t("languageLabel", { language: LANGUAGE_LABEL[course.language] })}
              </MetaPill>
              <MetaPill>{MODE_LABEL[course.mode]}</MetaPill>
              <MetaPill>{LEVEL_META_LABEL[course.level]}</MetaPill>
            </ul>
          </div>
        </div>

        <CourseHeroCTA
          courseId={course.id}
          slug={course.slug}
          isEnrolled={course.is_enrolled}
          accessStatus={course.enrollment_access_status}
          defaultFormat={course.delivery_formats.find((format) => format.pricing) ?? null}
        />
      </div>

      <div className="order-1 relative mx-auto w-full max-w-[280px] sm:max-w-[380px] md:max-w-[460px] lg:order-none lg:max-w-[560px] lg:mx-0">
        {/* Decorative blobs behind the image — same recipe as the homepage hero
            (gradient-blob + blur(90px)). Resize with w-/h-, reposition with top-/left-/right-. */}
        <HeroEllipse className="top-[-25%] right-[-35%] h-[650px] w-[650px]" />
        <HeroEllipse className="top-[-7%] left-[-20%] h-[440px] w-[440px]" />
        {/* Glitter texture overlay, same blend approach as the homepage hero. Hidden below lg — too busy behind the smaller mobile image. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -z-10 hidden lg:block"
          style={{
            left: "50%",
            top: "50%",
            width: "180%",
            height: "180%",
            transform: "translate(-50%, calc(-50% + 120px))",
            backgroundImage: "url('/main/glitter-bg.png')",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            backgroundSize: "contain",
            mixBlendMode: "lighten",
          }}
        />
        {course.image ? (
          <Image
            src={course.image}
            alt={course.title}
            width={500}
            height={496}
            priority
            className="h-auto w-full translate-x-0 translate-y-0 object-contain lg:translate-x-[60px] lg:-translate-y-[50px]"
            style={{
              maskImage: "linear-gradient(to bottom, black 75%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, black 75%, transparent 100%)",
            }}
            sizes="(min-width: 1024px) 560px, (min-width: 768px) 460px, (min-width: 640px) 380px, 280px"
          />
        ) : (
          <div
            className="flex aspect-square w-full items-center justify-center rounded-3xl bg-(--color-placeholder) px-6 text-center text-2xl text-(--color-text-primary)/50"
            aria-hidden="true"
          >
            {course.title}
          </div>
        )}
        <div
          aria-hidden="true"
          className="absolute bottom-[12%] left-[6%] inline-flex items-center rounded-[20px] border border-(--color-blue) bg-(--color-brand-lavender) px-4 py-2 shadow-(--shadow-card) sm:px-8"
        >
          <span className="text-base font-semibold text-(--color-blue) sm:text-2xl">
            {course.teacher.name}
          </span>
        </div>
      </div>
    </section>
  );
}

function MetaPill({ children }: { children: React.ReactNode }) {
  return (
    <li className="rounded-full border border-(--color-brand-pink) bg-(--color-bg-surface) px-3 py-1 text-base text-(--color-text-primary) sm:text-xl">
      {children}
    </li>
  );
}

/**
 * Soft brand-gradient ellipse behind the hero image. Uses --gradient-hero-ellipse
 * (semi-transparent, fades to nothing at the edge) so the two overlapping circles
 * blend together; pass size + position via className (w-/h-/top-/left-/right-).
 */
function HeroEllipse({ className }: { className: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute -z-10 rounded-full blur-[70px] ${className}`}
      style={{ background: "var(--gradient-hero-ellipse)" }}
    />
  );
}
