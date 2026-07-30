"use client";

import { Link } from "@/i18n/navigation";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Ban,
  Check,
  ChevronDown,
  CircleAlert,
  Clock3,
  Eye,
  History,
  LockOpen,
  RefreshCw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  TriangleAlert,
  UserRoundCheck,
} from "lucide-react";
import {
  claimUserReport,
  getAllUserReports,
  getMyUserReports,
  getUnassignedUserReports,
  takeAdminUserReportAction,
  takeModeratorUserReportAction,
  type AdminUserReportAction,
  type ModeratedUserReport,
  type ModeratorUserReportAction,
  type PaginatedUserReports,
  type UserReportAuditAction,
  type UserReportReason,
  type UserReportResolution,
  type UserReportStatus,
  type UserReportUserSummary,
} from "@/entities/user";
import type { ApiError } from "@/shared/api/base";
import { formatDateTime } from "@/shared/lib/time";
import { ModalShell } from "@/shared/ui/ModalShell";
import { PageShell } from "@/shared/ui/PageShell";
import { Pagination } from "@/shared/ui/Pagination";
import { UserAvatar } from "../admin/UserAvatar";
import { UserReportActionModal } from "./UserReportActionModal";

export type UserReportsWorkspaceMode = "moderator" | "administrator";
type ReportAction = ModeratorUserReportAction | AdminUserReportAction;
type ReportTabKey = "all" | "unassigned" | "in_review" | "resolved" | "rejected" | "escalated";
type ReportEndpoint = "all" | "unassigned" | "mine";

type ReportTab = {
  key: ReportTabKey;
  endpoint: ReportEndpoint;
  status?: UserReportStatus;
  resolution?: Exclude<UserReportResolution, "">;
};

type Banner = { tone: "success" | "error"; message: string };
type PendingReportAction = {
  action: ReportAction;
  reportId: number;
  targetName: string;
};

const REPORTS_PER_PAGE = 5;

const MODERATOR_TABS: ReportTab[] = [
  { key: "unassigned", endpoint: "unassigned" },
  { key: "in_review", endpoint: "mine", status: "in_review" },
  { key: "resolved", endpoint: "mine", status: "resolved" },
  {
    key: "rejected",
    endpoint: "mine",
    status: "resolved",
    resolution: "dismissed",
  },
  { key: "escalated", endpoint: "mine", status: "escalated" },
];

const ADMIN_TABS: ReportTab[] = [
  { key: "all", endpoint: "all" },
  { key: "unassigned", endpoint: "unassigned" },
  { key: "in_review", endpoint: "all", status: "in_review" },
  { key: "resolved", endpoint: "all", status: "resolved" },
  {
    key: "rejected",
    endpoint: "all",
    status: "resolved",
    resolution: "dismissed",
  },
  { key: "escalated", endpoint: "all", status: "escalated" },
];

const REASON_VALUES: ("" | UserReportReason)[] = [
  "",
  "spam",
  "harassment",
  "hate",
  "violence",
  "sexual",
  "fraud",
  "impersonation",
  "inappropriate_profile",
  "other",
];

type Translator = (key: string, values?: Record<string, string | number>) => string;

function formatReportDate(value: string | null, locale: string, notRecordedLabel: string): string {
  if (!value) return notRecordedLabel;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return notRecordedLabel;
  return formatDateTime(date, locale, { dateStyle: "medium", timeStyle: "short" });
}

function fullName(user: UserReportUserSummary, userNumberFallback: string): string {
  return (
    user.name?.trim() ||
    (user.first_name + " " + user.last_name).trim() ||
    user.email ||
    userNumberFallback
  );
}

function reportStateLabel(report: ModeratedUserReport, tStates: Translator): string {
  if (report.status === "resolved" && report.resolution) {
    return tStates(report.resolution);
  }
  return tStates(report.status);
}

function actorRoleLabel(
  role: UserReportAuditAction["actor_role"],
  tRoles: Translator,
  t: Translator,
): string {
  if (role === "student" || role === "teacher" || role === "moderator" || role === "administrator") {
    return tRoles(role);
  }
  if (role === "system") return t("systemActor");
  return t("unknownRole");
}

