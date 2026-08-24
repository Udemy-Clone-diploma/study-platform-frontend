"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  MoreVertical,
  Pencil,
  Send,
  Trash2,
  RotateCcw,
  Archive,
  ArchiveRestore,
  Eye,
} from "lucide-react";

export type TeacherCourseStatus =
  | "draft"
  | "active"
  | "active_draft_edit"
  | "active_pending_edit"
  | "active_needs_revision"
  | "pending_moderation"
  | "needs_revision"
  | "hidden"
  | "completed";

export type MenuAction =
  | "edit"
  | "publish"
  | "delete"
  | "withdraw"
  | "archive"
  | "unarchive"
  | "open"
  | "edit-changes"
  | "submit-changes"
  | "withdraw-edit"
  | "discard-changes";

type MenuItem = {
  labelKey: string;
  action: MenuAction;
  Icon: React.ElementType;
  danger?: boolean;
};

const MENU_BY_STATUS: Record<TeacherCourseStatus, MenuItem[]> = {
  draft: [
    { labelKey: "edit", action: "edit", Icon: Pencil },
    { labelKey: "submitForReview", action: "publish", Icon: Send },
    { labelKey: "delete", action: "delete", Icon: Trash2, danger: true },
  ],
  pending_moderation: [{ labelKey: "withdrawFromModeration", action: "withdraw", Icon: RotateCcw }],
  needs_revision: [
    { labelKey: "withdrawFromModeration", action: "withdraw", Icon: RotateCcw },
    { labelKey: "edit", action: "edit", Icon: Pencil },
    { labelKey: "resubmitForReview", action: "publish", Icon: Send },
  ],
  active: [
    { labelKey: "edit", action: "edit", Icon: Pencil },
    { labelKey: "archive", action: "archive", Icon: Archive },
  ],
  /** Published + draft pending edit (saved but not submitted) */
  active_draft_edit: [
    { labelKey: "editChanges", action: "edit-changes", Icon: Pencil },
    { labelKey: "submitChanges", action: "submit-changes", Icon: Send },
    { labelKey: "discardChanges", action: "discard-changes", Icon: Trash2, danger: true },
  ],
  /** Published + pending edit submitted for moderation (locked) */
  active_pending_edit: [
    { labelKey: "withdrawFromModeration", action: "withdraw-edit", Icon: RotateCcw },
  ],
  /** Published + edit returned by moderator */
  active_needs_revision: [
    { labelKey: "editChanges", action: "edit-changes", Icon: Pencil },
    { labelKey: "submitChanges", action: "submit-changes", Icon: Send },
    { labelKey: "discardChanges", action: "discard-changes", Icon: Trash2, danger: true },
  ],
  hidden: [
    { labelKey: "edit", action: "edit", Icon: Pencil },
    { labelKey: "open", action: "open", Icon: Eye },
    { labelKey: "archive", action: "archive", Icon: Archive },
  ],
  completed: [{ labelKey: "unarchive", action: "unarchive", Icon: ArchiveRestore }],
};

type Props = {
  status: TeacherCourseStatus;
  onAction: (action: MenuAction) => void;
};

/** Self-contained ⋮ trigger + dropdown for a teacher course card. */
export function CourseCardMenu({ status, onAction }: Props) {
  const t = useTranslations("TeacherCourseCard");
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (dropdownRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const items = MENU_BY_STATUS[status] ?? [];

  function handleClick(action: MenuAction) {
    setOpen(false);
    onAction(action);
  }

  return (
    <div
      style={{
        position: "absolute",
        right: 0,
        top: 0,
        bottom: 0,
        display: "flex",
        alignItems: "center",
      }}
    >
      {/* ⋮ trigger */}
      <button
        ref={triggerRef}
        aria-label={t("courseOptionsAriaLabel")}
        aria-expanded={open}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="flex shrink-0 items-center justify-center rounded transition-opacity hover:opacity-60"
        style={{
          width: "clamp(24px, 2.5vw, 40px)",
          height: "clamp(24px, 2.5vw, 40px)",
          marginRight: "clamp(8px, 0.83vw, 12px)",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: 0,
        }}
      >
        <MoreVertical
          style={{ width: "clamp(16px, 1.67vw, 24px)", height: "clamp(16px, 1.67vw, 24px)" }}
        />
      </button>

      {/* Dropdown */}
      {open && items.length > 0 && (
        <div
          ref={dropdownRef}
          style={{
            position: "absolute",
            top: "calc(100% - 16px)",
            right: 0,
            width: 220,
            minWidth: 220,
            background:
              "linear-gradient(90deg, var(--color-brand-lavender) -210.91%, var(--color-brand-pink) 233.85%, var(--color-brand-cream) 661.82%)",
            borderRadius: 12,
            padding: "16px",
            zIndex: 20,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {items.map((item, i) => (
            <button
              key={item.action}
              className={[
                "flex w-full items-center transition-opacity hover:opacity-70",
                item.danger ? "text-red-600" : "text-(--color-text-primary)",
                i < items.length - 1 ? "border-b border-white/60 pb-3 mb-1" : "",
              ].join(" ")}
              style={{ gap: 10, height: 28 }}
              onClick={() => handleClick(item.action)}
            >
              <span
                className="flex-1 text-left font-(family-name:--font-accent) font-medium uppercase"
                style={{ fontSize: "clamp(12px, 0.97vw, 16px)", lineHeight: "20px" }}
              >
                {t(item.labelKey)}
              </span>
              <item.Icon size={18} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
