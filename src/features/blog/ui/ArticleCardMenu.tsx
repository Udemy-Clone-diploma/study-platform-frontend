"use client";

import { useEffect, useRef, useState } from "react";
import {
  MoreVertical,
  Pencil,
  Send,
  Trash2,
  RotateCcw,
  Archive,
  ArchiveRestore,
  UserCheck,
  Check,
  X,
} from "lucide-react";
import type { ArticleStatus } from "@/entities/blog";

export type ArticleMenuAction =
  | "edit"
  | "submit"
  | "publish"
  | "withdraw"
  | "archive"
  | "restore"
  | "delete"
  | "assign"
  | "approve"
  | "reject";

export type MenuItem = {
  label: string;
  action: ArticleMenuAction;
  Icon: React.ElementType;
  danger?: boolean;
};

type Props = {
  status: ArticleStatus;
  /** Current user authored this article. */
  isOwner: boolean;
  /** Current user is a moderator or administrator. */
  isStaff: boolean;
  /** The article's author is themself a moderator/administrator (skips review). */
  authorIsStaff: boolean;
  /** Article is under review and assigned to the current moderator. */
  isAssignedToMe: boolean;
  onAction: (action: ArticleMenuAction) => void;
};

/** Which actions are available for an article, given the viewer's relationship to it.
 * Shared by ArticleCardMenu's dropdown (article page) and ArticleDetailPanel's button row (dashboard). */
export function buildArticleMenu({ status, isOwner, isStaff, authorIsStaff, isAssignedToMe }: Omit<Props, "onAction">): MenuItem[] {
  const items: MenuItem[] = [];

  if (isOwner) {
    if (status === "draft") {
      items.push({ label: "Edit", action: "edit", Icon: Pencil });
      items.push(
        authorIsStaff
          ? { label: "Publish", action: "publish", Icon: Send }
          : { label: "Send for Review", action: "submit", Icon: Send },
      );
      items.push({ label: "Delete", action: "delete", Icon: Trash2, danger: true });
    } else if (status === "review") {
      items.push({ label: "Withdraw to Draft", action: "withdraw", Icon: RotateCcw });
    } else if (status === "rejected") {
      items.push({ label: "Edit", action: "edit", Icon: Pencil });
      items.push({ label: "Resend for Review", action: "submit", Icon: Send });
      items.push({ label: "Delete", action: "delete", Icon: Trash2, danger: true });
    } else if (status === "published") {
      items.push({ label: "Unpublish (Edit)", action: "withdraw", Icon: RotateCcw });
      items.push({ label: "Archive", action: "archive", Icon: Archive });
    } else if (status === "archived") {
      items.push({ label: "Restore to Draft", action: "restore", Icon: ArchiveRestore });
    }
  }

  if (isStaff && status === "review") {
    if (isAssignedToMe) {
      items.push({ label: "Approve", action: "approve", Icon: Check });
      items.push({ label: "Reject", action: "reject", Icon: X, danger: true });
    } else if (!isOwner) {
      items.push({ label: "Assign to Me", action: "assign", Icon: UserCheck });
    }
  }

  // Articles under review only ever offer assign/approve/reject (above). On someone else's
  // article, staff can only archive it -- delete stays the owner's own call (see the isOwner
  // branches above), except for their own content.
  if (isStaff && !isOwner && status !== "review" && status !== "archived") {
    items.push({ label: "Archive", action: "archive", Icon: Archive });
  }

  return items;
}

/** Self-contained ⋮ trigger + dropdown for an article card, actions depend on status/role. */
export function ArticleCardMenu({ status, isOwner, isStaff, authorIsStaff, isAssignedToMe, onAction }: Props) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
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

  const items = buildArticleMenu({ status, isOwner, isStaff, authorIsStaff, isAssignedToMe });
  if (items.length === 0) return null;

  function handleClick(action: ArticleMenuAction) {
    setOpen(false);
    onAction(action);
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        ref={triggerRef}
        aria-label="Article options"
        aria-expanded={open}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="flex shrink-0 items-center justify-center rounded-full transition hover:bg-white/80"
        style={{ width: 32, height: 32, background: "var(--color-bg)", border: "none", cursor: "pointer", padding: 0 }}
      >
        <MoreVertical size={18} />
      </button>

      {open && (
        <div
          ref={dropdownRef}
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            width: 200,
            background: "linear-gradient(90deg, var(--color-brand-lavender) -210.91%, var(--color-brand-pink) 233.85%, var(--color-brand-cream) 661.82%)",
            borderRadius: 12,
            padding: 14,
            zIndex: 20,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {items.map((item, i) => (
            <button
              key={item.action}
              type="button"
              className={[
                "flex w-full items-center transition-opacity hover:opacity-70",
                item.danger ? "text-red-600" : "text-(--color-text-primary)",
                i < items.length - 1 ? "border-b border-white/60 pb-2 mb-1" : "",
              ].join(" ")}
              style={{ gap: 8 }}
              onClick={() => handleClick(item.action)}
            >
              <span className="flex-1 text-left font-(family-name:--font-accent) font-medium" style={{ fontSize: 13 }}>
                {item.label}
              </span>
              <item.Icon size={16} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
