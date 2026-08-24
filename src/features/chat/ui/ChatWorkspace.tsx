"use client";

import {
  type ClipboardEvent,
  type MouseEvent,
  type PointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { MessageSquarePlus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  clearChatHistory,
  deleteChat,
  deleteMessage,
  getChatAttachments,
  getChats,
  getMessages,
  markChatRead,
  sendMessage,
  updateChat,
  updateChatBlock,
  updateChatMute,
  updateMessage,
  uploadChatImage,
  uploadMessageAttachment,
  type ChatAttachment,
  type ChatAttachmentItem,
  type ChatMessage,
  type ChatRoom,
  type ChatSocketEvent,
  type ChatType,
  type ChatUser,
} from "@/entities/chat";
import { getMe, type UserData } from "@/entities/user";
import type { ApiError } from "@/shared/api/base";
import { resolveMediaUrl } from "@/shared/api/lib/mediaUrl";
import { useChatSocket } from "@/features/chat/lib/useChatSocket";
import {
  MESSAGE_PREFETCH_CHAT_COUNT,
  MESSAGE_SCROLLBAR_HIDE_DELAY,
  MESSAGE_SCROLLBAR_MIN_THUMB_HEIGHT,
} from "../lib/chatConstants";
import { attachmentName, forwardedMessageText } from "../lib/chatFormatters";
import { compressImageFile } from "../lib/imageCompression";
import { downloadFile } from "../lib/downloadFile";
import {
  blockedUserIdsFrom,
  chatAvatar,
  chatTitle,
  directPeer,
  lastMessagePreview,
  mutedChatIdsFrom,
  sortChats,
  toChatUser,
  updateChatParticipantMute,
  upsertChat,
  userDisplayName,
  userProfileHref,
} from "../lib/chatSelectors";
import {
  attachmentActionMenuPosition,
  canModifyMessage,
  messageActionMenuPosition,
} from "../lib/messageActions";
import type {
  ComposeMode,
  ConfirmationAction,
  AttachmentActionState,
  MessageActionState,
  MessageScrollbarState,
} from "../model/chatWorkspaceTypes";
import { ChatHeader } from "./ChatHeader";
import { AttachmentActionModal } from "./AttachmentActionModal";
import { ChatAttachmentsModal } from "./ChatAttachmentsModal";
import { ChatMenuPanel } from "./ChatMenuPanel";
import { ChatSidebar } from "./ChatSidebar";
import { ComposeModal } from "./ComposeModal";
import { ConfirmActionModal } from "./ConfirmActionModal";
import { EditMessageModal } from "./EditMessageModal";
import { ForwardMessageModal } from "./ForwardMessageModal";
import { GroupInfoModal } from "./GroupInfoModal";
import { MessageActionModal } from "./MessageActionModal";
import { MessageComposer } from "./MessageComposer";
import { MessageList } from "./MessageList";
import { ImagePreviewModal } from "./ImagePreviewModal";
import { ReportMessageModal } from "./ReportMessageModal";

type ChatWorkspaceProps = {
  onViewProfile?: (user: ChatUser) => void;
  moderationHref?: string;
};

type MessageCacheEntry = {
  messages: ChatMessage[];
  page: number;
  hasMore: boolean;
};

/** Full chat workspace with an optional profile-view override for composed experiences. */
export function ChatWorkspace({ onViewProfile, moderationHref }: ChatWorkspaceProps = {}) {
  const t = useTranslations("ChatWorkspace");
  const tCommon = useTranslations("ChatCommon");
  const tShared = useTranslations("Common");
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
  const [compressImages, setCompressImages] = useState(true);
  const [imagePreview, setImagePreview] = useState<{ url: string; alt: string } | null>(null);
  const [chatSearch, setChatSearch] = useState("");
  const [chatTypeFilter, setChatTypeFilter] = useState<ChatType>("direct");
  const [mobileChatOpen, setMobileChatOpen] = useState(() => Boolean(requestedChatId));
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [chatMenuOpen, setChatMenuOpen] = useState(false);
  const [groupInfoOpen, setGroupInfoOpen] = useState(false);
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);
  const [chatAttachments, setChatAttachments] = useState<ChatAttachmentItem[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [attachmentsError, setAttachmentsError] = useState("");
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
  const [attachmentAction, setAttachmentAction] = useState<AttachmentActionState | null>(null);
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
  const messageCacheRef = useRef<Map<number, MessageCacheEntry>>(new Map());
  const messagesPrefetchedRef = useRef(false);

  const meChatUser = useMemo(() => (me ? toChatUser(me) : null), [me]);
  const selectedChat = chats.find((chat) => chat.id === selectedChatId) ?? null;
  const selectedChatTitle = selectedChat ? chatTitle(selectedChat, me?.id ?? null, tCommon) : "";
  const selectedChatAvatar = selectedChat ? chatAvatar(selectedChat, me?.id ?? null) : null;
  const selectedPeer = selectedChat ? directPeer(selectedChat, me?.id ?? null) : null;
  const selectedChatMuted = selectedChat ? mutedChatIds.has(selectedChat.id) : false;
  const selectedPeerBlocked = selectedPeer ? blockedUserIds.has(selectedPeer.id) : false;
  const selectedGroupCanManage = Boolean(
    selectedChat &&
    me &&
    selectedChat.participants.some(
      (participant) =>
        participant.user.id === me.id &&
        (participant.role === "owner" || participant.role === "admin") &&
        !participant.left_at,
    ),
  );
  const typeFilteredChats = useMemo(
    () => chats.filter((chat) => chat.type === chatTypeFilter),
    [chatTypeFilter, chats],
  );
  const filteredChats = useMemo(() => {
    const query = chatSearch.trim().toLowerCase();
    if (!query) return typeFilteredChats;
    return typeFilteredChats.filter((chat) => {
      const title = chatTitle(chat, me?.id ?? null, tCommon).toLowerCase();
      return (
        title.includes(query) || lastMessagePreview(chat, tCommon).toLowerCase().includes(query)
      );
    });
  }, [chatSearch, me?.id, typeFilteredChats, tCommon]);

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
      if (requestedChatId && typeFilteredChats.some((chat) => chat.id === requestedChatId))
        return requestedChatId;
      if (current && typeFilteredChats.some((chat) => chat.id === current)) return current;
      return typeFilteredChats[0]?.id ?? null;
    });
  }, [requestedChatId, typeFilteredChats]);

  useEffect(() => {
    setMobileChatOpen(Boolean(requestedChatId));
  }, [requestedChatId]);

  useEffect(() => {
    const showChatList = () => setMobileChatOpen(false);
    window.addEventListener("chat:list-requested", showChatList);
    return () => window.removeEventListener("chat:list-requested", showChatList);
  }, []);

  const loadChats = useCallback(async () => {
    setError("");
    const data = await getChats(1);
    setChats(sortChats(data.results));
    setSelectedChatId((current) => requestedChatId ?? current ?? data.results[0]?.id ?? null);
  }, [requestedChatId]);

  const loadMessages = useCallback(
    async (chatId: number) => {
      const cached = messageCacheRef.current.get(chatId);
      if (cached) {
        setMessages(cached.messages);
        setMessagePage(cached.page);
        setHasMoreMessages(cached.hasMore);
        setLoadingMessages(false);
      } else {
        setMessages([]);
        setHasMoreMessages(false);
        setLoadingMessages(true);
      }
      setError("");
      try {
        const data = await getMessages(chatId, 1);
        const nextMessages = [...data.results].reverse();
        const nextEntry = {
          messages: nextMessages,
          page: 1,
          hasMore: Boolean(data.next),
        };
        messageCacheRef.current.set(chatId, nextEntry);
        if (selectedChatIdRef.current !== chatId) return;
        setMessages(nextMessages);
        setMessagePage(nextEntry.page);
        setHasMoreMessages(nextEntry.hasMore);
      } catch (requestError) {
        if (selectedChatIdRef.current !== chatId) return;
        const apiError = requestError as Partial<ApiError>;
        if (!cached) {
          setError(apiError.detail || apiError.message || t("couldNotLoadMessages"));
          setMessages([]);
          setHasMoreMessages(false);
        }
      } finally {
        if (selectedChatIdRef.current === chatId) {
          setLoadingMessages(false);
        }
      }
    },
    [t],
  );

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
          const optimisticIndex = current.findIndex(
            (message) =>
              message.optimistic &&
              message.sender?.id === event.message.sender?.id &&
              message.text === event.message.text &&
              message.reply_to === event.message.reply_to,
          );
          if (optimisticIndex < 0) return [...current, event.message];
          return current.map((message, index) =>
            index === optimisticIndex ? event.message : message,
          );
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
          setAttachmentsOpen(false);
          setAttachmentAction(null);
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
        setError(typeof event.detail === "string" ? event.detail : t("chatEventFailed"));
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
            index === optimisticIndex ? { ...message, optimistic: false, failed: true } : message,
          );
        });
      }
    },
    [loadChats, t],
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
        if (!cancelled) setError(t("couldNotLoadProfile"));
      })
      .finally(() => {
        if (!cancelled) {
          loadChats()
            .catch((requestError: Partial<ApiError>) =>
              setError(requestError.detail || requestError.message || t("couldNotLoadChats")),
            )
            .finally(() => setLoadingChats(false));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [loadChats, t]);

  useEffect(() => {
    setChatMenuOpen(false);
    setGroupInfoOpen(false);
    setAttachmentsOpen(false);
    setAttachmentAction(null);
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
    if (messagesPrefetchedRef.current || chats.length === 0) return;
    messagesPrefetchedRef.current = true;

    const candidateIds = chats.slice(0, MESSAGE_PREFETCH_CHAT_COUNT).map((chat) => chat.id);
    let cancelled = false;
    let timer: number | null = null;

    const prefetchNext = (index: number) => {
      if (cancelled || index >= candidateIds.length) return;
      const chatId = candidateIds[index];
      const alreadyCached = messageCacheRef.current.has(chatId);
      const isCurrentChat = chatId === selectedChatIdRef.current;
      if (alreadyCached || isCurrentChat) {
        timer = window.setTimeout(() => prefetchNext(index + 1), 0);
        return;
      }
      getMessages(chatId, 1)
        .then((data) => {
          if (cancelled || messageCacheRef.current.has(chatId)) return;
          messageCacheRef.current.set(chatId, {
            messages: [...data.results].reverse(),
            page: 1,
            hasMore: Boolean(data.next),
          });
        })
        .catch(() => null)
        .finally(() => {
          timer = window.setTimeout(() => prefetchNext(index + 1), 150);
        });
    };

    timer = window.setTimeout(() => prefetchNext(0), 300);

    return () => {
      cancelled = true;
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [chats]);

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
    const viewport = messagesViewportRef.current;

    if (!selectedChatId || loadingMore || !hasMoreMessages || !viewport) {
      return;
    }

    const previousScrollHeight = viewport.scrollHeight;
    const previousScrollTop = viewport.scrollTop;

    setLoadingMore(true);

    try {
      const nextPage = messagePage + 1;
      const data = await getMessages(selectedChatId, nextPage);

      setMessages((current) => [...data.results].reverse().concat(current));

      setMessagePage(nextPage);
      setHasMoreMessages(Boolean(data.next));

      requestAnimationFrame(() => {
        const newScrollHeight = viewport.scrollHeight;

        viewport.scrollTop = previousScrollTop + (newScrollHeight - previousScrollHeight);
      });
    } catch (requestError) {
      const apiError = requestError as Partial<ApiError>;

      setError(apiError.detail || apiError.message || t("couldNotLoadOlderMessages"));
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleSend() {
    const text = draft.trim();
    const files = attachedFiles;
    if (!selectedChatId || (!text && files.length === 0) || !meChatUser || selectedPeerBlocked)
      return;

    let uploadFiles = files;
    if (compressImages && files.length > 0) {
      uploadFiles = [];
      for (const file of files) {
        uploadFiles.push(await compressImageFile(file));
      }
    }

    const replyTarget = replyingTo?.chat === selectedChatId ? replyingTo : null;
    setDraft("");
    setAttachedFiles([]);
    setReplyingTo(null);
    setError("");
    const messageText = text || files.map((file) => file.name).join("\n");
    const imageOnlyMessage =
      files.length > 0 && !text && files.every((file) => file.type.startsWith("image/"));
    const messageType: ChatMessage["message_type"] =
      files.length === 0 ? "text" : imageOnlyMessage ? "image" : "file";
    const previewUrls = uploadFiles.map((file) => URL.createObjectURL(file));
    const optimisticAttachments: ChatAttachment[] = uploadFiles.map((file, index) => ({
      id: `optimistic-${Date.now()}-${index}`,
      url: previewUrls[index],
      file_type: file.type || "application/octet-stream",
      size: file.size,
      created_at: new Date().toISOString(),
    }));
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
      attachments: optimisticAttachments,
      optimistic: true,
    };
    setMessages((current) => [...current, optimistic]);

    try {
      const created = await sendMessage(
        selectedChatId,
        messageText,
        messageType,
        replyTarget?.id ?? null,
      );
      const attachments: ChatAttachment[] = [];
      for (const file of uploadFiles) {
        attachments.push(await uploadMessageAttachment(created.id, file));
      }
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
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    } catch (requestError) {
      const apiError = requestError as Partial<ApiError>;
      setError(apiError.detail || apiError.message || t("couldNotSendMessage"));
      setMessages((current) =>
        current.map((message) =>
          message.id === optimistic.id
            ? { ...message, attachments: [], failed: true, optimistic: false }
            : message,
        ),
      );
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
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
    const selectedFiles = Array.from(files);
    setAttachedFiles((current) => [...current, ...selectedFiles]);
  }

  function handlePastePhoto(event: ClipboardEvent<HTMLTextAreaElement>) {
    const pastedImages = Array.from(event.clipboardData.items)
      .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
      .map((item) => item.getAsFile())
      .filter((file): file is File => Boolean(file));
    if (pastedImages.length === 0) return;
    event.preventDefault();
    setAttachedFiles((current) => [...current, ...pastedImages]);
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
      setError(apiError.detail || apiError.message || t("couldNotUpdateNotifications"));
    }
  }

  function toggleMuteSelectedChat() {
    if (!selectedChat) return;
    void toggleChatMute(selectedChat.id);
    setChatMenuOpen(false);
  }

  function selectChat(chatId: number) {
    const currentChatId = selectedChatIdRef.current;
    if (currentChatId && currentChatId !== chatId) {
      messageCacheRef.current.set(currentChatId, {
        messages,
        page: messagePage,
        hasMore: hasMoreMessages,
      });
    }
    setSelectedChatId(chatId);
    setMobileChatOpen(true);

    const params = new URLSearchParams(window.location.search);
    params.set("chat", String(chatId));
    // Use the browser's actual (locale-prefixed) pathname here, not next-intl's
    // usePathname() (which strips the locale) -- pushing a de-prefixed URL makes
    // NavigationLoadingOverlay think a real route change happened and show its
    // full-page splash on every chat switch.
    window.history.pushState(
      window.history.state,
      "",
      `${window.location.pathname}?${params.toString()}`,
    );
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
    if (
      onViewProfile &&
      me?.role === "student" &&
      me.id !== user.id &&
      (user.role === "student" || user.role === "teacher")
    ) {
      onViewProfile(user);
      return;
    }
    router.push(userProfileHref(user, me));
  }

  function openSelectedGroupInfo() {
    if (!selectedChat || selectedChat.type !== "group") return;
    setChatMenuOpen(false);
    setAttachmentsOpen(false);
    setGroupInfoOpen(true);
  }

  function openChatAttachments() {
    if (!selectedChat) return;
    const chatId = selectedChat.id;
    setChatMenuOpen(false);
    setGroupInfoOpen(false);
    setAttachmentsOpen(true);
    setAttachmentsError("");
    setLoadingAttachments(true);
    void getChatAttachments(chatId)
      .then(setChatAttachments)
      .catch((requestError: Partial<ApiError>) => {
        setChatAttachments([]);
        setAttachmentsError(
          requestError.detail || requestError.message || t("couldNotLoadAttachments"),
        );
      })
      .finally(() => setLoadingAttachments(false));
  }

  async function renameGroupChat(chatId: number, title: string) {
    const updated = await updateChat(chatId, { title: title.trim() });
    setChats((current) => upsertChat(current, updated));
  }

  async function updateGroupChatImage(chatId: number, file: File) {
    const updated = await uploadChatImage(chatId, file);
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
      setError(apiError.detail || apiError.message || t("couldNotUpdateUserBlock"));
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
      setError(apiError.detail || apiError.message || t("couldNotClearHistory"));
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
      setError(apiError.detail || apiError.message || t("couldNotDeleteChat"));
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
      setError(apiError.detail || apiError.message || t("couldNotUpdateMessage"));
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
      setError(apiError.detail || apiError.message || t("couldNotDeleteMessage"));
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
    setAttachmentAction(null);
    setMessageAction({ message, ...position });
  }

  function openAttachmentActions(
    attachment: ChatAttachment,
    message: ChatMessage,
    attachmentElement: HTMLElement,
    showGoToMessage = false,
  ) {
    if (message.is_deleted || message.optimistic || message.failed) return;
    const position = attachmentActionMenuPosition(attachmentElement.getBoundingClientRect());
    setChatMenuOpen(false);
    setMessageAction(null);
    setAttachmentAction({ attachment, message, showGoToMessage, ...position });
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
    setAttachmentAction(null);
  }

  function startEdit(message: ChatMessage) {
    setEditingMessage(message);
    setEditText(message.text);
    setMessageAction(null);
  }

  function startForward(message: ChatMessage) {
    setForwardingMessage(message);
    setMessageAction(null);
    setAttachmentAction(null);
  }

  async function downloadAttachment(attachment: ChatAttachment) {
    const url = resolveMediaUrl(attachment.url);
    if (!url) return;
    try {
      await downloadFile(url, attachmentName(attachment, 0, tCommon));
      setAttachmentAction(null);
    } catch {
      setError(t("couldNotDownloadAttachment"));
    }
  }

  async function jumpToMessage(message: ChatMessage) {
    setAttachmentAction(null);
    setAttachmentsOpen(false);
    if (selectedChatIdRef.current !== message.chat) return;

    if (!messages.some((item) => item.id === message.id)) {
      try {
        let page = 1;
        let found = false;
        let hasNext = true;
        while (hasNext && !found) {
          const data = await getMessages(message.chat, page);
          const pageMessages = [...data.results].reverse();
          found = pageMessages.some((item) => item.id === message.id);
          setMessages((current) => {
            const byId = new Map(current.map((item) => [item.id, item]));
            pageMessages.forEach((item) => byId.set(item.id, item));
            return [...byId.values()].sort(
              (first, second) =>
                new Date(first.created_at).getTime() - new Date(second.created_at).getTime() ||
                first.id - second.id,
            );
          });
          hasNext = Boolean(data.next);
          page += 1;
        }
      } catch (requestError) {
        const apiError = requestError as Partial<ApiError>;
        setError(apiError.detail || apiError.message || t("couldNotFindMessage"));
        return;
      }
    }

    requestAnimationFrame(() => {
      document.getElementById(`chat-message-${message.id}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  }

  async function forwardMessageToChat(chat: ChatRoom) {
    if (!forwardingMessage) return;
    setForwardingChatId(chat.id);
    setError("");
    try {
      const forwarded = await sendMessage(
        chat.id,
        forwardedMessageText(forwardingMessage, tCommon),
      );
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
      setError(apiError.detail || apiError.message || t("couldNotForwardMessage"));
    } finally {
      setForwardingChatId(null);
    }
  }

  const typingLabel = Object.values(typingUsers).join(", ");
  const selectedPeerOnline = selectedPeer ? onlineUserIds.has(selectedPeer.id) : false;
  const selectedChatStatus = selectedChat?.is_read_only
    ? t("officialReadOnlyChat")
    : selectedPeerBlocked
      ? t("statusBlocked")
      : socketStatus !== "open"
        ? t("statusReconnecting")
        : typingLabel
          ? t("statusTyping", { names: typingLabel })
          : selectedChat?.type === "direct" && selectedPeerOnline
            ? t("statusOnline")
            : "";
  const selectedPeerName = selectedPeer ? userDisplayName(selectedPeer) : t("thisUser");
  const confirmation =
    confirmationAction === "clear-history"
      ? {
          title: t("clearHistoryTitle"),
          description: t("clearHistoryDescription"),
          confirmLabel: t("clear"),
          danger: true,
        }
      : confirmationAction === "delete-chat"
        ? {
            title: t("deleteChatTitle"),
            description: t("deleteChatDescription"),
            confirmLabel: tShared("delete"),
            danger: true,
          }
        : confirmationAction === "block-user"
          ? {
              title: t("blockUserTitle", { name: selectedPeerName }),
              description: t("blockUserDescription"),
              confirmLabel: t("block"),
              danger: true,
            }
          : confirmationAction === "unblock-user"
            ? {
                title: t("unblockUserTitle", { name: selectedPeerName }),
                description: t("unblockUserDescription"),
                confirmLabel: t("unblock"),
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
    <main className="relative isolate z-0 -mt-16 -mb-[calc(103px+env(safe-area-inset-bottom))] flex h-[100dvh] min-h-0 flex-none flex-col overflow-hidden bg-[#D6E0FF] px-4 pb-[calc(103px+env(safe-area-inset-bottom))] pt-[104px] text-[#111827] lg:m-0 lg:h-[calc(100vh-76px)] lg:min-h-[640px] lg:flex-1 lg:flex-row lg:gap-[clamp(28px,4vw,76px)] lg:overflow-visible lg:px-[clamp(28px,4vw,78px)] lg:py-[clamp(24px,3vw,40px)]">
      <ChatSidebar
        search={chatSearch}
        typeFilter={chatTypeFilter}
        chats={filteredChats}
        loading={loadingChats}
        meId={me?.id ?? null}
        selectedChatId={selectedChatId}
        onSearchChange={setChatSearch}
        onTypeFilterChange={setChatTypeFilter}
        mobileVisible={!mobileChatOpen}
        onSelectChat={selectChat}
        onNewChat={() => setComposeOpen(true)}
        moderationHref={moderationHref}
      />

      <section
        className={`${mobileChatOpen ? "flex" : "hidden lg:flex"} relative min-h-0 min-w-0 flex-1 flex-col`}
      >
        {selectedChat ? (
          <>
            <ChatHeader
              chat={selectedChat}
              peer={selectedPeer}
              avatar={selectedChatAvatar}
              title={selectedChatTitle}
              status={selectedChatStatus}
              menuOpen={chatMenuOpen}
              onViewProfile={() => viewUserProfile(selectedPeer)}
              onOpenMembers={openSelectedGroupInfo}
              onToggleMenu={() => setChatMenuOpen((open) => !open)}
            />

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
              onOpenAttachments={openChatAttachments}
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
                onUpdateImage={updateGroupChatImage}
                onOpenAttachments={openChatAttachments}
                onViewProfile={viewUserProfile}
                canManage={selectedGroupCanManage}
              />
            ) : null}

            {attachmentsOpen ? (
              <ChatAttachmentsModal
                title={selectedChatTitle}
                items={chatAttachments}
                loading={loadingAttachments}
                error={attachmentsError}
                onClose={() => setAttachmentsOpen(false)}
                onOpenImage={(url, alt) => setImagePreview({ url, alt })}
                onOpenActions={(item, element) =>
                  openAttachmentActions(item, item.message, element, true)
                }
              />
            ) : null}

            {error ? (
              <p
                role="alert"
                className="absolute inset-x-0 top-[73px] z-40 rounded-lg border border-[#FAD1D1] bg-[#FFF7F7] px-5 py-2 text-sm text-[#B42318] lg:relative lg:inset-auto lg:top-auto lg:mt-3"
              >
                {error}
              </p>
            ) : null}

            <MessageList
              chat={selectedChat}
              messages={messages}
              meId={me?.id ?? null}
              loading={loadingMessages}
              loadingMore={loadingMore}
              hasMore={hasMoreMessages}
              selectedActionMessageId={messageAction?.message.id ?? null}
              scrollbar={messageScrollbar}
              viewportRef={messagesViewportRef}
              endRef={messagesEndRef}
              onScroll={handleMessagesScroll}
              onLoadOlder={loadOlderMessages}
              onOpenActions={openMessageActions}
              onOpenImage={(url, alt) => setImagePreview({ url, alt })}
              onOpenAttachmentActions={openAttachmentActions}
              onLongPressStart={scheduleMessageLongPress}
              onLongPressEnd={clearLongPressTimer}
              onLongPressClick={suppressLongPressClick}
            />

            <MessageComposer
              chat={selectedChat}
              peerBlocked={selectedPeerBlocked}
              replyingTo={replyingTo}
              meId={me?.id ?? null}
              attachedFiles={attachedFiles}
              draft={draft}
              fileInputRef={fileInputRef}
              onDraftChange={handleDraftChange}
              onSend={handleSend}
              onCancelReply={() => setReplyingTo(null)}
              onRemoveFile={removeAttachedFile}
              onFileSelect={handleFileSelect}
              onPaste={handlePastePhoto}
              compressImages={compressImages}
              onCompressImagesChange={setCompressImages}
            />
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center rounded-[18px] border border-white/70 bg-[#D6E0FF]/45 text-center text-sm text-[#4B5563] shadow-[inset_0_2px_4px_rgba(255,255,255,0.65)]">
            <MessageSquarePlus className="mb-3 h-9 w-9 text-[#A7BAFA]" />
            {t("selectOrCreateChat")}
            <button
              type="button"
              onClick={() => setComposeOpen(true)}
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-black px-4 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" />
              {t("newChat")}
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
            selectChat(chat.id);
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

      {attachmentAction ? (
        <AttachmentActionModal
          state={attachmentAction}
          onClose={() => setAttachmentAction(null)}
          onDownload={downloadAttachment}
          onForward={startForward}
          onReply={startReply}
          onJumpToMessage={(message) => void jumpToMessage(message)}
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
        <EditMessageModal
          value={editText}
          onChange={setEditText}
          onClose={() => setEditingMessage(null)}
          onSave={() => void saveEdit()}
        />
      ) : null}

      {imagePreview ? (
        <ImagePreviewModal
          url={imagePreview.url}
          alt={imagePreview.alt}
          onClose={() => setImagePreview(null)}
        />
      ) : null}
    </main>
  );
}
