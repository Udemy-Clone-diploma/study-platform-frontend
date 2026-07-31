"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ClipboardCheck, Eye, Star } from "lucide-react";
import type {
  ApprovedCourseRecord,
  CourseLevel,
  CourseListItem,
  RejectedCourseRecord,
} from "@/entities/course";
import { DataTable, type DataTableColumn } from "@/shared/ui/DataTable";
import { CourseThumb, formatCourseDate } from "./admin/CoursesTable";

export type ModeratorCourseTab = "unassigned" | "review" | "needs_revision";
export type ModeratorHistoryStatus = "approved" | "rejected";

type Translator = (key: string, values?: Record<string, string | number>) => string;

const LEVEL_COLORS: Record<CourseLevel, string> = {
  beginner: "var(--color-blue)",
  intermediate: "var(--color-yellow-dark)",
  advanced: "var(--color-pink-dark)",
};

const STATUS_COLORS = {
  unassigned: "var(--color-text-secondary)",
  review: "var(--color-blue)",
  needs_revision: "var(--color-warning)",
  approved: "var(--color-success)",
  rejected: "var(--color-rejected)",
} as const;

type HistoryRecord = ApprovedCourseRecord | RejectedCourseRecord;

function humanize(value: string | null | undefined) {
  if (!value) return "-";
  return value.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatPrice(course: CourseListItem, freeLabel: string) {
  if (!course.price || Number(course.price) === 0) return freeLabel;
  return `${course.price}${course.currency ? ` ${course.currency}` : ""}`;
}

function formatRating(course: CourseListItem, t: Translator) {
  if (!course.rating_count) return t("noRatings");
  return `${course.rating_avg} (${course.rating_count})`;
}

function courseStatus(course: CourseListItem, tab: ModeratorCourseTab, t: Translator) {
  if (tab === "unassigned") return t("statusUnassigned");
  if (tab === "review") {
    return course.status === "review" ? t("statusUnderReview") : t("statusEditUnderReview");
  }
  return course.status === "needs_revision" ? t("statusRequiresRevision") : t("statusEditRequiresRevision");
}

function CourseStatusBadge({ status, color }: { status: string; color: string }) {
  return (
    <span
      className="inline-flex max-w-full items-center justify-center rounded-full border px-3 py-1 text-center font-(family-name:--font-accent) text-xs font-medium leading-4 whitespace-nowrap"
      style={{ color, borderColor: color, background: "white" }}
    >
      {status}
    </span>
  );
}

function CourseIdentity({ course, href, freeLabel }: { course: CourseListItem; href?: string; freeLabel: string }) {
  const content = (
    <>
      <CourseThumb image={course.image} title={course.title} />
      <div className="min-w-0">
        <p className="truncate font-semibold text-(--color-text-primary)">{course.title}</p>
        <p className="mt-0.5 truncate text-xs text-(--color-text-secondary)">
          {course.subtitle || `${humanize(course.language)} - ${formatPrice(course, freeLabel)}`}
        </p>
      </div>
    </>
  );

  return href ? (
    <Link href={href} className="flex min-w-0 items-center gap-3 hover:opacity-75">
      {content}
    </Link>
  ) : (
    <div className="flex min-w-0 items-center gap-3">{content}</div>
  );
}

function TableAction({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full border border-(--color-blue) bg-white px-3 py-1.5 text-xs font-semibold text-(--color-blue) transition hover:bg-(--color-brand-lavender-soft)"
    >
      {children}
      {label}
    </button>
  );
}

function currentCourseColumns(
  tab: ModeratorCourseTab,
  onAssign: (course: CourseListItem) => void,
  t: Translator,
  tLevel: Translator,
  tModuleCard: Translator,
  freeLabel: string,
): DataTableColumn<CourseListItem>[] {
  return [
    {
      key: "course",
      label: t("columnCourse"),
      flex: 3,
      render: (course) => (
        <CourseIdentity
          course={course}
          href={
            tab === "unassigned" ? undefined : `/moderator-dashboard/courses/${course.slug}/review`
          }
          freeLabel={freeLabel}
        />
      ),
    },
    {
      key: "teacher",
      label: t("columnTeacher"),
      flex: 1.7,
      render: (course) => <span className="truncate">{course.teacher_name || "-"}</span>,
    },
    {
      key: "category",
      label: t("columnCategory"),
      flex: 1.5,
      render: (course) =>
        course.category?.name || <span className="text-(--color-text-secondary)">{t("noCategory")}</span>,
    },
    {
      key: "level",
      label: t("columnLevel"),
      flex: 1.1,
      headerAlign: "center",
      cellAlign: "center",
      render: (course) => (
        <span style={{ color: LEVEL_COLORS[course.level] }}>{tLevel(`level.${course.level}`)}</span>
      ),
    },
    {
      key: "format",
      label: t("columnFormat"),
      flex: 1.7,
      render: (course) => (
        <span className="block truncate">
          {humanize(course.mode)} - {humanize(course.delivery_type)}
        </span>
      ),
    },
    {
      key: "content",
      label: t("columnContent"),
      flex: 1.15,
      headerAlign: "center",
      cellAlign: "center",
      render: (course) => (
        <span className="block whitespace-nowrap">
          {tModuleCard("lessonsCount", { count: course.lessons_count })}
          <br />
          {t("hoursAbbrev", { count: course.duration_hours })}
        </span>
      ),
    },
    {
      key: "students",
      label: t("columnStudents"),
      flex: 1,
      headerAlign: "center",
      cellAlign: "center",
      render: (course) => <span>{course.students_count}</span>,
    },
    {
      key: "rating",
      label: t("columnRating"),
      flex: 1.35,
      headerAlign: "center",
      cellAlign: "center",
      render: (course) => (
        <span className="inline-flex items-center justify-center gap-1 whitespace-nowrap">
          <Star className="h-3.5 w-3.5 fill-(--color-gold) text-(--color-gold)" />
          {formatRating(course, t)}
        </span>
      ),
    },
    {
      key: "status",
      label: t("columnStatus"),
      flex: 1.5,
      headerAlign: "center",
      cellAlign: "center",
      render: (course) => (
        <CourseStatusBadge status={courseStatus(course, tab, t)} color={STATUS_COLORS[tab]} />
      ),
    },
    {
      key: "actions",
      label: t("columnActions"),
      flex: 1.3,
      headerAlign: "center",
      cellAlign: "center",
      render: (course) =>
        tab === "unassigned" ? (
          <TableAction label={t("assignAction")} onClick={() => onAssign(course)}>
            <ClipboardCheck className="h-3.5 w-3.5" />
          </TableAction>
        ) : (
          <Link
            href={`/moderator-dashboard/courses/${course.slug}/review`}
            className="inline-flex items-center gap-1.5 rounded-full border border-(--color-blue) bg-white px-3 py-1.5 text-xs font-semibold text-(--color-blue) transition hover:bg-(--color-brand-lavender-soft)"
          >
            <Eye className="h-3.5 w-3.5" />
            {t("reviewAction")}
          </Link>
        ),
    },
  ];
}

export function ModeratorCoursesTable({
  courses,
  tab,
  onAssign,
  emptyMessage,
}: {
  courses: CourseListItem[];
  tab: ModeratorCourseTab;
  onAssign: (course: CourseListItem) => void;
  emptyMessage: string;
}) {
  const t = useTranslations("ModeratorCoursesTable");
  const tLevel = useTranslations("CourseBasicsForm");
  const tModuleCard = useTranslations("ModuleCard");
  const tRejection = useTranslations("RejectionDetailModal");
  return (
    <DataTable<CourseListItem>
      columns={currentCourseColumns(tab, onAssign, t, tLevel, tModuleCard, tRejection("free"))}
      rows={courses}
      getRowKey={(course) => course.id}
      emptyMessage={emptyMessage}
      headerVariant="plain"
      showIndex={false}
      rowVariant="card"
    />
  );
}

function historyCourseIdentity(record: HistoryRecord) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <CourseThumb image={record.course_image_url} title={record.course_title} />
      <span className="min-w-0 truncate font-semibold text-(--color-text-primary)">
        {record.course_title}
      </span>
    </div>
  );
}

