"use client";

import { Link } from "@/i18n/navigation";
import { Ban, ExternalLink, RotateCcw, Undo2 } from "lucide-react";
import type { Certificate } from "@/entities/certificate";
import { DataTable, type DataTableColumn } from "@/shared/ui/DataTable";
import { padTwo } from "@/shared/lib/time";
import { CertificateStatusBadge } from "./CertificateStatusBadge";

export function formatCertificateDate(iso: string): string {
  const d = new Date(iso);
  return `${padTwo(d.getDate())}.${padTwo(d.getMonth() + 1)}.${d.getFullYear()}`;
}

type Props = {
  certificates: Certificate[];
  emptyMessage: string;
  selectedCertificateId: number | null;
  onSelect: (certificate: Certificate) => void;
  onReissue: (certificate: Certificate) => void;
  onRevoke: (certificate: Certificate) => void;
  onRestore: (certificate: Certificate) => void;
  currentSort?: string | null;
  onSortChange?: (ordering: string) => void;
};

export function CertificatesTable({
  certificates,
  emptyMessage,
  selectedCertificateId,
  onSelect,
  onReissue,
  onRevoke,
  onRestore,
  currentSort,
  onSortChange,
}: Props) {
  const columns: DataTableColumn<Certificate>[] = [
    {
      key: "certificate",
      label: "Certificate",
      flex: 1.5,
      sortKey: "serial",
      render: (row) => (
        <button
          type="button"
          onClick={() => onSelect(row)}
          className="min-w-0 max-w-full cursor-pointer overflow-hidden border-none bg-transparent p-0 text-left font-mono text-ellipsis whitespace-nowrap text-(--color-blue) hover:underline"
          style={{ fontSize: "inherit" }}
          title={`Show details for ${row.serial}`}
        >
          {row.serial}
        </button>
      ),
    },
    {
      key: "student",
      label: "Student",
      flex: 1.3,
      sortKey: "student_name",
      render: (row) => (
        <span
          className="block overflow-hidden text-ellipsis whitespace-nowrap"
          title={row.student.email}
        >
          {row.student.full_name.trim() || row.student.email}
        </span>
      ),
    },
    {
      key: "course",
      label: "Course",
      flex: 1.5,
      sortKey: "course_title",
      render: (row) => (
        <Link
          href={`/courses/${row.course.slug}`}
          target="_blank"
          className="block overflow-hidden text-ellipsis whitespace-nowrap underline decoration-from-font hover:text-(--color-blue)"
          title={row.course.title}
        >
          {row.course.title}
        </Link>
      ),
    },
    {
      key: "issued",
      label: "Issue date",
      flex: 1,
      headerAlign: "center",
      cellAlign: "center",
      sortKey: "issued_at",
      render: (row) => <span>{formatCertificateDate(row.issued_at)}</span>,
    },
    {
      key: "status",
      label: "Status",
      flex: 1.1,
      headerAlign: "center",
      cellAlign: "center",
      render: (row) => (
        <CertificateStatusBadge status={row.status} superseded={row.superseded_by !== null} />
      ),
    },
    {
      key: "actions",
      label: "Actions",
      flex: 1.1,
      headerAlign: "center",
      cellAlign: "center",
      render: (row) => {
        const replaceable = row.status === "valid" && row.superseded_by === null;
        return (
          <div
            className="flex items-center justify-center"
            style={{ gap: "clamp(4px, 0.56vw, 8px)" }}
          >
            {row.certificate_url ? (
              <Link
                href={row.certificate_url}
                target="_blank"
                rel="noopener noreferrer"
                title="Open certificate PDF"
                aria-label={`Open certificate ${row.serial} as PDF`}
                className="inline-flex cursor-pointer items-center justify-center rounded-full p-1.5 text-(--color-text-primary) transition hover:bg-(--color-brand-lavender-soft) focus-visible:outline-2 focus-visible:outline-(--color-blue)"
              >
                <ExternalLink size={16} />
              </Link>
            ) : null}
            {replaceable && (
              <ActionButton
                title={`Re-issue certificate ${row.serial}`}
                onClick={() => onReissue(row)}
              >
                <RotateCcw size={16} />
              </ActionButton>
            )}
            {row.status === "valid" && (
              <ActionButton
                title={`Revoke certificate ${row.serial}`}
                onClick={() => onRevoke(row)}
                danger
              >
                <Ban size={16} />
              </ActionButton>
            )}
            {row.status === "revoked" && (
              <ActionButton
                title={
                  row.completion_reverted
                    ? `${row.serial} cannot be restored: the course completion behind it was reverted. Issue a new certificate by hand instead.`
                    : `Restore certificate ${row.serial}`
                }
                onClick={() => onRestore(row)}
                disabled={row.completion_reverted}
              >
                <Undo2 size={16} />
              </ActionButton>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <DataTable<Certificate>
      columns={columns}
      rows={certificates}
      getRowKey={(row) => row.id}
      emptyMessage={emptyMessage}
      headerVariant="plain"
      showIndex={false}
      rowVariant="card"
      selectedKey={selectedCertificateId}
      currentSort={currentSort}
      onSortChange={onSortChange}
    />
  );
}

function ActionButton({
  title,
  onClick,
  danger = false,
  disabled = false,
  children,
}: {
  title: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex cursor-pointer items-center justify-center rounded-full p-1.5 transition hover:bg-(--color-brand-lavender-soft) focus-visible:outline-2 focus-visible:outline-(--color-blue) disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
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
