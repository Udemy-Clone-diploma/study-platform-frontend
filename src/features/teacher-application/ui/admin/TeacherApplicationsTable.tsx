"use client";

import { useLocale, useTranslations } from "next-intl";
import type { TeacherApplication } from "@/entities/teacher-application";
import { DataTable, type DataTableColumn } from "@/shared/ui/DataTable";
import { formatUserDate } from "@/features/users";
import { ApplicationStatusBadge } from "./ApplicationStatusBadge";

type Props = {
  applications: TeacherApplication[];
  emptyMessage: string;
  selectedApplicationId: number | null;
  onSelect: (application: TeacherApplication) => void;
  currentSort?: string | null;
  onSortChange?: (ordering: string) => void;
};

export function TeacherApplicationsTable({
  applications,
  emptyMessage,
  selectedApplicationId,
  onSelect,
  currentSort,
  onSortChange,
}: Props) {
  const t = useTranslations("TeacherApplicationsAdmin");
  const locale = useLocale();
  const columns: DataTableColumn<TeacherApplication>[] = [
    {
      key: "applicant",
      label: t("columnApplicant"),
      flex: 2.2,
      render: (row) => (
        <button
          type="button"
          onClick={() => onSelect(row)}
          className="min-w-0 cursor-pointer overflow-hidden border-none bg-transparent p-0 text-left text-ellipsis whitespace-nowrap underline decoration-from-font hover:text-(--color-blue)"
          style={{ font: "inherit", color: "inherit" }}
        >
          {`${row.first_name} ${row.last_name}`.trim() || row.email}
        </button>
      ),
    },
    {
      key: "email",
      label: t("email"),
      flex: 2.2,
      headerAlign: "center",
      cellAlign: "center",
      render: (row) => (
        <span className="block overflow-hidden text-ellipsis whitespace-nowrap">{row.email}</span>
      ),
    },
    {
      key: "directions",
      label: t("directions"),
      flex: 2,
      headerAlign: "center",
      cellAlign: "center",
      render: (row) => (
        <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
          {row.directions.map((d) => d.name).join(", ") || "—"}
        </span>
      ),
    },
    {
      key: "submitted_at",
      label: t("submitted"),
      flex: 1.2,
      headerAlign: "center",
      cellAlign: "center",
      sortKey: "submitted_at",
      render: (row) => <span>{formatUserDate(row.submitted_at, locale)}</span>,
    },
    {
      key: "status",
      label: t("columnStatus"),
      flex: 1.2,
      headerAlign: "center",
      cellAlign: "center",
      render: (row) => <ApplicationStatusBadge status={row.status} />,
    },
  ];

  return (
    <DataTable<TeacherApplication>
      columns={columns}
      rows={applications}
      getRowKey={(row) => row.id}
      emptyMessage={emptyMessage}
      headerVariant="plain"
      showIndex={false}
      rowVariant="card"
      selectedKey={selectedApplicationId}
      currentSort={currentSort}
      onSortChange={onSortChange}
    />
  );
}
