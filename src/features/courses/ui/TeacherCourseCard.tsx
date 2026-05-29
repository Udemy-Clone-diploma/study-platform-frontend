"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MoreVertical, Download, Trash2 } from "lucide-react";
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
  onArchive?: () => void;
  onDelete?: () => void;
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
  onArchive,
  onDelete,
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

  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        dropdownRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      ) return;
      setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  return (
    <div className="relative">
      <Link
        href={`/teacher-dashboard/courses/${slug}/edit`}
        className={[
          "flex items-center shadow-(--shadow-my-courses-card) transition-[box-shadow,filter] hover:shadow-[0px_0px_40px_rgba(0,0,0,0.22)] focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-blue)",
          isCompleted ? "grayscale" : "",
        ].join(" ")}
        style={{
          background: gradient,
          borderRadius: "clamp(12px, 1.39vw, 20px)",
          padding: "clamp(10px, 1.25vw, 19px) clamp(8px, 0.83vw, 12px)",
          gap: "clamp(4px, 0.56vw, 8px)",
        }}
      >
        {/* Thumbnail */}
        <Image
          src={imageSrc ?? iconSrc}
          alt=""
          width={60}
          height={60}
          unoptimized={!!imageSrc}
          className="shrink-0 object-contain"
          style={{ width: thumbSize, height: thumbSize }}
        />

        {/* Text area */}
        <div className="flex min-w-0 flex-1 flex-col justify-center" style={{ gap: "clamp(4px, 0.56vw, 8px)" }}>
          <div className="flex items-center" style={{ gap: "clamp(4px, 0.28vw, 4px)" }}>
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

        {/* Menu trigger — sibling to thumbnail and text, vertically centred by parent align-items */}
        <button
          ref={triggerRef}
          aria-label="Course options"
          aria-expanded={menuOpen}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
          className="flex shrink-0 items-center justify-center rounded transition-opacity hover:opacity-60"
          style={{ width: "clamp(24px, 2.5vw, 40px)", height: "clamp(24px, 2.5vw, 40px)" }}
        >
          <MoreVertical style={{ width: "clamp(16px, 1.67vw, 24px)", height: "clamp(16px, 1.67vw, 24px)" }} />
        </button>
      </Link>

      {menuOpen && (
        <div
          ref={dropdownRef}
          style={{
            position: "absolute",
            top: "calc(100% - 16px)",
            right: 0,
            width: 220,
            minWidth: 220,
            background:
              "linear-gradient(90deg, #A7BAFA -210.91%, #FCC4C3 233.85%, #FFF4DA 661.82%)",
            borderRadius: 12,
            padding: "24px 40px 24px 16px",
            zIndex: 20,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <button
            className="flex w-full items-center text-(--color-text-primary) transition-opacity hover:opacity-70"
            style={{ height: 28, gap: 16 }}
            onClick={() => {
              onArchive?.();
              setMenuOpen(false);
            }}
          >
            <span
              className="flex-1 text-left font-(family-name:--font-accent) font-medium uppercase"
              style={{ fontSize: 16, lineHeight: "20px" }}
            >
              Archive
            </span>
            <Download size={28} />
          </button>

          <div style={{ height: 1, background: "#ffffff" }} />

          <button
            className="flex w-full items-center text-(--color-text-primary) transition-opacity hover:opacity-70"
            style={{ height: 28, gap: 16 }}
            onClick={() => {
              onDelete?.();
              setMenuOpen(false);
            }}
          >
            <span
              className="flex-1 text-left font-(family-name:--font-accent) font-medium uppercase"
              style={{ fontSize: 16, lineHeight: "20px" }}
            >
              Delete
            </span>
            <Trash2 size={28} />
          </button>
        </div>
      )}
    </div>
  );
}
