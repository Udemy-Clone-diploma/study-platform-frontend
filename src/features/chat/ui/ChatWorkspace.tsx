"use client";

import {
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Ban,
  BellOff,
  Check,
  CircleUserRound,
  Eraser,
  FileText,
  Flag,
  Forward,
  Loader2,
  LockKeyhole,
  MessageSquarePlus,
  MoreVertical,
  Paperclip,
  Pencil,
  Plus,
  Reply,
  Search,
  Send,
  Trash2,
  Users,
  X,
} from "lucide-react";
import {
  clearChatHistory,
  createDirectChat,
  createGroupChat,
  deleteChat,
  deleteMessage,
  getChats,
  getMessages,
  markChatRead,
  reportMessage,
  searchUsers,
  sendMessage,
  updateChat,
  updateChatBlock,
  updateChatMute,
  updateMessage,
  uploadMessageAttachment,
  type ChatAttachment,
  type ChatMessage,
  type MessageReportReason,
  type ChatRoom,
  type ChatSocketEvent,
  type ChatType,
  type ChatUser,
  type UserSearchResult,
} from "@/entities/chat";
import { getMe, type UserData } from "@/entities/user";
import type { ApiError } from "@/shared/api/base";
import { resolveMediaUrl } from "@/shared/api/lib/mediaUrl";
import { useChatSocket } from "@/features/chat/lib/useChatSocket";

type ComposeMode = "direct" | "group";
type MessageActionState = {
  message: ChatMessage;
  x: number;
  y: number;
};
type MessageScrollbarState = {
  top: number;
  height: number;
  visible: boolean;
};
type ConfirmationAction = "clear-history" | "delete-chat" | "block-user" | "unblock-user";

const MESSAGE_ACTION_WIDTH = 240;
const MESSAGE_ACTION_GAP = 8;
const MESSAGE_ACTION_BASE_HEIGHT = 156;
const MESSAGE_ACTION_OWNER_HEIGHT = 200;
const MESSAGE_SCROLLBAR_MIN_THUMB_HEIGHT = 36;
const MESSAGE_SCROLLBAR_HIDE_DELAY = 650;

function userDisplayName(user: Pick<ChatUser, "name" | "first_name" | "last_name" | "email">) {
  return user.name || `${user.first_name} ${user.last_name}`.trim() || user.email;
}

function compactTime(value: string) {
  const date = new Date(value);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit" }).format(date);
  }
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit" }).format(date);
}

function messageTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function messageFullDateTime(value: string) {
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

function sortChats(chats: ChatRoom[]) {
  return [...chats].sort(
    (first, second) =>
      new Date(second.updated_at).getTime() - new Date(first.updated_at).getTime() ||
      second.id - first.id,
  );
}

function upsertChat(chats: ChatRoom[], chat: ChatRoom) {
  const exists = chats.some((item) => item.id === chat.id);
  return sortChats(
    exists ? chats.map((item) => (item.id === chat.id ? chat : item)) : [chat, ...chats],
  );
}

function mutedChatIdsFrom(chats: ChatRoom[], meId: number | null) {
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

function blockedUserIdsFrom(chats: ChatRoom[]) {
  return new Set(chats.flatMap((chat) => chat.blocked_user_ids ?? []));
}

function updateChatParticipantMute(
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

function directPeer(chat: ChatRoom, meId: number | null) {
  return chat.participants.find((participant) => participant.user.id !== meId)?.user ?? null;
}

function chatTitle(chat: ChatRoom, meId: number | null) {
  if (chat.is_read_only) return chat.title || "School Administration";
  if (chat.type === "group") return chat.title || "Untitled group";
  const peer = directPeer(chat, meId);
  return peer ? userDisplayName(peer) : "Direct chat";
}

function chatAvatar(chat: ChatRoom, meId: number | null) {
  if (chat.image_url) return chat.image_url;
  return directPeer(chat, meId)?.avatar ?? null;
}

function userProfileHref(user: ChatUser) {
  const params = new URLSearchParams();
  const name = userDisplayName(user);

  if (name) params.set("name", name);
  if (user.email) params.set("email", user.email);
  if (user.role) params.set("role", user.role);
  if (user.avatar) params.set("avatar", user.avatar);

  const query = params.toString();
  return `/profile/${user.id}${query ? `?${query}` : ""}`;
}

function lastMessagePreview(chat: ChatRoom) {
  if (!chat.last_message) return "No messages yet";
  if (chat.last_message.is_deleted) return "Deleted message";
  return chat.last_message.text || "Attachment";
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function attachmentName(attachment: ChatAttachment, index: number) {
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

function messagePreview(message: ChatMessage) {
  if (message.is_deleted) return "Deleted message";
  if (message.text.trim()) return message.text.trim();
  if (message.attachments.length > 0) return "Attachment";
  return "Message";
}

function messageAuthorLabel(message: ChatMessage, meId: number | null) {
  if (message.sender?.id === meId) return "You";
  return message.sender ? userDisplayName(message.sender) : "Unknown sender";
}

function canModifyMessage(message: ChatMessage, meId: number | null) {
  return (
    message.sender?.id === meId && !message.optimistic && !message.failed && !message.is_deleted
  );
}

function forwardedMessageText(message: ChatMessage) {
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

function messageActionMenuPosition(rect: DOMRect, canModify: boolean) {
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

function toChatUser(user: UserData): ChatUser {
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

function Avatar({
  src,
  label,
  size = "md",
}: {
  src?: string | null;
  label: string;
  size?: "sm" | "md" | "lg" | "card";
}) {
  const dimensions = {
    sm: "h-8 w-8 text-xs",
    md: "h-11 w-11 text-sm",
    lg: "h-12 w-12 text-base",
    card: "h-[55px] w-[55px] text-base",
  }[size];
  const initials = label
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  const resolvedSrc = resolveMediaUrl(src);
  const [brokenSrc, setBrokenSrc] = useState<string | null>(null);
  const imageSrc = resolvedSrc && resolvedSrc !== brokenSrc ? resolvedSrc : null;

  if (imageSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageSrc}
        alt=""
        className={`${dimensions} shrink-0 rounded-full object-cover`}
        referrerPolicy="no-referrer"
        onError={() => setBrokenSrc(imageSrc)}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`${dimensions} flex shrink-0 items-center justify-center rounded-full bg-[#D6E0FF] font-semibold text-[#0B257C]`}
    >
      {initials || "?"}
    </span>
  );
}

function UserSearchBox({
  selected,
  onSelect,
  excludeIds = [],
}: {
  selected: UserSearchResult[];
  onSelect: (user: UserSearchResult) => void;
  excludeIds?: number[];
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const selectedIds = useMemo(() => new Set(selected.map((user) => user.id)), [selected]);
  const excluded = useMemo(() => new Set(excludeIds), [excludeIds]);
  const trimmedQuery = query.trim();
  const visibleResults = trimmedQuery.length >= 3 ? results : [];

  useEffect(() => {
    if (trimmedQuery.length < 3) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      setLoading(true);
      searchUsers(trimmedQuery)
        .then((items) => {
          if (cancelled) return;
          setResults(items.filter((user) => !selectedIds.has(user.id) && !excluded.has(user.id)));
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [excluded, selectedIds, trimmedQuery]);

  return (
    <div>
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by email"
          className="h-10 w-full rounded-lg border border-[#D8DDEA] bg-white pl-9 pr-3 text-sm outline-none transition focus:border-[#A7BAFA] focus:ring-2 focus:ring-[#D6E0FF]"
        />
      </label>
      <div className="mt-3 max-h-52 overflow-y-auto rounded-lg border border-[#EEF0F6]">
        {trimmedQuery.length >= 3 && loading ? (
          <div className="flex h-20 items-center justify-center text-sm text-[#6B7280]">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Searching
          </div>
        ) : visibleResults.length > 0 ? (
          visibleResults.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => {
                onSelect(user);
                setQuery("");
                setResults([]);
              }}
              className="flex w-full items-center gap-3 border-b border-[#EEF0F6] px-3 py-2 text-left last:border-b-0 hover:bg-[#F7F9FF]"
            >
              <Avatar src={user.avatar} label={user.name || user.email} size="sm" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-[#111827]">
                  {user.name || user.email}
                </span>
                <span className="block truncate text-xs text-[#6B7280]">{user.email}</span>
              </span>
            </button>
          ))
        ) : (
          <div className="flex h-20 items-center justify-center px-4 text-center text-sm text-[#6B7280]">
            {trimmedQuery.length >= 3 ? "No users found" : "Type at least 3 characters"}
          </div>
        )}
      </div>
    </div>
  );
}

function ComposeModal({
  mode,
  onModeChange,
  onClose,
  onCreated,
  meId,
}: {
  mode: ComposeMode;
  onModeChange: (mode: ComposeMode) => void;
  onClose: () => void;
  onCreated: (chat: ChatRoom) => void;
  meId: number | null;
}) {
  const [selected, setSelected] = useState<UserSearchResult[]>([]);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (mode === "direct" && selected.length !== 1) {
      setError("Select one user.");
      return;
    }
    if (mode === "group" && (!title.trim() || selected.length === 0)) {
      setError("Add a group title and at least one participant.");
      return;
    }

    setSaving(true);
    try {
      const chat =
        mode === "direct"
          ? await createDirectChat(selected[0].id)
          : await createGroupChat(
              title.trim(),
              selected.map((user) => user.id),
            );
      onCreated(chat);
      onClose();
    } catch (requestError) {
      const apiError = requestError as Partial<ApiError>;
      setError(apiError.detail || apiError.message || "Could not create chat.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30 px-6">
      <form
        onSubmit={submit}
        className="w-full max-w-[520px] rounded-lg bg-white p-6 shadow-[0_24px_70px_rgba(0,0,0,0.2)]"
      >
        <div className="flex items-center justify-between">
          <div className="inline-flex rounded-lg bg-[#F1F4FF] p-1">
            <button
              type="button"
              onClick={() => {
                onModeChange("direct");
                setSelected([]);
                setError("");
              }}
              className={`h-9 rounded-md px-4 text-sm font-medium ${
                mode === "direct" ? "bg-white text-[#0B257C] shadow-sm" : "text-[#4B5563]"
              }`}
            >
              Direct
            </button>
            <button
              type="button"
              onClick={() => {
                onModeChange("group");
                setSelected([]);
                setError("");
              }}
              className={`h-9 rounded-md px-4 text-sm font-medium ${
                mode === "group" ? "bg-white text-[#0B257C] shadow-sm" : "text-[#4B5563]"
              }`}
            >
              Group
            </button>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#F3F4F6]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {mode === "group" ? (
          <label className="mt-5 block">
            <span className="mb-2 block text-sm font-medium text-[#374151]">Title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="h-10 w-full rounded-lg border border-[#D8DDEA] px-3 text-sm outline-none focus:border-[#A7BAFA] focus:ring-2 focus:ring-[#D6E0FF]"
            />
          </label>
        ) : null}

        <div className="mt-5">
          <UserSearchBox
            selected={selected}
            excludeIds={meId ? [meId] : []}
            onSelect={(user) =>
              setSelected((current) => (mode === "direct" ? [user] : [...current, user]))
            }
          />
        </div>

        {selected.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {selected.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() =>
                  setSelected((current) => current.filter((item) => item.id !== user.id))
                }
                className="inline-flex max-w-full items-center gap-2 rounded-full bg-[#EEF2FF] px-3 py-1 text-xs text-[#0B257C]"
              >
                <span className="truncate">{user.name || user.email}</span>
                <X className="h-3 w-3 shrink-0" />
              </button>
            ))}
          </div>
        ) : null}

        {error ? (
          <p role="alert" className="mt-4 text-sm text-[#B42318]">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-10 min-w-[128px] items-center justify-center rounded-lg bg-black px-5 text-sm font-semibold text-white disabled:bg-[#A3A3A3]"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}

function MessageActionModal({
  state,
  meId,
  onClose,
  onReply,
  onForward,
  onEdit,
  onDelete,
  onReport,
}: {
  state: MessageActionState;
  meId: number | null;
  onClose: () => void;
  onReply: (message: ChatMessage) => void;
  onForward: (message: ChatMessage) => void;
  onEdit: (message: ChatMessage) => void;
  onDelete: (message: ChatMessage) => void;
  onReport: (message: ChatMessage) => void;
}) {
  const message = state.message;
  const canModify = canModifyMessage(message, meId);
  const canReport = Boolean(message.sender) && message.message_type !== "system";
  const itemClass =
    "flex h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-medium text-[#121212] transition hover:bg-[#F6F7FB]";

  return (
    <>
      <button
        type="button"
        aria-label="Close message actions"
        className="fixed inset-0 z-[80] bg-black/30"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Message actions"
        className="fixed z-[95] w-[240px] rounded-lg bg-white p-3 shadow-[0_18px_54px_rgba(17,24,39,0.24)]"
        style={{ left: state.x, top: state.y }}
      >
        <button type="button" className={itemClass} onClick={() => onReply(message)}>
          <Reply className="h-4 w-4 shrink-0" />
          Reply
        </button>
        <button type="button" className={itemClass} onClick={() => onForward(message)}>
          <Forward className="h-4 w-4 shrink-0" />
          Forward to
        </button>
        {canModify ? (
          <>
            <button type="button" className={itemClass} onClick={() => onEdit(message)}>
              <Pencil className="h-4 w-4 shrink-0" />
              Edit
            </button>
            <button
              type="button"
              className={`${itemClass} text-[#B42318] hover:bg-[#FFF1F1]`}
              onClick={() => onDelete(message)}
            >
              <Trash2 className="h-4 w-4 shrink-0" />
              Delete
            </button>
          </>
        ) : canReport ? (
          <button
            type="button"
            className={`${itemClass} text-[#B42318] hover:bg-[#FFF1F1]`}
            onClick={() => onReport(message)}
          >
            <Flag className="h-4 w-4 shrink-0" />
            Report
          </button>
        ) : null}
      </div>
    </>
  );
}

const REPORT_REASONS: Array<{ value: MessageReportReason; label: string }> = [
  { value: "spam", label: "Spam or advertising" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "hate", label: "Hate speech" },
  { value: "violence", label: "Violence or threats" },
  { value: "sexual", label: "Sexual content" },
  { value: "fraud", label: "Fraud or scam" },
  { value: "other", label: "Other" },
];

function ReportMessageModal({ message, onClose }: { message: ChatMessage; onClose: () => void }) {
  const [reason, setReason] = useState<MessageReportReason | "">("");
  const [details, setDetails] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reason) {
      setError("Select a reason for the report.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await reportMessage(message.id, reason, details.trim());
      setSent(true);
    } catch (requestError) {
      const apiError = requestError as Partial<ApiError>;
      setError(apiError.detail || apiError.message || "Could not send the report.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 px-6" onClick={saving ? undefined : onClose}>
      <section role="dialog" aria-modal="true" aria-label="Report message" className="w-full max-w-[480px] rounded-lg bg-white p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-[#121212]">Report message</h2>
          <button type="button" aria-label="Close" disabled={saving} onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#F3F4F6]"><X className="h-5 w-5" /></button>
        </div>
        {sent ? (
          <div className="mt-5">
            <p className="text-sm leading-6 text-[#4B5563]">The report was sent to the moderation team.</p>
            <button type="button" onClick={onClose} className="mt-6 h-10 w-full rounded-lg bg-black text-sm font-semibold text-white">Done</button>
          </div>
        ) : (
          <form className="mt-5" onSubmit={submit}>
            <p className="rounded-lg bg-[#F7F9FF] px-3 py-2 text-sm text-[#4B5563] line-clamp-3">{messagePreview(message)}</p>
            <fieldset className="mt-4 space-y-2">
              <legend className="mb-2 text-sm font-semibold text-[#121212]">Why are you reporting this message?</legend>
              {REPORT_REASONS.map((item) => (
                <label key={item.value} className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#EEF0F6] px-3 py-2.5 text-sm hover:bg-[#F7F9FF]">
                  <input type="radio" name="report-reason" value={item.value} checked={reason === item.value} onChange={() => setReason(item.value)} />
                  {item.label}
                </label>
              ))}
            </fieldset>
            <label className="mt-4 block text-sm font-semibold text-[#121212]">Additional details <span className="font-normal text-[#6B7280]">(optional)</span>
              <textarea value={details} maxLength={500} rows={3} onChange={(event) => setDetails(event.target.value)} className="mt-2 w-full resize-none rounded-lg border border-[#D8DDEA] px-3 py-2 font-normal outline-none focus:border-[#A7BAFA]" />
            </label>
            {error ? <p role="alert" className="mt-3 text-sm text-[#B42318]">{error}</p> : null}
            <button type="submit" disabled={saving} className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-lg bg-[#A12020] text-sm font-semibold text-white disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send report"}</button>
          </form>
        )}
      </section>
    </div>
  );
}

function ForwardMessageModal({
  message,
  chats,
  meId,
  forwardingChatId,
  onClose,
  onForward,
}: {
  message: ChatMessage;
  chats: ChatRoom[];
  meId: number | null;
  forwardingChatId: number | null;
  onClose: () => void;
  onForward: (chat: ChatRoom) => void;
}) {
  const [query, setQuery] = useState("");
  const visibleChats = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return chats;
    return chats.filter((chat) => {
      const title = chatTitle(chat, meId).toLowerCase();
      return (
        title.includes(normalized) || lastMessagePreview(chat).toLowerCase().includes(normalized)
      );
    });
  }, [chats, meId, query]);

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/30 px-6">
      <div className="w-full max-w-[520px] rounded-lg bg-white p-5 shadow-[0_24px_70px_rgba(0,0,0,0.2)]">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Forward to</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#F3F4F6]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 rounded-lg border border-[#EEF0F6] bg-[#F7F9FF] px-3 py-2">
          <p className="truncate text-xs font-semibold text-[#4B5563]">
            {messageAuthorLabel(message, meId)}
          </p>
          <p className="mt-1 max-h-10 overflow-hidden text-sm leading-5 text-[#121212]">
            {messagePreview(message)}
          </p>
        </div>

        <label className="relative mt-4 block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search chats"
            className="h-10 w-full rounded-lg border border-[#D8DDEA] bg-white pl-9 pr-3 text-sm outline-none transition focus:border-[#A7BAFA] focus:ring-2 focus:ring-[#D6E0FF]"
          />
        </label>

        <div className="mt-4 max-h-[360px] overflow-y-auto rounded-lg border border-[#EEF0F6]">
          {visibleChats.length > 0 ? (
            visibleChats.map((chat) => {
              const title = chatTitle(chat, meId);
              const forwarding = forwardingChatId === chat.id;
              return (
                <button
                  key={chat.id}
                  type="button"
                  disabled={forwardingChatId !== null}
                  onClick={() => onForward(chat)}
                  className="grid h-[72px] w-full grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 border-b border-[#EEF0F6] px-3 text-left last:border-b-0 hover:bg-[#F7F9FF] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Avatar src={chatAvatar(chat, meId)} label={title} size="md" />
                  <span className="min-w-0">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-sm font-semibold text-[#121212]">{title}</span>
                      {chat.type === "group" ? (
                        <Users className="h-4 w-4 shrink-0 text-[#4B5563]" />
                      ) : null}
                    </span>
                    <span className="mt-1 block truncate text-xs text-[#6B7280]">
                      {lastMessagePreview(chat)}
                    </span>
                  </span>
                  {forwarding ? <Loader2 className="h-4 w-4 animate-spin text-[#003AFF]" /> : null}
                </button>
              );
            })
          ) : (
            <div className="flex h-24 items-center justify-center px-4 text-center text-sm text-[#6B7280]">
              No chats found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GroupInfoModal({
  chat,
  muted,
  onClose,
  onToggleMute,
  onRename,
  onViewProfile,
}: {
  chat: ChatRoom;
  muted: boolean;
  onClose: () => void;
  onToggleMute: () => void;
  onRename: (chatId: number, title: string) => Promise<void>;
  onViewProfile: (user: ChatUser) => void;
}) {
  const currentTitle = chat.title || "Untitled group";
  const [draftTitle, setDraftTitle] = useState(currentTitle);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const participants = useMemo(() => {
    const roleRank = { owner: 0, admin: 1, member: 2 };
    return chat.participants
      .filter((participant) => !participant.left_at)
      .sort(
        (first, second) =>
          roleRank[first.role] - roleRank[second.role] ||
          userDisplayName(first.user).localeCompare(userDisplayName(second.user)),
      );
  }, [chat.participants]);
  const titleChanged = draftTitle.trim() !== currentTitle;

  useEffect(() => {
    setDraftTitle(currentTitle);
    setError("");
  }, [chat.id, currentTitle]);

  async function saveTitle() {
    const nextTitle = draftTitle.trim();
    if (!nextTitle) {
      setError("Group title cannot be empty.");
      return;
    }
    if (!titleChanged) return;

    setSaving(true);
    setError("");
    try {
      await onRename(chat.id, nextTitle);
      setDraftTitle(nextTitle);
    } catch (requestError) {
      const apiError = requestError as Partial<ApiError>;
      setError(apiError.detail || apiError.message || "Could not update group title.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[75] flex items-center justify-center bg-black/30 px-6"
      onClick={onClose}
    >
      <section
        className="w-full max-w-[560px] rounded-lg bg-white p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar src={chat.image_url} label={currentTitle} size="lg" />
            <div className="min-w-0">
              <h2 className="truncate text-xl font-bold text-[#121212]">{currentTitle}</h2>
              <p className="mt-1 text-sm text-[#4B5563]">
                {participants.length} {participants.length === 1 ? "member" : "members"}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-[#F3F4F6]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <label className="mt-6 block">
          <span className="mb-2 block text-sm font-semibold text-[#374151]">Chat name</span>
          <span className="flex gap-3">
            <input
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void saveTitle();
                }
              }}
              className="h-11 min-w-0 flex-1 rounded-lg border border-[#D8DDEA] px-3 text-sm outline-none transition focus:border-[#A7BAFA] focus:ring-2 focus:ring-[#D6E0FF]"
            />
            <button
              type="button"
              disabled={saving || !titleChanged || !draftTitle.trim()}
              onClick={() => void saveTitle()}
              className="inline-flex h-11 min-w-[92px] items-center justify-center rounded-lg bg-black px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#A3A3A3]"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </button>
          </span>
        </label>

        {error ? (
          <p role="alert" className="mt-3 text-sm text-[#B42318]">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          aria-pressed={!muted}
          onClick={onToggleMute}
          className="mt-5 flex h-12 w-full items-center justify-between rounded-lg border border-[#EEF0F6] px-4 text-left transition hover:bg-[#F7F9FF]"
        >
          <span className="flex min-w-0 items-center gap-3">
            <BellOff className="h-5 w-5 shrink-0 text-[#4B5563]" />
            <span className="font-medium text-[#121212]">Notifications</span>
          </span>
          <span className="rounded-full bg-[#EEF2FF] px-3 py-1 text-xs font-semibold text-[#0B257C]">
            {muted ? "Off" : "On"}
          </span>
        </button>

        <div className="mt-6">
          <h3 className="text-sm font-semibold text-[#374151]">Members</h3>
          <div className="mt-3 max-h-[320px] overflow-y-auto rounded-lg border border-[#EEF0F6]">
            {participants.length > 0 ? (
              participants.map((participant) => {
                const user = participant.user;
                const name = userDisplayName(user);
                const roleLabel =
                  participant.role === "owner"
                    ? "Owner"
                    : participant.role === "admin"
                      ? "Admin"
                      : "Member";
                return (
                  <button
                    key={participant.id}
                    type="button"
                    onClick={() => onViewProfile(user)}
                    className="grid h-[72px] w-full grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 border-b border-[#EEF0F6] px-4 text-left transition last:border-b-0 hover:bg-[#F7F9FF]"
                  >
                    <Avatar src={user.avatar} label={name} size="sm" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-[#121212]">
                        {name}
                      </span>
                      <span className="mt-1 block truncate text-xs text-[#6B7280]">
                        {user.email}
                      </span>
                    </span>
                    <span className="rounded-full bg-[#FFF4DA] px-2.5 py-1 text-[11px] font-semibold text-[#8A6201]">
                      {roleLabel}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="flex h-20 items-center justify-center text-sm text-[#6B7280]">
                No members
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function ConfirmActionModal({
  title,
  description,
  confirmLabel,
  pending,
  danger = false,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: ReactNode;
  confirmLabel: string;
  pending: boolean;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/35 px-6"
      onClick={pending ? undefined : onCancel}
    >
      <section
        className="w-full max-w-[420px] rounded-lg bg-white p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-[#121212]">{title}</h2>
        <div className="mt-3 text-sm leading-6 text-[#4B5563]">{description}</div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            disabled={pending}
            onClick={onCancel}
            className="h-10 rounded-lg border border-[#D8DDEA] px-4 text-sm font-semibold text-[#121212] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={onConfirm}
            className={`inline-flex h-10 min-w-[112px] items-center justify-center rounded-lg px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#A3A3A3] ${
              danger ? "bg-[#A12020] hover:bg-[#8F1C1C]" : "bg-black hover:bg-[#252525]"
            }`}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

function ChatMenuPanel({
  open,
  muted,
  blocked,
  canBlock,
  canViewProfile,
  deleting,
  isGroup,
  readOnly,
  onToggleMute,
  onViewProfile,
  onOpenMembers,
  onClearHistory,
  onDeleteChat,
  onToggleBlock,
}: {
  open: boolean;
  muted: boolean;
  blocked: boolean;
  canBlock: boolean;
  canViewProfile: boolean;
  deleting: boolean;
  isGroup: boolean;
  readOnly: boolean;
  onToggleMute: () => void;
  onViewProfile: () => void;
  onOpenMembers: () => void;
  onClearHistory: () => void;
  onDeleteChat: () => void;
  onToggleBlock: () => void;
}) {
  const itemClass =
    "flex h-11 w-full items-center gap-3 rounded-md px-2 text-left text-[15px] font-medium text-[#121212] transition hover:bg-[#F6F7FB] disabled:cursor-not-allowed disabled:opacity-45";

  return (
    <aside
      aria-hidden={!open}
      className={`absolute right-0 top-[104px] z-30 w-[292px] transition duration-200 ${
        open
          ? "pointer-events-auto translate-x-0 opacity-100"
          : "pointer-events-none translate-x-8 opacity-0"
      }`}
    >
      <div className="mb-2 pl-2 text-xs text-[#4B5563]">Menu</div>
      <div className="rounded-lg bg-white p-4 shadow-[0_16px_36px_rgba(17,24,39,0.18)]">
        <button type="button" onClick={onToggleMute} className={itemClass}>
          <BellOff className="h-5 w-5 shrink-0" />
          {muted ? "Turn on notifications" : "Turn off notifications"}
        </button>
        {readOnly ? (
          <div className="flex min-h-11 items-center gap-3 rounded-md px-2 text-sm font-medium text-[#4B5563]">
            <LockKeyhole className="h-5 w-5 shrink-0" />
            Official read-only chat
          </div>
        ) : isGroup ? (
          <button type="button" onClick={onOpenMembers} className={itemClass}>
            <Users className="h-5 w-5 shrink-0" />
            Members
          </button>
        ) : (
          <button
            type="button"
            disabled={!canViewProfile}
            onClick={onViewProfile}
            className={itemClass}
          >
            <CircleUserRound className="h-5 w-5 shrink-0" />
            View profile
          </button>
        )}
        {!readOnly ? (
          <button type="button" onClick={onClearHistory} className={itemClass}>
            <Eraser className="h-5 w-5 shrink-0" />
            Clear history
          </button>
        ) : null}
        {!isGroup && !readOnly ? (
          <button type="button" disabled={!canBlock} onClick={onToggleBlock} className={itemClass}>
            <Ban className="h-5 w-5 shrink-0" />
            {blocked ? "Unblock user" : "Block user"}
          </button>
        ) : null}
        {!readOnly ? (
          <button
            type="button"
            disabled={deleting}
            onClick={onDeleteChat}
            className={`${itemClass} text-[#A12020] hover:bg-[#FFF1F1]`}
          >
            {deleting ? (
              <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
            ) : (
              <Trash2 className="h-5 w-5 shrink-0" />
            )}
            Delete chat
          </button>
        ) : null}
      </div>
    </aside>
  );
}

export function ChatWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedChatId = Number(searchParams.get("chat")) || null;
  const [me, setMe] = useState<UserData | null>(null);
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagePage, setMessagePage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [draft, setDraft] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [chatSearch, setChatSearch] = useState("");
  const [chatTypeFilter, setChatTypeFilter] = useState<ChatType>("direct");
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [chatMenuOpen, setChatMenuOpen] = useState(false);
  const [groupInfoOpen, setGroupInfoOpen] = useState(false);
  const [deletingChat, setDeletingChat] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState<ConfirmationAction | null>(null);
  const [confirmingAction, setConfirmingAction] = useState(false);
  const [mutedChatIds, setMutedChatIds] = useState<Set<number>>(() => new Set());
  const [blockedUserIds, setBlockedUserIds] = useState<Set<number>>(() => new Set());
  const [onlineUserIds, setOnlineUserIds] = useState<Set<number>>(() => new Set());
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeMode, setComposeMode] = useState<ComposeMode>("direct");
  const [typingUsers, setTypingUsers] = useState<Record<number, string>>({});
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [editText, setEditText] = useState("");
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [messageAction, setMessageAction] = useState<MessageActionState | null>(null);
  const [reportingMessage, setReportingMessage] = useState<ChatMessage | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<ChatMessage | null>(null);
  const [forwardingChatId, setForwardingChatId] = useState<number | null>(null);
  const [messageScrollbar, setMessageScrollbar] = useState<MessageScrollbarState>({
    top: 0,
    height: 0,
    visible: false,
  });

  const selectedChatIdRef = useRef<number | null>(null);
  const meRef = useRef<UserData | null>(null);
  const typingStopTimer = useRef<number | null>(null);
  const longPressTimer = useRef<number | null>(null);
  const messageScrollbarHideTimer = useRef<number | null>(null);
  const longPressTriggered = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesViewportRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastReadSentRef = useRef<string | null>(null);

  const meChatUser = useMemo(() => (me ? toChatUser(me) : null), [me]);
  const selectedChat = chats.find((chat) => chat.id === selectedChatId) ?? null;
  const selectedChatTitle = selectedChat ? chatTitle(selectedChat, me?.id ?? null) : "";
  const selectedChatAvatar = selectedChat ? chatAvatar(selectedChat, me?.id ?? null) : null;
  const selectedPeer = selectedChat ? directPeer(selectedChat, me?.id ?? null) : null;
  const selectedChatMuted = selectedChat ? mutedChatIds.has(selectedChat.id) : false;
  const selectedPeerBlocked = selectedPeer ? blockedUserIds.has(selectedPeer.id) : false;
  const typeFilteredChats = useMemo(
    () => chats.filter((chat) => chat.type === chatTypeFilter),
    [chatTypeFilter, chats],
  );
  const filteredChats = useMemo(() => {
    const query = chatSearch.trim().toLowerCase();
    if (!query) return typeFilteredChats;
    return typeFilteredChats.filter((chat) => {
      const title = chatTitle(chat, me?.id ?? null).toLowerCase();
      return title.includes(query) || lastMessagePreview(chat).toLowerCase().includes(query);
    });
  }, [chatSearch, me?.id, typeFilteredChats]);

  useEffect(() => {
    selectedChatIdRef.current = selectedChatId;
  }, [selectedChatId]);

  useEffect(() => {
    meRef.current = me;
  }, [me]);

  useEffect(() => {
    setMutedChatIds(mutedChatIdsFrom(chats, me?.id ?? null));
    setBlockedUserIds(blockedUserIdsFrom(chats));
  }, [chats, me?.id]);

  useEffect(() => {
    setSelectedChatId((current) => {
      if (requestedChatId && typeFilteredChats.some((chat) => chat.id === requestedChatId)) return requestedChatId;
      if (current && typeFilteredChats.some((chat) => chat.id === current)) return current;
      return typeFilteredChats[0]?.id ?? null;
    });
  }, [requestedChatId, typeFilteredChats]);

  const loadChats = useCallback(async () => {
    setError("");
    const data = await getChats(1);
    setChats(sortChats(data.results));
    setSelectedChatId((current) => requestedChatId ?? current ?? data.results[0]?.id ?? null);
  }, [requestedChatId]);

  const loadMessages = useCallback(async (chatId: number) => {
    setLoadingMessages(true);
    setError("");
    try {
      const data = await getMessages(chatId, 1);
      if (selectedChatIdRef.current !== chatId) return;
      setMessages([...data.results].reverse());
      setMessagePage(1);
      setHasMoreMessages(Boolean(data.next));
    } catch (requestError) {
      if (selectedChatIdRef.current !== chatId) return;
      const apiError = requestError as Partial<ApiError>;
      setError(apiError.detail || apiError.message || "Could not load messages.");
      setMessages([]);
      setHasMoreMessages(false);
    } finally {
      if (selectedChatIdRef.current === chatId) {
        setLoadingMessages(false);
      }
    }
  }, []);

  const updateMessageScrollbar = useCallback((visible: boolean) => {
    const viewport = messagesViewportRef.current;
    if (!viewport) {
      setMessageScrollbar((current) =>
        current.top === 0 && current.height === 0 && !current.visible
          ? current
          : { top: 0, height: 0, visible: false },
      );
      return;
    }

    const { clientHeight, scrollHeight, scrollTop } = viewport;
    const scrollable = scrollHeight > clientHeight + 1;
    if (!scrollable) {
      setMessageScrollbar((current) =>
        current.top === 0 && current.height === 0 && !current.visible
          ? current
          : { top: 0, height: 0, visible: false },
      );
      return;
    }

    const trackHeight = Math.max(clientHeight - 24, 0);
    const height = Math.min(
      trackHeight,
      Math.max((clientHeight / scrollHeight) * trackHeight, MESSAGE_SCROLLBAR_MIN_THUMB_HEIGHT),
    );
    const maxTop = Math.max(trackHeight - height, 0);
    const maxScrollTop = Math.max(scrollHeight - clientHeight, 1);
    const top = (scrollTop / maxScrollTop) * maxTop;

    setMessageScrollbar((current) => {
      const unchanged =
        Math.abs(current.top - top) < 0.5 &&
        Math.abs(current.height - height) < 0.5 &&
        current.visible === visible;
      return unchanged ? current : { top, height, visible };
    });
  }, []);

  const scheduleMessageScrollbarHide = useCallback(() => {
    if (messageScrollbarHideTimer.current !== null) {
      window.clearTimeout(messageScrollbarHideTimer.current);
    }
    messageScrollbarHideTimer.current = window.setTimeout(() => {
      updateMessageScrollbar(false);
    }, MESSAGE_SCROLLBAR_HIDE_DELAY);
  }, [updateMessageScrollbar]);

  const handleMessagesScroll = useCallback(() => {
    updateMessageScrollbar(true);
    scheduleMessageScrollbarHide();
  }, [scheduleMessageScrollbarHide, updateMessageScrollbar]);

  const resync = useCallback(() => {
    void loadChats().catch(() => null);
    if (selectedChatIdRef.current) {
      void loadMessages(selectedChatIdRef.current);
    }
  }, [loadChats, loadMessages]);

  const handleSocketEvent = useCallback(
    (event: ChatSocketEvent) => {
      if (event.type === "message.created") {
        setMessages((current) => {
          if (event.message.chat !== selectedChatIdRef.current) return current;
          if (current.some((message) => message.id === event.message.id)) return current;
          const withoutOptimistic = current.filter(
            (message) =>
              !(
                message.optimistic &&
                message.sender?.id === event.message.sender?.id &&
                message.text === event.message.text &&
                message.reply_to === event.message.reply_to
              ),
          );
          return [...withoutOptimistic, event.message];
        });
        setChats((current) =>
          sortChats(
            current.map((chat) =>
              chat.id === event.message.chat
                ? {
                    ...chat,
                    last_message: event.message,
                    updated_at: event.message.created_at,
                    unread_count:
                      event.message.chat === selectedChatIdRef.current ||
                      event.message.sender?.id === meRef.current?.id
                        ? 0
                        : chat.unread_count + 1,
                  }
                : chat,
            ),
          ),
        );
        return;
      }

      if (event.type === "message.updated" || event.type === "message.deleted") {
        setMessages((current) =>
          current.map((message) => (message.id === event.message.id ? event.message : message)),
        );
        setChats((current) =>
          current.map((chat) =>
            chat.last_message?.id === event.message.id
              ? { ...chat, last_message: event.message }
              : chat,
          ),
        );
        return;
      }

      if (event.type === "chat.updated") {
        setChats((current) => upsertChat(current, event.chat));
        return;
      }

      if (event.type === "chat.deleted") {
        setChats((current) => current.filter((chat) => chat.id !== event.chat_id));
        if (selectedChatIdRef.current === event.chat_id) {
          setSelectedChatId(null);
          setMessages([]);
          setChatMenuOpen(false);
          setGroupInfoOpen(false);
        }
        return;
      }

      if (event.type === "typing") {
        if (event.user.id === meRef.current?.id || event.chat_id !== selectedChatIdRef.current)
          return;
        setTypingUsers((current) => {
          const next = { ...current };
          if (event.is_typing) next[event.user.id] = event.user.name;
          else delete next[event.user.id];
          return next;
        });
        if (event.is_typing) {
          window.setTimeout(() => {
            setTypingUsers((current) => {
              const next = { ...current };
              delete next[event.user.id];
              return next;
            });
          }, 2500);
        }
        return;
      }

      if (event.type === "presence.snapshot") {
        setOnlineUserIds(new Set(event.online_user_ids));
        return;
      }

      if (event.type === "presence") {
        setOnlineUserIds((current) => {
          const next = new Set(current);
          if (event.is_online) next.add(event.user_id);
          else next.delete(event.user_id);
          return next;
        });
        return;
      }

      if (event.type === "participant.added" || event.type === "participant.removed") {
        void loadChats().catch(() => null);
        return;
      }

      if (event.type === "error") {
        setError(typeof event.detail === "string" ? event.detail : "Chat event failed.");
        setMessages((current) => {
          let optimisticIndex = -1;
          for (let index = current.length - 1; index >= 0; index -= 1) {
            if (current[index].optimistic) {
              optimisticIndex = index;
              break;
            }
          }
          if (optimisticIndex < 0) return current;
          return current.map((message, index) =>
            index === optimisticIndex
              ? { ...message, optimistic: false, failed: true }
              : message,
          );
        });
      }
    },
    [loadChats],
  );

  const { status: socketStatus, send } = useChatSocket({
    enabled: Boolean(me),
    onEvent: handleSocketEvent,
    onOpen: resync,
  });

  useEffect(() => {
    if (socketStatus !== "open") {
      setOnlineUserIds(new Set());
    }
  }, [socketStatus]);

  useEffect(() => {
    return () => {
      if (longPressTimer.current !== null) {
        window.clearTimeout(longPressTimer.current);
      }
      if (messageScrollbarHideTimer.current !== null) {
        window.clearTimeout(messageScrollbarHideTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadingChats(true);
    getMe()
      .then((user) => {
        if (!cancelled) setMe(user);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load your profile.");
      })
      .finally(() => {
        if (!cancelled) {
          loadChats()
            .catch((requestError: Partial<ApiError>) =>
              setError(requestError.detail || requestError.message || "Could not load chats."),
            )
            .finally(() => setLoadingChats(false));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [loadChats]);

  useEffect(() => {
    setChatMenuOpen(false);
    setGroupInfoOpen(false);
    setMessageAction(null);
    setForwardingMessage(null);
    setReplyingTo(null);
    setAttachedFiles([]);
    if (!selectedChatId) {
      setMessages([]);
      lastReadSentRef.current = null;
      return;
    }
    lastReadSentRef.current = null;
    setTypingUsers({});
    void loadMessages(selectedChatId);
  }, [loadMessages, selectedChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, selectedChatId]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      updateMessageScrollbar(false);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [hasMoreMessages, loadingMessages, messages.length, selectedChatId, updateMessageScrollbar]);

  useEffect(() => {
    const viewport = messagesViewportRef.current;
    if (!viewport || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      updateMessageScrollbar(false);
    });
    observer.observe(viewport);

    return () => observer.disconnect();
  }, [selectedChatId, updateMessageScrollbar]);

  useEffect(() => {
    if (!selectedChatId || messages.length === 0) return;
    const lastMessage = [...messages]
      .reverse()
      .find(
        (message) =>
          message.chat === selectedChatId &&
          message.id > 0 &&
          !message.optimistic &&
          !message.failed,
      );
    if (!lastMessage) return;

    const readKey = `${selectedChatId}:${lastMessage.id}`;
    if (lastReadSentRef.current === readKey) return;
    lastReadSentRef.current = readKey;

    setChats((current) =>
      current.map((chat) => (chat.id === selectedChatId ? { ...chat, unread_count: 0 } : chat)),
    );
    const sentOverSocket = send("message.read", {
      chat_id: selectedChatId,
      message_id: lastMessage.id,
    });
    if (!sentOverSocket) {
      void markChatRead(selectedChatId, lastMessage.id).catch(() => null);
    }
  }, [messages, selectedChatId, send]);

  async function loadOlderMessages() {
    if (!selectedChatId || loadingMore || !hasMoreMessages) return;
    setLoadingMore(true);
    try {
      const nextPage = messagePage + 1;
      const data = await getMessages(selectedChatId, nextPage);
      setMessages((current) => [...data.results].reverse().concat(current));
      setMessagePage(nextPage);
      setHasMoreMessages(Boolean(data.next));
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleSend() {
    const text = draft.trim();
    const files = attachedFiles;
    if (!selectedChatId || (!text && files.length === 0) || !meChatUser || selectedPeerBlocked)
      return;
    const replyTarget = replyingTo?.chat === selectedChatId ? replyingTo : null;
    setDraft("");
    setAttachedFiles([]);
    setReplyingTo(null);
    setError("");
    const messageText = text || files.map((file) => file.name).join("\n");
    const messageType: ChatMessage["message_type"] =
      files.length === 0
        ? "text"
        : files.every((file) => file.type.startsWith("image/"))
          ? "image"
          : "file";
    const optimistic: ChatMessage = {
      id: -Date.now(),
      chat: selectedChatId,
      sender: meChatUser,
      text: messageText,
      message_type: messageType,
      reply_to: replyTarget?.id ?? null,
      created_at: new Date().toISOString(),
      edited_at: null,
      deleted_at: null,
      is_deleted: false,
      attachments: [],
      optimistic: true,
    };
    setMessages((current) => [...current, optimistic]);

    if (files.length === 0) {
      const sentOverSocket = send("message.send", {
        chat_id: selectedChatId,
        text: messageText,
        message_type: messageType,
        reply_to: replyTarget?.id ?? null,
      });
      if (sentOverSocket) return;
    }

    try {
      const created = await sendMessage(
        selectedChatId,
        messageText,
        messageType,
        replyTarget?.id ?? null,
      );
      const attachments =
        files.length > 0
          ? await Promise.all(files.map((file) => uploadMessageAttachment(created.id, file)))
          : [];
      const createdWithAttachments = {
        ...created,
        attachments: [...created.attachments, ...attachments],
      };
      setMessages((current) => {
        if (current.some((message) => message.id === optimistic.id)) {
          return current.map((message) =>
            message.id === optimistic.id ? createdWithAttachments : message,
          );
        }
        return current.map((message) =>
          message.id === created.id ? createdWithAttachments : message,
        );
      });
    } catch (requestError) {
      const apiError = requestError as Partial<ApiError>;
      setError(apiError.detail || apiError.message || "Could not send message.");
      setMessages((current) =>
        current.map((message) =>
          message.id === optimistic.id ? { ...message, failed: true, optimistic: false } : message,
        ),
      );
    }
  }

  function handleDraftChange(value: string) {
    setDraft(value);
    if (!selectedChatId || socketStatus !== "open") return;
    send("typing.start", { chat_id: selectedChatId });
    if (typingStopTimer.current !== null) window.clearTimeout(typingStopTimer.current);
    typingStopTimer.current = window.setTimeout(() => {
      send("typing.stop", { chat_id: selectedChatId });
    }, 1200);
  }

  function handleFileSelect(files: FileList | null) {
    if (!files?.length) return;
    setAttachedFiles((current) => [...current, ...Array.from(files)]);
  }

  function removeAttachedFile(index: number) {
    setAttachedFiles((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  function setChatMuted(chatId: number, isMuted: boolean) {
    setMutedChatIds((current) => {
      const next = new Set(current);
      if (isMuted) next.add(chatId);
      else next.delete(chatId);
      return next;
    });
    setChats((current) =>
      current.map((chat) =>
        chat.id === chatId ? updateChatParticipantMute(chat, me?.id ?? null, isMuted) : chat,
      ),
    );
  }

  async function toggleChatMute(chatId: number) {
    const nextMuted = !mutedChatIds.has(chatId);
    setChatMuted(chatId, nextMuted);
    setError("");
    try {
      await updateChatMute(chatId, nextMuted);
    } catch (requestError) {
      setChatMuted(chatId, !nextMuted);
      const apiError = requestError as Partial<ApiError>;
      setError(apiError.detail || apiError.message || "Could not update notifications.");
    }
  }

  function toggleMuteSelectedChat() {
    if (!selectedChat) return;
    void toggleChatMute(selectedChat.id);
    setChatMenuOpen(false);
  }

  function clearVisibleHistory() {
    if (selectedChat?.is_read_only) return;
    setConfirmationAction("clear-history");
    setChatMenuOpen(false);
  }

  function viewUserProfile(user: ChatUser | null) {
    if (!user) return;
    setChatMenuOpen(false);
    setGroupInfoOpen(false);
    router.push(userProfileHref(user));
  }

  function openSelectedGroupInfo() {
    if (!selectedChat || selectedChat.type !== "group") return;
    setChatMenuOpen(false);
    setGroupInfoOpen(true);
  }

  async function renameGroupChat(chatId: number, title: string) {
    const updated = await updateChat(chatId, { title: title.trim() });
    setChats((current) => upsertChat(current, updated));
  }

  function setUserBlocked(userId: number, isBlocked: boolean) {
    setBlockedUserIds((current) => {
      const next = new Set(current);
      if (isBlocked) next.add(userId);
      else next.delete(userId);
      return next;
    });
    setChats((current) =>
      current.map((chat) => ({
        ...chat,
        blocked_user_ids: isBlocked
          ? Array.from(new Set([...(chat.blocked_user_ids ?? []), userId]))
          : (chat.blocked_user_ids ?? []).filter((blockedId) => blockedId !== userId),
      })),
    );
  }

  function toggleBlockSelectedUser() {
    if (!selectedPeer) return;
    setConfirmationAction(selectedPeerBlocked ? "unblock-user" : "block-user");
    setChatMenuOpen(false);
  }

  async function blockSelectedUser(isBlocked: boolean) {
    if (!selectedChat || !selectedPeer) return;
    setUserBlocked(selectedPeer.id, isBlocked);
    setError("");
    try {
      const result = await updateChatBlock(selectedChat.id, isBlocked);
      setUserBlocked(result.user_id, result.is_blocked);
    } catch (requestError) {
      setUserBlocked(selectedPeer.id, !isBlocked);
      const apiError = requestError as Partial<ApiError>;
      setError(apiError.detail || apiError.message || "Could not update user block.");
      throw requestError;
    }
  }

  async function clearSelectedChatHistory() {
    if (!selectedChat) return;
    setError("");
    try {
      const updated = await clearChatHistory(selectedChat.id);
      setMessages([]);
      setHasMoreMessages(false);
      setChats((current) => upsertChat(current, updated));
    } catch (requestError) {
      const apiError = requestError as Partial<ApiError>;
      setError(apiError.detail || apiError.message || "Could not clear history.");
      throw requestError;
    }
  }

  async function removeSelectedChat() {
    if (!selectedChat || selectedChat.is_read_only) return;
    setDeletingChat(true);
    setError("");
    try {
      await deleteChat(selectedChat.id);
      const remainingChats = chats.filter((chat) => chat.id !== selectedChat.id);
      setChats(remainingChats);
      setSelectedChatId(remainingChats[0]?.id ?? null);
      setMessages([]);
      setChatMenuOpen(false);
      setGroupInfoOpen(false);
    } catch (requestError) {
      const apiError = requestError as Partial<ApiError>;
      setError(apiError.detail || apiError.message || "Could not delete chat.");
      throw requestError;
    } finally {
      setDeletingChat(false);
    }
  }

  async function saveEdit() {
    if (!editingMessage || !editText.trim()) return;
    try {
      const updated = await updateMessage(editingMessage.id, editText.trim());
      setMessages((current) =>
        current.map((message) => (message.id === updated.id ? updated : message)),
      );
      setEditingMessage(null);
      setEditText("");
    } catch (requestError) {
      const apiError = requestError as Partial<ApiError>;
      setError(apiError.detail || apiError.message || "Could not update message.");
    }
  }

  async function removeMessage(message: ChatMessage) {
    try {
      await deleteMessage(message.id);
      setMessages((current) =>
        current.map((item) =>
          item.id === message.id
            ? { ...item, text: "", is_deleted: true, deleted_at: new Date().toISOString() }
            : item,
        ),
      );
    } catch (requestError) {
      const apiError = requestError as Partial<ApiError>;
      setError(apiError.detail || apiError.message || "Could not delete message.");
    }
  }

  function openMessageActions(message: ChatMessage, messageElement: HTMLElement) {
    if (
      selectedChat?.is_read_only ||
      message.message_type === "system" ||
      message.is_deleted ||
      message.optimistic ||
      message.failed
    )
      return;
    const position = messageActionMenuPosition(
      messageElement.getBoundingClientRect(),
      canModifyMessage(message, me?.id ?? null),
    );
    setChatMenuOpen(false);
    setMessageAction({ message, ...position });
  }

  function clearLongPressTimer() {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  function scheduleMessageLongPress(message: ChatMessage, event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" || message.is_deleted || message.optimistic || message.failed)
      return;
    clearLongPressTimer();
    longPressTriggered.current = false;
    const messageElement = event.currentTarget;
    longPressTimer.current = window.setTimeout(() => {
      longPressTriggered.current = true;
      openMessageActions(message, messageElement);
    }, 550);
  }

  function suppressLongPressClick(event: MouseEvent<HTMLDivElement>) {
    if (!longPressTriggered.current) return;
    event.preventDefault();
    event.stopPropagation();
    longPressTriggered.current = false;
  }

  function startReply(message: ChatMessage) {
    setReplyingTo(message);
    setMessageAction(null);
  }

  function startEdit(message: ChatMessage) {
    setEditingMessage(message);
    setEditText(message.text);
    setMessageAction(null);
  }

  function startForward(message: ChatMessage) {
    setForwardingMessage(message);
    setMessageAction(null);
  }

  async function forwardMessageToChat(chat: ChatRoom) {
    if (!forwardingMessage) return;
    setForwardingChatId(chat.id);
    setError("");
    try {
      const forwarded = await sendMessage(chat.id, forwardedMessageText(forwardingMessage));
      setChats((current) =>
        sortChats(
          current.map((item) =>
            item.id === chat.id
              ? {
                  ...item,
                  last_message: forwarded,
                  updated_at: forwarded.created_at,
                  unread_count: 0,
                }
              : item,
          ),
        ),
      );
      if (chat.id === selectedChatIdRef.current) {
        setMessages((current) =>
          current.some((message) => message.id === forwarded.id)
            ? current
            : [...current, forwarded],
        );
      }
      setForwardingMessage(null);
    } catch (requestError) {
      const apiError = requestError as Partial<ApiError>;
      setError(apiError.detail || apiError.message || "Could not forward message.");
    } finally {
      setForwardingChatId(null);
    }
  }

  const typingLabel = Object.values(typingUsers).join(", ");
  const selectedPeerOnline = selectedPeer ? onlineUserIds.has(selectedPeer.id) : false;
  const selectedChatStatus = selectedChat?.is_read_only
    ? "Official read-only chat"
    : selectedPeerBlocked
      ? "Blocked"
      : socketStatus !== "open"
      ? "Reconnecting"
      : selectedChat?.type === "direct" && selectedPeerOnline
        ? "Online"
        : "";
  const chatFilterButtonClass = (filter: ChatType) =>
    `flex h-full flex-1 items-center justify-center rounded-full transition ${
      chatTypeFilter === filter
        ? "[background-image:var(--gradient-brand)]"
        : "text-black hover:bg-white/45"
    }`;
  const selectedPeerName = selectedPeer ? userDisplayName(selectedPeer) : "this user";
  const confirmation =
    confirmationAction === "clear-history"
      ? {
          title: "Clear history?",
          description:
            "Messages will disappear only for you. Other chat participants will keep their history.",
          confirmLabel: "Clear",
          danger: true,
        }
      : confirmationAction === "delete-chat"
        ? {
            title: "Delete chat?",
            description:
              "This will delete the entire chat for all participants. This action cannot be undone.",
            confirmLabel: "Delete",
            danger: true,
          }
        : confirmationAction === "block-user"
          ? {
              title: `Block ${selectedPeerName}?`,
              description:
                "You will not be able to send messages in this direct chat until the user is unblocked.",
              confirmLabel: "Block",
              danger: true,
            }
          : confirmationAction === "unblock-user"
            ? {
                title: `Unblock ${selectedPeerName}?`,
                description: "Messaging in this direct chat will be available again.",
                confirmLabel: "Unblock",
                danger: false,
              }
            : null;

  async function confirmPendingAction() {
    if (!confirmationAction) return;
    setConfirmingAction(true);
    try {
      if (confirmationAction === "clear-history") {
        await clearSelectedChatHistory();
      } else if (confirmationAction === "delete-chat") {
        await removeSelectedChat();
      } else if (confirmationAction === "block-user") {
        await blockSelectedUser(true);
      } else if (confirmationAction === "unblock-user") {
        await blockSelectedUser(false);
      }
      setConfirmationAction(null);
    } finally {
      setConfirmingAction(false);
    }
  }

  return (
    <main className="flex h-[calc(100vh-76px)] min-h-[640px] gap-[clamp(28px,4vw,76px)] bg-[#D6E0FF] px-[clamp(28px,4vw,78px)] py-[clamp(24px,3vw,40px)] text-[#111827]">
      <section className="flex w-[470px] shrink-0 flex-col">
        <label className="relative block">
          <Image
            src="/icons/search_blue.png"
            alt=""
            width={24}
            height={24}
            className="pointer-events-none absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2"
          />
          <input
            value={chatSearch}
            onChange={(event) => setChatSearch(event.target.value)}
            placeholder="Search"
            className="h-12 w-full rounded-[18px] border border-[#A7BAFA] bg-white pl-12 pr-4 text-base outline-none placeholder:text-[#C6C6CF] focus:border-[#003AFF] focus:ring-2 focus:ring-white/70"
          />
        </label>

        <div className="mt-7 flex items-center justify-between px-[clamp(26px,3vw,64px)]">
          <div className="inline-flex h-16 w-[212px] gap-2.5 rounded-[40px] bg-[#D9D9D9]/20 px-2 py-1 shadow-[0_2px_4px_0_rgba(255,255,255,1)]">
            <button
              type="button"
              aria-label="Direct chats"
              aria-pressed={chatTypeFilter === "direct"}
              onClick={() => setChatTypeFilter("direct")}
              className={chatFilterButtonClass("direct")}
            >
              <Image src="/icons/person.svg" alt="" width={24} height={24} />
            </button>
            <button
              type="button"
              aria-label="Group chats"
              aria-pressed={chatTypeFilter === "group"}
              onClick={() => setChatTypeFilter("group")}
              className={chatFilterButtonClass("group")}
            >
              <Image src="/icons/people_black.svg" alt="" width={24} height={24} />
            </button>
          </div>
          <button
            type="button"
            aria-label="New chat"
            onClick={() => setComposeOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-[4px] bg-black text-white transition hover:bg-[#252525]"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>

        <div className="mt-7 min-h-0 flex-1 rounded-[20px] bg-white/20 p-6 shadow-[0_2px_4px_0_rgba(255,255,255,1)]">
          <div className="h-full overflow-y-auto pr-1">
            {loadingChats ? (
              <div className="flex h-32 items-center justify-center text-sm text-[#4B5563]">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading chats
              </div>
            ) : filteredChats.length > 0 ? (
              <div className="space-y-3">
                {filteredChats.map((chat) => {
                  const title = chatTitle(chat, me?.id ?? null);
                  const active = chat.id === selectedChatId;
                  return (
                    <button
                      key={chat.id}
                      type="button"
                      onClick={() => setSelectedChatId(chat.id)}
                      className={`grid h-[79px] w-full grid-cols-[55px_minmax(0,1fr)_auto] items-center gap-2 rounded-[20px] px-6 py-3 text-left transition ${
                        active ? "bg-[#FFF4DA]" : "bg-white hover:bg-[#F8FAFF]"
                      }`}
                    >
                      <Avatar src={chatAvatar(chat, me?.id ?? null)} label={title} size="card" />
                      <span className="min-w-0">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="truncate text-base font-bold text-[#121212]">
                            {title}
                          </span>
                          {chat.type === "group" ? (
                            <Users className="h-4 w-4 shrink-0 text-[#4B5563]" />
                          ) : chat.is_read_only ? (
                            <LockKeyhole className="h-4 w-4 shrink-0 text-[#0B257C]" />
                          ) : null}
                        </span>
                        <span className="mt-1 block truncate text-sm text-[#121212]">
                          {lastMessagePreview(chat)}
                        </span>
                      </span>
                      <span className="flex min-w-8 flex-col items-end gap-2">
                        <span className="text-[11px] text-[#4B5563]">
                          {compactTime(chat.updated_at)}
                        </span>
                        {chat.unread_count > 0 ? (
                          <span className="flex min-w-5 items-center justify-center rounded-full bg-[#003AFF] px-1.5 py-0.5 text-[11px] font-semibold text-white">
                            {chat.unread_count}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-full min-h-40 flex-col items-center justify-center px-6 text-center text-sm text-[#4B5563]">
                <MessageSquarePlus className="mb-3 h-8 w-8 text-[#A7BAFA]" />
                No chats
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="relative flex min-w-0 flex-1 flex-col">
        {selectedChat ? (
          <>
            <header className="relative z-20 flex min-h-[90px] shrink-0 items-center justify-between rounded-[18px] border border-white/70 bg-[#D6E0FF]/60 px-10 py-4 shadow-[inset_0_2px_4px_rgba(255,255,255,0.65)]">
              <div className="flex min-w-0 items-center gap-4">
                {selectedChat.type === "direct" && selectedPeer ? (
                  <button
                    type="button"
                    aria-label="View profile"
                    onClick={() => viewUserProfile(selectedPeer)}
                    className="shrink-0 rounded-full outline-none ring-offset-2 transition hover:brightness-95 focus-visible:ring-2 focus-visible:ring-[#003AFF]"
                  >
                    <Avatar src={selectedChatAvatar} label={selectedChatTitle} size="lg" />
                  </button>
                ) : (
                  <Avatar src={selectedChatAvatar} label={selectedChatTitle} size="lg" />
                )}
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-bold text-[#121212]">{selectedChatTitle}</h2>
                  {selectedChatStatus ? (
                    <p className="mt-1 text-xs font-medium text-[#003AFF]">{selectedChatStatus}</p>
                  ) : null}
                </div>
              </div>
              <button
                type="button"
                aria-label="Chat menu"
                aria-expanded={chatMenuOpen}
                onClick={() => setChatMenuOpen((open) => !open)}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-black transition hover:bg-white/55"
              >
                <MoreVertical className="h-6 w-6" />
              </button>
            </header>

            <ChatMenuPanel
              open={chatMenuOpen}
              muted={selectedChatMuted}
              blocked={selectedPeerBlocked}
              canBlock={selectedChat.type === "direct" && Boolean(selectedPeer)}
              canViewProfile={Boolean(selectedPeer)}
              deleting={deletingChat}
              isGroup={selectedChat.type === "group"}
              readOnly={selectedChat.is_read_only}
              onToggleMute={toggleMuteSelectedChat}
              onViewProfile={() => viewUserProfile(selectedPeer)}
              onOpenMembers={openSelectedGroupInfo}
              onClearHistory={clearVisibleHistory}
              onDeleteChat={() => {
                setConfirmationAction("delete-chat");
                setChatMenuOpen(false);
              }}
              onToggleBlock={toggleBlockSelectedUser}
            />

            {groupInfoOpen && selectedChat.type === "group" ? (
              <GroupInfoModal
                chat={selectedChat}
                muted={selectedChatMuted}
                onClose={() => setGroupInfoOpen(false)}
                onToggleMute={() => toggleChatMute(selectedChat.id)}
                onRename={renameGroupChat}
                onViewProfile={viewUserProfile}
              />
            ) : null}

            {error ? (
              <p
                role="alert"
                className="mt-3 rounded-lg border border-[#FAD1D1] bg-[#FFF7F7] px-5 py-2 text-sm text-[#B42318]"
              >
                {error}
              </p>
            ) : null}

            <div className="relative mt-4 min-h-0 flex-1">
              <div
                ref={messagesViewportRef}
                onScroll={handleMessagesScroll}
                className="chat-scrollbar-hidden h-full overflow-y-auto rounded-[18px] border border-white/70 bg-[#D6E0FF]/45 px-5 py-6 shadow-[inset_0_2px_4px_rgba(255,255,255,0.65)]"
              >
                {hasMoreMessages ? (
                  <div className="mb-5 flex justify-center">
                    <button
                      type="button"
                      disabled={loadingMore}
                      onClick={loadOlderMessages}
                      className="inline-flex h-9 items-center rounded-lg border border-[#A7BAFA] bg-white px-4 text-sm text-[#374151] disabled:opacity-60"
                    >
                      {loadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Load older
                    </button>
                  </div>
                ) : null}

                {loadingMessages ? (
                  <div className="flex h-full items-center justify-center text-sm text-[#4B5563]">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading messages
                  </div>
                ) : messages.length > 0 ? (
                  <div className="space-y-4">
                    {messages.map((message) => {
                      const mine = message.sender?.id === me?.id;
                      const actionSelected = messageAction?.message.id === message.id;
                      const replyTarget = message.reply_to
                        ? (messages.find((item) => item.id === message.reply_to) ?? null)
                        : null;
                      return (
                        <div
                          key={message.id}
                          className={`flex ${mine ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            onContextMenu={(event) => {
                              if (message.is_deleted || message.optimistic || message.failed)
                                return;
                              event.preventDefault();
                              openMessageActions(message, event.currentTarget);
                            }}
                            onPointerDown={(event) => scheduleMessageLongPress(message, event)}
                            onPointerUp={clearLongPressTimer}
                            onPointerCancel={clearLongPressTimer}
                            onPointerLeave={clearLongPressTimer}
                            onClickCapture={suppressLongPressClick}
                            className={`flex max-w-[52%] flex-col ${
                              mine ? "items-end" : "items-start"
                            } ${actionSelected ? "relative z-[90]" : ""} ${
                              message.is_deleted || message.optimistic ? "" : "cursor-default"
                            }`}
                          >
                            {!mine && selectedChat.type === "group" && message.sender ? (
                              <span className="mb-1 text-xs font-semibold text-[#4B5563]">
                                {userDisplayName(message.sender)}
                              </span>
                            ) : null}
                            <div
                              className={`rounded-[12px] px-4 py-2 text-sm leading-5 text-[#121212] shadow-sm ${
                                selectedChat.is_read_only
                                  ? "bg-[#FFF4DA]"
                                  : mine
                                    ? "bg-[#FCC4C3]"
                                    : "bg-[#A7BAFA]"
                              } ${message.failed ? "ring-2 ring-[#B42318]" : ""} ${
                                actionSelected
                                  ? "ring-2 ring-white shadow-[0_0_0_4px_rgba(255,255,255,0.32),0_18px_44px_rgba(17,24,39,0.28)]"
                                  : ""
                              }`}
                            >
                              {message.is_deleted ? (
                                <span className="text-[#4B5563]">Deleted message</span>
                              ) : (
                                <>
                                  {message.reply_to ? (
                                    <div className="mb-2 rounded-md border-l-2 border-[#121212]/35 bg-white/35 px-2 py-1">
                                      <p className="truncate text-[11px] font-semibold text-[#121212]/70">
                                        {replyTarget
                                          ? messageAuthorLabel(replyTarget, me?.id ?? null)
                                          : "Original message"}
                                      </p>
                                      <p className="truncate text-xs text-[#121212]">
                                        {replyTarget
                                          ? messagePreview(replyTarget)
                                          : "Message is not loaded"}
                                      </p>
                                    </div>
                                  ) : null}
                                  <p className="whitespace-pre-wrap break-words">{message.text}</p>
                                  {message.attachments.length > 0 ? (
                                    <div className="mt-2 space-y-2">
                                      {message.attachments.map((attachment, index) => {
                                        const isImage =
                                          attachment.file_type.startsWith("image/") &&
                                          Boolean(attachment.url);
                                        const name = attachmentName(attachment, index);
                                        return attachment.url ? (
                                          <a
                                            key={attachment.id}
                                            href={attachment.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="block rounded-lg bg-white/45 p-2 text-xs hover:bg-white/65"
                                          >
                                            {isImage ? (
                                              // eslint-disable-next-line @next/next/no-img-element
                                              <img
                                                src={attachment.url}
                                                alt={name}
                                                className="max-h-44 max-w-full rounded-md object-cover"
                                              />
                                            ) : (
                                              <span className="flex min-w-0 items-center gap-2">
                                                <FileText className="h-4 w-4 shrink-0" />
                                                <span className="truncate">{name}</span>
                                                <span className="shrink-0 text-[#4B5563]">
                                                  {formatFileSize(attachment.size)}
                                                </span>
                                              </span>
                                            )}
                                          </a>
                                        ) : (
                                          <div
                                            key={attachment.id}
                                            className="flex min-w-0 items-center gap-2 rounded-lg bg-white/45 p-2 text-xs"
                                          >
                                            <FileText className="h-4 w-4 shrink-0" />
                                            <span className="truncate">{name}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : null}
                                </>
                              )}
                              <span className="mt-1 flex items-center justify-end gap-1 text-[10px] text-[#121212]/70">
                                {message.edited_at ? "edited" : null}
                                {message.optimistic ? (
                                  "sending"
                                ) : (
                                  <time
                                    dateTime={message.created_at}
                                    tabIndex={0}
                                    title={messageFullDateTime(message.created_at)}
                                    aria-label={messageFullDateTime(message.created_at)}
                                    className="group relative inline-flex cursor-help items-center rounded-sm focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-1 focus-visible:outline-[#121212]/50"
                                  >
                                    {messageTime(message.created_at)}
                                    <span
                                      aria-hidden="true"
                                      className="pointer-events-none absolute bottom-full right-0 z-20 mb-1.5 w-max max-w-[220px] rounded-md bg-[#111827] px-2 py-1 text-[11px] font-medium leading-4 text-white opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-visible:opacity-100"
                                    >
                                      {messageFullDateTime(message.created_at)}
                                    </span>
                                  </time>
                                )}
                                {mine && !message.optimistic ? <Check className="h-3 w-3" /> : null}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-center text-sm text-[#4B5563]">
                    <Send className="mb-3 h-8 w-8 text-[#A7BAFA]" />
                    No messages
                  </div>
                )}
              </div>
              {messageScrollbar.height > 0 ? (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-3 right-2 top-3 w-1.5"
                >
                  <span
                    className={`absolute right-0 block w-full rounded-full bg-[#121212]/45 shadow-[0_0_0_1px_rgba(255,255,255,0.28)] transition-opacity duration-200 ${
                      messageScrollbar.visible ? "opacity-70" : "opacity-0"
                    }`}
                    style={{
                      height: `${messageScrollbar.height}px`,
                      transform: `translateY(${messageScrollbar.top}px)`,
                    }}
                  />
                </div>
              ) : null}
            </div>

            {selectedChat.is_read_only ? (
              <div className="mt-4 flex min-h-14 shrink-0 items-center justify-center gap-3 rounded-[18px] border border-white/70 bg-white/45 px-5 text-center text-sm font-medium text-[#4B5563]">
                <LockKeyhole className="h-5 w-5 shrink-0 text-[#0B257C]" />
                This is an official message from the School Administration. Replies are disabled.
              </div>
            ) : (
            <div className="mt-4 shrink-0">
              <div className="mb-2 min-h-5 text-xs text-[#4B5563]">
                {typingLabel ? `${typingLabel} typing...` : ""}
                {selectedPeerBlocked ? "User is blocked. Unblock them from the menu to write." : ""}
              </div>

              {replyingTo ? (
                <div className="mb-3 flex items-start justify-between gap-3 rounded-lg border border-[#A7BAFA] bg-white/70 px-4 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-[#003AFF]">
                      Reply to {messageAuthorLabel(replyingTo, me?.id ?? null)}
                    </p>
                    <p className="mt-1 truncate text-sm text-[#121212]">
                      {messagePreview(replyingTo)}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Cancel reply"
                    onClick={() => setReplyingTo(null)}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full hover:bg-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : null}

              {attachedFiles.length > 0 ? (
                <div className="mb-3 flex flex-wrap gap-2">
                  {attachedFiles.map((file, index) => (
                    <button
                      key={`${file.name}-${file.lastModified}-${index}`}
                      type="button"
                      onClick={() => removeAttachedFile(index)}
                      className="flex max-w-[220px] items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs text-[#121212] hover:bg-white"
                    >
                      <Paperclip className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{file.name}</span>
                      <span className="shrink-0 text-[#4B5563]">{formatFileSize(file.size)}</span>
                      <X className="h-3.5 w-3.5 shrink-0" />
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="flex items-end gap-3">
                <div className="flex min-h-14 flex-1 rounded-[18px] bg-[linear-gradient(90deg,#A7BAFA_0%,#FCC4C3_52%,#FFF4DA_100%)] p-[2px]">
                  <div className="flex min-h-[52px] flex-1 items-end rounded-[16px] bg-[#D6E0FF]">
                    <textarea
                      value={draft}
                      rows={1}
                      disabled={selectedPeerBlocked}
                      onChange={(event) => handleDraftChange(event.target.value)}
                      onKeyDown={(event: KeyboardEvent<HTMLTextAreaElement>) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          void handleSend();
                        }
                      }}
                      placeholder="Message"
                      className="max-h-32 min-h-[52px] flex-1 resize-none bg-transparent px-6 py-4 text-sm outline-none placeholder:text-[#121212] disabled:cursor-not-allowed disabled:opacity-60"
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(event) => {
                        handleFileSelect(event.currentTarget.files);
                        event.currentTarget.value = "";
                      }}
                    />
                    <button
                      type="button"
                      aria-label="Attach files"
                      disabled={selectedPeerBlocked}
                      onClick={() => fileInputRef.current?.click()}
                      className="mr-3 flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-black transition hover:bg-white/35 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <Image src="/icons/paperclip.svg" alt="" width={24} height={24} />
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Send message"
                  disabled={selectedPeerBlocked || (!draft.trim() && attachedFiles.length === 0)}
                  onClick={() => void handleSend()}
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[8px] [background-image:var(--gradient-brand)] text-black transition hover:brightness-105 disabled:cursor-not-allowed disabled:grayscale"
                >
                  <Send className="h-7 w-7 fill-black" />
                </button>
              </div>
            </div>
            )}
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center rounded-[18px] border border-white/70 bg-[#D6E0FF]/45 text-center text-sm text-[#4B5563] shadow-[inset_0_2px_4px_rgba(255,255,255,0.65)]">
            <MessageSquarePlus className="mb-3 h-9 w-9 text-[#A7BAFA]" />
            Select or create a chat
            <button
              type="button"
              onClick={() => setComposeOpen(true)}
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-black px-4 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" />
              New chat
            </button>
          </div>
        )}
      </section>

      {composeOpen ? (
        <ComposeModal
          mode={composeMode}
          onModeChange={setComposeMode}
          meId={me?.id ?? null}
          onClose={() => setComposeOpen(false)}
          onCreated={(chat) => {
            setChats((current) => upsertChat(current, chat));
            setSelectedChatId(chat.id);
          }}
        />
      ) : null}

      {messageAction ? (
        <MessageActionModal
          state={messageAction}
          meId={me?.id ?? null}
          onClose={() => setMessageAction(null)}
          onReply={startReply}
          onForward={startForward}
          onEdit={startEdit}
          onDelete={(message) => {
            setMessageAction(null);
            void removeMessage(message);
          }}
          onReport={(message) => {
            setMessageAction(null);
            setReportingMessage(message);
          }}
        />
      ) : null}

      {reportingMessage ? (
        <ReportMessageModal message={reportingMessage} onClose={() => setReportingMessage(null)} />
      ) : null}

      {forwardingMessage ? (
        <ForwardMessageModal
          message={forwardingMessage}
          chats={chats}
          meId={me?.id ?? null}
          forwardingChatId={forwardingChatId}
          onClose={() => setForwardingMessage(null)}
          onForward={(chat) => void forwardMessageToChat(chat)}
        />
      ) : null}

      {confirmation ? (
        <ConfirmActionModal
          title={confirmation.title}
          description={confirmation.description}
          confirmLabel={confirmation.confirmLabel}
          danger={confirmation.danger}
          pending={confirmingAction || deletingChat}
          onCancel={() => {
            if (!confirmingAction) setConfirmationAction(null);
          }}
          onConfirm={() => void confirmPendingAction()}
        />
      ) : null}

      {editingMessage ? (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/30 px-6">
          <div className="w-full max-w-[520px] rounded-lg bg-white p-5 shadow-[0_24px_70px_rgba(0,0,0,0.2)]">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Edit message</h2>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setEditingMessage(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#F3F4F6]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <textarea
              value={editText}
              onChange={(event) => setEditText(event.target.value)}
              rows={5}
              className="mt-4 w-full resize-none rounded-lg border border-[#D8DDEA] px-3 py-2 text-sm outline-none focus:border-[#A7BAFA] focus:ring-2 focus:ring-[#D6E0FF]"
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingMessage(null)}
                className="h-10 rounded-lg border border-[#D8DDEA] px-4 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void saveEdit()}
                className="h-10 rounded-lg bg-black px-4 text-sm font-semibold text-white"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
