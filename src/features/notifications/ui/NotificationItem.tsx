"use client";

import Link from "next/link";
import { Bell, BookOpen, Bookmark, ClipboardList, MessageSquare } from "lucide-react";
import type { Notification, NotificationType } from "@/entities/notification";
import { formatRelativeTime } from "@/shared/lib/time";
import { NotificationItemMenu } from "./NotificationItemMenu";

const ICONS: Record<NotificationType, typeof Bell> = {
  new_message: MessageSquare,
  homework_graded: Bookmark,
  schedule_event: ClipboardList,
  new_lesson: BookOpen,
};

export function NotificationItem({
  notification,
  onSelect,
  onToggleRead,
  onDelete,
}: {
  notification: Notification;
  onSelect: (notification: Notification) => void;
  onToggleRead: (notification: Notification) => void;
  onDelete: (id: number) => void;
}) {
  const Icon = ICONS[notification.type] ?? Bell;
  const isRead = notification.is_read;

  const cardClass = `flex w-full items-center gap-4 rounded-3xl p-3 text-left transition-colors ${
    isRead ? "bg-(--color-bg)/40 group-hover:bg-(--color-bg)/70" : "bg-(--color-bg)"
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
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-center gap-2 pr-7">
          {!isRead && (
            <span className="h-2 w-2 shrink-0 rounded-full bg-(--color-danger)" aria-hidden />
          )}
          <span
            className={`min-w-0 flex-1 truncate ${
              isRead
                ? "font-medium text-(--color-text-secondary)"
                : "font-bold text-(--color-text-primary)"
            }`}
          >
            {notification.title}
          </span>
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
    </>
  );

  return (
    <div className="group relative rounded-3xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-(--shadow-card) active:translate-y-0">
      {notification.link_url ? (
        <Link
          href={notification.link_url}
          onClick={() => onSelect(notification)}
          className={cardClass}
        >
          {content}
        </Link>
      ) : (
        <button type="button" onClick={() => onSelect(notification)} className={cardClass}>
          {content}
        </button>
      )}
      <NotificationItemMenu
        isRead={isRead}
        onToggleRead={() => onToggleRead(notification)}
        onDelete={() => onDelete(notification.id)}
      />
    </div>
  );
}
