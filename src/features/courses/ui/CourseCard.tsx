"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice, type CourseListItem } from "@/entities/course";
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

type Props = { course: CourseListItem; isWishlisted?: boolean };

export function CourseCard({ course, isWishlisted = false }: Props) {
  const theme = LEVEL_THEME[course.level] ?? LEVEL_THEME.beginner;
  const [imageBroken, setImageBroken] = useState(false);
  const showImage = course.image && !imageBroken;

  return (
    <div className="relative h-[362px] w-[456px] shrink-0">
      <Link
        href={`/courses/${course.slug}`}
        className="course-card flex h-full w-full flex-col rounded-[20px] p-5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-blue)"
        style={
          {
            "--card-bg": theme.gradient,
            "--card-border-color": theme.badgeBg,
          } as React.CSSProperties
        }
      >
        <div className="flex shrink-0 items-start justify-between pr-10">
          <span className="text-2xl font-medium leading-tight text-(--color-text-primary)">
            {formatPrice(course)}
          </span>
        </div>

        <div className="relative my-3 h-[136px] w-full shrink-0 overflow-hidden rounded-xl">
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
          <h3 className="line-clamp-2 text-xl font-bold leading-tight uppercase text-(--color-text-primary)">
            {course.title}
          </h3>

          <div className="flex min-w-0 items-center">
            <span
              className="inline-flex max-w-full items-center truncate rounded-md px-2 py-px font-(family-name:--font-accent) text-xs uppercase whitespace-nowrap sm:text-sm"
              style={{ background: theme.badgeBg, color: theme.badgeText }}
            >
              {course.teacher_name}
            </span>
          </div>

          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="text-base text-(--color-text-primary)">
              {course.students_count.toLocaleString()} students
            </span>
            <Stars rating={course.rating_avg} />
          </div>
        </div>
      </Link>

      <div className="absolute top-4 right-4">
        <WishlistButton slug={course.slug} initialLiked={isWishlisted} />
      </div>
    </div>
  );
}
