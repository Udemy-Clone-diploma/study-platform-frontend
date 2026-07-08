"use client";

import {
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Ban,
  BellOff,
  Check,
  CircleUserRound,
  Eraser,
  FileText,
  Loader2,
  MessageSquarePlus,
  MoreVertical,
  Paperclip,
  Plus,
  Search,
  Send,
  Trash2,
  Users,
  X,
} from "lucide-react";
import {
  createDirectChat,
  createGroupChat,
  deleteChat,
  deleteMessage,
  getChats,
  getMessages,
  markChatRead,
  searchUsers,
  sendMessage,
  updateMessage,
  uploadMessageAttachment,
  type ChatAttachment,
  type ChatMessage,
  type ChatRoom,
  type ChatSocketEvent,
  type ChatUser,
  type UserSearchResult,
} from "@/entities/chat";
import { getMe, type UserData } from "@/entities/user";
import type { ApiError } from "@/shared/api/base";
import { resolveMediaUrl } from "@/shared/api/lib/mediaUrl";
import { useChatSocket } from "@/features/chat/lib/useChatSocket";

type ComposeMode = "direct" | "group";

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

function fullTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
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

function directPeer(chat: ChatRoom, meId: number | null) {
  return chat.participants.find((participant) => participant.user.id !== meId)?.user ?? null;
}

function chatTitle(chat: ChatRoom, meId: number | null) {
  if (chat.type === "group") return chat.title || "Untitled group";
  const peer = directPeer(chat, meId);
  return peer ? userDisplayName(peer) : "Direct chat";
}

