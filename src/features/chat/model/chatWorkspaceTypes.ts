import type { ChatAttachment, ChatMessage } from "@/entities/chat";

export type ComposeMode = "direct" | "group";

export type MessageActionState = {
  message: ChatMessage;
  x: number;
  y: number;
};

export type AttachmentActionState = {
  attachment: ChatAttachment;
  message: ChatMessage;
  showGoToMessage: boolean;
  x: number;
  y: number;
};

export type MessageScrollbarState = {
  top: number;
  height: number;
  visible: boolean;
};

export type ConfirmationAction = "clear-history" | "delete-chat" | "block-user" | "unblock-user";
