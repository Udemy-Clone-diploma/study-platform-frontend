"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { EyeOff } from "lucide-react";
import type { CourseLevel } from "@/entities/course";
import { CourseCardMenu, type MenuAction, type TeacherCourseStatus } from "./CourseCardMenu";
import { CourseConfirmModal } from "./CourseConfirmModal";

export type { TeacherCourseStatus } from "./CourseCardMenu";

const LEVEL_GRADIENT: Record<CourseLevel, string> = {
  beginner:     "var(--gradient-card-blue)",
  intermediate: "var(--gradient-card-yellow)",
  advanced:     "var(--gradient-card-pink)",
};

const STATUS_ICON: Record<TeacherCourseStatus, string | null> = {
  draft:              "/icons/pen.svg",
  active:             null,
  pending_moderation: "/icons/clock.svg",
  needs_revision:     "/icons/exclamationmark-triangle.svg",
  hidden:             null,
  completed:          null,
};

// ----- modal config -------------------------------------------------------

type ModalKind =
  | "delete"
  | "delete-hide"
  | "archive"
  | "archive-hide"
  | "hidden-archive"
  | "withdraw"
  | "unarchive"
  | "publish";

type ModalConfig = {
  title: string;
  description: string;
  confirmLabel: string;
  hideVariant?: boolean;
};

function modalConfig(kind: ModalKind, enrolledCount: number): ModalConfig {
  switch (kind) {
    case "delete":
      return { title: "Delete", description: "Are you sure you want to delete this course?", confirmLabel: "Delete" };
    case "delete-hide":
      return { title: "You cannot delete a course.", description: `You cannot delete the course. There are currently ${enrolledCount} students in the course. Do you want to hide the course from new users?`, confirmLabel: "Hide", hideVariant: true };
    case "archive":
      return { title: "Archive", description: "Are you sure you want to archive this course?", confirmLabel: "Archive" };
    case "archive-hide":
      return { title: "You cannot archive a course.", description: `You cannot archive the course. There are currently ${enrolledCount} students in the course. Do you want to hide the course from new users?`, confirmLabel: "Hide", hideVariant: true };
    case "hidden-archive":
      return { title: "Archive hidden course", description: `There are currently ${enrolledCount} students still enrolled and learning. Archiving will close their access to course content. Are you sure?`, confirmLabel: "Archive" };
    case "withdraw":
      return { title: "Withdraw from Moderation", description: "Are you sure you want to withdraw this course from moderation? It will be moved back to Draft.", confirmLabel: "Withdraw" };
    case "unarchive":
      return { title: "Unarchive", description: "This course will be moved back to Draft. Are you sure?", confirmLabel: "Unarchive" };
    case "publish":
      return { title: "Submit for Review", description: "Are you sure you want to submit this course for moderation?", confirmLabel: "Submit" };
  }
}

// ----- component ----------------------------------------------------------

type Props = {
  title: string;
  level: CourseLevel;
  status: TeacherCourseStatus;
  imageSrc?: string | null;
  iconSrc: string;
  progressPercent?: number;
  rating?: number;
  slug: string;
  enrolledCount?: number;
  onEdit?: () => void;
  onPublish?: () => void;
  onWithdraw?: () => void;
  onArchive?: () => void;
  onUnarchive?: () => void;
  onDelete?: () => void;
  onHide?: () => void;
  onOpen?: () => void;
};

