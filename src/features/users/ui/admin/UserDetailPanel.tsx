"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { AccentButton } from "@/shared/ui/AccentButton";
import {
  deleteUserNote,
  getUserNote,
  resendVerificationEmail,
  saveUserNote,
} from "@/entities/user";
import type { UserData } from "@/entities/user";
import type { ApiError } from "@/shared/api/base";
import { formatUserDate } from "../../lib/dates";
import { LANGUAGE_LABELS, ROLE_LABELS } from "../../model/labels";
import { UserAvatar } from "./UserAvatar";
import { UserStatusBadge } from "./UserStatusBadge";

const SOCIAL_LABELS = [
  ["instagram", "Instagram"],
  ["linkedin", "LinkedIn"],
  ["facebook", "Facebook"],
  ["behance", "Behance"],
] as const;

type Props = {
  user: UserData;
  onClose: () => void;
};

/** Inline admin panel to the right of the users table: user details, violation history, admin-only note. */
export function UserDetailPanel({ user, onClose }: Props) {
  const socials = SOCIAL_LABELS.filter(([key]) => Boolean(user[key]));

  const [note, setNote] = useState("");
  const [savedNote, setSavedNote] = useState("");
  const [loadedNoteUserId, setLoadedNoteUserId] = useState<number | null>(null);
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);
  const noteLoading = loadedNoteUserId !== user.id;

  useEffect(() => {
    let cancelled = false;
    getUserNote(user.id)
      .then((data) => {
        if (cancelled) return;
        const content = data?.content ?? "";
        setNote(content);
        setSavedNote(content);
        setNoteError(null);
        setLoadedNoteUserId(user.id);
      })
      .catch(() => {
        if (cancelled) return;
        setNote("");
        setSavedNote("");
        setNoteError("Failed to load the note.");
        setLoadedNoteUserId(user.id);
      });
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  const dirty = note.trim() !== savedNote;

  async function handleSaveNote() {
    const trimmed = note.trim();
    setNoteSaving(true);
    setNoteError(null);
    try {
      if (trimmed) {
        await saveUserNote(user.id, trimmed);
      } else if (savedNote) {
        await deleteUserNote(user.id);
      }
      setNote(trimmed);
      setSavedNote(trimmed);
    } catch (err) {
      setNoteError((err as ApiError).message ?? "Failed to save the note.");
    } finally {
      setNoteSaving(false);
    }
  }

  const name = `${user.first_name} ${user.last_name}`.trim() || user.email;
  const noteFieldId = `admin-user-note-${user.id}`;

  return (
    <aside
      aria-label="User details"
      className="flex shrink-0 flex-col rounded-[20px] border border-white bg-(--color-white-20) shadow-(--shadow-usp-glass) backdrop-blur-md"
      style={{
        width: "clamp(300px, 24vw, 360px)",
        padding: "clamp(16px, 1.67vw, 24px)",
        gap: "clamp(14px, 1.25vw, 18px)",
      }}
    >
      <div className="flex items-center justify-between" style={{ gap: 12 }}>
        <h2
          className="overflow-hidden font-bold text-ellipsis whitespace-nowrap text-(--color-text-primary)"
          style={{
            fontFamily: "var(--font-base)",
            fontSize: "clamp(16px, 1.25vw, 18px)",
            margin: 0,
          }}
        >
          {name}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close details"
          className="flex shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-transparent p-1 text-(--color-text-secondary) transition hover:bg-(--color-brand-lavender-soft)"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex items-center" style={{ gap: 12 }}>
        <UserAvatar user={user} size="clamp(44px, 3.33vw, 56px)" />
        <UserStatusBadge
          user={user}
          onResendVerification={() => resendVerificationEmail(user.email)}
        />
      </div>

      <dl className="flex flex-col" style={{ gap: 10, margin: 0 }}>
        <DetailRow label="Role">{ROLE_LABELS[user.role]}</DetailRow>
        <DetailRow label="Email">{user.email}</DetailRow>
        <DetailRow label="Email status">
          {user.is_email_verified ? "Verified" : "Unverified"}
        </DetailRow>
        <DetailRow label="Language">{LANGUAGE_LABELS[user.language]}</DetailRow>
        <DetailRow label="Reg. date">{formatUserDate(user.date_joined)}</DetailRow>
        {socials.map(([key, label]) => (
          <DetailRow key={key} label={label}>
            <a
              href={user[key]}
              target="_blank"
              rel="noreferrer"
              className="text-(--color-blue) underline"
            >
              {user[key]}
            </a>
          </DetailRow>
        ))}
      </dl>

      {user.role === "moderator" ? (
        <AccentButton
          href={`/admin/moderators/${user.id}`}
          size="sm"
          className="self-center text-center"
        >
          View work profile
        </AccentButton>
      ) : null}

      <div className="flex flex-col" style={{ gap: 6 }}>
        <h3
          className="font-bold text-(--color-blue)"
          style={{
            fontFamily: "var(--font-base)",
            fontSize: "clamp(14px, 1.11vw, 16px)",
            margin: 0,
          }}
        >
          User violation history
        </h3>
        <p
          className="text-(--color-text-secondary)"
          style={{
            fontFamily: "var(--font-base)",
            fontSize: "clamp(12px, 0.97vw, 14px)",
            margin: 0,
          }}
        >
          In progress
        </p>
      </div>

      <div className="flex flex-col" style={{ gap: 8 }}>
        <label
          htmlFor={noteFieldId}
          className="text-(--color-text-primary)"
          style={{ fontFamily: "var(--font-base)", fontSize: "clamp(13px, 0.97vw, 15px)" }}
        >
          Notes
        </label>
        <textarea
          id={noteFieldId}
          value={noteLoading ? "" : note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Take a note"
          disabled={noteLoading || noteSaving}
          rows={3}
          className="w-full resize-y rounded-xl border border-(--color-pink-dark) bg-white outline-none focus:border-(--color-blue) disabled:opacity-60"
          style={{
            fontFamily: "var(--font-base)",
            fontSize: "clamp(13px, 0.97vw, 14px)",
            color: "var(--color-text-primary)",
            padding: "10px 12px",
          }}
        />
        {!noteLoading && noteError && (
          <p
            className="text-(--color-danger)"
            style={{
              fontFamily: "var(--font-base)",
              fontSize: "clamp(11px, 0.83vw, 13px)",
              margin: 0,
            }}
          >
            {noteError}
          </p>
        )}
        <AccentButton
          size="sm"
          className="self-center"
          onClick={handleSaveNote}
          disabled={!dirty || noteLoading || noteSaving}
        >
          {noteSaving ? "Saving…" : "Save"}
        </AccentButton>
      </div>
    </aside>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="flex items-baseline"
      style={{ gap: 12, fontFamily: "var(--font-base)", fontSize: "clamp(13px, 0.97vw, 15px)" }}
    >
      <dt
        className="shrink-0 text-(--color-text-secondary)"
        style={{ width: "clamp(64px, 5vw, 80px)" }}
      >
        {label}
      </dt>
      <dd
        className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-(--color-text-primary)"
        style={{ margin: 0 }}
      >
        {children}
      </dd>
    </div>
  );
}
