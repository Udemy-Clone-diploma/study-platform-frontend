"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import {
  AlertCircle,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Flag,
  Loader2,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { getUnassignedUserReports, getUsers, type UserData } from "@/entities/user";
import { CURRENCIES, getCourses, type CourseListItem, type Currency } from "@/entities/course";
import {
  formatMoney,
  getPaymentsSummary,
  getRevenueTimeseries,
  MONEY_UNAVAILABLE,
  type RevenueTimeseriesRow,
} from "@/entities/payment";
import { getCertificateCounts } from "@/entities/certificate";
import { getTeacherApplications } from "@/entities/teacher-application";
import { CourseStatusBadge } from "@/features/courses";
import type { ApiError } from "@/shared/api/base";
import { PageShell } from "@/shared/ui/PageShell";
import { StudentAvatar } from "@/shared/ui/StudentAvatar";

type RoleSlice = { key: string; label: string; count: number; color: string };

type AttentionQueue = {
  key: string;
  label: string;
  hint: string;
  count: number;
  href: string;
  icon: ReactNode;
};

type CurrencyRevenue = {
  currency: Currency;
  net: string;
  change: number | null;
};

type AdminDashboardData = {
  totalUsers: number;
  newUsers7d: number;
  totalCourses: number;
  publishedCourses: number;
  coursesInModeration: number;
  certificates: number;
  revenue: CurrencyRevenue[];
  revenueTrend: RevenueTimeseriesRow[];
  revenueError: string | null;
  roles: RoleSlice[];
  attention: AttentionQueue[];
  latestUsers: UserData[];
  recentCourses: CourseListItem[];
};

const DAY = 24 * 60 * 60 * 1000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function iso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function fmtDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
}

function userName(user: UserData): string {
  return `${user.first_name} ${user.last_name}`.trim() || user.email;
}

function percentChange(current: string | null, previous: string | null): number | null {
  if (current === null || previous === null) return null;
  const now = Number(current);
  const before = Number(previous);
  if (!Number.isFinite(now) || !Number.isFinite(before) || before === 0) return null;
  return ((now - before) / before) * 100;
}

function settled<T>(result: PromiseSettledResult<T>, fallback: T): T {
  return result.status === "fulfilled" ? result.value : fallback;
}

function busiestCurrency(data: AdminDashboardData | null): Currency {
  if (data?.revenue.length) return data.revenue[0].currency;
  const earning = data?.revenueTrend.find((row) => Number(row.gross_revenue) > 0);
  return earning?.currency ?? "USD";
}

function revenueFailure(...results: PromiseSettledResult<unknown>[]): string | null {
  const rejected = results.find((result) => result.status === "rejected");
  if (!rejected) return null;
  return (
    ((rejected as PromiseRejectedResult).reason as ApiError)?.message ??
    "Revenue data could not be loaded."
  );
}