function reportStateClass(report: ModeratedUserReport): string {
  if (report.resolution === "blocked") {
    return "border-(--color-danger) text-(--color-danger)";
  }
  if (report.resolution === "unblocked") {
    return "border-(--color-success) text-(--color-success)";
  }
  if (report.resolution === "warning") {
    return "border-[#E0A52B] text-[#9A6500]";
  }
  if (report.resolution === "dismissed") {
    return "border-(--color-text-secondary) text-(--color-text-secondary)";
  }
  if (report.status === "escalated") {
    return "border-(--color-pink-dark) text-(--color-pink-dark)";
  }
  if (report.status === "in_review") {
    return "border-[#E0A52B] text-[#9A6500]";
  }
  return "border-(--color-blue) text-(--color-blue)";
}

function ReportStateBadge({ report }: { report: ModeratedUserReport }) {
  const tStates = useTranslations("UserReportsWorkspace.states");
  return (
    <span
      className={
        "inline-flex shrink-0 rounded-full border bg-white px-3 py-1 text-xs font-semibold " +
        reportStateClass(report)
      }
    >
      {reportStateLabel(report, tStates)}
    </span>
  );
}

function ReportTabs({
  tabs,
  activeKey,
  onChange,
}: {
  tabs: ReportTab[];
  activeKey: ReportTabKey;
  onChange: (key: ReportTabKey) => void;
}) {
  const t = useTranslations("UserReportsWorkspace");
  return (
    <div
      role="tablist"
      aria-label={t("filterByStatusAriaLabel")}
      className="flex flex-wrap items-center"
      style={{ gap: "clamp(16px, 2.22vw, 32px)" }}
    >
      {tabs.map((tab) => {
        const active = tab.key === activeKey;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.key)}
            className={
              "cursor-pointer border-b-2 pb-1 text-(--color-text-primary) transition " +
              (active
                ? "border-(--color-blue) font-semibold"
                : "border-transparent font-normal hover:text-(--color-blue)")
            }
            style={{
              fontFamily: "var(--font-base)",
              fontSize: "clamp(16px, 1.67vw, 24px)",
            }}
          >
            {t(`tabs.${tab.key}`)}
          </button>
        );
      })}
    </div>
  );
}