/** Course card for the teacher My Courses page */
export function TeacherCourseCard({
  title, level, status, imageSrc, iconSrc, progressPercent, rating, slug,
  enrolledCount = 0,
  onEdit, onPublish, onWithdraw, onArchive, onUnarchive, onDelete, onHide, onOpen,
}: Props) {
  const gradient  = LEVEL_GRADIENT[level];
  const statusIcon = STATUS_ICON[status];
  const clamped = progressPercent !== undefined ? Math.min(Math.max(progressPercent, 0), 100) : undefined;
  const thumbSize = "clamp(36px, 4.17vw, 60px)";
  const iconSize  = "clamp(16px, 1.67vw, 24px)";

  const [modal, setModal] = useState<ModalKind | null>(null);

  function handleAction(action: MenuAction) {
    switch (action) {
      case "edit":      onEdit?.(); break;
      case "open":      onOpen?.(); break;
      case "publish":   setModal("publish"); break;
      case "delete":    setModal(enrolledCount > 0 ? "delete-hide" : "delete"); break;
      case "withdraw":  setModal("withdraw"); break;
      case "unarchive": setModal("unarchive"); break;
      case "archive":
        if (status === "hidden") setModal(enrolledCount > 0 ? "hidden-archive" : "archive");
        else setModal(enrolledCount > 0 ? "archive-hide" : "archive");
        break;
    }
  }

  function handleConfirm() {
    if (!modal) return;
    switch (modal) {
      case "delete":         onDelete?.();    break;
      case "delete-hide":    onHide?.();      break;
      case "archive":        onArchive?.();   break;
      case "archive-hide":   onHide?.();      break;
      case "hidden-archive": onArchive?.();   break;
      case "withdraw":       onWithdraw?.();  break;
      case "unarchive":      onUnarchive?.(); break;
      case "publish":        onPublish?.();   break;
    }
    setModal(null);
  }

  const cfg = modal ? modalConfig(modal, enrolledCount) : null;

  return (
    <>
      <div className="relative">
        <Link
          href={`/teacher-dashboard/courses/${slug}/edit`}
          className={[
            "flex items-center shadow-(--shadow-my-courses-card) transition-[box-shadow,filter] hover:shadow-[0px_0px_40px_rgba(0,0,0,0.22)] focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-blue)",
            status === "completed" ? "grayscale" : "",
          ].join(" ")}
          style={{
            background: gradient,
            borderRadius: "clamp(12px, 1.39vw, 20px)",
            padding: "clamp(10px, 1.25vw, 19px) clamp(8px, 0.83vw, 12px)",
            gap: "clamp(4px, 0.56vw, 8px)",
          }}
        >
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
            <div className="flex items-center" style={{ gap: "clamp(4px, 0.28vw, 4px)" }}>
              <h3
                className="line-clamp-2 flex-1 font-bold uppercase text-(--color-text-primary)"
                style={{ fontSize: "clamp(10px, 0.97vw, 14px)", lineHeight: "clamp(13px, 1.25vw, 18px)" }}
              >
                {title}
              </h3>

              {(status === "completed" || status === "active") && rating !== undefined ? (
                <div className="flex shrink-0 items-center" style={{ gap: "clamp(2px, 0.14vw, 2px)" }}>
                  <Image src="/icons/star fill.png" alt="" width={24} height={24} style={{ width: iconSize, height: iconSize }} />
                  <span className="text-(--color-text-primary)" style={{ fontSize: "clamp(14px, 1.39vw, 20px)" }}>{rating}</span>
                </div>
              ) : status === "hidden" ? (
                <div className="flex shrink-0 items-center justify-center" style={{ width: "clamp(24px, 2.5vw, 36px)", height: "clamp(24px, 2.5vw, 36px)" }}>
                  <EyeOff style={{ width: iconSize, height: iconSize }} />
                </div>
              ) : statusIcon ? (
                <div className="flex shrink-0 items-center justify-center" style={{ width: "clamp(24px, 2.5vw, 36px)", height: "clamp(24px, 2.5vw, 36px)" }}>
                  <Image src={statusIcon} alt="" width={24} height={24} style={{ width: iconSize, height: iconSize }} />
                </div>
              ) : null}
            </div>

            {status === "active" && clamped !== undefined && (
              <div className="flex items-center" style={{ gap: "clamp(4px, 0.42vw, 6px)" }}>
                <div className="h-0.5 flex-1 overflow-hidden rounded-full bg-(--color-brand-lavender)">
                  <div className="h-full rounded-full bg-(--color-blue)" style={{ width: `${clamped}%` }} />
                </div>
                <span className="shrink-0 font-(family-name:--font-accent) font-semibold uppercase text-(--color-text-primary)" style={{ fontSize: "clamp(10px, 1.11vw, 16px)" }}>
                  {clamped}%
                </span>
              </div>
            )}
          </div>

          {/* Spacer that matches the ⋮ button width so the flex layout stays identical */}
          <div aria-hidden className="shrink-0" style={{ width: "clamp(24px, 2.5vw, 40px)" }} />
        </Link>

        <CourseCardMenu status={status} onAction={handleAction} />
      </div>

      {cfg && (
        <CourseConfirmModal
          title={cfg.title}
          description={cfg.description}
          confirmLabel={cfg.confirmLabel}
          hideVariant={cfg.hideVariant}
          onConfirm={handleConfirm}
          onCancel={() => setModal(null)}
        />
      )}
    </>
  );
}
