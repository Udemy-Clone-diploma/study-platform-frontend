import type { MessageReportReason } from "@/entities/chat";

export const MESSAGE_ACTION_WIDTH = 240;
export const MESSAGE_ACTION_GAP = 8;
export const MESSAGE_ACTION_BASE_HEIGHT = 156;
export const MESSAGE_ACTION_OWNER_HEIGHT = 200;
export const ATTACHMENT_ACTION_WIDTH = 260;
export const ATTACHMENT_ACTION_HEIGHT = 204;
export const MESSAGE_SCROLLBAR_MIN_THUMB_HEIGHT = 36;
export const MESSAGE_SCROLLBAR_HIDE_DELAY = 650;

/** How many of the most-recent chats get their messages prefetched (in the background) after the chat list loads, so opening one is a cache hit instead of a network round trip. */
export const MESSAGE_PREFETCH_CHAT_COUNT = 6;

/** Report reasons; labels come from the `ReportUser.reasons` i18n namespace (shared with user reports). */
export const REASON_VALUES: MessageReportReason[] = [
  "spam",
  "harassment",
  "hate",
  "violence",
  "sexual",
  "fraud",
  "other",
];
