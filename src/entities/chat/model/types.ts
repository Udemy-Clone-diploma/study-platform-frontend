import type { UserRole } from "@/entities/user";

export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type ChatType = "direct" | "group";
export type ChatParticipantRole = "owner" | "admin" | "member";
export type ChatMessageType = "text" | "file" | "image" | "system";
export type MessageReportReason =
  | "spam"
  | "harassment"
  | "hate"
  | "violence"
  | "sexual"
  | "fraud"
  | "other";

export type ChatUser = {
  id: number;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  avatar: string | null;
};

export type UserSearchResult = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  avatar: string | null;
};

export type ChatAttachment = {
  id: number | string;
  url: string | null;
  file_type: string;
  size: number;
  created_at: string;
};

export type ChatAttachmentKind = "file" | "video" | "link" | "image";

export type ChatAttachmentItem = ChatAttachment & {
  kind: ChatAttachmentKind;
  message: ChatMessage;
};

export type ChatMessage = {
  id: number;
  chat: number;
  sender: ChatUser | null;
  text: string;
  message_type: ChatMessageType;
  reply_to: number | null;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  is_deleted: boolean;
  attachments: ChatAttachment[];
  optimistic?: boolean;
  failed?: boolean;
};

export type ChatParticipant = {
  id: number;
  chat: number;
  user: ChatUser;
  role: ChatParticipantRole;
  joined_at: string;
  left_at: string | null;
  is_muted: boolean;
  history_cleared_at: string | null;
  last_read_message: number | null;
  created_at: string;
  updated_at: string;
};

export type ChatRoom = {
  id: number;
  type: ChatType;
  title: string;
  image: string | null;
  image_url: string | null;
  created_by: ChatUser | null;
  participants: ChatParticipant[];
  last_message: ChatMessage | null;
  unread_count: number;
  blocked_user_ids: number[];
  is_read_only: boolean;
  created_at: string;
  updated_at: string;
};

export type MessageReport = {
  id: number;
  reason: MessageReportReason;
  reason_label: string;
  details: string;
  message_text: string;
  created_at: string;
  message: number;
  message_created_at: string;
  sender: ChatUser | null;
  reporter: ChatUser;
  chat: Pick<ChatRoom, "id" | "type" | "title">;
  attachments: ChatAttachment[];
};

export type ChatModerationActionKind = "warning" | "retract_warning" | "restrict" | "restore";

export type ChatModerationAction = {
  id: number;
  action: ChatModerationActionKind;
  action_label: string;
  note: string;
  report: number | null;
  moderator: ChatUser | null;
  created_at: string;
};

export type ChatModerationStatus = {
  user_id: number;
  is_restricted: boolean;
  restriction_reason: string;
  restricted_at: string | null;
  active_warning_report_ids: number[];
  actions: ChatModerationAction[];
};

export type ChatSocketEvent =
  | { type: "message.created"; message: ChatMessage }
  | { type: "message.updated"; message: ChatMessage }
  | { type: "message.deleted"; message: ChatMessage }
  | { type: "typing"; chat_id: number; user: Pick<ChatUser, "id" | "name">; is_typing: boolean }
  | { type: "presence.snapshot"; online_user_ids: number[] }
  | { type: "presence"; user_id: number; is_online: boolean }
  | { type: "message.read"; chat_id: number; user_id: number; message_id: number | null }
  | { type: "chat.updated"; chat: ChatRoom }
  | { type: "chat.deleted"; chat_id: number }
  | {
      type: "participant.added";
      chat_id: number;
      participant: { user_id: number; role: ChatParticipantRole };
    }
  | { type: "participant.removed"; chat_id: number; user_id: number }
  | { type: "error"; code: string; detail: unknown };
