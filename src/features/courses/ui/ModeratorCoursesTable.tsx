import Image from "next/image";
import Link from "next/link";
import { ClipboardCheck, Eye, Star } from "lucide-react";
import type {
  ApprovedCourseRecord,
  CourseLevel,
  CourseListItem,
  RejectedCourseRecord,
} from "@/entities/course";
import { DataTable, type DataTableColumn } from "@/shared/ui/DataTable";

export type ModeratorCourseTab = "unassigned" | "review" | "needs_revision";
export type ModeratorHistoryStatus = "approved" | "rejected";

const LEVEL_FALLBACK: Record<CourseLevel, string> = {
  beginner: "/icons/curses.svg",
  intermediate: "/icons/world.png",
  advanced: "/icons/statistics.svg",
};

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
  if (!value) return "—";
  return value.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatPrice(course: CourseListItem) {
  if (!course.price || Number(course.price) === 0) return "Free";
  return `${course.price}${course.currency ? ` ${course.currency}` : ""}`;
}

function formatRating(course: CourseListItem) {
  if (!course.rating_count) return "No ratings";
  return `${course.rating_avg} (${course.rating_count})`;
}

function courseStatus(course: CourseListItem, tab: ModeratorCourseTab) {
  if (tab === "unassigned") return "Unassigned";
  if (tab === "review") {
    return course.status === "review" ? "Under review" : "Edit under review";
  }
  return course.status === "needs_revision" ? "Requires revision" : "Edit requires revision";
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

function CourseThumbnail({
  image,
  level,
  title,
}: {
  image: string | null | undefined;
  level: string;
  title: string;
}) {
  const fallback = LEVEL_FALLBACK[(level as CourseLevel) ?? "beginner"] ?? LEVEL_FALLBACK.beginner;
  return (
    <Image
      src={image ?? fallback}
      alt=""
      width={44}
      height={44}
      unoptimized={Boolean(image)}
      className="h-11 w-11 shrink-0 rounded-lg bg-(--color-brand-lavender-soft) object-contain"
      title={title}
    />
  );
}

function CourseIdentity({ course, href }: { course: CourseListItem; href?: string }) {
  const content = (
    <>
      <CourseThumbnail image={course.image} level={course.level} title={course.title} />
      <div className="min-w-0">
        <p className="truncate font-semibold text-(--color-text-primary)">{course.title}</p>
        <p className="mt-0.5 truncate text-xs text-(--color-text-secondary)">
          {course.subtitle || `${humanize(course.language)} · ${formatPrice(course)}`}
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
): DataTableColumn<CourseListItem>[] {
  return [
    {
      key: "course",
      label: "Course",
      flex: 3,
      render: (course) => (
        <CourseIdentity
          course={course}
          href={
            tab === "unassigned" ? undefined : `/moderator-dashboard/courses/${course.slug}/review`
          }
        />
      ),
    },
    {
      key: "teacher",
      label: "Teacher",
      flex: 1.7,
      render: (course) => <span className="truncate">{course.teacher_name || "—"}</span>,
    },
    {
      key: "category",
      label: "Category",
      flex: 1.5,
      render: (course) => <span className="truncate">{course.category?.name || "—"}</span>,
    },
    {
      key: "level",
      label: "Level",
      flex: 1.1,
      headerAlign: "center",
      cellAlign: "center",
      render: (course) => (
        <span style={{ color: LEVEL_COLORS[course.level] }}>{humanize(course.level)}</span>
      ),
    },
    {
      key: "format",
      label: "Format",
      flex: 1.7,
      render: (course) => (
        <span className="block truncate">
          {humanize(course.mode)} · {humanize(course.delivery_type)}
        </span>
      ),
    },
    {
      key: "content",
      label: "Content",
      flex: 1.15,
      headerAlign: "center",
      cellAlign: "center",
      render: (course) => (
        <span className="block whitespace-nowrap">
          {course.lessons_count} lessons
          <br />
          {course.duration_hours} h
        </span>
      ),
    },
    {
      key: "students",
      label: "Students",
      flex: 1,
      headerAlign: "center",
      cellAlign: "center",
      render: (course) => <span>{course.students_count}</span>,
    },
    {
      key: "rating",
      label: "Rating",
      flex: 1.35,
      headerAlign: "center",
      cellAlign: "center",
      render: (course) => (
        <span className="inline-flex items-center justify-center gap-1 whitespace-nowrap">
          <Star className="h-3.5 w-3.5 fill-(--color-gold) text-(--color-gold)" />
          {formatRating(course)}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      flex: 1.5,
      headerAlign: "center",
      cellAlign: "center",
      render: (course) => (
        <CourseStatusBadge status={courseStatus(course, tab)} color={STATUS_COLORS[tab]} />
      ),
    },
    {
      key: "actions",
      label: "Actions",
      flex: 1.3,
      headerAlign: "center",
      cellAlign: "center",
      render: (course) =>
        tab === "unassigned" ? (
          <TableAction label="Assign" onClick={() => onAssign(course)}>
            <ClipboardCheck className="h-3.5 w-3.5" />
          </TableAction>
        ) : (
          <Link
            href={`/moderator-dashboard/courses/${course.slug}/review`}
            className="inline-flex items-center gap-1.5 rounded-full border border-(--color-blue) bg-white px-3 py-1.5 text-xs font-semibold text-(--color-blue) transition hover:bg-(--color-brand-lavender-soft)"
          >
            <Eye className="h-3.5 w-3.5" />
            Review
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
  return (
    <DataTable<CourseListItem>
      columns={currentCourseColumns(tab, onAssign)}
      rows={courses}
      getRowKey={(course) => course.slug}
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
      <CourseThumbnail
        image={record.course_image_url}
        level={record.course_level}
        title={record.course_title}
      />
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

function historyChanges(record: HistoryRecord) {
  if (record.changed_fields.length === 0) return "Initial submission";
  return `${record.changed_fields.length} changed ${record.changed_fields.length === 1 ? "field" : "fields"}`;
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
  const columns: DataTableColumn<HistoryRecord>[] = [
    {
      key: "course",
      label: "Course",
      flex: 3.2,
      render: (record) => historyCourseIdentity(record),
    },
    {
      key: "category",
      label: "Category",
      flex: 1.8,
      render: (record) => <span className="truncate">{record.course_category || "—"}</span>,
    },
    {
      key: "level",
      label: "Level",
      flex: 1.2,
      headerAlign: "center",
      cellAlign: "center",
      render: (record) => (
        <span style={{ color: LEVEL_COLORS[(record.course_level as CourseLevel) ?? "beginner"] }}>
          {humanize(record.course_level)}
        </span>
      ),
    },
    {
      key: "changes",
      label: "Changes",
      flex: 2.2,
      render: (record) => (
        <span className="truncate" title={record.changed_fields.join(", ")}>
          {historyChanges(record)}
        </span>
      ),
    },
    {
      key: "date",
      label: "Decision date",
      flex: 1.6,
      headerAlign: "center",
      cellAlign: "center",
      render: (record) => (
        <span className="whitespace-nowrap">{formatDate(historyDate(record, status))}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      flex: 1.4,
      headerAlign: "center",
      cellAlign: "center",
      render: () => <CourseStatusBadge status={humanize(status)} color={STATUS_COLORS[status]} />,
    },
    {
      key: "actions",
      label: "Actions",
      flex: 1.2,
      headerAlign: "center",
      cellAlign: "center",
      render: (record) => (
        <TableAction label="View" onClick={() => onView(record)}>
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