function historyDate(record: HistoryRecord, status: ModeratorHistoryStatus) {
  return status === "approved"
    ? (record as ApprovedCourseRecord).approved_at
    : (record as RejectedCourseRecord).rejected_at;
}

function historyChanges(record: HistoryRecord, t: Translator) {
  if (record.changed_fields.length === 0) return t("initialSubmission");
  return t("changedFieldsCount", { count: record.changed_fields.length });
}

export function ModeratorHistoryTable({
  records,
  status,
  onView,
  emptyMessage,
}: {
  records: HistoryRecord[];
  status: ModeratorHistoryStatus;
  onView: (record: HistoryRecord) => void;
  emptyMessage: string;
}) {
  const t = useTranslations("ModeratorCoursesTable");
  const tLevel = useTranslations("CourseBasicsForm");
  const tRejection = useTranslations("RejectionDetailModal");
  const locale = useLocale();
  const statusLabel = status === "approved" ? tRejection("statusApproved") : tRejection("statusRejected");

  const columns: DataTableColumn<HistoryRecord>[] = [
    {
      key: "course",
      label: t("columnCourse"),
      flex: 3.2,
      render: (record) => historyCourseIdentity(record),
    },
    {
      key: "category",
      label: t("columnCategory"),
      flex: 1.8,
      render: (record) =>
        record.course_category || (
          <span className="text-(--color-text-secondary)">{t("noCategory")}</span>
        ),
    },
    {
      key: "level",
      label: t("columnLevel"),
      flex: 1.2,
      headerAlign: "center",
      cellAlign: "center",
      render: (record) => {
        const level = record.course_level as CourseLevel;
        return <span style={{ color: LEVEL_COLORS[level] }}>{tLevel(`level.${level}`)}</span>;
      },
    },
    {
      key: "changes",
      label: t("columnChanges"),
      flex: 2.2,
      render: (record) => (
        <span className="truncate" title={record.changed_fields.join(", ")}>
          {historyChanges(record, t)}
        </span>
      ),
    },
    {
      key: "date",
      label: t("columnDecisionDate"),
      flex: 1.6,
      headerAlign: "center",
      cellAlign: "center",
      render: (record) => (
        <span className="whitespace-nowrap">{formatCourseDate(historyDate(record, status), locale)}</span>
      ),
    },
    {
      key: "status",
      label: t("columnStatus"),
      flex: 1.4,
      headerAlign: "center",
      cellAlign: "center",
      render: () => <CourseStatusBadge status={statusLabel} color={STATUS_COLORS[status]} />,
    },
    {
      key: "actions",
      label: t("columnActions"),
      flex: 1.2,
      headerAlign: "center",
      cellAlign: "center",
      render: (record) => (
        <TableAction label={t("viewAction")} onClick={() => onView(record)}>
          <Eye className="h-3.5 w-3.5" />
        </TableAction>
      ),
    },
  ];

  return (
    <DataTable<HistoryRecord>
      columns={columns}
      rows={records}
      getRowKey={(record) => record.id}
      emptyMessage={emptyMessage}
      headerVariant="plain"
      showIndex={false}
      rowVariant="card"
    />
  );
}
