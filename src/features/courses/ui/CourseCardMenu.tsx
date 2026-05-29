"use client";

import { useEffect, useRef, useState } from "react";
import { MoreVertical, Pencil, Send, Trash2, RotateCcw, Archive, ArchiveRestore, Eye } from "lucide-react";

export type TeacherCourseStatus =
  | "draft"
  | "active"
  | "pending_moderation"
  | "needs_revision"
  | "hidden"
  | "completed";

export type MenuAction = "edit" | "publish" | "delete" | "withdraw" | "archive" | "unarchive" | "open";

type MenuItem = {
  label: string;
  action: MenuAction;
  Icon: React.ElementType;
  danger?: boolean;
};

const MENU_BY_STATUS: Record<TeacherCourseStatus, MenuItem[]> = {
  draft: [
    { label: "Edit",              action: "edit",      Icon: Pencil },
    { label: "Submit for Review", action: "publish",   Icon: Send   },
    { label: "Delete",            action: "delete",    Icon: Trash2, danger: true },
  ],
  pending_moderation: [
    { label: "Withdraw from Moderation", action: "withdraw", Icon: RotateCcw },
  ],
  needs_revision: [
    { label: "Withdraw from Moderation", action: "withdraw", Icon: RotateCcw },
    { label: "Edit",                     action: "edit",     Icon: Pencil   },
    { label: "Re-submit for Review",     action: "publish",  Icon: Send     },
  ],
  active: [
    { label: "Edit",    action: "edit",    Icon: Pencil  },
    { label: "Archive", action: "archive", Icon: Archive },
  ],
  hidden: [
    { label: "Edit",    action: "edit",    Icon: Pencil      },
    { label: "Open",    action: "open",    Icon: Eye         },
    { label: "Archive", action: "archive", Icon: Archive     },
  ],
  completed: [
    { label: "Unarchive", action: "unarchive", Icon: ArchiveRestore },
  ],
};

type Props = {
  status: TeacherCourseStatus;
  onAction: (action: MenuAction) => void;
};

/** Self-contained ⋮ trigger + dropdown for a teacher course card. */
export function CourseCardMenu({ status, onAction }: Props) {
  const [open, setOpen] = useState(false);
  const triggerRef  = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (dropdownRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
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
    <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, display: "flex", alignItems: "center" }}>
      {/* ⋮ trigger */}
      <button
        ref={triggerRef}
        aria-label="Course options"
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
        <MoreVertical style={{ width: "clamp(16px, 1.67vw, 24px)", height: "clamp(16px, 1.67vw, 24px)" }} />
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
            background: "linear-gradient(90deg, var(--color-brand-lavender) -210.91%, var(--color-brand-pink) 233.85%, var(--color-brand-cream) 661.82%)",
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
                {item.label}
              </span>
              <item.Icon size={18} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
