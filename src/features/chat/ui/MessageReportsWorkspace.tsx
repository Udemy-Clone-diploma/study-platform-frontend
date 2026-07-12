"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Ban,
  FileText,
  Flag,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import {
  getMessageReports,
  getChatModerationStatus,
  moderateChatUser,
  type ChatUser,
  type ChatModerationActionKind,
  type ChatModerationStatus,
  type MessageReport,
  type MessageReportReason,
} from "@/entities/chat";
import type { ApiError } from "@/shared/api/base";
import { resolveMediaUrl } from "@/shared/api/lib/mediaUrl";

type ReportedUserGroup = {
  key: string;
  user: ChatUser | null;
  reports: MessageReport[];
};

const REASON_OPTIONS: Array<{ value: MessageReportReason | "all"; label: string }> = [
  { value: "all", label: "All reasons" },
  { value: "spam", label: "Spam or advertising" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "hate", label: "Hate speech" },
  { value: "violence", label: "Violence or threats" },
  { value: "sexual", label: "Sexual content" },
  { value: "fraud", label: "Fraud or scam" },
  { value: "other", label: "Other" },
];

function fullName(user: ChatUser | null) {
  if (!user) return "Deleted user";
  return user.name || `${user.first_name} ${user.last_name}`.trim() || user.email;
}

function dateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function compactDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function reportMessagePreview(report: MessageReport) {
  return report.message_text.trim() || "Message contained attachments only.";
}

function Avatar({ user, size = "md" }: { user: ChatUser | null; size?: "sm" | "md" | "lg" }) {
  const dimensions = {
    sm: "h-8 w-8 text-xs",
    md: "h-11 w-11 text-sm",
    lg: "h-14 w-14 text-base",
  }[size];
  const label = fullName(user);
  const source = resolveMediaUrl(user?.avatar);
  const initials = label
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return source ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={source} alt="" className={`${dimensions} shrink-0 rounded-full object-cover`} />
  ) : (
    <span
      aria-hidden="true"
      className={`${dimensions} flex shrink-0 items-center justify-center rounded-full bg-(--color-brand-lavender) font-bold text-(--color-blue-dark)`}
    >
      {user ? initials : <UserRound className="h-5 w-5" />}
    </span>
  );
}

function buildGroups(reports: MessageReport[]) {
  const grouped = new Map<string, ReportedUserGroup>();

  reports.forEach((report) => {
    const key = report.sender ? String(report.sender.id) : `deleted-${report.message}`;
    const current = grouped.get(key);
    if (current) {
      current.reports.push(report);
    } else {
      grouped.set(key, { key, user: report.sender, reports: [report] });
    }
  });

  return Array.from(grouped.values()).sort(
    (first, second) =>
      new Date(second.reports[0].created_at).getTime() -
      new Date(first.reports[0].created_at).getTime(),
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[84px_minmax(0,1fr)] gap-2 text-xs leading-5">
      <dt className="text-(--color-text-muted)">{label}</dt>
      <dd className="min-w-0 break-words text-(--color-text-primary)">{children}</dd>
    </div>
  );
}

