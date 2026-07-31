"use client";

import { useLocale, useTranslations } from "next-intl";
import { ExternalLink, FileText, Film, Image as ImageIcon, Link2, Loader2, X } from "lucide-react";
import type { ChatAttachmentItem } from "@/entities/chat";
import { resolveMediaUrl } from "@/shared/api/lib/mediaUrl";
import {
  formatFileSize,
  messageFullDateTime,
  attachmentName,
  messagePreview,
} from "../lib/chatFormatters";
import { userDisplayName } from "../lib/chatSelectors";

type Props = {
  title: string;
  items: ChatAttachmentItem[];
  loading: boolean;
  error: string;
  onClose: () => void;
  onOpenActions: (item: ChatAttachmentItem, element: HTMLElement) => void;
  onOpenImage: (url: string, alt: string) => void;
};

const sectionDefs = [
  { kind: "file", icon: FileText },
  { kind: "video", icon: Film },
  { kind: "link", icon: Link2 },
  { kind: "image", icon: ImageIcon },
] as const;

/** Displays every file and link shared in a direct or group chat. */
export function ChatAttachmentsModal({
  title,
  items,
  loading,
  error,
  onClose,
  onOpenActions,
  onOpenImage,
}: Props) {
  const t = useTranslations("ChatAttachmentsModal");
  const tCommon = useTranslations("ChatCommon");
  const tShared = useTranslations("Common");
  const locale = useLocale();
  const sectionLabels: Record<(typeof sectionDefs)[number]["kind"], string> = {
    file: t("sectionFiles"),
    video: t("sectionVideos"),
    link: t("sectionLinks"),
    image: t("sectionImages"),
  };
  const groupedItems = sectionDefs.map((section) => ({
    ...section,
    label: sectionLabels[section.kind],
    items: items.filter((item) => item.kind === section.kind),
  }));
  const visibleSections = groupedItems.filter((section) => section.items.length > 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("title")}
      className="fixed inset-0 z-[75] flex items-center justify-center bg-black/30 px-6"
      onClick={onClose}
    >
      <section
        className="flex max-h-[calc(100vh-48px)] w-full max-w-[760px] flex-col rounded-[24px] bg-white p-8 shadow-[0_24px_70px_rgba(0,0,0,0.22)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#121212]">{t("title")}</h2>
            <p className="mt-1 truncate text-sm text-[#4B5563]">{title}</p>
          </div>
          <button
            type="button"
            aria-label={tShared("close")}
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#4B5563] transition hover:bg-[#EEF2FF] hover:text-[#003AFF]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error ? (
          <p role="alert" className="mt-5 rounded-lg bg-[#FFF1F1] px-4 py-3 text-sm text-[#B42318]">
            {error}
          </p>
        ) : null}

        <div className="chat-scrollbar-hidden mt-6 min-h-0 overflow-y-auto pr-1">
          {loading ? (
            <div className="flex h-40 items-center justify-center text-sm text-[#4B5563]">
              <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#003AFF]" />
              {t("loadingAttachments")}
            </div>
          ) : visibleSections.length > 0 ? (
            <div className="space-y-6">
              {visibleSections.map((section) => {
                const Icon = section.icon;
                return (
                  <section key={section.kind}>
                    <h3 className="flex items-center gap-2 text-sm font-bold text-[#0B257C]">
                      <Icon className="h-4 w-4" />
                      {section.label}
                      <span className="rounded-full bg-[#EEF2FF] px-2 py-0.5 text-[11px] text-[#003AFF]">
                        {section.items.length}
                      </span>
                    </h3>
                    <div className="mt-3 overflow-hidden rounded-xl border border-[#DDE5FF]">
                      {section.items.map((item) => {
                        const itemUrl = resolveMediaUrl(item.url);
                        const itemName =
                          item.kind === "link"
                            ? itemUrl || t("link")
                            : attachmentName(item, 0, tCommon);
                        const sender = item.message.sender
                          ? userDisplayName(item.message.sender)
                          : tCommon("unknownSender");
                        const isImage = item.kind === "image" && Boolean(itemUrl);
                        return (
                          <div
                            key={item.id}
                            onContextMenu={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              onOpenActions(item, event.currentTarget);
                            }}
                            className="grid min-h-[82px] grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-4 border-b border-[#EEF0F6] px-4 py-3 transition last:border-b-0 hover:bg-[linear-gradient(90deg,rgba(167,186,250,0.32),rgba(252,196,195,0.25),rgba(255,244,218,0.46))]"
                          >
                            {isImage ? (
                              <a
                                href={itemUrl ?? undefined}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(event) => {
                                  if (!itemUrl) return;
                                  event.preventDefault();
                                  onOpenImage(itemUrl, itemName);
                                }}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={itemUrl ?? ""}
                                  alt={itemName}
                                  className="h-14 w-14 rounded-lg object-cover"
                                />
                              </a>
                            ) : (
                              <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#003AFF]">
                                <Icon className="h-6 w-6" />
                              </span>
                            )}
                            <div className="min-w-0">
                              {itemUrl ? (
                                <a
                                  href={itemUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="group inline-flex max-w-full items-center gap-2 text-sm font-semibold text-[#121212] hover:text-[#003AFF]"
                                >
                                  <span className="truncate">{itemName}</span>
                                  <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-60 group-hover:opacity-100" />
                                </a>
                              ) : (
                                <p className="truncate text-sm font-semibold text-[#121212]">
                                  {itemName}
                                </p>
                              )}
                              <p className="mt-1 truncate text-xs text-[#4B5563]">
                                {sender} · {messageFullDateTime(item.message.created_at, locale)}
                              </p>
                              <p className="mt-1 truncate text-xs text-[#6B7280]">
                                {messagePreview(item.message, tCommon)}
                              </p>
                            </div>
                            <span className="shrink-0 text-xs text-[#6B7280]">
                              {item.kind === "link" ? t("link") : formatFileSize(item.size)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-[#C6D2FF] bg-[#F7F9FF] text-sm text-[#6B7280]">
              {t("noAttachmentsYet")}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
