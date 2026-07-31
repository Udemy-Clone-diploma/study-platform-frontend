import type { ChatAttachment, ChatMessage } from "@/entities/chat";
import { formatDate, formatDateTime } from "@/shared/lib/time";
import { userDisplayName } from "./chatSelectors";

/** Minimal shape of next-intl's translator, accepted so this plain module stays framework-agnostic. */
type Translator = (key: string, values?: Record<string, string | number>) => string;

export function compactTime(value: string, locale: string) {
  const date = new Date(value);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return formatDateTime(date, locale, { hour: "2-digit", minute: "2-digit" });
  }
  return formatDate(date, locale, { month: "short", day: "2-digit" });
}

export function messageTime(value: string, locale: string) {
  return formatDateTime(new Date(value), locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function messageFullDateTime(value: string, locale: string) {
  const date = new Date(value);
  const fullDate = formatDate(date, locale, { day: "2-digit", month: "long", year: "numeric" });
  const fullTime = formatDateTime(date, locale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return `${fullDate}, ${fullTime}`;
}

export function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function attachmentName(attachment: ChatAttachment, index: number, t: Translator) {
  if (!attachment.url) return t("attachmentNumbered", { number: index + 1 });
  const path = attachment.url.split("?")[0] ?? "";
  const rawName = path.split("/").filter(Boolean).pop();
  if (!rawName) return t("attachmentNumbered", { number: index + 1 });
  try {
    return decodeURIComponent(rawName);
  } catch {
    return rawName;
  }
}

export function messagePreview(message: ChatMessage, t: Translator) {
  if (message.is_deleted) return t("deletedMessage");
  if (message.text.trim()) return message.text.trim();
  if (message.attachments.length > 0) return t("attachment");
  return t("messageFallback");
}

export function messageAuthorLabel(message: ChatMessage, meId: number | null, t: Translator) {
  if (message.sender?.id === meId) return t("you");
  return message.sender ? userDisplayName(message.sender) : t("unknownSender");
}

export function forwardedMessageText(message: ChatMessage, t: Translator) {
  const parts = [
    message.text.trim(),
    ...message.attachments.map((attachment, index) =>
      attachment.url
        ? `${attachmentName(attachment, index, t)}: ${attachment.url}`
        : attachmentName(attachment, index, t),
    ),
  ].filter(Boolean);
  return parts.join("\n") || t("forwardedMessageFallback");
}