async function loadAdminDashboard(): Promise<AdminDashboardData> {
  const now = new Date();
  const monthWindow = new Date(now.getTime() - 30 * DAY);
  const revenueWindow = { date_from: iso(monthWindow), date_to: iso(now) };

  const [
    allUsers,
    students,
    teachers,
    moderators,
    latest,
    coursesTotal,
    published,
    inModeration,
    recent,
    summary,
    timeseries,
    certificates,
    applications,
    reports,
  ] = await Promise.allSettled([
    getUsers({ pageSize: 1 }),
    getUsers({ pageSize: 1, role: "student" }),
    getUsers({ pageSize: 1, role: "teacher" }),
    getUsers({ pageSize: 1, role: "moderator" }),
    getUsers({ pageSize: 50, ordering: "-date_joined" }),
    getCourses({ page_size: 1 }),
    getCourses({ page_size: 1, status: "published" }),
    getCourses({ page_size: 1, status: ["review", "needs_revision"] }),
    getCourses({ page_size: 6, ordering: "-created_at" }),
    getPaymentsSummary(revenueWindow),
    getRevenueTimeseries({ group_by: "month" }),
    getCertificateCounts(),
    getTeacherApplications({ pageSize: 1, status: "pending" }),
    getUnassignedUserReports({ page_size: 1 }),
  ]);

  const empty = { count: 0, next: null, previous: null, results: [] };
  const totalUsers = settled(allUsers, empty).count;
  const studentCount = settled(students, empty).count;
  const teacherCount = settled(teachers, empty).count;
  const moderatorCount = settled(moderators, empty).count;
  const latestUsers = settled(latest, empty).results;
  const adminCount = Math.max(0, totalUsers - studentCount - teacherCount - moderatorCount);

  const weekAgo = now.getTime() - 7 * DAY;
  const newUsers7d = latestUsers.filter(
    (user) => new Date(user.date_joined).getTime() >= weekAgo,
  ).length;

  const totalCourses = settled(coursesTotal, empty).count;
  const publishedCourses = settled(published, empty).count;
  const coursesInModeration = settled(inModeration, empty).count;
  const recentCourses = settled(recent, empty).results;

  const summaryData = settled(
    summary,
    null as Awaited<ReturnType<typeof getPaymentsSummary>> | null,
  );
  const revenue: CurrencyRevenue[] = (summaryData?.by_currency ?? [])
    .slice()
    .sort((a, b) => Number(b.gross_revenue) - Number(a.gross_revenue))
    .map((row) => ({
      currency: row.currency,
      net: row.net_revenue,
      change: percentChange(
        row.net_revenue,
        summaryData?.previous?.by_currency.find((prev) => prev.currency === row.currency)
          ?.net_revenue ?? null,
      ),
    }));

  const applicationsCount = settled(applications, empty).count;
  const reportsCount = settled(reports, empty).count;

  return {
    totalUsers,
    newUsers7d,
    totalCourses,
    publishedCourses,
    coursesInModeration,
    certificates: settled(certificates, { total: 0, valid: 0, revoked: 0 }).valid,
    revenue,
    revenueTrend: settled(timeseries, [] as RevenueTimeseriesRow[]),
    revenueError: revenueFailure(summary, timeseries),
    roles: [
      {
        key: "student",
        label: "Students",
        count: studentCount,
        color: "var(--color-brand-lavender)",
      },
      { key: "teacher", label: "Teachers", count: teacherCount, color: "var(--color-brand-pink)" },
      { key: "moderator", label: "Moderators", count: moderatorCount, color: "var(--color-gold)" },
      {
        key: "administrator",
        label: "Administrators",
        count: adminCount,
        color: "var(--color-blue)",
      },
    ],
    attention: [
      {
        key: "review",
        label: "Courses under moderation",
        hint: "Awaiting review or revision",
        count: coursesInModeration,
        href: "/admin/courses?status=moderation",
        icon: <ClipboardCheck className="h-5 w-5" />,
      },
      {
        key: "applications",
        label: "Teacher applications",
        hint: "Awaiting a decision",
        count: applicationsCount,
        href: "/admin/teacher-applications",
        icon: <UserPlus className="h-5 w-5" />,
      },
      {
        key: "reports",
        label: "Open user reports",
        hint: "Unassigned reports",
        count: reportsCount,
        href: "/admin/reports",
        icon: <Flag className="h-5 w-5" />,
      },
    ],
    latestUsers: latestUsers.slice(0, 5),
    recentCourses: recentCourses.slice(0, 5),
  };
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-xl bg-white shadow-[0_0_17px_rgba(0,0,0,0.16)] ${className}`.trim()}
    >
      {children}
    </section>
  );
}

function Change({ pct }: { pct: number }) {
  const up = pct >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span
      className="flex items-center gap-1 text-xs"
      style={{ color: up ? "var(--color-success)" : "var(--color-rejected)" }}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {up ? "+" : ""}
      {pct.toFixed(1)}%
    </span>
  );
}

function StatCard({
  label,
  value,
  icon,
  footer,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  footer: ReactNode;
}) {
  return (
    <Card className="flex min-h-36 flex-col p-5">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-base font-normal text-(--color-text-primary)">{label}</h2>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(--color-brand-lavender-soft) text-(--color-blue)">
          {icon}
        </span>
      </div>
      <div className="my-3 overflow-hidden rounded-lg bg-(image:--gradient-student-stat) px-3 py-2">
        <span className="block truncate text-[28px] leading-[35px] font-medium text-(--color-blue)">
          {value}
        </span>
      </div>
      <div className="mt-auto text-sm text-(--color-text-secondary)">{footer}</div>
    </Card>
  );
}

function TabGroup<T extends string>({
  options,
  active,
  onChange,
  ariaLabel,
}: {
  options: readonly { key: T; label: string }[];
  active: T | null;
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  return (
    <div
      className="flex shrink-0 gap-0.5 rounded-full border border-black/10 p-0.5"
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          onClick={() => onChange(option.key)}
          aria-pressed={option.key === active}
          className={`cursor-pointer rounded-full px-3 py-1 text-xs transition-colors ${
            option.key === active
              ? "bg-(--color-brand-lavender-soft) font-medium text-(--color-blue)"
              : "text-(--color-text-secondary) hover:text-(--color-blue)"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

const CHART_W = 600;
const CHART_H = 130;
const CHART_Y_TOP = 4;
const CHART_Y_BASE = 126;
const NICE_STEPS = [1, 2, 2.5, 5, 10];
const MAX_X_LABELS = 12;

const RANGES = [
  { key: "6m", label: "6M", caption: "last 6 months" },
  { key: "ytd", label: "YTD", caption: "year to date" },
  { key: "12m", label: "12M", caption: "last 12 months" },
  { key: "all", label: "All", caption: "all time" },
] as const;

type RangeKey = (typeof RANGES)[number]["key"];

const CURRENCY_OPTIONS = CURRENCIES.map((currency) => ({ key: currency, label: currency }));

function compact(value: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(
    value,
  );
}

function axisTicks(peak: number): number[] {
  const rough = peak / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const normalized = rough / magnitude;
  const step = Math.max(
    1,
    (NICE_STEPS.find((candidate) => normalized <= candidate) ?? 10) * magnitude,
  );
  const ticks: number[] = [];
  for (let value = 0; value < peak + step; value += step) ticks.push(value);
  return ticks;
}

function monthLabel(period: string, withYear: boolean): string {
  const [year, month] = period.split("-");
  const name = MONTHS[Number(month) - 1] ?? period;
  return withYear ? `${name} '${year.slice(2)}` : name;
}

function edgeShift(index: number, count: number): string {
  if (index === 0) return "0";
  if (index === count - 1) return "-100%";
  return "-50%";
}

function inRange(rows: RevenueTimeseriesRow[], range: RangeKey): RevenueTimeseriesRow[] {
  if (range === "all") return rows;
  if (range === "ytd") {
    const year = String(new Date().getFullYear());
    return rows.filter((row) => row.period.startsWith(year));
  }
  return rows.slice(range === "6m" ? -6 : -12);
}

function RevenueCard({
  rows,
  revenue,
  currency,
  onCurrencyChange,
  error,
}: {
  rows: RevenueTimeseriesRow[];
  revenue: CurrencyRevenue | null;
  currency: Currency;
  onCurrencyChange: (value: Currency) => void;
  error: string | null;
}) {
  const [range, setRange] = useState<RangeKey>("12m");
  const [hover, setHover] = useState<number | null>(null);

  const months = rows
    .filter((row) => row.currency === currency)
    .slice()
    .sort((a, b) => a.period.localeCompare(b.period));
  const points = inRange(months, range);
  const values = points.map((point) => Number(point.gross_revenue) || 0);
  const max = Math.max(1, ...values);
  const ticks = axisTicks(max);
  const axisTop = ticks[ticks.length - 1];
  const total = values.reduce((sum, value) => sum + value, 0);
  const caption = RANGES.find((option) => option.key === range)?.caption ?? "";
  const active = hover !== null && hover < points.length ? hover : null;
  const withYear = new Set(points.map((point) => point.period.slice(0, 4))).size > 1;
  const labelStep = Math.max(1, Math.ceil(points.length / MAX_X_LABELS));

  const xFor = (index: number) =>
    points.length <= 1 ? 0 : (index * CHART_W) / (points.length - 1);
  const yFor = (value: number) => CHART_Y_BASE - (value / axisTop) * (CHART_Y_BASE - CHART_Y_TOP);
  const leftOf = (index: number) => `${(xFor(index) / CHART_W) * 100}%`;

  const lineD = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${xFor(index)} ${yFor(values[index])}`)
    .join(" ");
  const areaD =
    points.length > 0
      ? `${lineD} L${xFor(points.length - 1)} ${CHART_Y_BASE} L${xFor(0)} ${CHART_Y_BASE} Z`
      : "";

  function trackHover(event: React.MouseEvent<HTMLDivElement>) {
    if (points.length === 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    const index = Math.round(ratio * (points.length - 1));
    setHover(Math.min(points.length - 1, Math.max(0, index)));
  }

  return (
    <Card className="flex h-full flex-col p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-bold text-(--color-text-primary)">Revenue</h2>
        <TabGroup
          options={CURRENCY_OPTIONS}
          active={currency}
          onChange={onCurrencyChange}
          ariaLabel="Revenue currency"
        />
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-x-10 gap-y-4">
        <div>
          <span className="block text-[28px] leading-[35px] font-medium text-(--color-blue)">
            {formatMoney(String(total), currency)}
          </span>
          <span className="mt-1 block text-xs text-(--color-text-secondary)">
            Gross revenue, {caption}
          </span>
        </div>
        <div>
          <span className="flex items-center gap-2">
            <span className="text-xl leading-7 font-medium text-(--color-text-primary)">
              {revenue === null ? MONEY_UNAVAILABLE : formatMoney(revenue.net, currency)}
            </span>
            {revenue?.change == null ? null : <Change pct={revenue.change} />}
          </span>
          <span className="mt-1 block text-xs text-(--color-text-secondary)">
            Net revenue, last 30 days
          </span>
        </div>
      </div>

      {error ? (
        <p role="alert" className="mb-3 text-sm text-(--color-rejected)">
          {error}
        </p>
      ) : null}

      <div className="mb-3 flex justify-end">
        <TabGroup options={RANGES} active={range} onChange={setRange} ariaLabel="Revenue period" />
      </div>

      <div className="flex min-h-44 flex-1 flex-col">
        {points.length > 0 ? (
          <>
            <div className="flex flex-1 gap-2">
              <div className="flex w-10 shrink-0 flex-col justify-between text-right text-[10px] leading-none text-(--color-text-secondary)">
                {ticks
                  .slice()
                  .reverse()
                  .map((tick) => (
                    <span key={tick}>{compact(tick)}</span>
                  ))}
              </div>
              <div
                className="relative min-w-0 flex-1"
                onMouseMove={trackHover}
                onMouseLeave={() => setHover(null)}
              >
                <svg
                  className="absolute inset-0 h-full w-full"
                  viewBox={`0 0 ${CHART_W} ${CHART_H}`}
                  preserveAspectRatio="none"
                  role="img"
                  aria-label={`Revenue over the ${caption}, peaking at ${formatMoney(String(max), currency)}`}
                >
                  <defs>
                    <linearGradient id="adminRevenueFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-brand-lavender)" stopOpacity="0.7" />
                      <stop offset="52%" stopColor="var(--color-brand-pink)" stopOpacity="0.65" />
                      <stop offset="100%" stopColor="var(--color-brand-cream)" stopOpacity="0.35" />
                    </linearGradient>
                  </defs>
                  {ticks.map((tick) => (
                    <line
                      key={tick}
                      x1="0"
                      x2={CHART_W}
                      y1={yFor(tick)}
                      y2={yFor(tick)}
                      stroke="var(--color-chart-grid)"
                      strokeWidth="1"
                      vectorEffect="non-scaling-stroke"
                    />
                  ))}
                  <path d={areaD} fill="url(#adminRevenueFill)" />
                  <path
                    d={lineD}
                    fill="none"
                    stroke="var(--color-brand-lavender)"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>

                {active !== null ? (
                  <>
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-y-0 border-l border-dashed border-(--color-brand-lavender)"
                      style={{ left: leftOf(active) }}
                    />
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-(--color-blue)"
                      style={{
                        left: leftOf(active),
                        top: `${(yFor(values[active]) / CHART_H) * 100}%`,
                      }}
                    />
                    <div
                      className="pointer-events-none absolute top-0 rounded-lg bg-white px-2.5 py-1.5 whitespace-nowrap shadow-[0_2px_10px_rgba(0,0,0,0.16)]"
                      style={{
                        left: leftOf(active),
                        transform: `translateX(${edgeShift(active, points.length)})`,
                      }}
                    >
                      <span className="block text-[10px] text-(--color-text-secondary)">
                        {monthLabel(points[active].period, withYear)}
                      </span>
                      <span className="block text-xs font-semibold text-(--color-text-primary)">
                        {formatMoney(points[active].gross_revenue, currency)}
                      </span>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
            <div className="relative mt-2 ml-12 h-4 text-[10px] text-(--color-text-secondary)">
              {points.map((point, index) =>
                (points.length - 1 - index) % labelStep === 0 ? (
                  <span
                    key={point.period}
                    className={`absolute whitespace-nowrap ${
                      index === active ? "font-semibold text-(--color-text-primary)" : ""
                    }`.trim()}
                    style={{
                      left: leftOf(index),
                      transform: `translateX(${edgeShift(index, points.length)})`,
                    }}
                  >
                    {monthLabel(point.period, withYear)}
                  </span>
                ) : null,
              )}
            </div>
          </>
        ) : (
          <div className="flex h-full min-h-44 items-center justify-center text-sm text-(--color-text-secondary)">
            No {currency} revenue recorded in this period.
          </div>
        )}
      </div>
    </Card>
  );
}

function AttentionPanel({ queues }: { queues: AttentionQueue[] }) {
  return (
    <Card className="p-5">
      <h2 className="mb-4 text-base font-bold text-(--color-text-primary)">Needs attention</h2>
      <div className="flex flex-col gap-2.5">
        {queues.map((queue) => (
          <Link
            key={queue.key}
            href={queue.href}
            className="group flex items-center gap-3 rounded-lg border border-black/5 px-3 py-2.5 transition-colors hover:bg-(--color-brand-lavender-soft)"
          >
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              style={{
                color: queue.count > 0 ? "var(--color-warning)" : "var(--color-text-secondary)",
                background: queue.count > 0 ? "rgba(255,141,40,0.12)" : "rgba(0,0,0,0.04)",
              }}
            >
              {queue.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-(--color-text-primary)">
                {queue.label}
              </p>
              <p className="truncate text-xs text-(--color-text-secondary)">
                {queue.count > 0 ? queue.hint : "All clear"}
              </p>
            </div>
            <span
              className="shrink-0 text-lg font-semibold"
              style={{
                color: queue.count > 0 ? "var(--color-warning)" : "var(--color-text-secondary)",
              }}
            >
              {queue.count}
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-(--color-text-secondary) transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>
    </Card>
  );
}

function RoleBreakdown({ roles }: { roles: RoleSlice[] }) {
  const max = Math.max(1, ...roles.map((role) => role.count));
  return (
    <Card className="p-5">
      <h2 className="mb-4 text-base font-bold text-(--color-text-primary)">Users by role</h2>
      <div className="flex flex-col gap-3.5">
        {roles.map((role) => (
          <div key={role.key} className="flex items-center gap-3">
            <span className="w-28 shrink-0 text-xs text-(--color-text-primary)">{role.label}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/5">
              <div
                className="h-full rounded-full transition-[width]"
                style={{ width: `${(role.count / max) * 100}%`, background: role.color }}
              />
            </div>
            <span className="w-10 shrink-0 text-right text-xs font-medium text-(--color-text-secondary)">
              {role.count.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function StatusPill({ user }: { user: UserData }) {
  const blocked = user.is_blocked;
  const active = user.status === "active";
  const label = blocked ? "Blocked" : active ? "Active" : "Inactive";
  const color = blocked
    ? "var(--color-rejected)"
    : active
      ? "var(--color-success)"
      : "var(--color-text-secondary)";
  return (
    <span
      className="shrink-0 rounded-full border px-3 py-0.5 text-xs font-medium whitespace-nowrap"
      style={{ color, borderColor: color }}
    >
      {label}
    </span>
  );
}

function LatestUsersPanel({ users }: { users: UserData[] }) {
  return (
    <Card className="flex flex-col p-5">
      <h2 className="mb-4 text-base font-bold text-(--color-text-primary)">
        Latest registered users
      </h2>
      <div className="flex flex-1 flex-col gap-2">
        {users.length === 0 ? (
          <p className="py-6 text-center text-sm text-(--color-text-secondary)">No users yet.</p>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 rounded-lg border border-black/5 px-3 py-2.5 shadow-[0_1px_8px_rgba(0,0,0,0.08)]"
            >
              <StudentAvatar name={userName(user)} avatar={user.avatar} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-(--color-text-primary)">
                  {userName(user)}
                </p>
                <p className="truncate text-xs text-(--color-text-secondary)">{user.email}</p>
              </div>
              <span className="hidden shrink-0 text-xs text-(--color-text-secondary) sm:block">
                {fmtDate(user.date_joined)}
              </span>
              <StatusPill user={user} />
            </div>
          ))
        )}
      </div>
      <Link
        href="/admin/users"
        className="mt-4 block text-center text-sm font-medium text-(--color-blue) hover:underline"
      >
        All Users
      </Link>
    </Card>
  );
}

function CourseThumb({ course }: { course: CourseListItem }) {
  if (course.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={course.image} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" />
    );
  }
  return (
    <span
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-(--color-blue)"
      style={{ background: "var(--gradient-brand)" }}
    >
      <BookOpen className="h-5 w-5" />
    </span>
  );
}

function RecentCoursesPanel({ courses }: { courses: CourseListItem[] }) {
  return (
    <Card className="flex flex-col p-5">
      <h2 className="mb-4 text-base font-bold text-(--color-text-primary)">
        Recently created courses
      </h2>
      <div className="flex flex-1 flex-col gap-2">
        {courses.length === 0 ? (
          <p className="py-6 text-center text-sm text-(--color-text-secondary)">No courses yet.</p>
        ) : (
          courses.map((course) => (
            <div
              key={course.id}
              className="flex items-center gap-3 rounded-lg border border-black/5 px-3 py-2.5 shadow-[0_1px_8px_rgba(0,0,0,0.08)]"
            >
              <CourseThumb course={course} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-(--color-text-primary)">
                  {course.title}
                </p>
                <p className="truncate text-xs text-(--color-text-secondary)">
                  {course.teacher_name} <span className="px-1">|</span> {fmtDate(course.created_at)}
                </p>
              </div>
              <CourseStatusBadge status={course.status} />
            </div>
          ))
        )}
      </div>
      <Link
        href="/admin/courses"
        className="mt-4 block text-center text-sm font-medium text-(--color-blue) hover:underline"
      >
        All Courses
      </Link>
    </Card>
  );
}

/** Live administrator dashboard: platform-wide totals, revenue trend, moderation queues, and recent activity. */
export function AdminDashboard() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [pickedCurrency, setPickedCurrency] = useState<Currency | null>(null);

  const currency = pickedCurrency ?? busiestCurrency(data);
  const revenue = data?.revenue.find((row) => row.currency === currency) ?? null;

  const refresh = useCallback(() => {
    setLoading(true);
    setReloadKey((key) => key + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadAdminDashboard()
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setError("");
      })
      .catch((requestError) => {
        if (cancelled) return;
        setError((requestError as ApiError).message || "Dashboard statistics could not be loaded.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return (
    <PageShell className="bg-white">
      <div className="mx-auto flex w-full max-w-[1648px] flex-col gap-6 font-(family-name:--font-base)">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-(--color-text-primary)">Dashboard</h1>
            <p className="mt-1 text-base text-(--color-text-secondary)">
              Overview of platform activity and key metrics
            </p>
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-(--color-brand-lavender) bg-white px-4 text-sm text-(--color-text-primary) transition hover:bg-(--color-brand-lavender-soft) disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </header>

        {error ? (
          <div
            role="alert"
            className="flex items-center gap-3 rounded-xl bg-(--color-brand-cream) p-4 text-(--color-pink-dark)"
          >
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {loading && !data ? (
          <div className="flex min-h-72 items-center justify-center text-(--color-blue)">
            <Loader2 className="h-7 w-7 animate-spin" aria-label="Loading dashboard statistics" />
          </div>
        ) : null}

        {data ? (
          <div
            className={`flex flex-col gap-5 ${loading ? "opacity-60" : ""} transition-opacity`.trim()}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
              <StatCard
                label="Total users"
                value={data.totalUsers.toLocaleString()}
                icon={<Users className="h-5 w-5" />}
                footer={
                  data.newUsers7d > 0 ? (
                    <span className="text-(--color-success)">
                      +{data.newUsers7d} in the last 7 days
                    </span>
                  ) : (
                    "Registered accounts"
                  )
                }
              />
              <StatCard
                label="Courses"
                value={data.totalCourses.toLocaleString()}
                icon={<BookOpen className="h-5 w-5" />}
                footer={`${data.publishedCourses.toLocaleString()} published`}
              />
              <StatCard
                label="Published courses"
                value={data.publishedCourses.toLocaleString()}
                icon={<CheckCircle2 className="h-5 w-5" />}
                footer={`of ${data.totalCourses.toLocaleString()} total`}
              />
              <StatCard
                label="New users"
                value={data.newUsers7d.toLocaleString()}
                icon={<UserPlus className="h-5 w-5" />}
                footer="Joined in the last 7 days"
              />
              <StatCard
                label="Certificates issued"
                value={data.certificates.toLocaleString()}
                icon={<Award className="h-5 w-5" />}
                footer="Active certificates"
              />
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
              <div className="xl:col-span-2">
                <RevenueCard
                  rows={data.revenueTrend}
                  revenue={revenue}
                  currency={currency}
                  onCurrencyChange={setPickedCurrency}
                  error={data.revenueError}
                />
              </div>
              <div className="flex flex-col gap-5">
                <AttentionPanel queues={data.attention} />
                <RoleBreakdown roles={data.roles} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              <LatestUsersPanel users={data.latestUsers} />
              <RecentCoursesPanel courses={data.recentCourses} />
            </div>
          </div>
        ) : null}
      </div>
    </PageShell>
  );
}
