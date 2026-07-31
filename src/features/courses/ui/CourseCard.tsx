"use client";

import { useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatPrice, type PublicCourseListItem } from "@/entities/course";
import { Stars } from "./Stars";
import { WishlistButton } from "./WishlistButton";

const LEVEL_THEME = {
  beginner: {
    gradient: "var(--gradient-card-yellow)",
    badgeBg: "var(--color-brand-yellow)",
    badgeText: "var(--color-yellow-dark)",
  },
  intermediate: {
    gradient: "var(--gradient-card-blue)",
    badgeBg: "var(--color-brand-lavender)",
    badgeText: "var(--color-blue-dark)",
  },
  advanced: {
    gradient: "var(--gradient-card-pink)",
    badgeBg: "var(--color-brand-pink)",
    badgeText: "var(--color-pink-dark)",
  },
} as const;

type Props = {
  course: PublicCourseListItem;
  isWishlisted?: boolean;
  /** Override destination link (default: /courses/:slug). */
  href?: string;
  /** Render as a button instead of a link and fire this handler on click. */
  onClick?: () => void;
};

export function CourseCard({ course, isWishlisted = false, href, onClick }: Props) {
  const theme = LEVEL_THEME[course.level] ?? LEVEL_THEME.beginner;
  const [imageBroken, setImageBroken] = useState(false);
  const showImage = course.image && !imageBroken;
  const t = useTranslations("CourseCard");
  const locale = useLocale();

  const sharedStyle = {
    "--card-bg": theme.gradient,
    "--card-border-color": theme.badgeBg,
  } as React.CSSProperties;

  const sharedClass =
    "course-card flex h-full w-full flex-col rounded-[20px] p-5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-blue)";

  const body = (
    <>
      <div className="flex shrink-0 items-start justify-between pr-10">
        <span className="text-[clamp(18px,calc(16.54px+0.39vw),24px)] font-medium leading-tight text-(--color-text-primary)">
          {formatPrice(course, t("free"), locale)}
        </span>
      </div>

      <div className="relative my-3 h-[clamp(100px,calc(91.26px+2.33vw),136px)] w-full shrink-0 overflow-hidden rounded-xl">
        {showImage ? (
          <Image
            src={course.image as string}
            alt=""
            fill
            unoptimized
            sizes="456px"
            className="object-contain"
            onError={() => setImageBroken(true)}
          />
        ) : null}
      </div>

      <div className="mt-auto flex min-h-0 flex-col gap-1.5">
        <h3 className="line-clamp-2 shrink-0 text-[clamp(16px,calc(15.03px+0.26vw),20px)] font-bold leading-tight uppercase text-(--color-text-primary)">
          {course.title}
        </h3>

        <div className="flex min-w-0 items-center">
          <span
            className="inline-flex max-w-full items-center truncate rounded-md px-2 py-px font-(family-name:--font-accent) text-[clamp(12px,calc(11.51px+0.13vw),14px)] uppercase whitespace-nowrap"
            style={{ background: theme.badgeBg, color: theme.badgeText }}
          >
            {course.teacher_name}
          </span>
        </div>

        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="text-[clamp(14px,calc(13.51px+0.13vw),16px)] text-(--color-text-primary)">
            {t("students", { count: course.students_count.toLocaleString() })}
          </span>
          <Stars rating={course.rating_avg} />
        </div>
      </div>
    </>
  );

  return (
    <div className="relative h-[clamp(300px,calc(284.95px+4.01vw),362px)] w-[clamp(300px,calc(262.14px+10.1vw),456px)] shrink-0">
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          className={`${sharedClass} text-left`}
          style={sharedStyle}
        >
          {body}
        </button>
      ) : (
        <Link href={href ?? `/courses/${course.slug}`} className={sharedClass} style={sharedStyle}>
          {body}
        </Link>
      )}

      <div className="absolute top-4 right-4">
        <WishlistButton slug={course.slug} initialLiked={isWishlisted} />
      </div>
    </div>
  );
}
