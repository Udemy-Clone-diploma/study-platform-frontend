"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Notification } from "@/entities/notification";
import { NotificationItem } from "./NotificationItem";

export function NotificationDrawer({
  open,
  notifications,
  unreadCount,
  hasMore,
  loadingMore,
  emailEnabled,
  emailSaving,
  onClose,
  onSelect,
  onToggleRead,
  onDelete,
  onMarkAllRead,
  onLoadMore,
  onToggleEmail,
}: {
  open: boolean;
  notifications: Notification[];
  unreadCount: number;
  hasMore: boolean;
  loadingMore: boolean;
  emailEnabled: boolean | null;
  emailSaving: boolean;
  onClose: () => void;
  onSelect: (notification: Notification) => void;
  onToggleRead: (notification: Notification) => void;
  onDelete: (id: number) => void;
  onMarkAllRead: () => void;
  onLoadMore: () => void;
  onToggleEmail: () => void;
}) {
  const t = useTranslations("NotificationBell");
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !hasMore) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) onLoadMore();
      },
      { root: scrollRef.current, threshold: 0.1 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [open, hasMore, onLoadMore, notifications.length]);

  return (
    <div inert={!open} className={`fixed inset-0 z-[60] ${open ? "" : "pointer-events-none"}`}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-(--color-text-primary)/20 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t("notifications")}
        className={`absolute right-0 top-0 flex h-full w-full max-w-[420px] flex-col gap-5 rounded-l-3xl p-6 shadow-(--shadow-card) transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ background: "var(--gradient-notification)" }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold uppercase text-(--color-text-primary) font-(family-name:--font-accent)">
            {t("title")}
          </h2>
          <button
            type="button"
            aria-label={t("closeNotifications")}
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center transition-opacity hover:opacity-70"
          >
            <X className="h-5 w-5 text-(--color-text-primary)" aria-hidden />
          </button>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="self-start text-sm font-medium uppercase text-(--color-text-secondary) transition-opacity hover:opacity-70 font-(family-name:--font-accent)"
          >
            {t("markAllAsRead")}
          </button>
        )}

        {notifications.length === 0 ? (
          <p className="py-6 text-(--color-text-secondary)">{t("empty")}</p>
        ) : (
          <div
            ref={scrollRef}
            className="-mx-3 -my-2 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 py-4"
          >
            {notifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onSelect={onSelect}
                onToggleRead={onToggleRead}
                onDelete={onDelete}
              />
            ))}
            {hasMore && (
              <div ref={sentinelRef} className="flex h-10 shrink-0 items-center justify-center">
                {loadingMore && (
                  <span className="text-sm text-(--color-text-secondary)">{t("loading")}</span>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-(--color-text-primary)/10 pt-4">
          <span className="text-sm text-(--color-text-primary)">{t("emailPreference")}</span>
          <button
            type="button"
            role="switch"
            aria-checked={emailEnabled === true}
            aria-label={t("emailPreference")}
            disabled={emailEnabled === null || emailSaving}
            onClick={onToggleEmail}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
              emailEnabled ? "bg-(--color-text-primary)" : "bg-(--color-text-secondary)/30"
            }`}
          >
            <span
              aria-hidden
              className={`inline-block h-5 w-5 rounded-full bg-(--color-bg) shadow-sm transition-transform ${
                emailEnabled ? "translate-x-[22px]" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </aside>
    </div>
  );
}
