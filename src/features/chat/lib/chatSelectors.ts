import type { ChatRoom, ChatUser } from "@/entities/chat";
import type { UserData } from "@/entities/user";

/** Minimal shape of next-intl's translator, accepted so this plain module stays framework-agnostic. */
type Translator = (key: string, values?: Record<string, string | number>) => string;

export function userDisplayName(
  user: Pick<ChatUser, "name" | "first_name" | "last_name">,
) {
  return user.name || `${user.first_name} ${user.last_name}`.trim() || "User";
}

export function sortChats(chats: ChatRoom[]) {
  return [...chats].sort(
    (first, second) =>
      new Date(second.updated_at).getTime() - new Date(first.updated_at).getTime() ||
      second.id - first.id,
  );
}

export function upsertChat(chats: ChatRoom[], chat: ChatRoom) {
  const exists = chats.some((item) => item.id === chat.id);
  return sortChats(
    exists ? chats.map((item) => (item.id === chat.id ? chat : item)) : [chat, ...chats],
  );
}

export function mutedChatIdsFrom(chats: ChatRoom[], meId: number | null) {
  if (!meId) return new Set<number>();
  return new Set(
    chats
      .filter((chat) =>
        chat.participants.some(
          (participant) => participant.user.id === meId && participant.is_muted,
        ),
      )
      .map((chat) => chat.id),
  );
}

export function blockedUserIdsFrom(chats: ChatRoom[]) {
  return new Set(chats.flatMap((chat) => chat.blocked_user_ids ?? []));
}

export function updateChatParticipantMute(
  chat: ChatRoom,
  meId: number | null,
  isMuted: boolean,
): ChatRoom {
  if (!meId) return chat;
  return {
    ...chat,
    participants: chat.participants.map((participant) =>
      participant.user.id === meId ? { ...participant, is_muted: isMuted } : participant,
    ),
  };
}

export function directPeer(chat: ChatRoom, meId: number | null) {
  return chat.participants.find((participant) => participant.user.id !== meId)?.user ?? null;
}

export function chatTitle(chat: ChatRoom, meId: number | null, t: Translator) {
  if (chat.is_read_only) return chat.title || t("schoolAdministration");
  if (chat.type === "group") return chat.title || t("untitledGroup");
  const peer = directPeer(chat, meId);
  return peer ? userDisplayName(peer) : t("directChat");
}

export function chatAvatar(chat: ChatRoom, meId: number | null) {
  if (chat.image_url) return chat.image_url;
  return directPeer(chat, meId)?.avatar ?? null;
}

export function userProfileHref(user: ChatUser, viewer: UserData | null) {
  if (viewer?.id === user.id) return "/profile";
  if (viewer?.role === "teacher" && user.role === "student") {
    return `/teacher-dashboard/students/${user.id}`;
  }
  if (viewer?.role === "administrator") {
    return `/admin/chats/users/${user.id}`;
  }
  return `/profile/${user.id}`;
}

export function lastMessagePreview(chat: ChatRoom, t: Translator) {
  if (!chat.last_message) return t("noMessagesYet");
  if (chat.last_message.is_deleted) return t("deletedMessage");
  const attachments = chat.last_message.attachments ?? [];
  if (attachments.length > 0) {
    const imageCount = attachments.filter((attachment) =>
      attachment.file_type.startsWith("image/"),
    ).length;
    const videoCount = attachments.filter((attachment) =>
      attachment.file_type.startsWith("video/"),
    ).length;
    if (imageCount === attachments.length) {
      return t("photosCount", { count: imageCount });
    }
    if (videoCount === attachments.length) {
      return t("videosCount", { count: videoCount });
    }
    return t("attachmentsPlural");
  }
  if (chat.last_message.message_type === "image") return t("photosCount", { count: 1 });
  if (chat.last_message.message_type === "file") return t("attachmentsPlural");
  return chat.last_message.text || t("attachment");
}

export function toChatUser(user: UserData): ChatUser {
  return {
    id: user.id,
    name: `${user.first_name} ${user.last_name}`.trim() || user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    role: user.role,
    avatar: user.avatar,
  };
}
