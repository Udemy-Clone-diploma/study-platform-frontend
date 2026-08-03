import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, LockKeyhole, MessageSquarePlus, Plus, ShieldAlert, Users } from "lucide-react";
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
  mobileVisible: boolean;
  onSearchChange: (value: string) => void;
  onTypeFilterChange: (filter: ChatType) => void;
  onSelectChat: (chatId: number) => void;
  onNewChat: () => void;
  moderationHref?: string;
};

/** Displays chat search, type filters, and the selectable chat list. */
export function ChatSidebar({
  search,
  typeFilter,
  chats,
  loading,
  meId,
  selectedChatId,
  mobileVisible,
  onSearchChange,
  onTypeFilterChange,
  onSelectChat,
  onNewChat,
  moderationHref,
}: Props) {
  const t = useTranslations("ChatSidebar");
  const tCommon = useTranslations("ChatCommon");
  const locale = useLocale();
  const filterButtonClass = (filter: ChatType) =>
    `relative z-10 flex h-full flex-1 items-center justify-center rounded-full text-black transition ${
      typeFilter === filter
        ? "[background-image:var(--gradient-brand)]"
        : "text-black hover:bg-white/45"
    }`;

  return (
    <section
      className={`${mobileVisible ? "flex" : "hidden lg:flex"} relative min-h-0 w-full flex-1 shrink-0 flex-col lg:w-[470px] lg:flex-none`}
    >
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
          className="h-10 w-full rounded-[20px] border border-[#A7BAFA] bg-white pl-11 pr-4 text-xs outline-none placeholder:text-[#121212] focus:border-[#003AFF] focus:ring-2 focus:ring-white/70 lg:h-12 lg:rounded-[18px] lg:pl-12 lg:text-base lg:placeholder:text-[#C6C6CF]"
          placeholder={t("searchPlaceholder")}
        />
      </label>

      {moderationHref ? (
        <div className="mt-2 flex justify-end">
          <Link
            href={moderationHref}
            className="inline-flex min-h-9 items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs font-semibold text-[#0B257C] shadow-sm transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#003AFF]"
          >
            <ShieldAlert className="h-4 w-4" aria-hidden="true" />
            {t("messageReports")}
          </Link>
        </div>
      ) : null}

      <div
        className={`${moderationHref ? "mt-2" : "mt-[18px]"} flex items-center justify-center lg:mt-7 lg:justify-between lg:px-[clamp(26px,3vw,64px)]`}
      >
        <div className="relative inline-flex h-[46px] w-[150px] gap-1.5 rounded-[40px] bg-[#D9D9D9]/20 px-1.5 py-1 shadow-[0_2px_4px_0_rgba(255,255,255,1)] lg:h-16 lg:w-[212px] lg:gap-2.5 lg:px-2">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 z-0 h-8 w-16 rounded-full [background-image:var(--gradient-brand)] opacity-70 blur-md transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:left-5"
            style={{
              transform:
                typeFilter === "group"
                  ? "translate(103px, -50%) scaleX(0.55)"
                  : "translate(0, -50%) scaleX(1)",
            }}
          />
          <button
            type="button"
            aria-label={t("directChatsAriaLabel")}
            aria-pressed={typeFilter === "direct"}
            onClick={() => onTypeFilterChange("direct")}
            className={filterButtonClass("direct")}
          >
            <Image src="/icons/person.svg" alt="" width={24} height={24} className="h-6 w-6" />
          </button>
          <button
            type="button"
            aria-label={t("groupChatsAriaLabel")}
            aria-pressed={typeFilter === "group"}
            onClick={() => onTypeFilterChange("group")}
            className={filterButtonClass("group")}
          >
            <Image
              src="/icons/people_black.svg"
              alt=""
              width={24}
              height={24}
              className="h-6 w-6"
            />
          </button>
        </div>
        <button
          type="button"
          aria-label={t("newChatAriaLabel")}
          onClick={onNewChat}
          className="absolute bottom-[14px] right-0 flex h-[50px] w-[50px] items-center justify-center rounded-full bg-[#819CF0] text-black shadow-[0_4px_10px_rgba(0,0,0,0.18)] transition hover:brightness-105 lg:static lg:h-9 lg:w-9 lg:rounded-[4px] lg:bg-black lg:text-white lg:shadow-none lg:hover:bg-[#252525]"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      <div className="mt-[19px] min-h-0 flex-1 rounded-[20px] bg-transparent p-0 shadow-none lg:mt-7 lg:bg-white/20 lg:p-6 lg:shadow-[0_2px_4px_0_rgba(255,255,255,1)]">
        <div className="chat-scrollbar-hidden h-full overflow-y-auto pr-0 lg:pr-1">
          {loading ? (
            <div className="flex h-32 items-center justify-center text-sm text-[#4B5563]">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("loadingChats")}
            </div>
          ) : chats.length > 0 ? (
            <div className="space-y-3">
              {chats.map((chat) => {
                const title = chatTitle(chat, meId, tCommon);
                const active = chat.id === selectedChatId;
                return (
                  <button
                    key={chat.id}
                    type="button"
                    onClick={() => onSelectChat(chat.id)}
                    className={`grid h-[68px] w-full grid-cols-[40px_minmax(0,1fr)] items-center gap-2 rounded-[20px] px-4 py-2 text-left transition lg:h-[79px] lg:grid-cols-[55px_minmax(0,1fr)_auto] lg:px-6 lg:py-3 ${
                      active ? "bg-white lg:bg-[#FFF4DA]" : "bg-white hover:bg-[#F8FAFF]"
                    }`}
                  >
                    <Avatar src={chatAvatar(chat, meId)} label={title} size="card" />
                    <span className="min-w-0">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-[16px] font-bold leading-5 text-[#121212] lg:text-base">
                          {title}
                        </span>
                        {chat.type === "group" ? (
                          <Users className="hidden h-4 w-4 shrink-0 text-[#4B5563] lg:block" />
                        ) : chat.is_read_only ? (
                          <LockKeyhole className="hidden h-4 w-4 shrink-0 text-[#0B257C] lg:block" />
                        ) : null}
                      </span>
                      <span className="mt-1 block truncate text-[12px] leading-4 text-[#121212] lg:text-sm">
                        {lastMessagePreview(chat, tCommon)}
                      </span>
                    </span>
                    <span className="hidden min-w-8 flex-col items-end gap-2 lg:flex">
                      <span className="text-[11px] text-[#4B5563]">
                        {compactTime(chat.updated_at, locale)}
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
              {t("noChats")}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
