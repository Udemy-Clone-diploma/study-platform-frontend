import Image from "next/image";
import { Loader2, LockKeyhole, MessageSquarePlus, Plus, Users } from "lucide-react";
import type { ChatRoom, ChatType } from "@/entities/chat";
import { compactTime } from "../lib/chatFormatters";
import { chatAvatar, chatTitle, lastMessagePreview } from "../lib/chatSelectors";
import { Avatar } from "./Avatar";

type Props = {
  search: string;
  typeFilter: ChatType;
  chats: ChatRoom[];
  loading: boolean;
  meId: number | null;
  selectedChatId: number | null;
  onSearchChange: (value: string) => void;
  onTypeFilterChange: (filter: ChatType) => void;
  onSelectChat: (chatId: number) => void;
  onNewChat: () => void;
};

/** Displays chat search, type filters, and the selectable chat list. */
export function ChatSidebar({
  search,
  typeFilter,
  chats,
  loading,
  meId,
  selectedChatId,
  onSearchChange,
  onTypeFilterChange,
  onSelectChat,
  onNewChat,
}: Props) {
  const filterButtonClass = (filter: ChatType) =>
    `relative z-10 flex h-full flex-1 items-center justify-center rounded-full text-black transition ${
      typeFilter === filter
        ? "[background-image:var(--gradient-brand)]"
        : "text-black hover:bg-white/45"
    }`;

  return (
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
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search"
          className="h-12 w-full rounded-[18px] border border-[#A7BAFA] bg-white pl-12 pr-4 text-base outline-none placeholder:text-[#C6C6CF] focus:border-[#003AFF] focus:ring-2 focus:ring-white/70"
        />
      </label>

      <div className="mt-7 flex items-center justify-between px-[clamp(26px,3vw,64px)]">
        <div className="relative inline-flex h-16 w-[212px] gap-2.5 rounded-[40px] bg-[#D9D9D9]/20 px-2 py-1 shadow-[0_2px_4px_0_rgba(255,255,255,1)]">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-5 top-1/2 z-0 h-8 w-16 rounded-full [background-image:var(--gradient-brand)] opacity-70 blur-md transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              transform:
                typeFilter === "group"
                  ? "translate(103px, -50%) scaleX(0.55)"
                  : "translate(0, -50%) scaleX(1)",
            }}
          />
          <button
            type="button"
            aria-label="Direct chats"
            aria-pressed={typeFilter === "direct"}
            onClick={() => onTypeFilterChange("direct")}
            className={filterButtonClass("direct")}
          >
            <Image src="/icons/person.svg" alt="" width={24} height={24} />
          </button>
          <button
            type="button"
            aria-label="Group chats"
            aria-pressed={typeFilter === "group"}
            onClick={() => onTypeFilterChange("group")}
            className={filterButtonClass("group")}
          >
            <Image src="/icons/people_black.svg" alt="" width={24} height={24} />
          </button>
        </div>
        <button
          type="button"
          aria-label="New chat"
          onClick={onNewChat}
          className="flex h-9 w-9 items-center justify-center rounded-[4px] bg-black text-white transition hover:bg-[#252525]"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      <div className="mt-7 min-h-0 flex-1 rounded-[20px] bg-white/20 p-6 shadow-[0_2px_4px_0_rgba(255,255,255,1)]">
        <div className="h-full overflow-y-auto pr-1">
          {loading ? (
            <div className="flex h-32 items-center justify-center text-sm text-[#4B5563]">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading chats
            </div>
          ) : chats.length > 0 ? (
            <div className="space-y-3">
              {chats.map((chat) => {
                const title = chatTitle(chat, meId);
                const active = chat.id === selectedChatId;
                return (
                  <button
                    key={chat.id}
                    type="button"
                    onClick={() => onSelectChat(chat.id)}
                    className={`grid h-[79px] w-full grid-cols-[55px_minmax(0,1fr)_auto] items-center gap-2 rounded-[20px] px-6 py-3 text-left transition ${
                      active ? "bg-[#FFF4DA]" : "bg-white hover:bg-[#F8FAFF]"
                    }`}
                  >
                    <Avatar src={chatAvatar(chat, meId)} label={title} size="card" />
                    <span className="min-w-0">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-base font-bold text-[#121212]">{title}</span>
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
  );
}
