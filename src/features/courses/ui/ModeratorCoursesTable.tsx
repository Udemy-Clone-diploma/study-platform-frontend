"use client";

import Link from "next/link";
import { Eye, UserPlus } from "lucide-react";
import type { ApprovedCourseRecord, CourseListItem, RejectedCourseRecord } from "@/entities/course";
import { DataTable, type DataTableColumn } from "@/shared/ui/DataTable";
import { CourseThumb, formatCourseDate } from "./admin/CoursesTable";

export type ModeratorCourseTab = "unassigned" | "review" | "needs_revision";

type ModeratorCoursesTableProps = {
  courses: CourseListItem[];
  tab: ModeratorCourseTab;
  emptyMessage: string;
  onAssign: (course: CourseListItem) => void;
};

/** Courses awaiting or under this moderator's review — "Unassigned" claims a course,
 * "Under review"/"Requires revision" (already assigned to me) continue into the review workspace. */
export function ModeratorCoursesTable({ courses, tab, emptyMessage, onAssign }: ModeratorCoursesTableProps) {
  const columns: DataTableColumn<CourseListItem>[] = [
    {
      key: "course",
      label: "Course",
      flex: 2.6,
      render: (row) => (
        <div className="flex min-w-0 items-center" style={{ gap: "clamp(8px, 0.83vw, 12px)" }}>
          <CourseThumb image={row.image} title={row.title} />
          <span className="min-w-0 overflow-hidden font-semibold text-ellipsis whitespace-nowrap">
            {row.title}
          </span>
        </div>
      ),
    },
    {
      key: "instructor",
      label: "Instructor",
      flex: 1.4,
      headerAlign: "center",
      cellAlign: "center",
      render: (row) => (
        <span className="block overflow-hidden text-ellipsis whitespace-nowrap">{row.teacher_name}</span>
      ),
    },
    {
      key: "category",
      label: "Category",
      flex: 1.1,
      headerAlign: "center",
      cellAlign: "center",
      render: (row) => row.category?.name ?? <span className="text-(--color-text-secondary)">No category</span>,
    },
    {
      key: "created",
      label: "Submitted",
      flex: 1,
      headerAlign: "center",
      cellAlign: "center",
      render: (row) => <span>{formatCourseDate(row.created_at)}</span>,
    },
    {
      key: "actions",
      label: "Actions",
      flex: 1.2,
      headerAlign: "center",
      cellAlign: "center",
      render: (row) =>
        tab === "unassigned" ? (
          <button
            type="button"
            onClick={() => onAssign(row)}
            className="inline-flex cursor-pointer items-center rounded-full px-3 py-1.5 font-(family-name:--font-accent) font-medium transition hover:opacity-80"
            style={{ gap: 6, background: "var(--color-text-primary)", color: "var(--color-bg)", fontSize: "clamp(11px, 0.9vw, 13px)" }}
          >
            <UserPlus size={14} /> Assign to me
          </button>
        ) : (
          <Link
            href={`/moderator-dashboard/courses/${row.slug}/review`}
            className="inline-flex items-center rounded-full border border-(--color-text-primary) px-3 py-1.5 font-(family-name:--font-accent) font-medium transition hover:bg-(--color-brand-lavender-soft)"
            style={{ gap: 6, fontSize: "clamp(11px, 0.9vw, 13px)" }}
          >
            <Eye size={14} /> Continue review
          </Link>
        ),
    },
  ];

  return (
    <DataTable<CourseListItem>
      columns={columns}
      rows={courses}
      getRowKey={(row) => row.id}
      emptyMessage={emptyMessage}
      headerVariant="plain"
      showIndex={false}
      rowVariant="card"
    />
  );
}

type HistoryRecord = ApprovedCourseRecord | RejectedCourseRecord;

type ModeratorHistoryTableProps = {
  records: HistoryRecord[];
  status: "approved" | "rejected";
  emptyMessage: string;
  onView: (record: HistoryRecord) => void;
};

/** Immutable snapshot history of courses this moderator has approved or rejected. */
export function ModeratorHistoryTable({ records, status, emptyMessage, onView }: ModeratorHistoryTableProps) {
  const columns: DataTableColumn<HistoryRecord>[] = [
    {
      key: "course",
      label: "Course",
      flex: 2.6,
      render: (row) => (
        <div className="flex min-w-0 items-center" style={{ gap: "clamp(8px, 0.83vw, 12px)" }}>
          <CourseThumb image={row.course_image_url} title={row.course_title} />
          <span className="min-w-0 overflow-hidden font-semibold text-ellipsis whitespace-nowrap">
            {row.course_title}
          </span>
        </div>
      ),
    },
    {
      key: "category",
      label: "Category",
      flex: 1.2,
      headerAlign: "center",
      cellAlign: "center",
      render: (row) => row.course_category || <span className="text-(--color-text-secondary)">No category</span>,
    },
    {
      key: "level",
      label: "Level",
      flex: 1,
      headerAlign: "center",
      cellAlign: "center",
      render: (row) => <span className="capitalize">{row.course_level}</span>,
    },
    {
      key: "date",
      label: status === "approved" ? "Approved" : "Rejected",
      flex: 1,
      headerAlign: "center",
      cellAlign: "center",
      render: (row) =>
        formatCourseDate(status === "approved" ? (row as ApprovedCourseRecord).approved_at : (row as RejectedCourseRecord).rejected_at),
    },
    {
      key: "actions",
      label: "Actions",
      flex: 0.8,
      headerAlign: "center",
      cellAlign: "center",
      render: (row) => (
        <button
          type="button"
          onClick={() => onView(row)}
          aria-label="View details"
          title="View details"
          className="inline-flex cursor-pointer items-center justify-center rounded-full p-1.5 text-(--color-text-primary) transition hover:bg-(--color-brand-lavender-soft)"
          style={{ background: "none", border: "none" }}
        >
          <Eye size={16} />
        </button>
      ),
    },
  ];

  return (
    <DataTable<HistoryRecord>
      columns={columns}
      rows={records}
      getRowKey={(row) => row.id}
      emptyMessage={emptyMessage}
      headerVariant="plain"
      showIndex={false}
      rowVariant="card"
    />
  );
}
