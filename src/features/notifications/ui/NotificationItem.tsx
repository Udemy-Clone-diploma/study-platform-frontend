"use client";

import Link from "next/link";
import { Bell, BookOpen, Bookmark, ClipboardList, MessageSquare } from "lucide-react";
import type { Notification, NotificationType } from "@/entities/notification";
import { formatRelativeTime } from "@/shared/lib/time";

const ICONS: Record<NotificationType, typeof Bell> = {
  new_message: MessageSquare,
  homework_graded: Bookmark,
  schedule_event: ClipboardList,
  new_lesson: BookOpen,
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

  const className = `flex w-full items-start gap-4 rounded-3xl p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-(--shadow-card) active:translate-y-0 ${
    isRead ? "bg-(--color-bg)/40 hover:bg-(--color-bg)/70" : "bg-(--color-bg)"
  }`;

  const content = (
    <>
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-opacity ${
          isRead ? "opacity-60" : "opacity-100"
        }`}
        style={{ background: "var(--gradient-ellipse)" }}
      >
        <Icon className="h-5 w-5 text-(--color-text-primary)" strokeWidth={2} aria-hidden />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 py-1">
        <span className="flex items-start gap-2">
          <span
            className={`min-w-0 flex-1 break-words ${
              isRead
                ? "font-medium text-(--color-text-secondary)"
                : "font-bold text-(--color-text-primary)"
            }`}
          >
            {notification.title}
          </span>
          {!isRead && (
            <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-(--color-danger)" aria-hidden />
          )}
        </span>
        <span className="break-words text-sm text-(--color-text-secondary)">
          {notification.body}
        </span>
        <time
          dateTime={notification.created_at}
          className="text-xs text-(--color-text-secondary)"
        >
          {formatRelativeTime(notification.created_at)}
        </time>
      </span>
    </>
  );

  if (notification.link_url) {
    return (
      <Link
        href={notification.link_url}
        onClick={() => onSelect(notification)}
        className={className}
      >
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={() => onSelect(notification)} className={className}>
      {content}
    </button>
  );
}