function ModeratorActionsPanel({
  user,
  reportId,
}: {
  user: ChatUser;
  reportId: number;
}) {
  const [status, setStatus] = useState<ChatModerationStatus | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<ChatModerationActionKind | null>(null);
  const [confirmAction, setConfirmAction] = useState<ChatModerationActionKind | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;
    getChatModerationStatus(user.id)
      .then((data) => {
        if (!cancelled) setStatus(data);
      })
      .catch((requestError) => {
        if (cancelled) return;
        const apiError = requestError as Partial<ApiError>;
        setError(apiError.detail || apiError.message || "Could not load moderation history.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  async function runAction(action: ChatModerationActionKind) {
    setPendingAction(action);
    setConfirmAction(null);
    setError("");
    setSuccess("");
    try {
      const data = await moderateChatUser(user.id, action, note.trim(), reportId);
      setStatus(data);
      setNote("");
      setSuccess(
        action === "warning"
          ? "Warning sent to the user."
          : action === "retract_warning"
            ? "The warning has been retracted."
            : action === "restrict"
              ? "The user can no longer write in chats."
              : "The user can write in chats again.",
      );
    } catch (requestError) {
      const apiError = requestError as Partial<ApiError>;
      setError(apiError.detail || apiError.message || "Could not apply moderation action.");
    } finally {
      setPendingAction(null);
    }
  }

  const busy = pendingAction !== null;
  const warningActive = status?.active_warning_report_ids.includes(reportId) ?? false;

  return (
    <div className="mt-6 border-t border-white/80 pt-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-(--color-text-primary)">Moderator action</h3>
        {loading ? <Loader2 className="h-4 w-4 animate-spin text-(--color-blue)" /> : null}
      </div>

      {status?.is_restricted ? (
        <div className="mt-3 rounded-xl bg-(--color-error-surface) p-3 text-xs text-(--color-pink-dark)">
          <span className="flex items-center gap-2 font-bold">
            <Ban className="h-4 w-4" /> Chat access restricted
          </span>
          {status.restricted_at ? <p className="mt-1">Since {dateTime(status.restricted_at)}</p> : null}
          {status.restriction_reason ? <p className="mt-1 leading-5">{status.restriction_reason}</p> : null}
        </div>
      ) : null}

      <label className="mt-4 block text-xs font-semibold text-(--color-text-primary)">
        Note to user <span className="font-normal text-(--color-text-muted)">(optional)</span>
        <textarea
          value={note}
          maxLength={500}
          rows={3}
          disabled={busy || loading}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Explain the moderation decision"
          className="mt-2 w-full resize-none rounded-xl border border-white bg-white/65 px-3 py-2 font-normal leading-5 outline-none focus:border-(--color-brand-pink) disabled:opacity-60"
        />
      </label>

      <div className="mt-3 space-y-2">
        <button
          type="button"
          disabled={busy || loading}
          onClick={() => void runAction(warningActive ? "retract_warning" : "warning")}
          className={`inline-flex h-9 w-full items-center justify-center gap-2 rounded-full border bg-white/60 text-xs font-bold hover:bg-white disabled:opacity-60 ${
            warningActive
              ? "border-(--color-success) text-(--color-success)"
              : "border-(--color-warning) text-(--color-yellow-dark)"
          }`}
        >
          {pendingAction === "warning" || pendingAction === "retract_warning" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : warningActive ? (
            <ShieldCheck className="h-4 w-4" />
          ) : (
            <ShieldAlert className="h-4 w-4" />
          )}
          {warningActive ? "Retract warning" : "Give warning"}
        </button>

        <button
          type="button"
          disabled={busy || loading}
          onClick={() => setConfirmAction(status?.is_restricted ? "restore" : "restrict")}
          className={`inline-flex h-9 w-full items-center justify-center gap-2 rounded-full border bg-white/60 text-xs font-bold hover:bg-white disabled:opacity-60 ${
            status?.is_restricted
              ? "border-(--color-success) text-(--color-success)"
              : "border-(--color-danger) text-(--color-danger)"
          }`}
        >
          {status?.is_restricted ? <ShieldCheck className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
          {status?.is_restricted ? "Unblock user" : "Block user from chats"}
        </button>
      </div>

      {confirmAction ? (
        <div className="mt-3 rounded-xl bg-white/60 p-3 text-xs text-(--color-text-secondary)">
          <p className="leading-5">
            {confirmAction === "restrict"
              ? "The user will immediately lose the ability to send messages in every chat."
              : "The user will immediately be able to send chat messages again."}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmAction(null)}
              className="h-8 flex-1 rounded-full border border-(--color-border-light) bg-white font-bold text-(--color-text-primary)"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void runAction(confirmAction)}
              className="h-8 flex-1 rounded-full bg-black font-bold text-white"
            >
              Confirm
            </button>
          </div>
        </div>
      ) : null}

      {error ? <p role="alert" className="mt-3 text-xs leading-5 text-(--color-danger)">{error}</p> : null}
      {success ? <p role="status" className="mt-3 text-xs leading-5 text-(--color-success)">{success}</p> : null}

      {status?.actions.length ? (
        <div className="mt-6">
          <h3 className="text-sm font-bold text-(--color-blue)">User moderation history</h3>
          <div className="mt-3 max-h-52 space-y-3 overflow-y-auto pr-1">
            {status.actions.map((action) => (
              <div key={action.id} className="rounded-xl bg-white/45 p-3 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className={`font-bold ${
                    action.action === "warning"
                      ? "text-(--color-yellow-dark)"
                      : action.action === "restrict"
                          ? "text-(--color-danger)"
                          : "text-(--color-success)"
                  }`}>
                    {action.action_label}
                  </span>
                  <time className="shrink-0 text-(--color-text-muted)" dateTime={action.created_at}>
                    {compactDate(action.created_at)}
                  </time>
                </div>
                {action.note ? <p className="mt-2 break-words leading-5 text-(--color-text-secondary)">{action.note}</p> : null}
                <p className="mt-2 text-(--color-text-muted)">
                  {action.moderator ? fullName(action.moderator) : "Deleted moderator"}
                  {action.report ? ` · Report #${action.report}` : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Displays reports grouped by the users whose messages were reported. */
export function MessageReportsWorkspace() {
  const [reports, setReports] = useState<MessageReport[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [reason, setReason] = useState<MessageReportReason | "all">("all");
  const [selectedUserKey, setSelectedUserKey] = useState<string | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);

  const load = useCallback(async (nextPage = 1) => {
    if (nextPage === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError("");
    try {
      const data = await getMessageReports(nextPage);
      setReports((current) => (nextPage === 1 ? data.results : [...current, ...data.results]));
      setPage(nextPage);
      setHasMore(Boolean(data.next));
    } catch (requestError) {
      const apiError = requestError as Partial<ApiError>;
      setError(apiError.detail || apiError.message || "Could not load message reports.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredReports = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return reports.filter((report) => {
      if (reason !== "all" && report.reason !== reason) return false;
      if (!normalizedQuery) return true;
      return [
        fullName(report.sender),
        report.sender?.email,
        report.message_text,
        report.reason_label,
        report.details,
      ].some((value) => value?.toLowerCase().includes(normalizedQuery));
    });
  }, [query, reason, reports]);

  const groups = useMemo(() => buildGroups(filteredReports), [filteredReports]);
  const selectedGroup =
    groups.find((group) => group.key === selectedUserKey) ?? groups[0] ?? null;
  const selectedReport =
    selectedGroup?.reports.find((report) => report.id === selectedReportId) ??
    selectedGroup?.reports[0] ??
    null;

  function selectGroup(group: ReportedUserGroup) {
    setSelectedUserKey(group.key);
    setSelectedReportId(group.reports[0]?.id ?? null);
  }

  return (
    <main className="min-h-full bg-(--color-brand-lavender-soft) px-5 py-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="flex flex-wrap items-center gap-4">
          <label className="relative min-w-64 flex-1 lg:max-w-96">
            <span className="sr-only">Search reported users and messages</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-(--color-brand-lavender)" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search users or messages"
              className="h-11 w-full rounded-full border border-(--color-brand-lavender) bg-white px-11 text-sm outline-none placeholder:text-(--color-text-muted) focus:ring-2 focus:ring-(--color-brand-lavender)"
            />
          </label>

          <label>
            <span className="sr-only">Filter by report reason</span>
            <select
              value={reason}
              onChange={(event) => setReason(event.target.value as MessageReportReason | "all")}
              className="h-11 rounded-full border border-white bg-white px-5 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-brand-lavender)"
            >
              {REASON_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            disabled={loading}
            onClick={() => void load()}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-(--color-text-primary) transition hover:bg-(--color-bg-surface) disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <div className="mt-4 flex items-center gap-6 text-sm text-(--color-text-primary)">
          <span className="font-bold">All reports</span>
          <span>{groups.length} reported {groups.length === 1 ? "user" : "users"}</span>
          <span>{filteredReports.length} {filteredReports.length === 1 ? "message" : "messages"}</span>
        </div>

        {error ? (
          <p role="alert" className="mt-4 rounded-xl bg-(--color-error-surface) p-4 text-sm text-(--color-danger)">
            {error}
          </p>
        ) : null}

        {loading ? (
          <div className="flex h-[520px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-(--color-blue)" />
          </div>
        ) : reports.length === 0 ? (
          <div className="mt-6 flex min-h-[520px] flex-col items-center justify-center rounded-2xl border border-white/70 bg-white/30 text-center">
            <AlertTriangle className="h-10 w-10 text-(--color-brand-lavender)" />
            <p className="mt-3 font-bold text-(--color-text-primary)">No reported messages</p>
            <p className="mt-1 text-sm text-(--color-text-secondary)">New reports will appear here.</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="mt-6 flex min-h-[520px] flex-col items-center justify-center rounded-2xl border border-white/70 bg-white/30 text-center">
            <Search className="h-9 w-9 text-(--color-brand-lavender)" />
            <p className="mt-3 font-bold text-(--color-text-primary)">Nothing found</p>
            <p className="mt-1 text-sm text-(--color-text-secondary)">Try another search or reason.</p>
          </div>
        ) : (
          <div className="mt-6 grid min-h-[560px] grid-cols-[minmax(250px,0.9fr)_minmax(350px,1.45fr)_minmax(250px,0.9fr)] gap-5">
            <aside className="flex min-h-0 flex-col rounded-2xl border border-white/80 bg-white/20 p-4">
              <h2 className="px-1 text-sm font-bold text-(--color-text-primary)">Reported users</h2>
              <div className="mt-4 max-h-[610px] space-y-2 overflow-y-auto pr-1">
                {groups.map((group) => {
                  const active = selectedGroup?.key === group.key;
                  const latestReport = group.reports[0];
                  return (
                    <button
                      key={group.key}
                      type="button"
                      onClick={() => selectGroup(group)}
                      className={`grid w-full grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
                        active
                          ? "bg-(--color-brand-cream) shadow-sm"
                          : "bg-white hover:bg-(--color-white-85)"
                      }`}
                    >
                      <Avatar user={group.user} />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-(--color-text-primary)">
                          {fullName(group.user)}
                        </span>
                        <span className="mt-1 block truncate text-xs text-(--color-text-secondary)">
                          {reportMessagePreview(latestReport)}
                        </span>
                      </span>
                      <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-(--color-brand-pink) px-2 text-xs font-bold text-(--color-pink-dark)">
                        {group.reports.length}
                      </span>
                    </button>
                  );
                })}
              </div>
              {hasMore ? (
                <button
                  type="button"
                  disabled={loadingMore}
                  onClick={() => void load(page + 1)}
                  className="mt-4 inline-flex h-10 items-center justify-center rounded-xl border border-white bg-white/60 text-xs font-bold text-(--color-text-primary) disabled:opacity-60"
                >
                  {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load more reports"}
                </button>
              ) : null}
            </aside>

            <section className="min-w-0">
              {selectedGroup ? (
                <>
                  <div className="flex min-h-20 items-center justify-between gap-4 rounded-2xl border border-white/80 bg-white/20 px-6 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar user={selectedGroup.user} />
                      <div className="min-w-0">
                        <h2 className="truncate text-base font-bold text-(--color-text-primary)">
                          {fullName(selectedGroup.user)}
                        </h2>
                        <p className="mt-1 truncate text-xs text-(--color-text-secondary)">
                          {selectedGroup.user?.email || "The user account has been deleted"}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-semibold text-(--color-text-secondary)">
                      {selectedGroup.reports.length} reported {selectedGroup.reports.length === 1 ? "message" : "messages"}
                    </span>
                  </div>

                  <div className="mt-5 max-h-[550px] space-y-4 overflow-y-auto px-2 pb-3">
                    {selectedGroup.reports.map((report) => {
                      const active = selectedReport?.id === report.id;
                      return (
                        <button
                          key={report.id}
                          type="button"
                          onClick={() => setSelectedReportId(report.id)}
                          className={`block w-full rounded-2xl border p-5 text-left transition ${
                            active
                              ? "border-(--color-brand-pink) bg-(--color-brand-cream) shadow-md"
                              : "border-white/80 bg-(--color-brand-cream)/80 hover:bg-(--color-brand-cream)"
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-xs font-bold text-(--color-pink-dark)">
                              <Flag className="h-3.5 w-3.5" />
                              {report.reason_label}
                            </span>
                            <time dateTime={report.message_created_at} className="text-xs text-(--color-text-secondary)">
                              Sent {dateTime(report.message_created_at)}
                            </time>
                          </div>
                          <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-(--color-text-primary)">
                            {reportMessagePreview(report)}
                          </p>
                          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/70 pt-3 text-xs text-(--color-text-secondary)">
                            <span>Reported by <strong className="text-(--color-text-primary)">{fullName(report.reporter)}</strong></span>
                            <span>{dateTime(report.created_at)}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : null}
            </section>

            <aside className="min-w-0 rounded-2xl border border-white/80 bg-white/20 p-5">
              {selectedReport ? (
                <>
                  <div className="flex items-center gap-3">
                    <Avatar user={selectedReport.sender} size="lg" />
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-bold text-(--color-text-primary)">
                        {fullName(selectedReport.sender)}
                      </h2>
                      <p className="mt-1 text-xs capitalize text-(--color-text-secondary)">
                        {selectedReport.sender?.role || "Unknown role"}
                      </p>
                    </div>
                  </div>

                  <dl className="mt-6 space-y-3">
                    <DetailRow label="Sender">{selectedReport.sender?.email || "Deleted account"}</DetailRow>
                    <DetailRow label="Sent">{dateTime(selectedReport.message_created_at)}</DetailRow>
                    <DetailRow label="Message ID">#{selectedReport.message}</DetailRow>
                    <DetailRow label="Chat">
                      {selectedReport.chat.title || `${selectedReport.chat.type} chat`} · #{selectedReport.chat.id}
                    </DetailRow>
                  </dl>

                  <div className="mt-6 border-t border-white/80 pt-5">
                    <h3 className="text-sm font-bold text-(--color-text-primary)">Report information</h3>
                    <dl className="mt-4 space-y-3">
                      <DetailRow label="Reason">
                        <span className="font-bold text-(--color-pink-dark)">{selectedReport.reason_label}</span>
                      </DetailRow>
                      <DetailRow label="Reported">{dateTime(selectedReport.created_at)}</DetailRow>
                      <DetailRow label="Reporter">{fullName(selectedReport.reporter)}</DetailRow>
                      <DetailRow label="Reporter role">
                        <span className="capitalize">{selectedReport.reporter.role}</span>
                      </DetailRow>
                    </dl>
                  </div>

                  {selectedReport.details ? (
                    <div className="mt-5 rounded-xl bg-white/60 p-4">
                      <p className="text-xs font-bold text-(--color-text-primary)">Reporter note</p>
                      <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-5 text-(--color-text-secondary)">
                        {selectedReport.details}
                      </p>
                    </div>
                  ) : null}

                  {selectedReport.attachments.length ? (
                    <div className="mt-5">
                      <h3 className="text-sm font-bold text-(--color-text-primary)">Attachments</h3>
                      <div className="mt-3 space-y-2">
                        {selectedReport.attachments.map((attachment) =>
                          attachment.url ? (
                            <a
                              key={attachment.id}
                              href={attachment.url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2 text-xs font-semibold text-(--color-blue) hover:bg-white"
                            >
                              <FileText className="h-4 w-4 shrink-0" />
                              <span className="truncate">Attachment #{attachment.id}</span>
                            </a>
                          ) : null,
                        )}
                      </div>
                    </div>
                  ) : null}

                  {selectedReport.sender ? (
                    <ModeratorActionsPanel
                      key={`${selectedReport.sender.id}-${selectedReport.id}`}
                      user={selectedReport.sender}
                      reportId={selectedReport.id}
                    />
                  ) : (
                    <p className="mt-6 rounded-xl bg-white/50 p-3 text-xs leading-5 text-(--color-text-secondary)">
                      Moderation actions are unavailable because this user account no longer exists.
                    </p>
                  )}

                  <div className="mt-6 rounded-xl border border-white/80 bg-white/40 p-3 text-xs text-(--color-text-secondary)">
                    Report #{selectedReport.id} · {compactDate(selectedReport.created_at)}
                  </div>
                </>
              ) : null}
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
