"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Bell, BellOff, Camera, ChevronRight, Loader2, Paperclip, X } from "lucide-react";
import type { ChatRoom, ChatUser } from "@/entities/chat";
import type { ApiError } from "@/shared/api/base";
import { userDisplayName } from "../lib/chatSelectors";
import { Avatar } from "./Avatar";

type Props = {
  chat: ChatRoom;
  muted: boolean;
  onClose: () => void;
  onToggleMute: () => void;
  onRename: (chatId: number, title: string) => Promise<void>;
  onUpdateImage: (chatId: number, file: File) => Promise<void>;
  onOpenAttachments: () => void;
  onViewProfile: (user: ChatUser) => void;
  canManage: boolean;
};

/** Shows group details, notification state, title editing, and members. */
export function GroupInfoModal({
  chat,
  muted,
  onClose,
  onToggleMute,
  onRename,
  onUpdateImage,
  onOpenAttachments,
  onViewProfile,
  canManage,
}: Props) {
  const t = useTranslations("GroupInfoModal");
  const tCommon = useTranslations("ChatCommon");
  const tShared = useTranslations("Common");
  const currentTitle = chat.title || tCommon("untitledGroup");
  const [draftTitle, setDraftTitle] = useState(currentTitle);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);
  const participants = useMemo(() => {
    const roleRank = { owner: 0, admin: 1, member: 2 };
    return chat.participants
      .filter((participant) => !participant.left_at)
      .sort(
        (first, second) =>
          roleRank[first.role] - roleRank[second.role] ||
          userDisplayName(first.user).localeCompare(userDisplayName(second.user)),
      );
  }, [chat.participants]);
  const titleChanged = draftTitle.trim() !== currentTitle;
  const NotificationIcon = muted ? BellOff : Bell;

  useEffect(() => {
    setDraftTitle(currentTitle);
    setError("");
  }, [chat.id, currentTitle]);

  async function saveTitle() {
    const nextTitle = draftTitle.trim();
    if (!nextTitle) {
      setError(t("groupTitleEmptyError"));
      return;
    }
    if (!titleChanged) return;

    setSaving(true);
    setError("");
    try {
      await onRename(chat.id, nextTitle);
      setDraftTitle(nextTitle);
    } catch (requestError) {
      const apiError = requestError as Partial<ApiError>;
      setError(apiError.detail || apiError.message || t("couldNotUpdateGroupTitle"));
    } finally {
      setSaving(false);
    }
  }

  async function handleImageChange(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError(t("selectImageFileError"));
      return;
    }

    setUploadingImage(true);
    setError("");
    try {
      await onUpdateImage(chat.id, file);
    } catch (requestError) {
      const apiError = requestError as Partial<ApiError>;
      setError(apiError.detail || apiError.message || t("couldNotUpdateGroupPhoto"));
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[75] flex items-center justify-center bg-black/30 px-6"
      onClick={onClose}
    >
      <section
        className="flex max-h-[calc(100vh-48px)] w-full max-w-[760px] flex-col overflow-y-auto rounded-[24px] bg-white p-8 shadow-[0_24px_70px_rgba(0,0,0,0.22)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative flex flex-col items-center text-center">
          <button
            type="button"
            aria-label={tShared("close")}
            onClick={onClose}
            className="absolute right-0 top-0 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#4B5563] transition hover:bg-[#EEF2FF] hover:text-[#003AFF]"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex flex-col items-center gap-4">
            <div className="relative shrink-0">
              <Avatar src={chat.image_url} label={currentTitle} size="xl" />
              {canManage ? (
                <label
                  aria-label={chat.image_url ? t("changeGroupPhoto") : t("addGroupPhoto")}
                  className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-[#003AFF] text-white transition hover:bg-[#0B257C]"
                >
                  {uploadingImage ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Camera className="h-3.5 w-3.5" />
                  )}
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    disabled={uploadingImage}
                    onChange={(event) => void handleImageChange(event.target.files?.[0])}
                  />
                </label>
              ) : null}
            </div>
            <div className="min-w-0 max-w-full">
              <h2 className="truncate text-3xl font-bold text-[#121212]">{currentTitle}</h2>
              <p className="mt-1 text-sm text-[#4B5563]">
                {t("memberCount", { count: participants.length })}
              </p>
            </div>
          </div>
        </div>

        <label className="mt-6 block">
          <span className="mb-2 block text-sm font-semibold text-[#374151]">
            {t("chatNameLabel")}
          </span>
          <span className="flex gap-3">
            <input
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void saveTitle();
                }
              }}
              className="h-11 min-w-0 flex-1 rounded-lg border border-[#D8DDEA] px-3 text-sm outline-none transition focus:border-[#A7BAFA] focus:ring-2 focus:ring-[#D6E0FF]"
            />
            <button
              type="button"
              disabled={saving || !titleChanged || !draftTitle.trim()}
              onClick={() => void saveTitle()}
              className="inline-flex h-11 min-w-[92px] items-center justify-center rounded-lg bg-black px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#A3A3A3]"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : tShared("save")}
            </button>
          </span>
        </label>

        {error ? (
          <p role="alert" className="mt-3 text-sm text-[#B42318]">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          aria-pressed={!muted}
          onClick={onToggleMute}
          className="mt-5 flex h-14 w-full items-center justify-between rounded-xl border border-[#DDE5FF] px-4 text-left transition hover:[background-image:linear-gradient(90deg,rgba(167,186,250,0.34),rgba(252,196,195,0.3),rgba(255,244,218,0.5))] hover:shadow-[0_8px_24px_rgba(0,58,255,0.1)]"
        >
          <span className="flex min-w-0 items-center gap-3">
            <NotificationIcon className="h-5 w-5 shrink-0 text-[#003AFF]" />
            <span className="font-medium text-[#121212]">{t("notifications")}</span>
          </span>
          <span className="rounded-full bg-[#EEF2FF] px-3 py-1 text-xs font-semibold text-[#0B257C]">
            {muted ? t("off") : t("on")}
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenAttachments}
          className="mt-4 flex min-h-16 w-full items-center gap-3 rounded-xl border border-[#DDE5FF] px-4 text-left transition hover:[background-image:linear-gradient(90deg,rgba(167,186,250,0.34),rgba(252,196,195,0.3),rgba(255,244,218,0.5))] hover:shadow-[0_8px_24px_rgba(0,58,255,0.1)]"
        >
          <Paperclip className="h-5 w-5 shrink-0 text-[#121212]" />
          <span className="min-w-0 flex-1">
            <span className="block font-medium text-[#121212]">{t("attachmentsLabel")}</span>
            <span className="mt-1 block text-xs text-[#6B7280]">
              {t("attachmentsDescription")}
            </span>
          </span>
          <ChevronRight className="h-5 w-5 shrink-0 text-[#121212]" />
        </button>

        <div className="mt-7">
          <h3 className="text-lg font-semibold text-[#374151]">{t("membersHeading")}</h3>
          <div className="mt-3 max-h-[320px] overflow-y-auto rounded-lg border border-[#EEF0F6]">
            {participants.length > 0 ? (
              participants.map((participant) => {
                const user = participant.user;
                const name = userDisplayName(user);
                const roleLabel =
                  participant.role === "owner"
                    ? t("roleOwner")
                    : participant.role === "admin"
                      ? t("roleAdmin")
                      : t("roleMember");
                return (
                  <button
                    key={participant.id}
                    type="button"
                    onClick={() => onViewProfile(user)}
                    className="grid h-[72px] w-full grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 border-b border-[#EEF0F6] px-4 text-left transition last:border-b-0 hover:[background-image:linear-gradient(90deg,rgba(167,186,250,0.34),rgba(252,196,195,0.3),rgba(255,244,218,0.5))]"
                  >
                    <Avatar src={user.avatar} label={name} size="sm" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-[#121212]">
                        {name}
                      </span>
                      <span className="mt-1 block truncate text-xs text-[#6B7280]">
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </span>
                    <span className="rounded-full bg-[#FFF4DA] px-2.5 py-1 text-[11px] font-semibold text-[#8A6201]">
                      {roleLabel}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="flex h-20 items-center justify-center text-sm text-[#6B7280]">
                {t("noMembers")}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
