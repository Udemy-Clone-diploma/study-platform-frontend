import { MoreVertical } from "lucide-react";
import type { ChatRoom, ChatUser } from "@/entities/chat";
import { Avatar } from "./Avatar";

type Props = {
  chat: ChatRoom;
  peer: ChatUser | null;
  avatar: string | null;
  title: string;
  status: string;
  menuOpen: boolean;
  onViewProfile: () => void;
  onOpenMembers: () => void;
  onToggleMenu: () => void;
};

/** Displays identity, presence, and the menu trigger for the current chat. */
export function ChatHeader({
  chat,
  peer,
  avatar,
  title,
  status,
  menuOpen,
  onViewProfile,
  onOpenMembers,
  onToggleMenu,
}: Props) {
  const canOpenAvatar = chat.type === "group" || Boolean(peer);

  return (
    <header className="relative z-0 flex h-[60px] min-h-[60px] shrink-0 items-center justify-between rounded-[18px] border border-white/70 bg-[#D6E0FF]/60 px-3 py-2 shadow-[inset_0_2px_4px_rgba(255,255,255,0.65)] lg:h-auto lg:min-h-[90px] lg:px-10 lg:py-4">
      <div className="flex min-w-0 items-center gap-4">
        {canOpenAvatar ? (
          <button
            type="button"
            aria-label={chat.type === "group" ? "View members" : "View profile"}
            onClick={chat.type === "group" ? onOpenMembers : onViewProfile}
            className="shrink-0 rounded-full outline-none ring-offset-2 transition hover:brightness-95 focus-visible:ring-2 focus-visible:ring-[#003AFF]"
          >
            <Avatar src={avatar} label={title} size="lg" />
          </button>
        ) : (
          <Avatar src={avatar} label={title} size="lg" />
        )}
        <div className="min-w-0">
          <h2 className="truncate text-base font-bold leading-5 text-[#121212] lg:text-xl">
            {title}
          </h2>
          {status ? <p className="mt-1 text-xs font-medium text-[#003AFF]">{status}</p> : null}
        </div>
      </div>
      <button
        type="button"
        aria-label="Chat menu"
        aria-expanded={menuOpen}
        onClick={onToggleMenu}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-black transition hover:bg-white/55"
      >
        <MoreVertical className="h-6 w-6" />
      </button>
    </header>
  );
}
