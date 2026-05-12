"use client";

import Image from "next/image";
import Link from "next/link";
import type { CourseLevel } from "@/entities/course";

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
  title: string;
  teacherName: string;
  progressPercent?: number;
  imageSrc?: string | null;
  iconSrc: string;
  level?: CourseLevel;
  slug: string;
  isArchived?: boolean;
};

/** Course card for the student My Courses page */
export function StudentCourseCard({
  title,
  teacherName,
  progressPercent,
  imageSrc,
  iconSrc,
  level = "beginner",
  slug,
  isArchived = false,
}: Props) {
  const theme = LEVEL_THEME[level] ?? LEVEL_THEME.beginner;
  const clamped =
    progressPercent !== undefined
      ? Math.min(Math.max(progressPercent, 0), 100)
      : undefined;

  const thumbSize = "clamp(36px, 4.17vw, 60px)";

  return (
    <Link
      href={`/courses/${slug}`}
      className={[
        "flex items-center justify-center shadow-(--shadow-my-courses-card) transition-[box-shadow,filter] hover:shadow-[0px_0px_40px_rgba(0,0,0,0.22)] focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-blue)",
        isArchived ? "grayscale" : "",
      ].join(" ")}
      style={{
        background: theme.gradient,
        borderRadius: "clamp(12px, 1.39vw, 20px)",
        padding: "clamp(10px, 1.25vw, 19px) clamp(8px, 0.83vw, 12px)",
      }}
    >
      <div className="flex w-full flex-col" style={{ gap: "clamp(4px, 0.56vw, 8px)", maxWidth: "clamp(200px, 18.4vw, 265px)" }}>
        <div className="flex items-center" style={{ gap: "clamp(4px, 0.56vw, 8px)" }}>
          <Image
            src={imageSrc ?? iconSrc}
            alt=""
            width={60}
            height={60}
            unoptimized={!!imageSrc}
            className="shrink-0 object-contain"
            style={{ width: thumbSize, height: thumbSize }}
          />

          <div className="flex min-w-0 flex-1 flex-col" style={{ gap: "clamp(3px, 0.28vw, 4px)" }}>
            <h3
              className="line-clamp-2 font-bold uppercase text-(--color-text-primary)"
              style={{ fontSize: "clamp(10px, 0.97vw, 14px)", lineHeight: "clamp(13px, 1.25vw, 18px)" }}
            >
              {title}
            </h3>
            <span
              className="inline-block max-w-full truncate font-(family-name:--font-accent) uppercase leading-none"
              style={{
                background: theme.badgeBg,
                color: theme.badgeText,
                fontSize: "clamp(7px, 0.69vw, 10px)",
                borderRadius: "clamp(3px, 0.35vw, 5px)",
                padding: "2px clamp(4px, 0.42vw, 6px)",
              }}
            >
              {teacherName}
            </span>
          </div>
        </div>

        {clamped !== undefined && (
          <div className="flex items-center" style={{ gap: "clamp(4px, 0.42vw, 6px)" }}>
            <div className="h-0.5 flex-1 overflow-hidden rounded-full bg-(--color-brand-lavender)">
              <div
                className="h-full rounded-full bg-(--color-blue)"
                style={{ width: `${clamped}%` }}
              />
            </div>
            <span
              className="shrink-0 font-(family-name:--font-accent) font-semibold uppercase text-(--color-text-primary)"
              style={{ fontSize: "clamp(10px, 1.11vw, 16px)" }}
            >
              {clamped}%
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
