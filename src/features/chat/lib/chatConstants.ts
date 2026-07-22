import type { MessageReportReason } from "@/entities/chat";

export const MESSAGE_ACTION_WIDTH = 240;
export const MESSAGE_ACTION_GAP = 8;
export const MESSAGE_ACTION_BASE_HEIGHT = 156;
export const MESSAGE_ACTION_OWNER_HEIGHT = 200;
export const ATTACHMENT_ACTION_WIDTH = 260;
export const ATTACHMENT_ACTION_HEIGHT = 204;
export const MESSAGE_SCROLLBAR_MIN_THUMB_HEIGHT = 36;
export const MESSAGE_SCROLLBAR_HIDE_DELAY = 650;

export const REPORT_REASONS: Array<{ value: MessageReportReason; label: string }> = [
  { value: "spam", label: "Spam or advertising" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "hate", label: "Hate speech" },
  { value: "violence", label: "Violence or threats" },
  { value: "sexual", label: "Sexual content" },
  { value: "fraud", label: "Fraud or scam" },
  { value: "other", label: "Other" },
];
