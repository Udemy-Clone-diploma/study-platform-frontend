import type { ChatAttachment, ChatMessage } from "@/entities/chat";
import { userDisplayName } from "./chatSelectors";

export function compactTime(value: string) {
  const date = new Date(value);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit" }).format(date);
  }
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit" }).format(date);
}

export function messageTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

export function messageFullDateTime(value: string) {
  const date = new Date(value);
  const fullDate = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
  const fullTime = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);

  return `${fullDate}, ${fullTime}`;
}

export function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function attachmentName(attachment: ChatAttachment, index: number) {
  if (!attachment.url) return `Attachment ${index + 1}`;
  const path = attachment.url.split("?")[0] ?? "";
  const rawName = path.split("/").filter(Boolean).pop();
  if (!rawName) return `Attachment ${index + 1}`;
  try {
    return decodeURIComponent(rawName);
  } catch {
    return rawName;
  }
}

export function messagePreview(message: ChatMessage) {
  if (message.is_deleted) return "Deleted message";
  if (message.text.trim()) return message.text.trim();
  if (message.attachments.length > 0) return "Attachment";
  return "Message";
}

export function messageAuthorLabel(message: ChatMessage, meId: number | null) {
  if (message.sender?.id === meId) return "You";
  return message.sender ? userDisplayName(message.sender) : "Unknown sender";
}

export function forwardedMessageText(message: ChatMessage) {
  const parts = [
    message.text.trim(),
    ...message.attachments.map((attachment, index) =>
      attachment.url
        ? `${attachmentName(attachment, index)}: ${attachment.url}`
        : attachmentName(attachment, index),
    ),
  ].filter(Boolean);
  return parts.join("\n") || "Forwarded message";
}
