import { useTranslations } from "next-intl";
import {
  Ban,
  Bell,
  BellOff,
  CircleUserRound,
  Eraser,
  Loader2,
  LockKeyhole,
  Paperclip,
  Trash2,
  Users,
} from "lucide-react";

type Props = {
  open: boolean;
  muted: boolean;
  blocked: boolean;
  canBlock: boolean;
  canViewProfile: boolean;
  deleting: boolean;
  isGroup: boolean;
  readOnly: boolean;
  onToggleMute: () => void;
  onOpenAttachments: () => void;
  onViewProfile: () => void;
  onOpenMembers: () => void;
  onClearHistory: () => void;
  onDeleteChat: () => void;
  onToggleBlock: () => void;
};

/** Displays actions for the currently selected chat. */
export function ChatMenuPanel({
  open,
  muted,
  blocked,
  canBlock,
  canViewProfile,
  deleting,
  isGroup,
  readOnly,
  onToggleMute,
  onOpenAttachments,
  onViewProfile,
  onOpenMembers,
  onClearHistory,
  onDeleteChat,
  onToggleBlock,
}: Props) {
  const t = useTranslations("ChatMenuPanel");
  const itemClass =
    "flex h-11 w-full items-center gap-3 rounded-md px-2 text-left text-[15px] font-medium text-[#121212] transition hover:bg-[#F6F7FB] disabled:cursor-not-allowed disabled:opacity-45";
  const NotificationIcon = muted ? BellOff : Bell;

  return (
    <aside
      aria-hidden={!open}
      className={`absolute right-0 top-[73px] z-40 w-[292px] transition duration-200 lg:top-[104px] ${
        open
          ? "pointer-events-auto translate-x-0 opacity-100"
          : "pointer-events-none translate-x-8 opacity-0"
      }`}
    >
      <div className="mb-2 pl-2 text-xs text-[#4B5563]">{t("menuLabel")}</div>
      <div className="rounded-lg bg-white p-4 shadow-[0_16px_36px_rgba(17,24,39,0.18)]">
        <button type="button" onClick={onToggleMute} className={itemClass}>
          <NotificationIcon className="h-5 w-5 shrink-0 text-[#003AFF]" />
          {muted ? t("turnOnNotifications") : t("turnOffNotifications")}
        </button>
        {readOnly ? (
          <div className="flex min-h-11 items-center gap-3 rounded-md px-2 text-sm font-medium text-[#4B5563]">
            <LockKeyhole className="h-5 w-5 shrink-0" />
            {t("officialReadOnlyChat")}
          </div>
        ) : isGroup ? (
          <button type="button" onClick={onOpenMembers} className={itemClass}>
            <Users className="h-5 w-5 shrink-0" />
            {t("members")}
          </button>
        ) : (
          <button
            type="button"
            disabled={!canViewProfile}
            onClick={onViewProfile}
            className={itemClass}
          >
            <CircleUserRound className="h-5 w-5 shrink-0" />
            {t("viewProfile")}
          </button>
        )}
        <button type="button" onClick={onOpenAttachments} className={itemClass}>
          <Paperclip className="h-5 w-5 shrink-0 text-[#121212]" />
          {t("attachments")}
        </button>
        {!readOnly ? (
          <button type="button" onClick={onClearHistory} className={itemClass}>
            <Eraser className="h-5 w-5 shrink-0" />
            {t("clearHistory")}
          </button>
        ) : null}
        {!isGroup && !readOnly ? (
          <button type="button" disabled={!canBlock} onClick={onToggleBlock} className={itemClass}>
            <Ban className="h-5 w-5 shrink-0" />
            {blocked ? t("unblockUser") : t("blockUser")}
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
            {t("deleteChat")}
          </button>
        ) : null}
      </div>
    </aside>
  );
}
