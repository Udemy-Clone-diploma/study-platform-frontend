"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState, type ReactNode } from "react";
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Check,
  Eye,
  Flag,
  Loader2,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react";
import {
  getAdminUserProfile,
  type AdminProfileCourse,
  type AdminProfileUser,
  type AdminUserProfile,
  type StaffUserProfile,
  type CourseModerationRecord,
  type ModeratedUserReport,
  type PlatformStats,
  type ProcessedMessageReport,
  type ProcessedUserReport,
  type ReportStats,
  type UserRole,
} from "@/entities/user";
import type { ApiError } from "@/shared/api/base";
import { ModalShell } from "@/shared/ui/ModalShell";
import { PageShell } from "@/shared/ui/PageShell";
import { ReportReviewModal } from "@/features/users/ui/moderation/UserReportsWorkspace";
import { getRoleLabels } from "@/features/users/model/labels";
import { PublicProfileView } from "./PublicProfileView";

function formatDate(value: string | null | undefined) {
  if (!value) return "Not specified";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatKey(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "Not specified";
  return String(value);
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`min-w-0 overflow-hidden rounded-2xl bg-white p-4 shadow-(--shadow-dashboard-card) sm:p-5 ${className}`}
    >
      {children}
    </section>
  );
}

function SectionTitle({ icon, title, count }: { icon: ReactNode; title: string; count?: number }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-lg font-bold text-(--color-text-primary)">
        <span className="text-(--color-blue)">{icon}</span>
        {title}
      </h2>
      {count !== undefined ? (
        <span className="rounded-full bg-(--color-brand-lavender-soft) px-3 py-1 text-xs font-semibold text-(--color-blue-dark)">
          {count}
        </span>
      ) : null}
    </div>
  );
}

function ExpandableBio({ value }: { value: unknown }) {
  const text = displayValue(value);
  const canExpand = text !== "Not specified" && text.length > 20;
  const [expanded, setExpanded] = useState(false);

  if (!canExpand) {
    return <span>{text}</span>;
  }

  if (expanded) {
    return (
      <div className="relative rounded-xl bg-(--color-bg-surface) px-3 py-2 pr-10">
        <p className="whitespace-pre-wrap break-words">{text}</p>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          aria-label="Hide full bio"
          title="Hide full bio"
          className="absolute top-1 right-1 flex h-7 w-7 items-center justify-center rounded-full text-(--color-blue) transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-blue)"
        >
          <Check className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setExpanded(true)}
      className="block max-w-full truncate text-left hover:text-(--color-blue) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-blue)"
      title="Show full bio"
    >
      {text.slice(0, 20)}…
    </button>
  );
}

