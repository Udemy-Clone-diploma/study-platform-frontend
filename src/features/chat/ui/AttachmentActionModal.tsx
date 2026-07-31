import { useTranslations } from "next-intl";
import { Download, Forward, LocateFixed, Reply } from "lucide-react";
import type { ChatAttachment, ChatMessage } from "@/entities/chat";
import type { AttachmentActionState } from "../model/chatWorkspaceTypes";

type Props = {
  state: AttachmentActionState;
  onClose: () => void;
  onDownload: (attachment: ChatAttachment) => void;
  onForward: (message: ChatMessage) => void;
  onReply: (message: ChatMessage) => void;
  onJumpToMessage: (message: ChatMessage) => void;
};

/** Context actions for an uploaded file or a link. */
export function AttachmentActionModal({
  state,
  onClose,
  onDownload,
  onForward,
  onReply,
  onJumpToMessage,
}: Props) {
  const t = useTranslations("AttachmentActionModal");
  const itemClass =
    "flex h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-medium text-[#121212] transition hover:bg-[#F6F7FB]";

  return (
    <>
      <button
        type="button"
        aria-label={t("closeAriaLabel")}
        className="fixed inset-0 z-[90] bg-black/30"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("ariaLabel")}
        className="fixed z-[95] w-[260px] rounded-lg bg-white p-3 shadow-[0_18px_54px_rgba(17,24,39,0.24)]"
        style={{ left: state.x, top: state.y }}
      >
        <button type="button" className={itemClass} onClick={() => onDownload(state.attachment)}>
          <Download className="h-4 w-4 shrink-0" />
          {t("download")}
        </button>
        <button type="button" className={itemClass} onClick={() => onForward(state.message)}>
          <Forward className="h-4 w-4 shrink-0" />
          {t("forwardTo")}
        </button>
        <button type="button" className={itemClass} onClick={() => onReply(state.message)}>
          <Reply className="h-4 w-4 shrink-0" />
          {t("reply")}
        </button>
        {state.showGoToMessage ? (
          <button
            type="button"
            className={itemClass}
            onClick={() => onJumpToMessage(state.message)}
          >
            <LocateFixed className="h-4 w-4 shrink-0" />
            {t("goToMessage")}
          </button>
        ) : null}
      </div>
    </>
  );
}