function ReportsToolbar({
  query,
  reason,
  refreshing,
  onQueryChange,
  onReasonChange,
  onRefresh,
}: {
  query: string;
  reason: "" | UserReportReason;
  refreshing: boolean;
  onQueryChange: (value: string) => void;
  onReasonChange: (value: "" | UserReportReason) => void;
  onRefresh: () => void;
}) {
  const t = useTranslations("UserReportsWorkspace");
  const tReasons = useTranslations("ReportUser.reasons");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const activeFilters = reason ? 1 : 0;
  const reasonOptions = useMemo(
    () =>
      REASON_VALUES.map((value) => ({
        value,
        label: value === "" ? t("allReasons") : tReasons(value),
      })),
    [t, tReasons],
  );

  useEffect(() => {
    if (!filterOpen) return;

    function handleOutsideClick(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setFilterOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [filterOpen]);

  return (
    <div className="flex flex-wrap items-center gap-4 sm:gap-6">
      <label
        className="gradient-border flex max-w-full cursor-text items-center bg-white"
        style={{
          width: 329,
          height: 60,
          gap: 10,
          borderRadius: 40,
          padding: "0 22px",
        }}
      >
        <Search className="h-5 w-5 shrink-0 text-(--color-text-primary)" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchAriaLabel")}
          className="min-w-0 flex-1 bg-transparent text-base text-(--color-text-primary) outline-none placeholder:text-(--color-text-secondary)"
          style={{ fontFamily: "var(--font-base)" }}
        />
      </label>

      <div ref={filterRef} className="relative">
        <button
          type="button"
          aria-expanded={filterOpen}
          onClick={() => setFilterOpen((open) => !open)}
          className="flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-(--color-text-primary) shadow-sm transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-blue)"
          style={{ fontFamily: "var(--font-base)" }}
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          {t("allFilters")}
          {activeFilters > 0 ? (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-(--color-blue) px-1 text-xs text-white">
              {activeFilters}
            </span>
          ) : null}
          <ChevronDown
            className={"h-4 w-4 transition " + (filterOpen ? "rotate-180" : "")}
            aria-hidden="true"
          />
        </button>

        {filterOpen ? (
          <div
            className="absolute left-0 z-40 mt-2 w-[280px] overflow-hidden rounded-2xl bg-white py-3"
            style={{ boxShadow: "var(--shadow-sort-dropdown)" }}
          >
            <p className="px-4 pb-2 text-xs font-bold tracking-[0.08em] text-(--color-text-secondary) uppercase">
              {t("complaintReason")}
            </p>
            <div className="max-h-72 overflow-y-auto">
              {reasonOptions.map((option) => {
                const selected = option.value === reason;
                return (
                  <button
                    key={option.value || "all"}
                    type="button"
                    onClick={() => {
                      onReasonChange(option.value);
                      setFilterOpen(false);
                    }}
                    className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-(--color-text-primary) transition hover:bg-(--color-brand-lavender-soft)"
                  >
                    {option.label}
                    {selected ? (
                      <Check className="h-4 w-4 text-(--color-blue)" aria-hidden="true" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onRefresh}
        title={t("refreshComplaints")}
        aria-label={t("refreshComplaints")}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-(--color-text-primary) shadow-sm transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-blue)"
      >
        <RefreshCw className={"h-4 w-4 " + (refreshing ? "animate-spin" : "")} />
      </button>
    </div>
  );
}

function ReportCard({
  report,
  onReview,
  onDetails,
}: {
  report: ModeratedUserReport;
  onReview: () => void;
  onDetails: () => void;
}) {
  const t = useTranslations("UserReportsWorkspace");
  const tRoles = useTranslations("PublicProfile.roles");
  const tReasons = useTranslations("ReportUser.reasons");
  const tPublicProfile = useTranslations("PublicProfile");
  const locale = useLocale();
  return (
    <li className="flex min-h-[154px] flex-col gap-5 rounded-[18px] border border-(--color-border-light) bg-white px-5 py-5 transition hover:border-[#A7BAFA] hover:shadow-sm lg:flex-row lg:items-center lg:justify-between lg:px-7">
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <div className="flex min-w-0 items-center gap-3">
          <UserAvatar user={report.reported_user} size="48px" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="truncate font-bold text-(--color-text-primary)">
                {fullName(
                  report.reported_user,
                  tPublicProfile("userNumber", { id: report.reported_user.id }),
                )}
              </p>
              <time className="text-xs text-(--color-text-secondary)" dateTime={report.created_at}>
                {formatReportDate(report.created_at, locale, t("notRecorded"))}
              </time>
            </div>
            <p className="mt-0.5 truncate text-sm text-(--color-text-secondary)">
              {tRoles(report.reported_user.role)} · {report.reported_user.email}
            </p>
          </div>
        </div>

        <p className="mt-4 line-clamp-2 max-w-4xl break-words text-sm text-(--color-text-primary)">
          {report.details || t("noDetailsCard")}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <ReportStateBadge report={report} />
          <span className="text-sm font-semibold text-(--color-danger)">
            {tReasons(report.reason)}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 flex-row gap-2 lg:w-[126px] lg:flex-col">
        <button
          type="button"
          onClick={onReview}
          className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-full border border-(--color-text-primary) bg-white px-4 text-sm font-semibold text-(--color-text-primary) transition hover:bg-(--color-brand-lavender-soft) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-blue)"
        >
          {t("review")}
          <Eye className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onDetails}
          className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-full border border-(--color-text-primary) bg-white px-4 text-sm font-semibold text-(--color-text-primary) transition hover:bg-(--color-brand-lavender-soft) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-blue)"
        >
          {t("details")}
          <History className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[112px_minmax(0,1fr)] gap-3 text-sm">
      <dt className="text-(--color-text-secondary)">{label}</dt>
      <dd className="min-w-0 break-words font-medium text-(--color-text-primary)">{children}</dd>
    </div>
  );
}

function UserInformation({
  title,
  user,
  profileLink,
}: {
  title: string;
  user: UserReportUserSummary;
  profileLink: string;
}) {
  const t = useTranslations("UserReportsWorkspace");
  const tRoles = useTranslations("PublicProfile.roles");
  const tAccountStatus = useTranslations("UserReportsWorkspace.accountStatus");
  const tPublicProfile = useTranslations("PublicProfile");
  const locale = useLocale();
  const displayName = fullName(user, tPublicProfile("userNumber", { id: user.id }));
  return (
    <section className="rounded-2xl border border-(--color-border-light) bg-(--color-bg-surface) p-5">
      <div className="mb-5 flex items-center gap-3">
        <UserAvatar user={user} size="56px" />
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold text-(--color-text-primary)">{title}</h3>
          <p className="truncate text-sm text-(--color-text-secondary)">{displayName}</p>
        </div>
      </div>
      <dl className="flex flex-col gap-3">
        <InfoRow label={t("fullName")}>{displayName}</InfoRow>
        <InfoRow label={t("email")}>{user.email}</InfoRow>
        <InfoRow label={t("registered")}>
          {formatReportDate(user.date_joined, locale, t("notRecorded"))}
        </InfoRow>
        <InfoRow label={t("role")}>{tRoles(user.role)}</InfoRow>
        <InfoRow label={t("account")}>
          {user.is_blocked ? t("blocked") : tAccountStatus(user.status)}
        </InfoRow>
      </dl>
      <Link
        href={profileLink}
        className="mt-5 inline-flex rounded-full border border-(--color-blue) px-4 py-2 text-sm font-semibold text-(--color-blue) transition hover:bg-white"
      >
        {t("openProfile")}
      </Link>
    </section>
  );
}

function ProfileSnapshot({ report }: { report: ModeratedUserReport }) {
  const t = useTranslations("UserReportsWorkspace");
  const snapshot = report.profile_snapshot;
  if (!snapshot) return null;

  const links = [
    ["Instagram", snapshot.instagram],
    ["LinkedIn", snapshot.linkedin],
    ["Facebook", snapshot.facebook],
    ["Behance", snapshot.behance],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));

  if (!snapshot.avatar && links.length === 0) return null;

  return (
    <section className="rounded-2xl border border-(--color-border-light) bg-white p-5">
      <h3 className="text-base font-bold text-(--color-text-primary)">
        {t("profileAtReportTime")}
      </h3>
      <div className="mt-4 flex flex-wrap items-start gap-5">
        {snapshot.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={snapshot.avatar}
            alt={t("reportedUserAvatarAlt")}
            className="h-20 w-20 rounded-full object-cover"
          />
        ) : null}
        {links.length > 0 ? (
          <dl className="flex min-w-0 flex-1 flex-col gap-2">
            {links.map(([label, href]) => (
              <InfoRow key={label} label={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-(--color-blue) underline"
                >
                  {href}
                </a>
              </InfoRow>
            ))}
          </dl>
        ) : null}
      </div>
    </section>
  );
}

function ReviewActionButton({
  action,
  onClick,
  children,
}: {
  action: ReportAction;
  onClick: () => void;
  children: ReactNode;
}) {
  const colorClass =
    action === "block"
      ? "border-(--color-danger) text-(--color-danger)"
      : action === "unblock"
        ? "border-(--color-success) text-(--color-success)"
        : action === "escalate"
          ? "border-(--color-blue) text-(--color-blue)"
          : action === "warning"
            ? "border-[#E0A52B] text-[#9A6500]"
            : "border-(--color-text-secondary) text-(--color-text-secondary)";

  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-full border bg-white px-4 text-sm font-semibold transition hover:bg-(--color-brand-lavender-soft) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-blue) " +
        colorClass
      }
    >
      {children}
    </button>
  );
}

export function ReportReviewModal({
  report,
  mode,
  canClaim,
  claiming,
  readOnly = false,
  onClaim,
  onRequestAction,
  onClose,
}: {
  report: ModeratedUserReport;
  mode: UserReportsWorkspaceMode;
  canClaim: boolean;
  claiming: boolean;
  readOnly?: boolean;
  onClaim: () => void;
  onRequestAction: (action: ReportAction) => void;
  onClose: () => void;
}) {
  const t = useTranslations("UserReportsWorkspace");
  const tStates = useTranslations("UserReportsWorkspace.states");
  const tReasons = useTranslations("ReportUser.reasons");
  const tPublicProfile = useTranslations("PublicProfile");
  const locale = useLocale();
  const moderatorCanAct = !readOnly && mode === "moderator" && report.status === "in_review";
  const adminCanAct = !readOnly && mode === "administrator" && report.status === "escalated";
  const blockedDecision =
    report.status === "resolved" &&
    report.resolution === "blocked" &&
    report.reported_user.is_blocked;
  const moderatorCanUnblock =
    !readOnly &&
    mode === "moderator" &&
    blockedDecision &&
    report.assigned_moderator?.id === report.resolved_by?.id;
  const adminCanUnblock = !readOnly && mode === "administrator" && blockedDecision;
  const canUnblock = moderatorCanUnblock || adminCanUnblock;
  const canDecide = moderatorCanAct || adminCanAct;

  return (
    <ModalShell
      title={t("reviewComplaintTitle", { id: report.id })}
      icon={<Eye className="h-5 w-5" aria-hidden="true" />}
      width="min(1120px, calc(100vw - 32px))"
      padding="clamp(20px, 2.5vw, 36px)"
      maxHeight="92vh"
      onClose={onClose}
    >
      <div className="flex flex-col gap-5 font-(family-name:--font-base)">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-(--color-brand-lavender-soft) px-5 py-4">
          <div>
            <p className="text-sm text-(--color-text-secondary)">
              {t("currentProcessingStatus")}
            </p>
            <p className="mt-1 font-bold text-(--color-text-primary)">
              {reportStateLabel(report, tStates)}
            </p>
          </div>
          <ReportStateBadge report={report} />
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <UserInformation
            title={t("reportedUser")}
            user={report.reported_user}
            profileLink={
              "/profile/" +
              report.reported_user.id +
              "?view=review&from=" +
              (mode === "moderator" ? "moderator-reports" : "admin-reports")
            }
          />
          <UserInformation
            title={t("complaintSubmittedBy")}
            user={report.reporter}
            profileLink={
              "/profile/" +
              report.reporter.id +
              "?view=review&from=" +
              (mode === "moderator" ? "moderator-reports" : "admin-reports")
            }
          />
        </div>

        <section className="rounded-2xl border border-(--color-border-light) bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-[0.08em] text-(--color-text-secondary) uppercase">
                {t("complaintReason")}
              </p>
              <h3 className="mt-1 text-lg font-bold text-(--color-danger)">
                {tReasons(report.reason)}
              </h3>
            </div>
            <time className="text-sm text-(--color-text-secondary)" dateTime={report.created_at}>
              {t("submittedDate", {
                date: formatReportDate(report.created_at, locale, t("notRecorded")),
              })}
            </time>
          </div>
          <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-(--color-text-primary)">
            {report.details || t("noDetailsModal")}
          </p>
        </section>

        <ProfileSnapshot report={report} />

        <section className="grid gap-4 rounded-2xl border border-(--color-border-light) bg-(--color-bg-surface) p-5 sm:grid-cols-2">
          <div>
            <p className="text-xs font-bold tracking-[0.08em] text-(--color-text-secondary) uppercase">
              {t("assignedModerator")}
            </p>
            <p className="mt-2 text-sm font-semibold text-(--color-text-primary)">
              {report.assigned_moderator
                ? fullName(
                    report.assigned_moderator,
                    tPublicProfile("userNumber", { id: report.assigned_moderator.id }),
                  )
                : t("notAssigned")}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold tracking-[0.08em] text-(--color-text-secondary) uppercase">
              {t("latestDecision")}
            </p>
            <p className="mt-2 text-sm font-semibold text-(--color-text-primary)">
              {report.resolution ? tStates(report.resolution) : tStates(report.status)}
            </p>
            {report.resolution_note || report.escalation_note ? (
              <p className="mt-2 whitespace-pre-wrap break-words text-sm text-(--color-text-secondary)">
                {report.resolution_note || report.escalation_note}
              </p>
            ) : null}
          </div>
        </section>

        {canClaim && !readOnly ? (
          <div className="border-t border-(--color-border-light) pt-5">
            <button
              type="button"
              disabled={claiming}
              onClick={onClaim}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-(--color-text-primary) px-5 text-sm font-semibold text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <UserRoundCheck className="h-4 w-4" aria-hidden="true" />
              {claiming ? t("assigning") : t("assignToMe")}
            </button>
          </div>
        ) : null}

        {canDecide || canUnblock ? (
          <section className="border-t border-(--color-border-light) pt-5">
            <h3 className="mb-4 text-lg font-bold text-(--color-text-primary)">
              {t("takeAction")}
            </h3>
            <div className="flex flex-wrap gap-3">
              {canDecide ? (
                <>
                  <ReviewActionButton action="warning" onClick={() => onRequestAction("warning")}>
                    <TriangleAlert className="h-4 w-4" aria-hidden="true" />
                    {t("actionWarning")}
                  </ReviewActionButton>
                  <ReviewActionButton action="block" onClick={() => onRequestAction("block")}>
                    <Ban className="h-4 w-4" aria-hidden="true" />
                    {t("actionBlockSiteAccess")}
                  </ReviewActionButton>
                </>
              ) : null}

              {canUnblock ? (
                <ReviewActionButton action="unblock" onClick={() => onRequestAction("unblock")}>
                  <LockOpen className="h-4 w-4" aria-hidden="true" />
                  {t("actionRestoreSiteAccess")}
                </ReviewActionButton>
              ) : null}

              {moderatorCanAct ? (
                <ReviewActionButton action="escalate" onClick={() => onRequestAction("escalate")}>
                  <ShieldAlert className="h-4 w-4" aria-hidden="true" />
                  {t("actionEscalateToAdministrator")}
                </ReviewActionButton>
              ) : null}

              {canDecide ? (
                <ReviewActionButton action="dismiss" onClick={() => onRequestAction("dismiss")}>
                  <CircleAlert className="h-4 w-4" aria-hidden="true" />
                  {t("actionRejectComplaint")}
                </ReviewActionButton>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
    </ModalShell>
  );
}

function ReportHistoryModal({
  report,
  onClose,
}: {
  report: ModeratedUserReport;
  onClose: () => void;
}) {
  const t = useTranslations("UserReportsWorkspace");
  const tStates = useTranslations("UserReportsWorkspace.states");
  const tRoles = useTranslations("PublicProfile.roles");
  const tPublicProfile = useTranslations("PublicProfile");
  const locale = useLocale();
  return (
    <ModalShell
      title={t("historyModalTitle", { id: report.id })}
      icon={<History className="h-5 w-5" aria-hidden="true" />}
      width="min(760px, calc(100vw - 32px))"
      padding="clamp(20px, 2.5vw, 36px)"
      maxHeight="90vh"
      onClose={onClose}
    >
      <div className="font-(family-name:--font-base)">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-(--color-brand-lavender-soft) px-5 py-4">
          <div>
            <p className="text-sm text-(--color-text-secondary)">{t("latestDecision")}</p>
            <p className="mt-1 font-bold text-(--color-text-primary)">
              {reportStateLabel(report, tStates)}
            </p>
          </div>
          <ReportStateBadge report={report} />
        </div>

        {report.actions.length === 0 ? (
          <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-2xl border border-(--color-border-light) text-center text-(--color-text-secondary)">
            <Clock3 className="h-6 w-6" aria-hidden="true" />
            {t("noActionsRecorded")}
          </div>
        ) : (
          <ol className="relative ml-2 border-l-2 border-[#D6E0FF] pl-6">
            {report.actions.map((action) => (
              <li key={action.id} className="relative pb-6 last:pb-0">
                <span className="absolute top-1 -left-[31px] h-3 w-3 rounded-full border-2 border-white bg-(--color-blue)" />
                <article className="rounded-2xl border border-(--color-border-light) bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-(--color-text-primary)">
                        {tStates(action.action)}
                      </p>
                      <p className="mt-1 text-sm text-(--color-text-secondary)">
                        {action.actor
                          ? fullName(action.actor, tPublicProfile("userNumber", { id: action.actor.id }))
                          : t("systemActor")}
                        {" · "}
                        {actorRoleLabel(action.actor_role, tRoles, t)}
                      </p>
                    </div>
                    <time
                      className="text-xs text-(--color-text-secondary)"
                      dateTime={action.created_at}
                    >
                      {formatReportDate(action.created_at, locale, t("notRecorded"))}
                    </time>
                  </div>
                  <p className="mt-3 text-xs font-semibold tracking-wide text-(--color-text-secondary) uppercase">
                    {tStates(action.previous_status)}
                    {" → "}
                    {tStates(action.new_status)}
                  </p>
                  {action.note ? (
                    <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-(--color-text-primary)">
                      {action.note}
                    </p>
                  ) : null}
                </article>
              </li>
            ))}
          </ol>
        )}
      </div>
    </ModalShell>
  );
}

async function loadReports(
  tab: ReportTab,
  page: number,
  reason: UserReportReason | undefined,
  search: string | undefined,
): Promise<PaginatedUserReports> {
  const params = {
    page,
    page_size: REPORTS_PER_PAGE,
    reason,
    search,
    status: tab.status,
    resolution: tab.resolution,
  };
  if (tab.endpoint === "unassigned") {
    return getUnassignedUserReports({
      page,
      page_size: REPORTS_PER_PAGE,
      reason,
      search,
    });
  }
  if (tab.endpoint === "mine") return getMyUserReports(params);
  return getAllUserReports(params);
}

function nextTabForAction(action: ReportAction): ReportTabKey {
  if (action === "escalate") return "escalated";
  if (action === "dismiss") return "rejected";
  return "resolved";
}

/** Displays role-aware complaint queues, review controls, and immutable action history. */
export function UserReportsWorkspace({ mode }: { mode: UserReportsWorkspaceMode }) {
  const t = useTranslations("UserReportsWorkspace");
  const tPublicProfile = useTranslations("PublicProfile");
  const tabs = mode === "moderator" ? MODERATOR_TABS : ADMIN_TABS;
  const [activeTabKey, setActiveTabKey] = useState<ReportTabKey>(tabs[0].key);
  const activeTab = tabs.find((tab) => tab.key === activeTabKey) ?? tabs[0];
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [reason, setReason] = useState<"" | UserReportReason>("");
  const [reports, setReports] = useState<PaginatedUserReports>({
    count: 0,
    next: null,
    previous: null,
    results: [],
  });
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [listError, setListError] = useState<string | null>(null);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [claimingId, setClaimingId] = useState<number | null>(null);
  const [reviewReport, setReviewReport] = useState<ModeratedUserReport | null>(null);
  const [historyReport, setHistoryReport] = useState<ModeratedUserReport | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingReportAction | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const bannerRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(query.trim());
      setPage(1);
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [query]);

  const requestKey = [mode, activeTab.key, page, reason, search, refreshKey].join("|");
  const loading = loadedKey !== requestKey;
  const refresh = useCallback(() => setRefreshKey((value) => value + 1), []);

  useEffect(() => {
    if (banner) bannerRef.current?.focus();
  }, [banner]);

  useEffect(() => {
    let cancelled = false;
    loadReports(activeTab, page, reason || undefined, search || undefined)
      .then((data) => {
        if (cancelled) return;
        setReports(data);
        setListError(null);
        setLoadedKey(requestKey);
      })
      .catch((error: ApiError) => {
        if (cancelled) return;
        if (error.status === 404 && page > 1) {
          setPage(1);
          return;
        }
        setReports({ count: 0, next: null, previous: null, results: [] });
        setListError(error.detail || error.message || t("failedToLoad"));
        setLoadedKey(requestKey);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab, page, reason, requestKey, search, t]);

  function changeTab(key: ReportTabKey) {
    setActiveTabKey(key);
    setPage(1);
    setReviewReport(null);
    setHistoryReport(null);
    setBanner(null);
  }

  async function handleClaim(reportId: number) {
    setClaimingId(reportId);
    setBanner(null);
    try {
      await claimUserReport(reportId);
      setReviewReport(null);
      setActiveTabKey("in_review");
      setPage(1);
      setBanner({ tone: "success", message: t("complaintAssigned") });
      refresh();
    } catch (error) {
      const apiError = error as ApiError;
      setBanner({
        tone: "error",
        message:
          apiError.status === 409
            ? t("claimConflict")
            : apiError.detail || apiError.message || t("failedToAssign"),
      });
      refresh();
    } finally {
      setClaimingId(null);
    }
  }

  function requestAction(report: ModeratedUserReport, action: ReportAction) {
    setActionError(null);
    setReviewReport(null);
    setPendingAction({
      action,
      reportId: report.id,
      targetName: fullName(
        report.reported_user,
        tPublicProfile("userNumber", { id: report.reported_user.id }),
      ),
    });
  }

  async function handleActionSubmit(note: string) {
    if (!pendingAction) return;
    setActionLoading(true);
    setActionError(null);
    try {
      if (mode === "moderator") {
        await takeModeratorUserReportAction(pendingAction.reportId, {
          action: pendingAction.action,
          note,
        });
      } else {
        await takeAdminUserReportAction(pendingAction.reportId, {
          action: pendingAction.action as AdminUserReportAction,
          note,
        });
      }

      const completedAction = pendingAction.action;
      setPendingAction(null);
      setHistoryReport(null);
      setActiveTabKey(nextTabForAction(completedAction));
      setPage(1);
      setBanner({
        tone: "success",
        message: t("decisionSaved"),
      });
      refresh();
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError.status === 409) {
        setPendingAction(null);
        setActionError(null);
        setBanner({
          tone: "error",
          message: t("reportChangedConflict"),
        });
        refresh();
      } else {
        setActionError(apiError.detail || apiError.message || t("failedToSaveDecision"));
      }
    } finally {
      setActionLoading(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(reports.count / REPORTS_PER_PAGE));

  return (
    <PageShell className="bg-(--color-brand-lavender-soft)">
      <div className="mx-auto flex w-full max-w-[1648px] flex-col font-(family-name:--font-base)">
        <h1
          className="font-semibold text-(--color-text-primary)"
          style={{
            fontSize: "clamp(24px, 2.5vw, 36px)",
            margin: "0 0 clamp(16px, 1.67vw, 24px)",
          }}
        >
          {t("pageTitle")}
        </h1>

        <div style={{ marginBottom: "clamp(20px, 2vw, 30px)" }}>
          <ReportTabs tabs={tabs} activeKey={activeTab.key} onChange={changeTab} />
        </div>

        <div style={{ marginBottom: "clamp(20px, 2vw, 30px)" }}>
          <ReportsToolbar
            query={query}
            reason={reason}
            refreshing={loading}
            onQueryChange={setQuery}
            onReasonChange={(value) => {
              setReason(value);
              setPage(1);
            }}
            onRefresh={refresh}
          />
        </div>

        {banner ? (
          <p
            ref={bannerRef}
            role={banner.tone === "error" ? "alert" : "status"}
            tabIndex={-1}
            className={
              "mb-5 rounded-2xl border bg-white px-5 py-3 text-sm font-semibold " +
              (banner.tone === "success"
                ? "border-(--color-success) text-(--color-success)"
                : "border-(--color-danger) text-(--color-danger)")
            }
          >
            {banner.message}
          </p>
        ) : null}

        <section className="min-h-[520px] rounded-[20px] bg-white p-4 shadow-(--shadow-dashboard-card) sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-(--color-text-primary)">
              {t(`tabs.${activeTab.key}`)}
            </h2>
            <span className="text-sm text-(--color-text-secondary)">
              {t("complaintsCount", { count: reports.count })}
            </span>
          </div>

          {loading ? (
            <div
              className="flex min-h-[390px] items-center justify-center gap-3 text-(--color-text-secondary)"
              role="status"
            >
              <RefreshCw className="h-5 w-5 animate-spin" aria-hidden="true" />
              {t("loadingComplaints")}
            </div>
          ) : listError ? (
            <div className="flex min-h-[390px] flex-col items-center justify-center gap-4 text-center">
              <p className="text-sm text-(--color-danger)" role="alert">
                {listError}
              </p>
              <button
                type="button"
                onClick={refresh}
                className="rounded-full border border-(--color-text-primary) px-5 py-2 text-sm font-semibold text-(--color-text-primary)"
              >
                {t("tryAgain")}
              </button>
            </div>
          ) : reports.results.length === 0 ? (
            <div className="flex min-h-[390px] flex-col items-center justify-center gap-3 text-center text-(--color-text-secondary)">
              <CircleAlert className="h-7 w-7" aria-hidden="true" />
              {t("noComplaintsMatch")}
            </div>
          ) : (
            <ul className="flex flex-col gap-4">
              {reports.results.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  onReview={() => setReviewReport(report)}
                  onDetails={() => setHistoryReport(report)}
                />
              ))}
            </ul>
          )}

          {!loading && !listError && totalPages > 1 ? (
            <div className="mt-7">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(nextPage) => {
                  setPage(nextPage);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </div>
          ) : null}
        </section>
      </div>

      {reviewReport ? (
        <ReportReviewModal
          report={reviewReport}
          mode={mode}
          canClaim={mode === "moderator" && activeTab.key === "unassigned"}
          claiming={claimingId === reviewReport.id}
          onClaim={() => void handleClaim(reviewReport.id)}
          onRequestAction={(action) => requestAction(reviewReport, action)}
          onClose={() => setReviewReport(null)}
        />
      ) : null}

      {historyReport ? (
        <ReportHistoryModal report={historyReport} onClose={() => setHistoryReport(null)} />
      ) : null}

      {pendingAction ? (
        <UserReportActionModal
          action={pendingAction.action}
          targetName={pendingAction.targetName}
          loading={actionLoading}
          error={actionError}
          onSubmit={handleActionSubmit}
          onClose={() => {
            if (actionLoading) return;
            setPendingAction(null);
            setActionError(null);
          }}
        />
      ) : null}
    </PageShell>
  );
}