function PersonalInformation({ user }: { user: AdminProfileUser }) {
  const roleLabels = getRoleLabels(useTranslations("PublicProfile.roles"));
  const profileValues = user.profile
    ? Object.entries(user.profile).filter(([key]) => key.toLowerCase() !== "id")
    : [];
  const values: Array<[string, unknown, string]> = [
    ["Email", user.email, "email"],
    ["Role", roleLabels[user.role], "role"],
    ["Language", user.language, "language"],
    ["Status", user.status, "status"],
    ["Joined", formatDate(user.date_joined), "joined"],
    ["Blocked", user.is_blocked ? "Yes" : "No", "blocked"],
    ...profileValues.map(
      ([key, value]) => [formatKey(key), value, key] as [string, unknown, string],
    ),
  ];

  return (
    <Card>
      <SectionTitle icon={<ShieldCheck className="h-5 w-5" />} title="Personal information" />
      <dl className="space-y-3">
        {values.map(([label, value, key]) => (
          <div
            key={`${label}-${key}`}
            className="grid min-w-0 grid-cols-1 gap-1 sm:grid-cols-[max-content_minmax(0,1fr)] sm:items-baseline sm:gap-x-3"
          >
            <dt className="whitespace-nowrap text-sm font-semibold text-(--color-text-secondary)">
              {label}
            </dt>
            <dd className="min-w-0 break-words font-semibold text-(--color-text-primary)">
              {key.toLowerCase() === "bio" ? <ExpandableBio value={value} /> : displayValue(value)}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function AttendanceChart({ course }: { course: AdminProfileCourse }) {
  const attendance = course.enrollment?.attendance;
  if (!attendance) return null;
  return (
    <div className="mt-4 w-full max-w-full overflow-hidden rounded-xl bg-(--color-brand-lavender-soft) p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-(--color-text-primary)">Attendance</p>
        <p className="text-sm font-bold text-(--color-blue)">
          {attendance.percent}% ({attendance.present}/{attendance.total})
        </p>
      </div>
      {attendance.points.length ? (
        <div
          className="mt-4 flex h-24 w-full max-w-full items-end gap-1 sm:gap-2"
          aria-label={`Attendance chart for ${course.title}`}
        >
          {attendance.points.map((point) => (
            <div
              key={point.label}
              className="flex h-full min-w-0 flex-1 flex-col justify-end gap-1"
            >
              <div
                className="min-h-1 rounded-t-md bg-(--color-blue)"
                style={{ height: `${Math.max(point.value, 4)}%` }}
                title={`${point.label}: ${point.value}%`}
              />
              <span className="truncate text-center text-[8px] text-(--color-text-muted) sm:text-[10px]">
                {point.label}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-(--color-text-secondary)">
          No attendance sessions recorded.
        </p>
      )}
    </div>
  );
}

function CourseCard({
  course,
  showAttendance = false,
}: {
  course: AdminProfileCourse;
  showAttendance?: boolean;
}) {
  return (
    <article className="rounded-xl border border-(--color-border-light) bg-(--color-bg-surface) p-4">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row">
        {course.image ? (
          <Image
            src={course.image}
            alt=""
            width={64}
            height={64}
            unoptimized
            className="h-32 w-full rounded-lg object-cover sm:h-16 sm:w-16"
          />
        ) : (
          <div className="flex h-32 w-full shrink-0 items-center justify-center rounded-lg bg-(image:--gradient-brand) sm:h-16 sm:w-16">
            <BookOpen className="h-6 w-6 text-(--color-text-primary)" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <Link
            href={`/courses/${course.slug}`}
            className="line-clamp-2 font-bold text-(--color-text-primary) hover:text-(--color-blue)"
          >
            {course.title}
          </Link>
          <p className="mt-1 text-sm text-(--color-text-secondary)">
            {course.category || "Uncategorized"} · {formatKey(course.status)}
          </p>
          {course.enrollment ? (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-(--color-text-secondary)">
                <span>{course.enrollment.order_id ? "Purchased" : "Free enrollment"}</span>
                <span>{course.enrollment.progress_percent}% complete</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-(--color-border-light)">
                <div
                  className="h-full rounded-full bg-(image:--gradient-brand)"
                  style={{ width: `${course.enrollment.progress_percent}%` }}
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
      {showAttendance ? <AttendanceChart course={course} /> : null}
    </article>
  );
}

function CoursesSection({ courses, student }: { courses: AdminProfileCourse[]; student: boolean }) {
  const [showAll, setShowAll] = useState(false);
  const canCollapse = courses.length > 4;
  const visibleCourses = canCollapse && !showAll ? courses.slice(0, 4) : courses;

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-(--color-text-primary)">
          <span className="text-(--color-blue)">
            <BookOpen className="h-5 w-5" />
          </span>
          {student ? "Purchased courses" : "Created courses"}
        </h2>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full bg-(--color-brand-lavender-soft) px-3 py-1 text-xs font-semibold text-(--color-blue-dark)">
            {courses.length}
          </span>
          {canCollapse ? (
            <button
              type="button"
              aria-expanded={showAll}
              onClick={() => setShowAll((value) => !value)}
              className="text-xs font-semibold text-(--color-blue) hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-blue)"
            >
              {showAll ? "Hide all" : "Show all"}
            </button>
          ) : null}
        </div>
      </div>
      {courses.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {visibleCourses.map((course) => (
            <CourseCard key={course.id} course={course} showAttendance={student} />
          ))}
        </div>
      ) : (
        <p className="rounded-xl bg-(--color-bg-surface) p-4 text-sm text-(--color-text-secondary)">
          No courses to display.
        </p>
      )}
    </Card>
  );
}

function ReportStatsCard({
  title,
  stats,
  onReview,
}: {
  title: string;
  stats: ReportStats;
  onReview: () => void;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-bold text-(--color-text-primary)">{title}</h3>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-(--color-brand-pink) px-3 py-1 text-sm font-bold text-(--color-pink-dark)">
            {stats.total}
          </span>
          <button
            type="button"
            onClick={onReview}
            className="inline-flex items-center gap-1 rounded-full border border-(--color-blue) px-3 py-1 text-xs font-semibold text-(--color-blue) transition hover:bg-(--color-brand-lavender-soft) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-blue)"
          >
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            Review
          </button>
        </div>
      </div>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-(--color-text-secondary)">
            By status
          </p>
          <div className="mt-3 space-y-2">
            {stats.by_status.map((row) => (
              <div key={row.key} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-(--color-text-secondary)">{row.label}</span>
                <span className="font-bold text-(--color-text-primary)">{row.count}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-(--color-text-secondary)">
            By reason
          </p>
          <div className="mt-3 space-y-2">
            {stats.by_reason
              .filter((row) => row.count > 0)
              .map((row) => (
                <div key={row.key} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate text-(--color-text-secondary)">{row.label}</span>
                  <span className="font-bold text-(--color-text-primary)">{row.count}</span>
                </div>
              ))}
            {!stats.by_reason.some((row) => row.count > 0) ? (
              <p className="text-sm text-(--color-text-secondary)">No reports yet.</p>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  );
}

function reportStateLabel(report: ModeratedUserReport) {
  if (report.status === "resolved" && report.resolution) {
    return formatKey(report.resolution);
  }
  return formatKey(report.status);
}

function ReportsListModal({
  title,
  reports,
  onSelect,
  onClose,
}: {
  title: string;
  reports: ModeratedUserReport[];
  onSelect: (report: ModeratedUserReport) => void;
  onClose: () => void;
}) {
  return (
    <ModalShell
      title={title}
      icon={<Flag className="h-5 w-5" aria-hidden="true" />}
      width="min(820px, calc(100vw - 32px))"
      padding="clamp(20px, 2.5vw, 36px)"
      maxHeight="90vh"
      onClose={onClose}
    >
      <div className="max-h-[70vh] space-y-3 overflow-y-auto font-(family-name:--font-base)">
        {reports.length ? (
          reports.map((report) => (
            <button
              key={report.id}
              type="button"
              onClick={() => onSelect(report)}
              className="block w-full rounded-2xl border border-(--color-border-light) bg-(--color-bg-surface) p-4 text-left transition hover:border-(--color-blue) hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-blue)"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-(--color-danger)">
                    {report.reason_label || formatKey(report.reason)}
                  </p>
                  <p className="mt-1 text-sm text-(--color-text-primary)">
                    {report.reported_user
                      ? `On user: ${report.reported_user.name || report.reported_user.email}`
                      : "Deleted user"}
                  </p>
                </div>
                <time
                  className="shrink-0 text-xs text-(--color-text-secondary)"
                  dateTime={report.created_at}
                >
                  {formatDate(report.created_at)}
                </time>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-(--color-text-secondary)">
                <span className="rounded-full border border-(--color-border-light) px-3 py-1">
                  {reportStateLabel(report)}
                </span>
                <span>Complaint #{report.id}</span>
                <span>
                  From: {report.reporter?.name || report.reporter?.email || "Deleted user"}
                </span>
              </div>
              {report.details ? (
                <p className="mt-3 line-clamp-2 text-sm text-(--color-text-secondary)">
                  {report.details}
                </p>
              ) : null}
            </button>
          ))
        ) : (
          <p className="rounded-xl bg-(--color-bg-surface) p-5 text-sm text-(--color-text-secondary)">
            No complaints to display.
          </p>
        )}
      </div>
    </ModalShell>
  );
}

function ModerationCourseHistory({
  approved,
  rejected,
}: {
  approved: CourseModerationRecord[];
  rejected: CourseModerationRecord[];
}) {
  const records = [
    ...approved.map((record) => ({ ...record, kind: "approved", date: record.approved_at })),
    ...rejected.map((record) => ({ ...record, kind: "rejected", date: record.rejected_at })),
  ].sort(
    (first, second) => new Date(second.date || 0).getTime() - new Date(first.date || 0).getTime(),
  );
  return (
    <Card>
      <SectionTitle
        icon={<BookOpen className="h-5 w-5" />}
        title="Course moderation history"
        count={records.length}
      />
      {records.length ? (
        <div className="space-y-3">
          {records.map((record) => (
            <div
              key={`${record.kind}-${record.id}`}
              className="flex items-start gap-3 rounded-xl bg-(--color-bg-surface) p-3"
            >
              {record.kind === "approved" ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-(--color-success)" />
              ) : (
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-(--color-danger)" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-(--color-text-primary)">{record.course_title}</p>
                <p className="mt-1 text-sm text-(--color-text-secondary)">
                  {record.kind === "approved" ? "Approved" : "Rejected"} · {formatDate(record.date)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-(--color-text-secondary)">No course moderation records.</p>
      )}
    </Card>
  );
}

function MessageReportsHistory({ reports }: { reports: ProcessedMessageReport[] }) {
  return (
    <Card>
      <SectionTitle
        icon={<Flag className="h-5 w-5" />}
        title="Processed message reports"
        count={reports.length}
      />
      {reports.length ? (
        <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
          {reports.map((item) => (
            <article key={item.id} className="rounded-xl bg-(--color-bg-surface) p-3">
              <div className="flex flex-wrap justify-between gap-2">
                <p className="font-semibold text-(--color-text-primary)">
                  {item.report.reason_label} · {item.action_label}
                </p>
                <time className="text-xs text-(--color-text-secondary)">
                  {formatDate(item.processed_at)}
                </time>
              </div>
              <p className="mt-2 text-sm text-(--color-text-secondary)">
                User: {item.target_user?.name || "Deleted user"} · Report #{item.report.id}
              </p>
              {item.report.message ? (
                <p className="mt-2 line-clamp-2 text-sm text-(--color-text-primary)">
                  {item.report.message}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <p className="text-sm text-(--color-text-secondary)">No processed message reports.</p>
      )}
    </Card>
  );
}

function UserReportsHistory({ reports }: { reports: ProcessedUserReport[] }) {
  return (
    <Card>
      <SectionTitle
        icon={<Flag className="h-5 w-5" />}
        title="Processed user reports"
        count={reports.length}
      />
      {reports.length ? (
        <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
          {reports.map((item) => (
            <article key={item.id} className="rounded-xl bg-(--color-bg-surface) p-3">
              <div className="flex flex-wrap justify-between gap-2">
                <p className="font-semibold text-(--color-text-primary)">
                  {item.report.reason_label} · {formatKey(item.action)}
                </p>
                <time className="text-xs text-(--color-text-secondary)">
                  {formatDate(item.processed_at)}
                </time>
              </div>
              <p className="mt-2 text-sm text-(--color-text-secondary)">
                On user: {item.report.reported_user?.name || "Deleted user"} · Report #
                {item.report.id}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <p className="text-sm text-(--color-text-secondary)">No processed user reports.</p>
      )}
    </Card>
  );
}

function PlatformStatsSection({ stats }: { stats: PlatformStats }) {
  const roleLabels = getRoleLabels(useTranslations("PublicProfile.roles"));
  return (
    <Card>
      <SectionTitle icon={<BarChart3 className="h-5 w-5" />} title="Platform statistics" />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-(--color-brand-lavender-soft) p-4">
          <p className="text-sm text-(--color-text-secondary)">Users</p>
          <p className="mt-1 text-2xl font-bold text-(--color-text-primary)">{stats.users.total}</p>
          <p className="mt-1 text-xs text-(--color-text-secondary)">{stats.users.active} active</p>
        </div>
        <div className="rounded-xl bg-(--color-brand-lavender-soft) p-4">
          <p className="text-sm text-(--color-text-secondary)">Courses</p>
          <p className="mt-1 text-2xl font-bold text-(--color-text-primary)">
            {stats.courses.total}
          </p>
          <p className="mt-1 text-xs text-(--color-text-secondary)">
            {stats.courses.by_status.length} statuses
          </p>
        </div>
        <div className="rounded-xl bg-(--color-brand-lavender-soft) p-4">
          <p className="text-sm text-(--color-text-secondary)">Categories</p>
          <p className="mt-1 text-2xl font-bold text-(--color-text-primary)">
            {stats.categories.total}
          </p>
          <p className="mt-1 text-xs text-(--color-text-secondary)">
            {stats.categories.with_courses} with courses
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <p className="text-sm font-bold text-(--color-text-primary)">Users by role</p>
          <div className="mt-2 space-y-2">
            {stats.users.by_role.map((row) => (
              <div key={row.role} className="flex justify-between text-sm">
                <span className="text-(--color-text-secondary)">
                  {roleLabels[row.role as UserRole] || formatKey(row.role)}
                </span>
                <span className="font-bold">{row.count}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-bold text-(--color-text-primary)">Courses by status</p>
          <div className="mt-2 space-y-2">
            {stats.courses.by_status.map((row) => (
              <div key={row.status} className="flex justify-between text-sm">
                <span className="text-(--color-text-secondary)">{formatKey(row.status)}</span>
                <span className="font-bold">{row.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function AdminProfileView({
  data,
  backHref,
  backLabel,
}: {
  data: AdminUserProfile;
  backHref: string;
  backLabel: string;
}) {
  const roleLabels = getRoleLabels(useTranslations("PublicProfile.roles"));
  const user = data.user;
  const fullName = `${user.first_name} ${user.last_name}`.trim() || user.email;
  const roleDetails = data.details[user.role];
  const [reportsModal, setReportsModal] = useState<{
    title: string;
    reports: ModeratedUserReport[];
  } | null>(null);
  const [selectedReport, setSelectedReport] = useState<ModeratedUserReport | null>(null);

  return (
    <PageShell className="overflow-x-hidden bg-(--color-brand-lavender-soft)">
      <div className="mx-auto flex min-w-0 w-full max-w-[1648px] flex-col gap-5 font-(family-name:--font-base)">
        <Link
          href={backHref}
          className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-(--color-blue-dark) hover:text-(--color-blue)"
        >
          <ArrowLeft className="h-4 w-4" /> {backLabel}
        </Link>
        <header>
          <h1 className="text-3xl font-semibold text-(--color-text-primary)">{fullName}</h1>
          <p className="mt-1 text-sm text-(--color-text-secondary)">
            {roleLabels[user.role]} profile
          </p>
        </header>

        <div className="grid min-w-0 grid-cols-1 items-start gap-5 2xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="min-w-0 space-y-5">
            <Card className="flex flex-col items-center text-center">
              <div className="relative h-36 w-36 overflow-hidden rounded-full bg-(image:--gradient-brand)">
                {user.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={fullName}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center text-4xl font-bold text-(--color-text-primary)">
                    {fullName
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)}
                  </span>
                )}
              </div>
              <h2 className="mt-4 text-xl font-bold text-(--color-text-primary)">{fullName}</h2>
              <span className="mt-2 rounded-full bg-(--color-brand-cream) px-3 py-1 text-sm font-semibold text-(--color-yellow-dark)">
                {roleLabels[user.role]}
              </span>
            </Card>
            <PersonalInformation user={user} />
          </div>

          <div className="min-w-0 space-y-5">
            {user.role === "student" && data.details.student ? (
              <CoursesSection courses={data.details.student.courses} student />
            ) : null}
            {user.role === "teacher" && data.details.teacher ? (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Card className="sm:col-span-1">
                    <p className="text-sm text-(--color-text-secondary)">Total students</p>
                    <p className="mt-2 flex items-center gap-2 text-3xl font-bold text-(--color-blue)">
                      <Users className="h-6 w-6" />
                      {data.details.teacher.total_students}
                    </p>
                  </Card>
                </div>
                <CoursesSection courses={data.details.teacher.courses} student={false} />
              </>
            ) : null}
            {roleDetails && "approved_courses" in roleDetails ? (
              <ModerationCourseHistory
                approved={roleDetails.approved_courses}
                rejected={roleDetails.rejected_courses}
              />
            ) : null}
            {roleDetails && "message_reports" in roleDetails ? (
              <MessageReportsHistory reports={roleDetails.message_reports} />
            ) : null}
            {roleDetails && "user_reports" in roleDetails ? (
              <UserReportsHistory reports={roleDetails.user_reports} />
            ) : null}
            {user.role === "administrator" && data.details.administrator?.platform_stats ? (
              <PlatformStatsSection stats={data.details.administrator.platform_stats} />
            ) : null}
            {data.report_stats ? (
              <div className="grid gap-5 xl:grid-cols-2">
                <ReportStatsCard
                  title="Reports submitted by this user"
                  stats={data.report_stats.submitted}
                  onReview={() =>
                    setReportsModal({
                      title: "Reports submitted by this user",
                      reports: data.report_stats?.submitted.reports ?? [],
                    })
                  }
                />
                <ReportStatsCard
                  title="Reports received by this user"
                  stats={data.report_stats.received}
                  onReview={() =>
                    setReportsModal({
                      title: "Reports received by this user",
                      reports: data.report_stats?.received.reports ?? [],
                    })
                  }
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {reportsModal ? (
        <ReportsListModal
          title={reportsModal.title}
          reports={reportsModal.reports}
          onSelect={(report) => {
            setReportsModal(null);
            setSelectedReport(report);
          }}
          onClose={() => setReportsModal(null)}
        />
      ) : null}

      {selectedReport ? (
        <ReportReviewModal
          report={selectedReport}
          mode="administrator"
          canClaim={false}
          claiming={false}
          readOnly
          onClaim={() => undefined}
          onRequestAction={() => undefined}
          onClose={() => setSelectedReport(null)}
        />
      ) : null}
    </PageShell>
  );
}

/** Loads the detailed profile used by administrator, moderator, and teacher review screens. */
export function AdminProfileLoader({
  userId,
  backHref = "/admin/chats",
  backLabel = "Back to chats",
}: {
  userId: number;
  backHref?: string;
  backLabel?: string;
}) {
  const [data, setData] = useState<StaffUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getAdminUserProfile(userId)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((requestError: Partial<ApiError>) => {
        if (!active) return;
        setError(requestError.detail || requestError.message || "The profile could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  if (loading) {
    return (
      <PageShell className="bg-(--color-brand-lavender-soft)">
        <div className="flex min-h-72 items-center justify-center text-(--color-blue)">
          <Loader2 className="h-7 w-7 animate-spin" aria-label="Loading profile" />
        </div>
      </PageShell>
    );
  }

  if (error || !data) {
    return (
      <PageShell className="bg-(--color-brand-lavender-soft)">
        <div
          className="flex items-center gap-3 rounded-2xl bg-white p-5 text-(--color-danger)"
          role="alert"
        >
          <AlertCircle className="h-5 w-5" />
          {error || "Profile unavailable."}
        </div>
      </PageShell>
    );
  }

  if ("role" in data) {
    return <PublicProfileView profile={data} />;
  }

  return <AdminProfileView data={data} backHref={backHref} backLabel={backLabel} />;
}
