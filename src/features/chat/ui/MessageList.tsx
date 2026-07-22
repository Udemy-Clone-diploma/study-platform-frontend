import type { MouseEvent, PointerEvent, RefObject } from "react";
import { Check, FileText, Loader2, Send } from "lucide-react";
import type { ChatAttachment, ChatMessage, ChatRoom } from "@/entities/chat";
import { resolveMediaUrl } from "@/shared/api/lib/mediaUrl";
import {
  attachmentName,
  formatFileSize,
  messageAuthorLabel,
  messageFullDateTime,
  messagePreview,
  messageTime,
} from "../lib/chatFormatters";
import { userDisplayName } from "../lib/chatSelectors";
import type { MessageScrollbarState } from "../model/chatWorkspaceTypes";

const urlPattern = /(https?:\/\/[^\s<>()]+)/gi;

function linkedMessageText(text: string) {
  return text.split(urlPattern).map((part, index) => {
    if (!/^https?:\/\//i.test(part)) {
      return <span key={`${part}-${index}`}>{part}</span>;
    }

    const trailing = part.match(/[.,!?;:]+$/)?.[0] ?? "";
    const url = trailing ? part.slice(0, -trailing.length) : part;
    return (
      <span key={`${part}-${index}`}>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="font-medium underline decoration-[#003AFF]/45 underline-offset-2 hover:text-[#003AFF]"
        >
          {url}
        </a>
        {trailing}
      </span>
    );
  });
}

type Props = {
  chat: ChatRoom;
  messages: ChatMessage[];
  meId: number | null;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  selectedActionMessageId: number | null;
  scrollbar: MessageScrollbarState;
  viewportRef: RefObject<HTMLDivElement | null>;
  endRef: RefObject<HTMLDivElement | null>;
  onScroll: () => void;
  onLoadOlder: () => void | Promise<void>;
  onOpenActions: (message: ChatMessage, messageElement: HTMLElement) => void;
  onOpenImage: (url: string, alt: string) => void;
  onOpenAttachmentActions: (
    attachment: ChatAttachment,
    message: ChatMessage,
    attachmentElement: HTMLElement,
  ) => void;
  onLongPressStart: (message: ChatMessage, event: PointerEvent<HTMLDivElement>) => void;
  onLongPressEnd: () => void;
  onLongPressClick: (event: MouseEvent<HTMLDivElement>) => void;
};

