"use client";

import Image from "next/image";
import Link from "next/link";
import type { CourseLevel } from "@/entities/course";

export type TeacherCourseStatus =
  | "draft"
  | "active"
  | "pending_moderation"
  | "needs_revision"
  | "completed";

const LEVEL_GRADIENT: Record<CourseLevel, string> = {
  beginner:     "var(--gradient-card-blue)",
  intermediate: "var(--gradient-card-yellow)",
  advanced:     "var(--gradient-card-pink)",
};

const STATUS_ICON: Record<TeacherCourseStatus, string | null> = {
  draft: "/icons/pen.svg",
  active: null,
  pending_moderation: "/icons/clock.svg",
  needs_revision: "/icons/exclamationmark-triangle.svg",
  completed: null,
};

type Props = {
  title: string;
  level: CourseLevel;
  status: TeacherCourseStatus;
  imageSrc?: string | null;
  iconSrc: string;
  progressPercent?: number;
  rating?: number;
  slug: string;
};

/** Course card for the teacher My Courses page*/
export function TeacherCourseCard({
  title,
  level,
  status,
  imageSrc,
  iconSrc,
  progressPercent,
  rating,
  slug,
}: Props) {
  const gradient = LEVEL_GRADIENT[level];
  const statusIcon = STATUS_ICON[status];
  const clamped =
    progressPercent !== undefined
      ? Math.min(Math.max(progressPercent, 0), 100)
      : undefined;

  const isCompleted = status === "completed";
  const thumbSize = "clamp(36px, 4.17vw, 60px)";
  const iconSize = "clamp(16px, 1.67vw, 24px)";

  return (
    <Link
      href={`/teacher-dashboard/courses/${slug}/edit`}
      className={[
        "flex items-center justify-center shadow-(--shadow-my-courses-card) transition-[box-shadow,filter] hover:shadow-[0px_0px_40px_rgba(0,0,0,0.22)] focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-blue)",
        isCompleted ? "grayscale" : "",
      ].join(" ")}
      style={{
        background: gradient,
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

          <div className="flex min-w-0 flex-1 flex-col justify-center" style={{ gap: "clamp(4px, 0.56vw, 8px)" }}>
            <div className="flex items-start justify-between" style={{ gap: "clamp(4px, 0.28vw, 4px)" }}>
              <h3
                className="line-clamp-2 flex-1 font-bold uppercase text-(--color-text-primary)"
                style={{ fontSize: "clamp(10px, 0.97vw, 14px)", lineHeight: "clamp(13px, 1.25vw, 18px)" }}
              >
                {title}
              </h3>

              {(status === "completed" || status === "active") && rating !== undefined ? (
                <div className="flex shrink-0 items-center" style={{ gap: "clamp(2px, 0.14vw, 2px)" }}>
                  <Image
                    src="/icons/star fill.png"
                    alt=""
                    width={24}
                    height={24}
                    style={{ width: iconSize, height: iconSize }}
                  />
                  <span
                    className="text-(--color-text-primary)"
                    style={{ fontSize: "clamp(14px, 1.39vw, 20px)" }}
                  >
                    {rating}
                  </span>
                </div>
              ) : statusIcon ? (
                <div
                  className="flex shrink-0 items-center justify-center"
                  style={{ width: "clamp(24px, 2.5vw, 36px)", height: "clamp(24px, 2.5vw, 36px)" }}
                >
                  <Image
                    src={statusIcon}
                    alt=""
                    width={24}
                    height={24}
                    style={{ width: iconSize, height: iconSize }}
                  />
                </div>
              ) : null}
            </div>

            {status === "active" && clamped !== undefined ? (
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
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}
