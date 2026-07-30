import Image from "next/image";
import { useEffect, useMemo, type ClipboardEvent, type KeyboardEvent, type RefObject } from "react";
import { useTranslations } from "next-intl";
import { LockKeyhole, Paperclip, Send, X } from "lucide-react";
import type { ChatMessage, ChatRoom } from "@/entities/chat";
import { formatFileSize, messageAuthorLabel, messagePreview } from "../lib/chatFormatters";

type Props = {
  chat: ChatRoom;
  typingLabel: string;
  peerBlocked: boolean;
  replyingTo: ChatMessage | null;
  meId: number | null;
  attachedFiles: File[];
  draft: string;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onDraftChange: (value: string) => void;
  onSend: () => void | Promise<void>;
  onCancelReply: () => void;
  onRemoveFile: (index: number) => void;
  onFileSelect: (files: FileList | null) => void;
  onPaste: (event: ClipboardEvent<HTMLTextAreaElement>) => void;
  compressImages: boolean;
  onCompressImagesChange: (value: boolean) => void;
};

function AttachedFileChip({
  file,
  index,
  onRemove,
}: {
  file: File;
  index: number;
  onRemove: (index: number) => void;
}) {
  const isImage = file.type.startsWith("image/");
  const previewUrl = useMemo(() => (isImage ? URL.createObjectURL(file) : null), [file, isImage]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <button
      type="button"
      onClick={() => onRemove(index)}
      className="flex max-w-[240px] items-center gap-2 rounded-xl bg-white/70 px-2 py-1 text-xs text-[#121212] transition hover:bg-white"
    >
      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt="" className="h-9 w-9 rounded-lg object-cover" />
      ) : (
        <Paperclip className="h-3.5 w-3.5 shrink-0" />
      )}
      <span className="truncate">{file.name}</span>
      <span className="shrink-0 text-[#4B5563]">{formatFileSize(file.size)}</span>
      <X className="h-3.5 w-3.5 shrink-0" />
    </button>
  );
}

/** Displays read-only status or the reply, attachment, and message composing controls. */
export function MessageComposer({
  chat,
  typingLabel,
  peerBlocked,
  replyingTo,
  meId,
  attachedFiles,
  draft,
  fileInputRef,
  onDraftChange,
  onSend,
  onCancelReply,
  onRemoveFile,
  onFileSelect,
  onPaste,
  compressImages,
  onCompressImagesChange,
}: Props) {
  const t = useTranslations("MessageComposer");
  const tCommon = useTranslations("ChatCommon");

  if (chat.is_read_only) {
    return (
      <div className="mt-4 flex min-h-14 shrink-0 items-center justify-center gap-3 rounded-[18px] border border-white/70 bg-white/45 px-5 text-center text-sm font-medium text-[#4B5563]">
        <LockKeyhole className="h-5 w-5 shrink-0 text-[#0B257C]" />
        {t("readOnlyNotice")}
      </div>
    );
  }

  return (
    <div className="mt-2 shrink-0 lg:mt-4">
      <div className="mb-2 hidden min-h-5 text-xs text-[#4B5563] lg:block">
        {typingLabel ? t("typingIndicator", { names: typingLabel }) : ""}
        {peerBlocked ? t("peerBlockedNotice") : ""}
      </div>

      {replyingTo ? (
        <div className="mb-3 flex items-start justify-between gap-3 rounded-lg border border-[#A7BAFA] bg-white/70 px-4 py-2">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-[#003AFF]">
              {t("replyTo", { name: messageAuthorLabel(replyingTo, meId, tCommon) })}
            </p>
            <p className="mt-1 truncate text-sm text-[#121212]">
              {messagePreview(replyingTo, tCommon)}
            </p>
          </div>
          <button
            type="button"
            aria-label={t("cancelReplyAriaLabel")}
            onClick={onCancelReply}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full hover:bg-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {attachedFiles.length > 0 ? (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {attachedFiles.map((file, index) => (
            <AttachedFileChip
              key={`${file.name}-${file.lastModified}-${index}`}
              file={file}
              index={index}
              onRemove={onRemoveFile}
            />
          ))}
          {attachedFiles.some((file) => file.type.startsWith("image/")) ? (
            <label className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-lg px-2 text-xs text-[#121212] transition hover:bg-white/70">
              <input
                type="checkbox"
                checked={!compressImages}
                onChange={(event) => onCompressImagesChange(!event.target.checked)}
                className="h-4 w-4 accent-[#003AFF]"
              />
              {t("dontCompressPhotos")}
            </label>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-end gap-2 lg:gap-3">
        <div className="flex min-h-10 flex-1 rounded-[18px] bg-[linear-gradient(90deg,#A7BAFA_0%,#FCC4C3_52%,#FFF4DA_100%)] p-[2px] lg:min-h-14">
          <div className="flex min-h-9 flex-1 items-end rounded-[16px] bg-[#D6E0FF] lg:min-h-[52px]">
            <textarea
              value={draft}
              rows={1}
              disabled={peerBlocked}
              onChange={(event) => onDraftChange(event.target.value)}
              onPaste={onPaste}
              onKeyDown={(event: KeyboardEvent<HTMLTextAreaElement>) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void onSend();
                }
              }}
              placeholder={t("messagePlaceholder")}
              className="max-h-32 min-h-9 flex-1 resize-none bg-transparent px-3 py-2 text-xs leading-4 outline-none placeholder:text-[#121212] disabled:cursor-not-allowed disabled:opacity-60 lg:min-h-[52px] lg:px-6 lg:py-4 lg:text-sm lg:leading-normal"
            />
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(event) => {
                onFileSelect(event.currentTarget.files);
                event.currentTarget.value = "";
              }}
            />
            <button
              type="button"
              aria-label={t("attachFilesAriaLabel")}
              disabled={peerBlocked}
              onClick={() => fileInputRef.current?.click()}
              className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-black transition hover:bg-white/35 disabled:cursor-not-allowed disabled:opacity-45 lg:mr-3 lg:h-12 lg:w-12"
            >
              <Image src="/icons/paperclip.svg" alt="" width={24} height={24} />
            </button>
          </div>
        </div>
        <button
          type="button"
          aria-label={t("sendMessageAriaLabel")}
          disabled={peerBlocked || (!draft.trim() && attachedFiles.length === 0)}
          onClick={() => void onSend()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] [background-image:var(--gradient-brand)] text-black transition hover:brightness-105 disabled:cursor-not-allowed disabled:grayscale lg:h-14 lg:w-14"
        >
          <Send className="h-7 w-7 fill-black" />
        </button>
      </div>
    </div>
  );
}