/** Renders the scrollable message history and custom scrollbar. */
export function MessageList({
  chat,
  messages,
  meId,
  loading,
  loadingMore,
  hasMore,
  selectedActionMessageId,
  scrollbar,
  viewportRef,
  endRef,
  onScroll,
  onLoadOlder,
  onOpenActions,
  onOpenImage,
  onOpenAttachmentActions,
  onLongPressStart,
  onLongPressEnd,
  onLongPressClick,
}: Props) {
  return (
    <div className="relative mt-4 min-h-0 flex-1">
      <div
        ref={viewportRef}
        onScroll={onScroll}
        className="chat-scrollbar-hidden h-full overflow-y-auto rounded-[18px] border border-white/70 bg-[#D6E0FF]/45 px-5 py-6 shadow-[inset_0_2px_4px_rgba(255,255,255,0.65)]"
      >
        {hasMore ? (
          <div className="mb-5 flex justify-center">
            <button
              type="button"
              disabled={loadingMore}
              onClick={() => void onLoadOlder()}
              className="inline-flex h-9 items-center rounded-lg border border-[#A7BAFA] bg-white px-4 text-sm text-[#374151] disabled:opacity-60"
            >
              {loadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Load older
            </button>
          </div>
        ) : null}

        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-[#4B5563]">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading messages
          </div>
        ) : messages.length > 0 ? (
          <div className="space-y-4">
            {messages.map((message) => {
              const mine = message.sender?.id === meId;
              const actionSelected = selectedActionMessageId === message.id;
              const hasImageAttachments = message.attachments.some((attachment) =>
                attachment.file_type.startsWith("image/"),
              );
              const showMessageText =
                Boolean(message.text.trim()) &&
                !(message.message_type === "image" && hasImageAttachments);
              const standaloneImageMessage =
                message.message_type === "image" && hasImageAttachments && !showMessageText;
              const replyTarget = message.reply_to
                ? (messages.find((item) => item.id === message.reply_to) ?? null)
                : null;
              return (
                <div
                  key={message.id}
                  id={`chat-message-${message.id}`}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    onContextMenu={(event) => {
                      if (message.is_deleted || message.optimistic || message.failed) return;
                      event.preventDefault();
                      onOpenActions(message, event.currentTarget);
                    }}
                    onPointerDown={(event) => onLongPressStart(message, event)}
                    onPointerUp={onLongPressEnd}
                    onPointerCancel={onLongPressEnd}
                    onPointerLeave={onLongPressEnd}
                    onClickCapture={onLongPressClick}
                    className={`flex max-w-[52%] flex-col ${
                      mine ? "items-end" : "items-start"
                    } ${actionSelected ? "relative z-[90]" : ""} ${
                      message.is_deleted || message.optimistic ? "" : "cursor-default"
                    }`}
                  >
                    {!mine && chat.type === "group" && message.sender ? (
                      <span className="mb-1 text-xs font-semibold text-[#4B5563]">
                        {userDisplayName(message.sender)}
                      </span>
                    ) : null}
                    <div
                      className={
                        standaloneImageMessage
                          ? "text-sm leading-5 text-[#121212]"
                          : `rounded-[12px] px-4 py-2 text-sm leading-5 text-[#121212] shadow-sm ${
                              chat.is_read_only
                                ? "bg-[#FFF4DA]"
                                : mine
                                  ? "bg-[#FCC4C3]"
                                  : "bg-[#A7BAFA]"
                            } ${message.failed ? "ring-2 ring-[#B42318]" : ""} ${
                              actionSelected
                                ? "ring-2 ring-white shadow-[0_0_0_4px_rgba(255,255,255,0.32),0_18px_44px_rgba(17,24,39,0.28)]"
                                : ""
                            }`
                      }
                    >
                      {message.is_deleted ? (
                        <span className="text-[#4B5563]">Deleted message</span>
                      ) : (
                        <>
                          {message.reply_to ? (
                            <div className="mb-2 rounded-md border-l-2 border-[#121212]/35 bg-white/35 px-2 py-1">
                              <p className="truncate text-[11px] font-semibold text-[#121212]/70">
                                {replyTarget
                                  ? messageAuthorLabel(replyTarget, meId)
                                  : "Original message"}
                              </p>
                              <p className="truncate text-xs text-[#121212]">
                                {replyTarget
                                  ? messagePreview(replyTarget)
                                  : "Message is not loaded"}
                              </p>
                            </div>
                          ) : null}
                          {showMessageText ? (
                            <p className="whitespace-pre-wrap break-words">
                              {linkedMessageText(message.text)}
                            </p>
                          ) : null}
                          {message.attachments.length > 0 ? (
                            <div
                              className={standaloneImageMessage ? "space-y-2" : "mt-2 space-y-2"}
                            >
                              {message.attachments.map((attachment, index) => {
                                const attachmentUrl = resolveMediaUrl(attachment.url);
                                const isImage =
                                  attachment.file_type.startsWith("image/") &&
                                  Boolean(attachmentUrl);
                                const name = attachmentName(attachment, index);
                                return attachmentUrl ? (
                                  <a
                                    key={attachment.id}
                                    href={attachmentUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    onContextMenu={(event) => {
                                      event.preventDefault();
                                      event.stopPropagation();
                                      onOpenAttachmentActions(
                                        attachment,
                                        message,
                                        event.currentTarget,
                                      );
                                    }}
                                    onClick={(event) => {
                                      if (!isImage) return;
                                      event.preventDefault();
                                      onOpenImage(attachmentUrl, name);
                                    }}
                                    className={
                                      standaloneImageMessage && isImage
                                        ? "block text-xs"
                                        : "block rounded-lg bg-white/45 p-2 text-xs hover:bg-white/65"
                                    }
                                  >
                                    {isImage ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={attachmentUrl}
                                        alt={name}
                                        className={`max-h-44 max-w-full cursor-pointer object-cover ${
                                          standaloneImageMessage ? "" : "rounded-md"
                                        }`}
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
                                    onContextMenu={(event) => {
                                      event.preventDefault();
                                      event.stopPropagation();
                                      onOpenAttachmentActions(
                                        attachment,
                                        message,
                                        event.currentTarget,
                                      );
                                    }}
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
            <div ref={endRef} />
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center text-sm text-[#4B5563]">
            <Send className="mb-3 h-8 w-8 text-[#A7BAFA]" />
            No messages
          </div>
        )}
      </div>
      {scrollbar.height > 0 ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-3 right-2 top-3 w-1.5"
        >
          <span
            className={`absolute right-0 block w-full rounded-full bg-[#121212]/45 shadow-[0_0_0_1px_rgba(255,255,255,0.28)] transition-opacity duration-200 ${
              scrollbar.visible ? "opacity-70" : "opacity-0"
            }`}
            style={{
              height: `${scrollbar.height}px`,
              transform: `translateY(${scrollbar.top}px)`,
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
