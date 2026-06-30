"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import type { Notification } from "@/entities/notification";
import { useNotifications } from "../lib/useNotifications";
import { useEmailPreference } from "../lib/useEmailPreference";
import { NotificationItem } from "./NotificationItem";
import { NotificationDrawer } from "./NotificationDrawer";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const {
    unreadCount,
    notifications,
    listLoading,
    loadingMore,
    hasMore,
    loadList,
    loadMore,
    markRead,
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
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
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
    if (notification.link_url) {
      setOpen(false);
      setDrawerOpen(false);
      router.push(notification.link_url);
    }
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
          aria-label="Notifications"
          aria-expanded={open}
          onClick={toggle}
          className="relative flex h-10 w-10 items-center justify-center transition-opacity hover:opacity-70"
        >
          <Image src="/layout/notifications-icon.png" alt="" width={24} height={24} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 right-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-(--color-danger) px-1 text-[10px] font-bold text-(--color-bg)">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {open && (
          <div
            className="absolute right-0 z-50 flex w-[380px] flex-col gap-4 rounded-3xl p-5 shadow-(--shadow-card)"
            style={{ top: "calc(100% + 8px)", background: "var(--gradient-notification)" }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold uppercase text-(--color-text-primary) font-(family-name:--font-accent)">
                Notification
              </h2>
              <button
                type="button"
                aria-label="Close notifications"
                onClick={() => setOpen(false)}
                className="flex h-7 w-7 items-center justify-center transition-opacity hover:opacity-70"
              >
                <X className="h-5 w-5 text-(--color-text-primary)" aria-hidden />
              </button>
            </div>

            {!listLoading && notifications.length === 0 ? (
              <p className="py-6 text-(--color-text-secondary)">You have no new messages</p>
            ) : (
              <>
                <div className="-mx-3 -my-2 flex max-h-[60vh] flex-col gap-3 overflow-y-auto px-3 py-2">
                  {notifications.slice(0, 5).map((n) => (
                    <NotificationItem key={n.id} notification={n} onSelect={handleSelect} />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={openDrawer}
                  className="w-full py-1 text-center text-sm font-bold uppercase text-(--color-text-primary) transition-opacity hover:opacity-70 font-(family-name:--font-accent)"
                >
                  See all
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
        onMarkAllRead={markAllRead}
        onLoadMore={loadMore}
        onToggleEmail={toggleEmail}
      />
    </>
  );
}