function chatAvatar(chat: ChatRoom, meId: number | null) {
  if (chat.image_url) return chat.image_url;
  return directPeer(chat, meId)?.avatar ?? null;
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
  size?: "sm" | "md" | "lg";
}) {
  const dimensions = {
    sm: "h-8 w-8 text-xs",
    md: "h-11 w-11 text-sm",
    lg: "h-12 w-12 text-base",
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

function ChatMenuPanel({
  open,
  muted,
  blocked,
  canBlock,
  deleting,
  onToggleMute,
  onViewProfile,
  onClearHistory,
  onDeleteChat,
  onToggleBlock,
}: {
  open: boolean;
  muted: boolean;
  blocked: boolean;
  canBlock: boolean;
  deleting: boolean;
  onToggleMute: () => void;
  onViewProfile: () => void;
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
        <button type="button" onClick={onViewProfile} className={itemClass}>
          <CircleUserRound className="h-5 w-5 shrink-0" />
          View profile
        </button>
        <button type="button" onClick={onClearHistory} className={itemClass}>
          <Eraser className="h-5 w-5 shrink-0" />
          Clear history
        </button>
        <button type="button" disabled={!canBlock} onClick={onToggleBlock} className={itemClass}>
          <Ban className="h-5 w-5 shrink-0" />
          {blocked ? "Unblock user" : "Block user"}
        </button>
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
      </div>
    </aside>
  );
}

export function ChatWorkspace() {
  const [me, setMe] = useState<UserData | null>(null);
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagePage, setMessagePage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [draft, setDraft] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [chatSearch, setChatSearch] = useState("");
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [chatMenuOpen, setChatMenuOpen] = useState(false);
  const [deletingChat, setDeletingChat] = useState(false);
  const [mutedChatIds, setMutedChatIds] = useState<Set<number>>(() => new Set());
  const [blockedUserIds, setBlockedUserIds] = useState<Set<number>>(() => new Set());
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeMode, setComposeMode] = useState<ComposeMode>("direct");
  const [typingUsers, setTypingUsers] = useState<Record<number, string>>({});
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [editText, setEditText] = useState("");

  const selectedChatIdRef = useRef<number | null>(null);
  const meRef = useRef<UserData | null>(null);
  const typingStopTimer = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastReadSentRef = useRef<string | null>(null);

  const meChatUser = useMemo(() => (me ? toChatUser(me) : null), [me]);
  const selectedChat = chats.find((chat) => chat.id === selectedChatId) ?? null;
  const selectedChatTitle = selectedChat ? chatTitle(selectedChat, me?.id ?? null) : "";
  const selectedChatAvatar = selectedChat ? chatAvatar(selectedChat, me?.id ?? null) : null;
  const selectedPeer = selectedChat ? directPeer(selectedChat, me?.id ?? null) : null;
  const selectedChatMuted = selectedChat ? mutedChatIds.has(selectedChat.id) : false;
  const selectedPeerBlocked = selectedPeer ? blockedUserIds.has(selectedPeer.id) : false;
  const filteredChats = useMemo(() => {
    const query = chatSearch.trim().toLowerCase();
    if (!query) return chats;
    return chats.filter((chat) => {
      const title = chatTitle(chat, me?.id ?? null).toLowerCase();
      return title.includes(query) || lastMessagePreview(chat).toLowerCase().includes(query);
    });
  }, [chatSearch, chats, me?.id]);

  useEffect(() => {
    selectedChatIdRef.current = selectedChatId;
  }, [selectedChatId]);

  useEffect(() => {
    meRef.current = me;
  }, [me]);

  const loadChats = useCallback(async () => {
    setError("");
    const data = await getChats(1);
    setChats(sortChats(data.results));
    setSelectedChatId((current) => current ?? data.results[0]?.id ?? null);
  }, []);

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
                message.text === event.message.text
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

      if (event.type === "participant.added" || event.type === "participant.removed") {
        void loadChats().catch(() => null);
        return;
      }

      if (event.type === "error") {
        setError(typeof event.detail === "string" ? event.detail : "Chat event failed.");
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
    setDraft("");
    setAttachedFiles([]);
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
      reply_to: null,
      created_at: new Date().toISOString(),
      edited_at: null,
      deleted_at: null,
      is_deleted: false,
      attachments: [],
      optimistic: true,
    };
    setMessages((current) => [...current, optimistic]);

    if (files.length === 0) {
      const sentOverSocket = send("message.send", { chat_id: selectedChatId, text: messageText });
      if (sentOverSocket) return;
    }

    try {
      const created = await sendMessage(selectedChatId, messageText, messageType);
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

  function toggleMuteSelectedChat() {
    if (!selectedChat) return;
    setMutedChatIds((current) => {
      const next = new Set(current);
      if (next.has(selectedChat.id)) next.delete(selectedChat.id);
      else next.add(selectedChat.id);
      return next;
    });
    setChatMenuOpen(false);
  }

  function clearVisibleHistory() {
    setMessages([]);
    setChatMenuOpen(false);
  }

  function toggleBlockSelectedUser() {
    if (!selectedPeer) return;
    setBlockedUserIds((current) => {
      const next = new Set(current);
      if (next.has(selectedPeer.id)) next.delete(selectedPeer.id);
      else next.add(selectedPeer.id);
      return next;
    });
    setChatMenuOpen(false);
  }

  async function removeSelectedChat() {
    if (!selectedChat) return;
    setDeletingChat(true);
    setError("");
    try {
      await deleteChat(selectedChat.id);
      const remainingChats = chats.filter((chat) => chat.id !== selectedChat.id);
      setChats(remainingChats);
      setSelectedChatId(remainingChats[0]?.id ?? null);
      setMessages([]);
      setChatMenuOpen(false);
    } catch (requestError) {
      const apiError = requestError as Partial<ApiError>;
      setError(apiError.detail || apiError.message || "Could not delete chat.");
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

  const typingLabel = Object.values(typingUsers).join(", ");

  return (
    <main className="flex h-[calc(100vh-76px)] min-h-[640px] gap-[clamp(28px,4vw,76px)] bg-[#D6E0FF] px-[clamp(28px,4vw,78px)] py-[clamp(24px,3vw,40px)] text-[#111827]">
      <section className="flex w-[clamp(320px,28vw,410px)] shrink-0 flex-col">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-[#A7BAFA]" />
          <input
            value={chatSearch}
            onChange={(event) => setChatSearch(event.target.value)}
            placeholder="Search"
            className="h-12 w-full rounded-[18px] border border-[#A7BAFA] bg-white pl-12 pr-4 text-base outline-none placeholder:text-[#C6C6CF] focus:border-[#003AFF] focus:ring-2 focus:ring-white/70"
          />
        </label>

        <div className="mt-7 flex items-center justify-between px-[clamp(26px,3vw,64px)]">
          <div className="inline-flex h-[52px] w-[184px] rounded-full border border-white/70 bg-[#D6E0FF]/60 p-1 shadow-[inset_0_2px_4px_rgba(255,255,255,0.85)]">
            <button
              type="button"
              aria-label="Direct chats"
              className="flex flex-1 items-center justify-center rounded-full [background-image:var(--gradient-brand)]"
            >
              <CircleUserRound className="h-6 w-6" />
            </button>
            <button
              type="button"
              aria-label="Group chats"
              className="flex flex-1 items-center justify-center rounded-full text-black"
            >
              <Users className="h-6 w-6" />
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

        <div className="mt-7 min-h-0 flex-1 rounded-[18px] border border-white/70 p-5 shadow-[inset_0_2px_4px_rgba(255,255,255,0.65)]">
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
                      className={`grid w-full grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-3 rounded-[14px] px-5 py-4 text-left transition ${
                        active ? "bg-[#FFF4DA]" : "bg-white hover:bg-[#F8FAFF]"
                      }`}
                    >
                      <Avatar src={chatAvatar(chat, me?.id ?? null)} label={title} size="lg" />
                      <span className="min-w-0">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="truncate text-base font-bold text-[#121212]">
                            {title}
                          </span>
                          {chat.type === "group" ? (
                            <Users className="h-4 w-4 shrink-0 text-[#4B5563]" />
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
                <Avatar src={selectedChatAvatar} label={selectedChatTitle} size="lg" />
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-bold text-[#121212]">{selectedChatTitle}</h2>
                  <p className="mt-1 text-xs font-medium text-[#003AFF]">
                    {selectedPeerBlocked
                      ? "Blocked"
                      : socketStatus === "open"
                        ? "Online"
                        : "Reconnecting"}
                  </p>
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
              deleting={deletingChat}
              onToggleMute={toggleMuteSelectedChat}
              onViewProfile={() => setChatMenuOpen(false)}
              onClearHistory={clearVisibleHistory}
              onDeleteChat={() => void removeSelectedChat()}
              onToggleBlock={toggleBlockSelectedUser}
            />

            {error ? (
              <p
                role="alert"
                className="mt-3 rounded-lg border border-[#FAD1D1] bg-[#FFF7F7] px-5 py-2 text-sm text-[#B42318]"
              >
                {error}
              </p>
            ) : null}

            <div className="mt-4 min-h-0 flex-1 overflow-y-auto rounded-[18px] border border-white/70 bg-[#D6E0FF]/45 px-5 py-6 shadow-[inset_0_2px_4px_rgba(255,255,255,0.65)]">
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
                    const canModify = mine && !message.optimistic && !message.is_deleted;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${mine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`flex max-w-[52%] flex-col ${
                            mine ? "items-end" : "items-start"
                          }`}
                        >
                          {!mine && selectedChat.type === "group" && message.sender ? (
                            <span className="mb-1 text-xs font-semibold text-[#4B5563]">
                              {userDisplayName(message.sender)}
                            </span>
                          ) : null}
                          <div
                            className={`rounded-[12px] px-4 py-2 text-sm leading-5 text-[#121212] shadow-sm ${
                              mine ? "bg-[#FCC4C3]" : "bg-[#A7BAFA]"
                            } ${message.failed ? "ring-2 ring-[#B42318]" : ""}`}
                          >
                            {message.is_deleted ? (
                              <span className="text-[#4B5563]">Deleted message</span>
                            ) : (
                              <>
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
                              {message.optimistic ? "sending" : fullTime(message.created_at)}
                              {mine && !message.optimistic ? <Check className="h-3 w-3" /> : null}
                            </span>
                          </div>
                          {canModify ? (
                            <div className="mt-1 flex gap-2 text-xs">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingMessage(message);
                                  setEditText(message.text);
                                }}
                                className="text-[#4B5563] hover:text-[#003AFF]"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => removeMessage(message)}
                                className="text-[#B42318] hover:underline"
                              >
                                Delete
                              </button>
                            </div>
                          ) : null}
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

            <div className="mt-4 shrink-0">
              <div className="mb-2 min-h-5 text-xs text-[#4B5563]">
                {typingLabel ? `${typingLabel} typing...` : ""}
                {selectedPeerBlocked ? "User is blocked. Unblock them from the menu to write." : ""}
              </div>

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
                <div className="flex min-h-12 flex-1 items-end rounded-[12px] border border-[#A7BAFA] bg-white/45 transition focus-within:border-[#003AFF] focus-within:ring-2 focus-within:ring-white/70">
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
                    className="max-h-32 min-h-12 flex-1 resize-none bg-transparent px-4 py-3 text-sm outline-none placeholder:text-[#121212] disabled:cursor-not-allowed disabled:opacity-60"
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
                    className="mb-1 mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-black transition hover:bg-white/55 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <Paperclip className="h-6 w-6" />
                  </button>
                </div>
                <button
                  type="button"
                  aria-label="Send message"
                  disabled={selectedPeerBlocked || (!draft.trim() && attachedFiles.length === 0)}
                  onClick={() => void handleSend()}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[4px] [background-image:var(--gradient-brand)] text-black transition hover:brightness-105 disabled:cursor-not-allowed disabled:grayscale"
                >
                  <Send className="h-7 w-7 fill-black" />
                </button>
              </div>
            </div>
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
