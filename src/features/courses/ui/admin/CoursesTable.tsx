"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Ban, ExternalLink, LockOpen, Trash2 } from "lucide-react";
import type { CourseListItem } from "@/entities/course";
import { DataTable, type DataTableColumn } from "@/shared/ui/DataTable";
import { padTwo } from "@/shared/lib/time";
import { CourseStatusBadge } from "./CourseStatusBadge";

export function formatCourseDate(iso: string): string {
  const d = new Date(iso);
  return `${padTwo(d.getDate())}.${padTwo(d.getMonth() + 1)}.${d.getFullYear()}`;
}

type Props = {
  courses: CourseListItem[];
  emptyMessage: string;
  selectedCourseId: number | null;
  onSelect: (course: CourseListItem) => void;
  onToggleHidden: (course: CourseListItem) => void;
  onDelete: (course: CourseListItem) => void;
  currentSort?: string | null;
  onSortChange?: (ordering: string) => void;
};

export function CoursesTable({
  courses,
  emptyMessage,
  selectedCourseId,
  onSelect,
  onToggleHidden,
  onDelete,
  currentSort,
  onSortChange,
}: Props) {
  const columns: DataTableColumn<CourseListItem>[] = [
    {
      key: "course",
      label: "Course",
      flex: 2.6,
      sortKey: "title",
      render: (row) => (
        <div className="flex min-w-0 items-center" style={{ gap: "clamp(8px, 0.83vw, 12px)" }}>
          <CourseThumb image={row.image} title={row.title} />
          <button
            type="button"
            onClick={() => onSelect(row)}
            className="min-w-0 cursor-pointer overflow-hidden border-none bg-transparent p-0 text-left font-semibold text-ellipsis whitespace-nowrap underline decoration-from-font hover:text-(--color-blue)"
            style={{ font: "inherit", color: "inherit" }}
          >
            {row.title}
          </button>
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
        <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
          {row.teacher_name}
        </span>
      ),
    },
    {
      key: "category",
      label: "Category",
      flex: 1.1,
      headerAlign: "center",
      cellAlign: "center",
      render: (row) =>
        row.category ? (
          <Link
            href={`/catalog?category=${row.category.slug}`}
            className="underline decoration-from-font hover:text-(--color-blue)"
            title={`View ${row.category.name} courses in the catalog`}
          >
            {row.category.name}
          </Link>
        ) : (
          <span className="text-(--color-text-secondary)">No category</span>
        ),
    },
    {
      key: "status",
      label: "Status",
      flex: 1.2,
      headerAlign: "center",
      cellAlign: "center",
      render: (row) => <CourseStatusBadge status={row.status} />,
    },
    {
      key: "students",
      label: "Students",
      flex: 0.8,
      headerAlign: "center",
      cellAlign: "center",
      sortKey: "students_count",
      render: (row) => <span>{row.students_count}</span>,
    },
    {
      key: "created",
      label: "Created",
      flex: 1,
      headerAlign: "center",
      cellAlign: "center",
      sortKey: "created_at",
      render: (row) => <span>{formatCourseDate(row.created_at)}</span>,
    },
    {
      key: "actions",
      label: "Actions",
      flex: 1.1,
      headerAlign: "center",
      cellAlign: "center",
      render: (row) => (
        <div
          className="flex items-center justify-center"
          style={{ gap: "clamp(4px, 0.56vw, 8px)" }}
        >
          <Link
            href={`/courses/${row.slug}`}
            target="_blank"
            title="Open course page"
            aria-label="Open course page"
            className="inline-flex cursor-pointer items-center justify-center rounded-full p-1.5 text-(--color-text-primary) transition hover:bg-(--color-brand-lavender-soft)"
          >
            <ExternalLink size={16} />
          </Link>
          {(row.status === "published" || row.status === "hidden") && (
            <ActionButton
              title={row.status === "hidden" ? "Unhide course" : "Hide course"}
              onClick={() => onToggleHidden(row)}
              danger={row.status !== "hidden"}
            >
              {row.status === "hidden" ? <LockOpen size={16} /> : <Ban size={16} />}
            </ActionButton>
          )}
          <ActionButton title="Delete course" onClick={() => onDelete(row)} danger>
            <Trash2 size={16} />
          </ActionButton>
        </div>
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
      selectedKey={selectedCourseId}
      currentSort={currentSort}
      onSortChange={onSortChange}
    />
  );
}

export function CourseThumb({
  image,
  title,
  size = "clamp(36px, 2.78vw, 44px)",
}: {
  image: string | null;
  title: string;
  size?: string;
}) {
  const [imageBroken, setImageBroken] = useState(false);

  if (image && !imageBroken) {
    return (
      <span
        className="relative block shrink-0 overflow-hidden rounded-xl"
        style={{ width: size, height: size }}
      >
        <Image
          src={image}
          alt=""
          fill
          unoptimized
          sizes="88px"
          className="object-cover"
          onError={() => setImageBroken(true)}
        />
      </span>
    );
  }

  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-xl"
      style={{ width: size, height: size, background: "var(--gradient-brand)" }}
    >
      <span
        className="font-(family-name:--font-accent) font-bold text-(--color-text-primary)"
        style={{ fontSize: "clamp(14px, 1.11vw, 16px)", lineHeight: 1 }}
      >
        {title.charAt(0).toUpperCase()}
      </span>
    </span>
  );
}

function ActionButton({
  title,
  onClick,
  danger = false,
  children,
}: {
  title: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className="inline-flex cursor-pointer items-center justify-center rounded-full p-1.5 transition hover:bg-(--color-brand-lavender-soft)"
      style={{
        background: "none",
        border: "none",
        color: danger ? "var(--color-rejected)" : "var(--color-text-primary)",
      }}
    >
      {children}
    </button>
  );
}
