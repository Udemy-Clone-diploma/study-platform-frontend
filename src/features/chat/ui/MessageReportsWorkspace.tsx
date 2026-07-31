"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
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
  type ChatModerationActionKind,
  type ChatModerationStatus,
  type MessageReport,
  type MessageReportReason,
  type ModerationChatUser,
} from "@/entities/chat";
import type { ApiError } from "@/shared/api/base";
import { resolveMediaUrl } from "@/shared/api/lib/mediaUrl";

type ReportedUserGroup = {
  key: string;
  user: ModerationChatUser | null;
  reports: MessageReport[];
};

const REASON_VALUES: MessageReportReason[] = [
  "spam",
  "harassment",
  "hate",
  "violence",
  "sexual",
  "fraud",
  "other",
];

type Translator = (key: string, values?: Record<string, string | number>) => string;

function fullName(user: ModerationChatUser | null, t: Translator) {
  if (!user) return t("deletedUser");
  return user.name || `${user.first_name} ${user.last_name}`.trim() || user.email;
}

function dateTime(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function compactDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function reportMessagePreview(report: MessageReport, t: Translator) {
  return report.message_text.trim() || t("attachmentsOnlyPreview");
}

function Avatar({
  user,
  size = "md",
}: {
  user: ModerationChatUser | null;
  size?: "sm" | "md" | "lg";
}) {
  const t = useTranslations("MessageReportsWorkspace");
  const dimensions = {
    sm: "h-8 w-8 text-xs",
    md: "h-11 w-11 text-sm",
    lg: "h-14 w-14 text-base",
  }[size];
  const label = fullName(user, t);
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
  user: ModerationChatUser;
  reportId: number;
}) {
  const t = useTranslations("MessageReportsWorkspace");
  const tShared = useTranslations("Common");
  const locale = useLocale();
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
        setError(apiError.detail || apiError.message || t("couldNotLoadHistory"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user.id, t]);

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
          ? t("warningSent")
          : action === "retract_warning"
            ? t("warningRetracted")
            : action === "restrict"
              ? t("userRestricted")
              : t("userUnrestricted"),
      );
    } catch (requestError) {
      const apiError = requestError as Partial<ApiError>;
      setError(apiError.detail || apiError.message || t("couldNotApplyAction"));
    } finally {
      setPendingAction(null);
    }
  }

  const busy = pendingAction !== null;
  const warningActive = status?.active_warning_report_ids.includes(reportId) ?? false;

  return (
    <div className="mt-6 border-t border-white/80 pt-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-(--color-text-primary)">{t("moderatorActionHeading")}</h3>
        {loading ? <Loader2 className="h-4 w-4 animate-spin text-(--color-blue)" /> : null}
      </div>

      {status?.is_restricted ? (
        <div className="mt-3 rounded-xl bg-(--color-error-surface) p-3 text-xs text-(--color-pink-dark)">
          <span className="flex items-center gap-2 font-bold">
            <Ban className="h-4 w-4" /> {t("chatAccessRestricted")}
          </span>
          {status.restricted_at ? (
            <p className="mt-1">{t("sinceDate", { date: dateTime(status.restricted_at, locale) })}</p>
          ) : null}
          {status.restriction_reason ? (
            <p className="mt-1 leading-5">{status.restriction_reason}</p>
          ) : null}
        </div>
      ) : null}

      <label className="mt-4 block text-xs font-semibold text-(--color-text-primary)">
        {t("noteToUserLabel")} <span className="font-normal text-(--color-text-muted)">{t("optionalLabel")}</span>
        <textarea
          value={note}
          maxLength={500}
          rows={3}
          disabled={busy || loading}
          onChange={(event) => setNote(event.target.value)}
          placeholder={t("notePlaceholder")}
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
          {warningActive ? t("retractWarning") : t("giveWarning")}
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
          {status?.is_restricted ? (
            <ShieldCheck className="h-4 w-4" />
          ) : (
            <Ban className="h-4 w-4" />
          )}
          {status?.is_restricted ? t("unblockUser") : t("blockUserFromChats")}
        </button>
      </div>

      {confirmAction ? (
        <div className="mt-3 rounded-xl bg-white/60 p-3 text-xs text-(--color-text-secondary)">
          <p className="leading-5">
            {confirmAction === "restrict"
              ? t("confirmRestrictDescription")
              : t("confirmRestoreDescription")}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmAction(null)}
              className="h-8 flex-1 rounded-full border border-(--color-border-light) bg-white font-bold text-(--color-text-primary)"
            >
              {tShared("cancel")}
            </button>
            <button
              type="button"
              onClick={() => void runAction(confirmAction)}
              className="h-8 flex-1 rounded-full bg-black font-bold text-white"
            >
              {t("confirm")}
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="mt-3 text-xs leading-5 text-(--color-danger)">
          {error}
        </p>
      ) : null}
      {success ? (
        <p role="status" className="mt-3 text-xs leading-5 text-(--color-success)">
          {success}
        </p>
      ) : null}

      {status?.actions.length ? (
        <div className="mt-6">
          <h3 className="text-sm font-bold text-(--color-blue)">{t("moderationHistoryHeading")}</h3>
          <div className="mt-3 max-h-52 space-y-3 overflow-y-auto pr-1">
            {status.actions.map((action) => (
              <div key={action.id} className="rounded-xl bg-white/45 p-3 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`font-bold ${
                      action.action === "warning"
                        ? "text-(--color-yellow-dark)"
                        : action.action === "restrict"
                          ? "text-(--color-danger)"
                          : "text-(--color-success)"
                    }`}
                  >
                    {action.action_label}
                  </span>
                  <time className="shrink-0 text-(--color-text-muted)" dateTime={action.created_at}>
                    {compactDate(action.created_at, locale)}
                  </time>
                </div>
                {action.note ? (
                  <p className="mt-2 break-words leading-5 text-(--color-text-secondary)">
                    {action.note}
                  </p>
                ) : null}
                <p className="mt-2 text-(--color-text-muted)">
                  {action.moderator ? fullName(action.moderator, t) : t("deletedModerator")}
                  {action.report ? t("reportRefSuffix", { number: action.report }) : ""}
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
  const t = useTranslations("MessageReportsWorkspace");
  const tReasons = useTranslations("ReportUser.reasons");
  const tRoles = useTranslations("PublicProfile.roles");
  const locale = useLocale();
  const reasonOptions = useMemo(
    () => [
      { value: "all" as const, label: t("allReasons") },
      ...REASON_VALUES.map((value) => ({ value, label: tReasons(value) })),
    ],
    [t, tReasons],
  );
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
      setError(apiError.detail || apiError.message || t("couldNotLoadReports"));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredReports = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return reports.filter((report) => {
      if (reason !== "all" && report.reason !== reason) return false;
      if (!normalizedQuery) return true;
      return [
        fullName(report.sender, t),
        report.sender?.email,
        report.message_text,
        report.reason_label,
        report.details,
      ].some((value) => value?.toLowerCase().includes(normalizedQuery));
    });
  }, [query, reason, reports, t]);

  const groups = useMemo(() => buildGroups(filteredReports), [filteredReports]);
  const selectedGroup = groups.find((group) => group.key === selectedUserKey) ?? groups[0] ?? null;
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
            <span className="sr-only">{t("searchAriaLabel")}</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-(--color-brand-lavender)" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("searchPlaceholder")}
              className="h-11 w-full rounded-full border border-(--color-brand-lavender) bg-white px-11 text-sm outline-none placeholder:text-(--color-text-muted) focus:ring-2 focus:ring-(--color-brand-lavender)"
            />
          </label>

          <label>
            <span className="sr-only">{t("filterByReasonAriaLabel")}</span>
            <select
              value={reason}
              onChange={(event) => setReason(event.target.value as MessageReportReason | "all")}
              className="h-11 rounded-full border border-white bg-white px-5 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-brand-lavender)"
            >
              {reasonOptions.map((option) => (
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
            {t("refresh")}
          </button>
        </div>

        <div className="mt-4 flex items-center gap-6 text-sm text-(--color-text-primary)">
          <span className="font-bold">{t("allReportsHeading")}</span>
          <span>{t("reportedUsersCount", { count: groups.length })}</span>
          <span>{t("messagesCount", { count: filteredReports.length })}</span>
        </div>

        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-xl bg-(--color-error-surface) p-4 text-sm text-(--color-danger)"
          >
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
            <p className="mt-3 font-bold text-(--color-text-primary)">{t("noReportedMessages")}</p>
            <p className="mt-1 text-sm text-(--color-text-secondary)">
              {t("newReportsWillAppear")}
            </p>
          </div>
        ) : groups.length === 0 ? (
          <div className="mt-6 flex min-h-[520px] flex-col items-center justify-center rounded-2xl border border-white/70 bg-white/30 text-center">
            <Search className="h-9 w-9 text-(--color-brand-lavender)" />
            <p className="mt-3 font-bold text-(--color-text-primary)">{t("nothingFound")}</p>
            <p className="mt-1 text-sm text-(--color-text-secondary)">
              {t("tryAnotherSearch")}
            </p>
          </div>
        ) : (
          <div className="mt-6 grid min-h-[560px] grid-cols-[minmax(250px,0.9fr)_minmax(350px,1.45fr)_minmax(250px,0.9fr)] gap-5">
            <aside className="flex min-h-0 flex-col rounded-2xl border border-white/80 bg-white/20 p-4">
              <h2 className="px-1 text-sm font-bold text-(--color-text-primary)">{t("reportedUsersHeading")}</h2>
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
                          {fullName(group.user, t)}
                        </span>
                        <span className="mt-1 block truncate text-xs text-(--color-text-secondary)">
                          {reportMessagePreview(latestReport, t)}
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
                  {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : t("loadMoreReports")}
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
                          {fullName(selectedGroup.user, t)}
                        </h2>
                        <p className="mt-1 truncate text-xs text-(--color-text-secondary)">
                          {selectedGroup.user?.email || t("userAccountDeleted")}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-semibold text-(--color-text-secondary)">
                      {t("reportedMessagesCount", { count: selectedGroup.reports.length })}
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
                            <time
                              dateTime={report.message_created_at}
                              className="text-xs text-(--color-text-secondary)"
                            >
                              {t("sentDate", { date: dateTime(report.message_created_at, locale) })}
                            </time>
                          </div>
                          <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-(--color-text-primary)">
                            {reportMessagePreview(report, t)}
                          </p>
                          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/70 pt-3 text-xs text-(--color-text-secondary)">
                            <span>
                              {t("reportedByLabel")}{" "}
                              <strong className="text-(--color-text-primary)">
                                {fullName(report.reporter, t)}
                              </strong>
                            </span>
                            <span>{dateTime(report.created_at, locale)}</span>
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
                        {fullName(selectedReport.sender, t)}
                      </h2>
                      <p className="mt-1 text-xs capitalize text-(--color-text-secondary)">
                        {selectedReport.sender?.role ? tRoles(selectedReport.sender.role) : t("unknownRole")}
                      </p>
                      {selectedReport.sender ? (
                        <Link
                          href={`/profile/${selectedReport.sender.id}?view=review&from=moderator-chats`}
                          className="mt-2 inline-flex text-xs font-semibold text-(--color-blue) hover:underline"
                        >
                          {t("viewProfile")}
                        </Link>
                      ) : null}
                    </div>
                  </div>

                  <dl className="mt-6 space-y-3">
                    <DetailRow label={t("sender")}>
                      {selectedReport.sender?.email || t("deletedAccount")}
                    </DetailRow>
                    <DetailRow label={t("sent")}>
                      {dateTime(selectedReport.message_created_at, locale)}
                    </DetailRow>
                    <DetailRow label={t("messageId")}>#{selectedReport.message}</DetailRow>
                    <DetailRow label={t("chat")}>
                      {selectedReport.chat.title ||
                        (selectedReport.chat.type === "group"
                          ? t("groupChatFallback")
                          : t("directChatFallback"))}{" "}
                      · #{selectedReport.chat.id}
                    </DetailRow>
                  </dl>

                  <div className="mt-6 border-t border-white/80 pt-5">
                    <h3 className="text-sm font-bold text-(--color-text-primary)">
                      {t("reportInformationHeading")}
                    </h3>
                    <dl className="mt-4 space-y-3">
                      <DetailRow label={t("reason")}>
                        <span className="font-bold text-(--color-pink-dark)">
                          {selectedReport.reason_label}
                        </span>
                      </DetailRow>
                      <DetailRow label={t("reported")}>{dateTime(selectedReport.created_at, locale)}</DetailRow>
                      <DetailRow label={t("reporter")}>{fullName(selectedReport.reporter, t)}</DetailRow>
                      <DetailRow label={t("reporterRole")}>
                        <span className="capitalize">{tRoles(selectedReport.reporter.role)}</span>
                      </DetailRow>
                    </dl>
                  </div>

                  {selectedReport.details ? (
                    <div className="mt-5 rounded-xl bg-white/60 p-4">
                      <p className="text-xs font-bold text-(--color-text-primary)">{t("reporterNote")}</p>
                      <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-5 text-(--color-text-secondary)">
                        {selectedReport.details}
                      </p>
                    </div>
                  ) : null}

                  {selectedReport.attachments.length ? (
                    <div className="mt-5">
                      <h3 className="text-sm font-bold text-(--color-text-primary)">{t("attachmentsHeading")}</h3>
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
                              <span className="truncate">{t("attachmentNumber", { number: attachment.id })}</span>
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
                      {t("moderationUnavailable")}
                    </p>
                  )}

                  <div className="mt-6 rounded-xl border border-white/80 bg-white/40 p-3 text-xs text-(--color-text-secondary)">
                    {t("reportFooter", { number: selectedReport.id, date: compactDate(selectedReport.created_at, locale) })}
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
