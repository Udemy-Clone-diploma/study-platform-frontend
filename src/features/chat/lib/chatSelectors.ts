import type { ChatRoom, ChatUser } from "@/entities/chat";
import type { UserData } from "@/entities/user";

export function userDisplayName(
  user: Pick<ChatUser, "name" | "first_name" | "last_name" | "email">,
) {
  return user.name || `${user.first_name} ${user.last_name}`.trim() || user.email;
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

export function chatTitle(chat: ChatRoom, meId: number | null) {
  if (chat.is_read_only) return chat.title || "School Administration";
  if (chat.type === "group") return chat.title || "Untitled group";
  const peer = directPeer(chat, meId);
  return peer ? userDisplayName(peer) : "Direct chat";
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

export function lastMessagePreview(chat: ChatRoom) {
  if (!chat.last_message) return "No messages yet";
  if (chat.last_message.is_deleted) return "Deleted message";
  const attachments = chat.last_message.attachments ?? [];
  if (attachments.length > 0) {
    const imageCount = attachments.filter((attachment) =>
      attachment.file_type.startsWith("image/"),
    ).length;
    const videoCount = attachments.filter((attachment) =>
      attachment.file_type.startsWith("video/"),
    ).length;
    if (imageCount === attachments.length) {
      return imageCount === 1 ? "Photo" : `${imageCount} photos`;
    }
    if (videoCount === attachments.length) {
      return videoCount === 1 ? "Video" : `${videoCount} videos`;
    }
    return "Attachments";
  }
  if (chat.last_message.message_type === "image") return "Photo";
  if (chat.last_message.message_type === "file") return "Attachments";
  return chat.last_message.text || "Attachment";
}

export function toChatUser(user: UserData): ChatUser {
  return {
    id: user.id,
    name: `${user.first_name} ${user.last_name}`.trim() || user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
  };
}
