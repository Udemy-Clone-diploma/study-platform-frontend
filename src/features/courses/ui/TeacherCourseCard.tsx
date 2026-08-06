"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
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

const LEVEL_BORDER: Record<CourseLevel, string> = {
  beginner:     "var(--color-brand-lavender)",
  intermediate: "var(--color-brand-yellow)",
  advanced:     "var(--color-brand-pink)",
};

const STATUS_ICON: Record<TeacherCourseStatus, string | null> = {
  draft:                "/icons/pen.svg",
  active:               null,
  active_draft_edit:    "/icons/pen.svg",
  active_pending_edit:  "/icons/clock.svg",
  active_needs_revision:"/icons/exclamationmark-triangle.svg",
  pending_moderation:   "/icons/clock.svg",
  needs_revision:       "/icons/exclamationmark-triangle.svg",
  hidden:               null,
  completed:            null,
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
  | "publish"
  | "submit-changes"
  | "discard-changes"
  | "withdraw-edit"
  | "moderation-info";

type ModalConfig = {
  title: string;
  description: string;
  confirmLabel: string;
  hideVariant?: boolean;
};

function modalConfig(
  kind: ModalKind,
  enrolledCount: number,
  t: (key: string, values?: Record<string, number>) => string,
): ModalConfig {
  switch (kind) {
    case "delete":
      return { title: t("deleteTitle"), description: t("deleteDescription"), confirmLabel: t("delete") };
    case "delete-hide":
      return { title: t("cannotDeleteTitle"), description: t("cannotDeleteDescription", { count: enrolledCount }), confirmLabel: t("hide"), hideVariant: true };
    case "archive":
      return { title: t("archiveTitle"), description: t("archiveDescription"), confirmLabel: t("archive") };
    case "archive-hide":
      return { title: t("cannotArchiveTitle"), description: t("cannotArchiveDescription", { count: enrolledCount }), confirmLabel: t("hide"), hideVariant: true };
    case "hidden-archive":
      return { title: t("archiveHiddenTitle"), description: t("archiveHiddenDescription", { count: enrolledCount }), confirmLabel: t("archive") };
    case "withdraw":
      return { title: t("withdrawTitle"), description: t("withdrawDescription"), confirmLabel: t("withdraw") };
    case "unarchive":
      return { title: t("unarchiveTitle"), description: t("unarchiveDescription"), confirmLabel: t("unarchive") };
    case "publish":
      return { title: t("publishTitle"), description: t("publishDescription"), confirmLabel: t("submit") };
    case "submit-changes":
      return { title: t("submitChangesTitle"), description: t("submitChangesDescription"), confirmLabel: t("submit") };
    case "discard-changes":
      return { title: t("discardChangesTitle"), description: t("discardChangesDescription"), confirmLabel: t("discard") };
    case "withdraw-edit":
      return { title: t("withdrawEditTitle"), description: t("withdrawEditDescription"), confirmLabel: t("withdraw") };
    case "moderation-info":
      return { title: t("moderationInfoTitle"), description: t("moderationInfoDescription"), confirmLabel: t("withdraw") };
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
  onEditChanges?: () => void;
  onSubmitChanges?: () => void;
  onWithdrawEdit?: () => void;
  onDiscardChanges?: () => void;
};

/** Course card for the teacher My Courses page */
export function TeacherCourseCard({
  title, level, status, imageSrc, iconSrc, progressPercent, rating, slug,
  enrolledCount = 0,
  onEdit, onPublish, onWithdraw, onArchive, onUnarchive, onDelete, onHide, onOpen,
  onEditChanges, onSubmitChanges, onWithdrawEdit, onDiscardChanges,
}: Props) {
  const t = useTranslations("TeacherCourseCard");
  const gradient   = LEVEL_GRADIENT[level];
  const border     = LEVEL_BORDER[level];
  const statusIcon = STATUS_ICON[status];
  const clamped    = progressPercent !== undefined ? Math.min(Math.max(progressPercent, 0), 100) : undefined;
  const thumbSize  = "clamp(60px, 4.17vw, 60px)";
  const iconSize   = "clamp(16px, 1.67vw, 24px)";

  const [modal, setModal] = useState<ModalKind | null>(null);

  function handleAction(action: MenuAction) {
    switch (action) {
      case "edit":            onEdit?.();                  break;
      case "open":            onOpen?.();                  break;
      case "publish":         setModal("publish");         break;
      case "withdraw":        setModal("withdraw");        break;
      case "unarchive":       setModal("unarchive");       break;
      case "edit-changes":    onEditChanges?.();           break;
      case "submit-changes":  setModal("submit-changes");  break;
      case "withdraw-edit":   setModal("withdraw-edit");   break;
      case "discard-changes": setModal("discard-changes"); break;
      case "delete":
        setModal(enrolledCount > 0 ? "delete-hide" : "delete");
        break;
      case "archive":
        if (status === "hidden") setModal(enrolledCount > 0 ? "hidden-archive" : "archive");
        else setModal(enrolledCount > 0 ? "archive-hide" : "archive");
        break;
    }
  }

  function handleConfirm() {
    if (!modal) return;
    switch (modal) {
      case "delete":          onDelete?.();         break;
      case "delete-hide":     onHide?.();           break;
      case "archive":         onArchive?.();        break;
      case "archive-hide":    onHide?.();           break;
      case "hidden-archive":  onArchive?.();        break;
      case "withdraw":        onWithdraw?.();       break;
      case "unarchive":       onUnarchive?.();      break;
      case "publish":         onPublish?.();        break;
      case "submit-changes":  onSubmitChanges?.();  break;
      case "discard-changes": onDiscardChanges?.(); break;
      case "withdraw-edit":    onWithdrawEdit?.();  break;
      case "moderation-info":  onWithdraw?.();      break;
    }
    setModal(null);
  }

  function cardHref(): string {
    if (status === "draft" || status === "needs_revision") {
      return `/teacher-dashboard/courses/${slug}/edit`;
    }
    if (status === "pending_moderation") return "#";
    return `/teacher-dashboard/courses/${slug}`;
  }

  function handleCardClick(e: React.MouseEvent) {
    if (status === "pending_moderation") {
      e.preventDefault();
      setModal("moderation-info");
    }
  }

  const cfg = modal ? modalConfig(modal, enrolledCount, t) : null;

  const showRating = (status === "completed" || status === "active" || status === "active_draft_edit" || status === "active_pending_edit" || status === "active_needs_revision") && rating !== undefined;

  return (
    <>
      <div className="relative">
        <Link
          href={cardHref()}
          onClick={handleCardClick}
          className={[
            "mini-course-card flex w-full items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-blue)",
            status === "completed" ? "grayscale" : "",
          ].join(" ")}
          style={{
            "--card-bg": gradient,
            "--card-border-color": border,
            borderRadius: "clamp(12px, 1.39vw, 20px)",
            padding: "clamp(28px, 2.09vw, 40px) clamp(12px, 0.83vw, 12px)",
            gap: "clamp(4px, 0.56vw, 8px)",
          } as React.CSSProperties}
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
                style={{ fontSize: "clamp(12px, 0.97vw, 14px)", lineHeight: "clamp(15px, 1.25vw, 18px)" }}
              >
                {title}
              </h3>

              {showRating && (
                <div className="flex shrink-0 items-center" style={{ gap: "clamp(2px, 0.14vw, 2px)" }}>
                  <Image src="/icons/star fill.png" alt="" width={24} height={24} style={{ width: iconSize, height: iconSize }} />
                  <span className="text-(--color-text-primary)" style={{ fontSize: "clamp(14px, 1.39vw, 20px)" }}>{rating}</span>
                </div>
              )}
              {status === "hidden" ? (
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
                <span className="shrink-0 font-(family-name:--font-accent) font-semibold uppercase text-(--color-text-primary)" style={{ fontSize: "clamp(12px, 1.11vw, 16px)" }}>
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
