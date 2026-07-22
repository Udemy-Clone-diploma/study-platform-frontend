"use client";

import { useMemo, useState } from "react";
import { Loader2, Search, Users, X } from "lucide-react";
import type { ChatMessage, ChatRoom } from "@/entities/chat";
import { messageAuthorLabel, messagePreview } from "../lib/chatFormatters";
import { chatAvatar, chatTitle, lastMessagePreview } from "../lib/chatSelectors";
import { Avatar } from "./Avatar";

type Props = {
  message: ChatMessage;
  chats: ChatRoom[];
  meId: number | null;
  forwardingChatId: number | null;
  onClose: () => void;
  onForward: (chat: ChatRoom) => void;
};

/** Selects a destination chat for forwarding a message. */
export function ForwardMessageModal({
  message,
  chats,
  meId,
  forwardingChatId,
  onClose,
  onForward,
}: Props) {
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
