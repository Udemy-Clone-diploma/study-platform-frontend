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

type Props = { course: CourseListItem };

export function CourseCard({ course }: Props) {
  const theme = LEVEL_THEME[course.level] ?? LEVEL_THEME.beginner;
  const [imageBroken, setImageBroken] = useState(false);
  const showImage = course.image && !imageBroken;

  return (
    <div className="relative h-full">
      <Link
        href={`/courses/${course.slug}`}
        className="course-card flex h-full flex-col rounded-[20px] p-4 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-blue) sm:p-5"
        style={
          {
            "--card-bg": theme.gradient,
            "--card-border-color": theme.badgeBg,
          } as React.CSSProperties
        }
      >
        <div className="flex items-start justify-between">
          <span className="text-xl font-medium text-(--color-text-primary) sm:text-2xl">
            {formatPrice(course)}
          </span>
        </div>

        <div className="relative my-3 aspect-video w-full overflow-hidden rounded-xl">
          {showImage ? (
            <Image
              src={course.image as string}
              alt=""
              fill
              unoptimized
              sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="object-contain"
              onError={() => setImageBroken(true)}
            />
          ) : null}
        </div>

        <div className="mt-auto flex flex-col gap-1.5">
          <h3 className="line-clamp-2 text-lg font-bold uppercase text-(--color-text-primary) sm:text-2xl">
            {course.title}
          </h3>

          <div className="flex items-center">
            <span
              className="inline-flex max-w-full items-center truncate rounded-md px-2 py-px font-(family-name:--font-accent) text-xs uppercase whitespace-nowrap sm:text-sm"
              style={{ background: theme.badgeBg, color: theme.badgeText }}
            >
              {course.teacher_name}
            </span>
          </div>

          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="text-sm text-(--color-text-primary) sm:text-base">
              {course.students_count.toLocaleString()} person
            </span>
            <Stars rating={course.rating_avg} />
          </div>
        </div>
      </Link>

      <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
        <WishlistButton />
      </div>
    </div>
  );
}
