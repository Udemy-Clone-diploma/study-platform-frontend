"use client";

import { Bell, BookOpen, Bookmark, ClipboardList, MessageSquare, ShieldAlert } from "lucide-react";
import type { Notification, NotificationType } from "@/entities/notification";
import { formatRelativeTime } from "@/shared/lib/time";

const ICONS: Record<NotificationType, typeof Bell> = {
  new_message: MessageSquare,
  homework_submitted: Bookmark,
  homework_graded: Bookmark,
  schedule_event: ClipboardList,
  new_lesson: BookOpen,
  moderation_action: ShieldAlert,
};

export function NotificationItem({
  notification,
  onSelect,
}: {
  notification: Notification;
  onSelect: (notification: Notification) => void;
}) {
  const Icon = ICONS[notification.type] ?? Bell;
  const isRead = notification.is_read;

  return (
    <button
      type="button"
      onClick={() => onSelect(notification)}
      className={`flex w-full items-center gap-4 rounded-3xl p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-(--shadow-card) active:translate-y-0 ${
        isRead ? "bg-(--color-bg)/40 hover:bg-(--color-bg)/70" : "bg-(--color-bg)"
      }`}
    >
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-opacity ${
          isRead ? "opacity-60" : "opacity-100"
        }`}
        style={{ background: "var(--gradient-ellipse)" }}
      >
        <Icon className="h-5 w-5 text-(--color-text-primary)" strokeWidth={2} aria-hidden />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-center gap-2">
          <span
            className={`min-w-0 flex-1 truncate ${
              isRead
                ? "font-medium text-(--color-text-secondary)"
                : "font-bold text-(--color-text-primary)"
            }`}
          >
            {notification.title}
          </span>
          {!isRead && (
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-(--color-danger)" aria-hidden />
          )}
        </span>
        <span className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-sm text-(--color-text-secondary)">
            {notification.body}
          </span>
          <time
            dateTime={notification.created_at}
            className="shrink-0 text-xs text-(--color-text-secondary)"
          >
            {formatRelativeTime(notification.created_at)}
          </time>
        </span>
      </span>
    </button>
  );
}
