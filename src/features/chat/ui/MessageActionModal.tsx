import { useTranslations } from "next-intl";
import { Flag, Forward, Pencil, Reply, Trash2 } from "lucide-react";
import type { ChatMessage } from "@/entities/chat";
import { canModifyMessage } from "../lib/messageActions";
import type { MessageActionState } from "../model/chatWorkspaceTypes";

type Props = {
  state: MessageActionState;
  meId: number | null;
  onClose: () => void;
  onReply: (message: ChatMessage) => void;
  onForward: (message: ChatMessage) => void;
  onEdit: (message: ChatMessage) => void;
  onDelete: (message: ChatMessage) => void;
  onReport: (message: ChatMessage) => void;
};

/** Shows context actions for a selected chat message. */
export function MessageActionModal({
  state,
  meId,
  onClose,
  onReply,
  onForward,
  onEdit,
  onDelete,
  onReport,
}: Props) {
  const t = useTranslations("MessageActionModal");
  const tShared = useTranslations("Common");
  const message = state.message;
  const canModify = canModifyMessage(message, meId);
  const canReport = Boolean(message.sender) && message.message_type !== "system";
  const itemClass =
    "flex h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-medium text-[#121212] transition hover:bg-[#F6F7FB]";

  return (
    <>
      <button
        type="button"
        aria-label={t("closeAriaLabel")}
        className="fixed inset-0 z-[80] bg-black/30"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("ariaLabel")}
        className="fixed z-[95] w-[240px] rounded-lg bg-white p-3 shadow-[0_18px_54px_rgba(17,24,39,0.24)]"
        style={{ left: state.x, top: state.y }}
      >
        <button type="button" className={itemClass} onClick={() => onReply(message)}>
          <Reply className="h-4 w-4 shrink-0" />
          {t("reply")}
        </button>
        <button type="button" className={itemClass} onClick={() => onForward(message)}>
          <Forward className="h-4 w-4 shrink-0" />
          {t("forwardTo")}
        </button>
        {canModify ? (
          <>
            <button type="button" className={itemClass} onClick={() => onEdit(message)}>
              <Pencil className="h-4 w-4 shrink-0" />
              {t("edit")}
            </button>
            <button
              type="button"
              className={`${itemClass} text-[#B42318] hover:bg-[#FFF1F1]`}
              onClick={() => onDelete(message)}
            >
              <Trash2 className="h-4 w-4 shrink-0" />
              {tShared("delete")}
            </button>
          </>
        ) : canReport ? (
          <button
            type="button"
            className={`${itemClass} text-[#B42318] hover:bg-[#FFF1F1]`}
            onClick={() => onReport(message)}
          >
            <Flag className="h-4 w-4 shrink-0" />
            {t("report")}
          </button>
        ) : null}
      </div>
    </>
  );
}
