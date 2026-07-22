import type { ChatMessage } from "@/entities/chat";
import {
  ATTACHMENT_ACTION_HEIGHT,
  ATTACHMENT_ACTION_WIDTH,
  MESSAGE_ACTION_BASE_HEIGHT,
  MESSAGE_ACTION_GAP,
  MESSAGE_ACTION_OWNER_HEIGHT,
  MESSAGE_ACTION_WIDTH,
} from "./chatConstants";

export function attachmentActionMenuPosition(rect: DOMRect) {
  const gap = MESSAGE_ACTION_GAP;
  if (typeof window === "undefined") return { x: rect.left, y: rect.bottom + gap };

  const preferredTop =
    window.innerHeight - rect.bottom >= ATTACHMENT_ACTION_HEIGHT + gap
      ? rect.bottom + gap
      : rect.top - ATTACHMENT_ACTION_HEIGHT - gap;
  return {
    x: Math.max(16, Math.min(rect.left, window.innerWidth - ATTACHMENT_ACTION_WIDTH - 16)),
    y: Math.max(16, Math.min(preferredTop, window.innerHeight - ATTACHMENT_ACTION_HEIGHT - 16)),
  };
}

export function canModifyMessage(message: ChatMessage, meId: number | null) {
  return (
    message.sender?.id === meId && !message.optimistic && !message.failed && !message.is_deleted
  );
}

export function messageActionMenuPosition(rect: DOMRect, canModify: boolean) {
  const menuHeight = canModify ? MESSAGE_ACTION_OWNER_HEIGHT : MESSAGE_ACTION_BASE_HEIGHT;
  if (typeof window === "undefined") return { x: rect.left, y: rect.bottom + MESSAGE_ACTION_GAP };

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const centeredLeft = rect.left + rect.width / 2 - MESSAGE_ACTION_WIDTH / 2;
  const below = rect.bottom + MESSAGE_ACTION_GAP;
  const above = rect.top - menuHeight - MESSAGE_ACTION_GAP;
  const spaceBelow = viewportHeight - rect.bottom;
  const spaceAbove = rect.top;
  const preferredTop =
    spaceBelow >= menuHeight + MESSAGE_ACTION_GAP || spaceBelow >= spaceAbove ? below : above;

  return {
    x: Math.max(16, Math.min(centeredLeft, viewportWidth - MESSAGE_ACTION_WIDTH - 16)),
    y: Math.max(16, Math.min(preferredTop, viewportHeight - menuHeight - 16)),
  };
}
