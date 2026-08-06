"use client";

import { useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Ban, ExternalLink, LockOpen, Trash2 } from "lucide-react";
import type { CourseListItem } from "@/entities/course";
import { DataTable, type DataTableColumn } from "@/shared/ui/DataTable";
import { formatDate } from "@/shared/lib/time";
import { CourseStatusBadge } from "./CourseStatusBadge";

export function formatCourseDate(iso: string, locale: string): string {
  return formatDate(iso, locale);
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
  const t = useTranslations("CoursesTable");
  const locale = useLocale();
  const compact = selectedCourseId !== null;
  const columns: DataTableColumn<CourseListItem>[] = [
    {
      key: "course",
      label: t("columnCourse"),
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
      label: t("columnInstructor"),
      flex: 1.2,
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
      label: t("columnCategory"),
      flex: 1.1,
      headerAlign: "center",
      cellAlign: "center",
      render: (row) =>
        row.category ? (
          <Link
            href={`/catalog?category=${row.category.slug}`}
            className="underline decoration-from-font hover:text-(--color-blue)"
            title={t("viewCategoryCoursesTitle", { category: row.category.name })}
          >
            {row.category.name}
          </Link>
        ) : (
          <span className="text-(--color-text-secondary)">{t("noCategory")}</span>
        ),
    },
    {
      key: "status",
      label: t("columnStatus"),
      flex: 1.7,
      headerAlign: "center",
      cellAlign: "center",
      render: (row) => (
        <CourseStatusBadge status={row.status} pendingEditStatus={row.pending_edit_status} />
      ),
    },
    {
      key: "students",
      label: t("columnStudents"),
      flex: 0.8,
      headerAlign: "center",
      cellAlign: "center",
      sortKey: "students_count",
      render: (row) => <span>{row.students_count}</span>,
    },
    {
      key: "created",
      label: t("columnCreated"),
      flex: 1,
      headerAlign: "center",
      cellAlign: "center",
      sortKey: "created_at",
      render: (row) => <span>{formatCourseDate(row.created_at, locale)}</span>,
    },
    {
      key: "actions",
      label: t("columnActions"),
      flex: 1.1,
      headerAlign: "center",
      cellAlign: "center",
      render: (row) => (
        <div
          className="flex flex-wrap items-center justify-center"
          style={{ gap: "clamp(2px, 0.42vw, 8px)", rowGap: "clamp(2px, 0.42vw, 6px)" }}
        >
          <Link
            href={`/courses/${row.slug}`}
            target="_blank"
            title={t("openCoursePage")}
            aria-label={t("openCoursePage")}
            className="inline-flex cursor-pointer items-center justify-center rounded-full p-1.5 text-(--color-text-primary) transition hover:bg-(--color-brand-lavender-soft)"
          >
            <ExternalLink size={16} />
          </Link>
          {(row.status === "published" || row.status === "hidden") && (
            <ActionButton
              title={row.status === "hidden" ? t("unhideCourseTitle") : t("hideCourseTitle")}
              onClick={() => onToggleHidden(row)}
              danger={row.status !== "hidden"}
            >
              {row.status === "hidden" ? <LockOpen size={16} /> : <Ban size={16} />}
            </ActionButton>
          )}
          <ActionButton title={t("deleteCourseTitle")} onClick={() => onDelete(row)} danger>
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
      minWidth="820px"
      compact={compact}
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
