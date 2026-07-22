"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Camera, ImagePlus, Loader2, X } from "lucide-react";
import {
  createDirectChat,
  createGroupChat,
  type ChatRoom,
  type UserSearchResult,
} from "@/entities/chat";
import type { ApiError } from "@/shared/api/base";
import type { ComposeMode } from "../model/chatWorkspaceTypes";
import { UserSearchBox } from "./UserSearchBox";

type Props = {
  mode: ComposeMode;
  onModeChange: (mode: ComposeMode) => void;
  onClose: () => void;
  onCreated: (chat: ChatRoom) => void;
  meId: number | null;
};

/** Creates a direct chat or group chat from searched users. */
export function ComposeModal({ mode, onModeChange, onClose, onCreated, meId }: Props) {
  const [selected, setSelected] = useState<UserSearchResult[]>([]);
  const [title, setTitle] = useState("");
  const [groupImage, setGroupImage] = useState<File | null>(null);
  const [groupImagePreview, setGroupImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (groupImagePreview) URL.revokeObjectURL(groupImagePreview);
    };
  }, [groupImagePreview]);

  function changeMode(nextMode: ComposeMode) {
    onModeChange(nextMode);
    setSelected([]);
    setGroupImage(null);
    setGroupImagePreview(null);
    setError("");
  }

  function handleGroupImageChange(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    setGroupImage(file);
    setGroupImagePreview(URL.createObjectURL(file));
    setError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (mode === "direct" && selected.length !== 1) {
      setError("Select one user.");
      return;
    }
    if (mode === "group" && (!title.trim() || selected.length === 0)) {
      setError("Add a group title and at least one participant.");
      return;
    }

    setSaving(true);
    try {
      const chat =
        mode === "direct"
          ? await createDirectChat(selected[0].id)
          : await createGroupChat(
              title.trim(),
              selected.map((user) => user.id),
              groupImage,
            );
      onCreated(chat);
      onClose();
    } catch (requestError) {
      const apiError = requestError as Partial<ApiError>;
      setError(apiError.detail || apiError.message || "Could not create chat.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30 px-6">
      <form
        onSubmit={submit}
        className="w-full max-w-[520px] rounded-lg bg-white p-6 shadow-[0_24px_70px_rgba(0,0,0,0.2)]"
      >
        <div className="flex items-center justify-between">
          <div className="inline-flex rounded-lg bg-[#F1F4FF] p-1">
            <button
              type="button"
              onClick={() => changeMode("direct")}
              className={`h-9 rounded-md px-4 text-sm font-medium ${
                mode === "direct" ? "bg-white text-[#0B257C] shadow-sm" : "text-[#4B5563]"
              }`}
            >
              Direct
            </button>
            <button
              type="button"
              onClick={() => changeMode("group")}
              className={`h-9 rounded-md px-4 text-sm font-medium ${
                mode === "group" ? "bg-white text-[#0B257C] shadow-sm" : "text-[#4B5563]"
              }`}
            >
              Group
            </button>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#F3F4F6]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {mode === "group" ? (
          <>
            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-medium text-[#374151]">Title</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="h-10 w-full rounded-lg border border-[#D8DDEA] px-3 text-sm outline-none focus:border-[#A7BAFA] focus:ring-2 focus:ring-[#D6E0FF]"
              />
            </label>
            <div className="mt-5 flex items-center gap-3 rounded-lg border border-[#EEF0F6] p-3">
              <label className="relative flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-[#D6E0FF] text-[#0B257C] transition hover:brightness-95">
                {groupImagePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={groupImagePreview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ImagePlus className="h-6 w-6" />
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  onChange={(event) => handleGroupImageChange(event.target.files?.[0])}
                />
              </label>
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-medium text-[#374151]">
                  <Camera className="h-4 w-4 text-[#003AFF]" />
                  Group photo
                </p>
                <p className="mt-1 truncate text-xs text-[#6B7280]">
                  {groupImage?.name || "Add a photo for this group"}
                </p>
              </div>
            </div>
          </>
        ) : null}

        <div className="mt-5">
          <UserSearchBox
            selected={selected}
            excludeIds={meId ? [meId] : []}
            onSelect={(user) =>
              setSelected((current) => (mode === "direct" ? [user] : [...current, user]))
            }
          />
        </div>

        {selected.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {selected.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() =>
                  setSelected((current) => current.filter((item) => item.id !== user.id))
                }
                className="inline-flex max-w-full items-center gap-2 rounded-full bg-[#EEF2FF] px-3 py-1 text-xs text-[#0B257C]"
              >
                <span className="truncate">{user.name || user.email}</span>
                <X className="h-3 w-3 shrink-0" />
              </button>
            ))}
          </div>
        ) : null}

        {error ? (
          <p role="alert" className="mt-4 text-sm text-[#B42318]">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-10 min-w-[128px] items-center justify-center rounded-lg bg-black px-5 text-sm font-semibold text-white disabled:bg-[#A3A3A3]"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}
