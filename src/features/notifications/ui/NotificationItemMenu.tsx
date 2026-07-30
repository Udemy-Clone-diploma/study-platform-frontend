"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, MoreVertical, RotateCcw, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

const MENU_WIDTH = 184;
const MENU_HEIGHT = 96;

export function NotificationItemMenu({
  isRead,
  onToggleRead,
  onDelete,
}: {
  isRead: boolean;
  onToggleRead: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations("NotificationItemMenu");
  const tCommon = useTranslations("Common");
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function close() {
      setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) {
      const flipUp = rect.bottom + 6 + MENU_HEIGHT > window.innerHeight;
      setPos({
        top: flipUp ? rect.top - 6 - MENU_HEIGHT : rect.bottom + 6,
        left: Math.max(8, rect.right - MENU_WIDTH),
      });
    }
    setOpen(true);
  }

  function run(action: () => void) {
    setOpen(false);
    action();
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label={t("actionsAriaLabel")}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
        className={`absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full text-(--color-text-secondary) opacity-0 transition-all duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 hover:bg-(--color-text-primary)/10 hover:text-(--color-text-primary) focus-visible:pointer-events-auto focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-text-primary)/20 ${
          open
            ? "pointer-events-auto bg-(--color-text-primary)/10 text-(--color-text-primary) opacity-100"
            : "pointer-events-none"
        }`}
      >
        <MoreVertical className="h-4 w-4" aria-hidden />
      </button>

      {open &&
        pos &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label={t("actionsAriaLabel")}
            data-notif-menu
            style={{ position: "fixed", top: pos.top, left: pos.left, width: MENU_WIDTH }}
            className="z-[70] flex flex-col gap-0.5 rounded-2xl bg-(--color-bg) p-1.5 shadow-(--shadow-card)"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => run(onToggleRead)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-(--color-text-primary) transition-colors hover:bg-(--color-text-primary)/5"
            >
              {isRead ? (
                <RotateCcw className="h-4 w-4 shrink-0" aria-hidden />
              ) : (
                <Check className="h-4 w-4 shrink-0" aria-hidden />
              )}
              {isRead ? t("markAsUnread") : t("markAsRead")}
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => run(onDelete)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-(--color-danger) transition-colors hover:bg-(--color-danger)/10"
            >
              <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
              {tCommon("delete")}
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}
