import { api } from "@/shared/api/base";
import type {
  ChatAttachment,
  ChatAttachmentItem,
  ChatModerationActionKind,
  ChatModerationStatus,
  ChatMessage,
  ChatParticipant,
  ChatParticipantRole,
  ChatRoom,
  MessageReport,
  MessageReportReason,
  Paginated,
  UserSearchResult,
} from "../model/types";

export async function getChats(page = 1): Promise<Paginated<ChatRoom>> {
  const { data } = await api.get<Paginated<ChatRoom>>("chats/", { params: { page } });
  return data;
}

export async function getChat(chatId: number): Promise<ChatRoom> {
  const { data } = await api.get<ChatRoom>(`chats/${chatId}/`);
  return data;
}

export async function createDirectChat(userId: number): Promise<ChatRoom> {
  const { data } = await api.post<ChatRoom>("chats/direct/", { user_id: userId });
  return data;
}

export async function createGroupChat(
  title: string,
  participantIds: number[],
  image?: File | null,
): Promise<ChatRoom> {
  if (image) {
    const body = new FormData();
    body.append("title", title);
    participantIds.forEach((participantId) =>
      body.append("participant_ids", String(participantId)),
    );
    body.append("image", image);
    const { data } = await api.post<ChatRoom>("chats/group/", body);
    return data;
  }

  const { data } = await api.post<ChatRoom>("chats/group/", {
    title,
    participant_ids: participantIds,
  });
  return data;
}

export async function updateChat(chatId: number, patch: Partial<Pick<ChatRoom, "title">>) {
  const { data } = await api.patch<ChatRoom>(`chats/${chatId}/`, patch);
  return data;
}

export async function uploadChatImage(chatId: number, image: File): Promise<ChatRoom> {
  const body = new FormData();
  body.append("image", image);
  const { data } = await api.patch<ChatRoom>(`chats/${chatId}/`, body);
  return data;
}

export async function deleteChat(chatId: number): Promise<void> {
  await api.delete(`chats/${chatId}/`);
}

export async function updateChatMute(chatId: number, isMuted: boolean): Promise<ChatParticipant> {
  const { data } = await api.patch<ChatParticipant>(`chats/${chatId}/mute/`, {
    is_muted: isMuted,
  });
  return data;
}

export async function updateChatBlock(
  chatId: number,
  isBlocked: boolean,
): Promise<{ user_id: number; is_blocked: boolean }> {
  const { data } = await api.patch<{ user_id: number; is_blocked: boolean }>(
    `chats/${chatId}/block/`,
    { is_blocked: isBlocked },
  );
  return data;
}

export async function clearChatHistory(chatId: number): Promise<ChatRoom> {
  const { data } = await api.post<ChatRoom>(`chats/${chatId}/clear-history/`);
  return data;
}

export async function getMessages(chatId: number, page = 1): Promise<Paginated<ChatMessage>> {
  const { data } = await api.get<Paginated<ChatMessage>>(`chats/${chatId}/messages/`, {
    params: { page },
  });
  return data;
}

export async function getChatAttachments(chatId: number): Promise<ChatAttachmentItem[]> {
  const { data } = await api.get<ChatAttachmentItem[]>(`chats/${chatId}/attachments/`);
  return data;
}

export async function sendMessage(
  chatId: number,
  text: string,
  messageType: ChatMessage["message_type"] = "text",
  replyTo?: number | null,
): Promise<ChatMessage> {
  const { data } = await api.post<ChatMessage>(`chats/${chatId}/messages/`, {
    text,
    message_type: messageType,
    reply_to: replyTo ?? null,
  });
  return data;
}

export async function updateMessage(messageId: number, text: string): Promise<ChatMessage> {
  const { data } = await api.patch<ChatMessage>(`messages/${messageId}/`, { text });
  return data;
}

export async function deleteMessage(messageId: number): Promise<void> {
  await api.delete(`messages/${messageId}/`);
}

export async function reportMessage(
  messageId: number,
  reason: MessageReportReason,
  details = "",
): Promise<MessageReport> {
  const { data } = await api.post<MessageReport>(`messages/${messageId}/report/`, {
    reason,
    details,
  });
  return data;
}

export async function getMessageReports(page = 1): Promise<Paginated<MessageReport>> {
  const { data } = await api.get<Paginated<MessageReport>>("moderation/message-reports/", {
    params: { page },
  });
  return data;
}

export async function getChatModerationStatus(userId: number): Promise<ChatModerationStatus> {
  const { data } = await api.get<ChatModerationStatus>(`moderation/users/${userId}/`);
  return data;
}

export async function moderateChatUser(
  userId: number,
  action: ChatModerationActionKind,
  note = "",
  reportId?: number | null,
): Promise<ChatModerationStatus> {
  const { data } = await api.post<ChatModerationStatus>(`moderation/users/${userId}/`, {
    action,
    note,
    report_id: reportId ?? null,
  });
  return data;
}

export async function markChatRead(
  chatId: number,
  messageId?: number | null,
): Promise<ChatParticipant> {
  const { data } = await api.post<ChatParticipant>(`chats/${chatId}/read/`, {
    message_id: messageId ?? null,
  });
  return data;
}

export async function getParticipants(chatId: number): Promise<ChatParticipant[]> {
  const { data } = await api.get<ChatParticipant[]>(`chats/${chatId}/participants/`);
  return data;
}

export async function addParticipants(
  chatId: number,
  userIds: number[],
): Promise<ChatParticipant[]> {
  const { data } = await api.post<ChatParticipant[]>(`chats/${chatId}/participants/`, {
    user_ids: userIds,
  });
  return data;
}

export async function removeParticipant(chatId: number, userId: number): Promise<void> {
  await api.delete(`chats/${chatId}/participants/${userId}/`);
}

export async function updateParticipantRole(
  chatId: number,
  userId: number,
  role: Exclude<ChatParticipantRole, "owner">,
): Promise<ChatParticipant> {
  const { data } = await api.patch<ChatParticipant>(
    `chats/${chatId}/participants/${userId}/role/`,
    { role },
  );
  return data;
}

export async function uploadMessageAttachment(
  messageId: number,
  file: File,
): Promise<ChatAttachment> {
  const body = new FormData();
  body.append("file", file);
  const { data } = await api.post<ChatAttachment>(`messages/${messageId}/attachments/`, body);
  return data;
}

export async function searchUsers(email: string): Promise<UserSearchResult[]> {
  const { data } = await api.get<UserSearchResult[]>("users/search/", { params: { email } });
  return data;
}
