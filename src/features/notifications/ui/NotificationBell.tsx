"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import type { Notification } from "@/entities/notification";
import { useNotifications } from "../lib/useNotifications";
import { useEmailPreference } from "../lib/useEmailPreference";
import { NotificationItem } from "./NotificationItem";
import { NotificationDrawer } from "./NotificationDrawer";

export function NotificationBell({ iconSize = 24 }: { iconSize?: number } = {}) {
  const [open, setOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const t = useTranslations("NotificationBell");
  const {
    unreadCount,
    notifications,
    listLoading,
    loadingMore,
    hasMore,
    loadList,
    loadMore,
    markRead,
    markUnread,
    remove,
    markAllRead,
  } = useNotifications();
  const {
    emailEnabled,
    saving: emailSaving,
    load: loadEmailPref,
    toggle: toggleEmail,
  } = useEmailPreference();

  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (target.closest?.("[data-notif-menu]")) return;
      if (ref.current && !ref.current.contains(target)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  function toggle() {
    setOpen((prev) => {
      const next = !prev;
      if (next) loadList();
      return next;
    });
  }

  function handleSelect(notification: Notification) {
    markRead(notification.id);
    setOpen(false);
    setDrawerOpen(false);
  }

  function handleToggleRead(notification: Notification) {
    if (notification.is_read) markUnread(notification.id);
    else markRead(notification.id);
  }

  function openDrawer() {
    setOpen(false);
    setDrawerOpen(true);
    loadEmailPref();
  }

  return (
    <>
      <div ref={ref} className="relative flex h-full items-center">
        <button
          type="button"
          aria-label={t("notifications")}
          aria-expanded={open}
          onClick={toggle}
          className="relative flex h-10 w-10 items-center justify-center transition-opacity hover:opacity-70"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={iconSize}
            height={iconSize}
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="text-(--color-text-primary)"
          >
            <path
              fill="currentColor"
              d="m5.705 3.71l-1.41-1.42C1 5.563 1 7.935 1 11h1l1-.063C3 8.009 3 6.396 5.705 3.71m13.999-1.42l-1.408 1.42C21 6.396 21 8.009 21 11l2-.063c0-3.002 0-5.374-3.296-8.647M12 22a2.98 2.98 0 0 0 2.818-2H9.182A2.98 2.98 0 0 0 12 22m7-7.414V10c0-3.217-2.185-5.927-5.145-6.742C13.562 2.52 12.846 2 12 2s-1.562.52-1.855 1.258C7.184 4.073 5 6.783 5 10v4.586l-1.707 1.707A1 1 0 0 0 3 17v1a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-1a1 1 0 0 0-.293-.707z"
            />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 right-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-(--color-danger) px-1 text-[10px] font-bold text-(--color-bg)">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {open && (
          <div
            className="absolute right-0 z-50 flex w-[min(380px,calc(100vw-2rem))] flex-col gap-4 rounded-3xl p-5 shadow-(--shadow-card)"
            style={{ top: "calc(100% + 8px)", background: "var(--gradient-notification)" }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold uppercase text-(--color-text-primary) font-(family-name:--font-accent)">
                {t("title")}
              </h2>
              <button
                type="button"
                aria-label={t("closeNotifications")}
                onClick={() => setOpen(false)}
                className="flex h-7 w-7 items-center justify-center transition-opacity hover:opacity-70"
              >
                <X className="h-5 w-5 text-(--color-text-primary)" aria-hidden />
              </button>
            </div>

            {!listLoading && notifications.length === 0 ? (
              <p className="py-6 text-(--color-text-secondary)">{t("empty")}</p>
            ) : (
              <>
                <div className="-mx-3 -my-4 flex max-h-[60vh] flex-col gap-3 overflow-y-auto px-3 py-4">
                  {notifications.slice(0, 5).map((n) => (
                    <NotificationItem
                      key={n.id}
                      notification={n}
                      onSelect={handleSelect}
                      onToggleRead={handleToggleRead}
                      onDelete={remove}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={openDrawer}
                  className="w-full py-1 text-center text-sm font-bold uppercase text-(--color-text-primary) transition-opacity hover:opacity-70 font-(family-name:--font-accent)"
                >
                  {t("seeAll")}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <NotificationDrawer
        open={drawerOpen}
        notifications={notifications}
        unreadCount={unreadCount}
        hasMore={hasMore}
        loadingMore={loadingMore}
        emailEnabled={emailEnabled}
        emailSaving={emailSaving}
        onClose={() => setDrawerOpen(false)}
        onSelect={handleSelect}
        onToggleRead={handleToggleRead}
        onDelete={remove}
        onMarkAllRead={markAllRead}
        onLoadMore={loadMore}
        onToggleEmail={toggleEmail}
      />
    </>
  );
}
