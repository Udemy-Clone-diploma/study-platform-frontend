"use client";

import type { ReactNode } from "react";
import { FileText, Receipt, RotateCcw } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/shared/ui/DataTable";
import { padTwo } from "@/shared/lib/time";
import { formatMoney } from "@/entities/payment";
import type { AdminPayment } from "@/entities/payment";
import { PaymentStatusBadge } from "./PaymentStatusBadge";

export function formatPaymentDate(iso: string | null): string {
  if (!iso) return "n/a";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "n/a";
  return `${padTwo(d.getDate())}.${padTwo(d.getMonth() + 1)}.${d.getFullYear()}`;
}

export function payerName(payment: AdminPayment): string {
  return payment.user?.full_name || "Unknown payer";
}

export function paymentCourses(payment: AdminPayment): string {
  const titles = payment.items.map((item) => item.course_title).filter(Boolean);
  if (titles.length === 0) return "No course on this payment";
  if (titles.length === 1) return titles[0];
  return `${titles[0]} +${titles.length - 1} more`;
}

const METHOD_LABELS: Record<AdminPayment["payment_method"], string> = {
  stripe: "Stripe",
  manual: "Manual",
};

export function refundedSoFar(payment: AdminPayment): number {
  return Number(payment.refunded_amount) || 0;
}

export function remainingAmount(payment: AdminPayment): number {
  return Math.max(0, (Number(payment.amount) || 0) - refundedSoFar(payment));
}

export function isPartiallyRefunded(payment: AdminPayment): boolean {
  return payment.status !== "refunded" && refundedSoFar(payment) > 0;
}

export function hasReceipt(payment: AdminPayment): boolean {
  return payment.is_successful || payment.status === "refunded";
}

type Props = {
  payments: AdminPayment[];
  emptyMessage: string;
  selectedPaymentId: number | null;
  onSelect: (payment: AdminPayment) => void;
  onDownloadReceipt: (payment: AdminPayment) => void;
  onDownloadInvoice: (payment: AdminPayment) => void;
  onRefund: (payment: AdminPayment) => void;
  currentSort?: string | null;
  onSortChange?: (ordering: string) => void;
};

export function PaymentsTable({
  payments,
  emptyMessage,
  selectedPaymentId,
  onSelect,
  onDownloadReceipt,
  onDownloadInvoice,
  onRefund,
  currentSort,
  onSortChange,
}: Props) {
  const columns: DataTableColumn<AdminPayment>[] = [
    {
      key: "payer",
      label: "Payer",
      flex: 1.7,
      render: (row) => (
        <button
          type="button"
          onClick={() => onSelect(row)}
          className="flex min-w-0 cursor-pointer flex-col border-none bg-transparent p-0 text-left"
          style={{ font: "inherit", color: "inherit" }}
        >
          <span className="overflow-hidden font-semibold text-ellipsis whitespace-nowrap underline decoration-from-font hover:text-(--color-blue)">
            {payerName(row)}
          </span>
          <span
            className="text-(--color-text-secondary)"
            style={{ fontSize: "clamp(11px, 0.83vw, 13px)" }}
          >
            #{row.id}
          </span>
        </button>
      ),
    },
    {
      key: "course",
      label: "Course",
      flex: 2,
      render: (row) => (
        <span
          className="block overflow-hidden text-ellipsis whitespace-nowrap"
          title={paymentCourses(row)}
        >
          {paymentCourses(row)}
        </span>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      flex: 1,
      headerAlign: "center",
      cellAlign: "center",
      sortKey: "amount",
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold whitespace-nowrap">
            {formatMoney(row.amount, row.currency)}
          </span>
          {isPartiallyRefunded(row) && (
            <span
              className="whitespace-nowrap text-(--color-text-secondary)"
              style={{ fontSize: "clamp(11px, 0.83vw, 13px)" }}
            >
              {formatMoney(row.refunded_amount, row.currency)} refunded
            </span>
          )}
        </div>
      ),
    },
    {
      key: "method",
      label: "Method",
      flex: 0.9,
      headerAlign: "center",
      cellAlign: "center",
      render: (row) => <span>{METHOD_LABELS[row.payment_method] ?? row.payment_method}</span>,
    },
    {
      key: "status",
      label: "Status",
      flex: 1.2,
      headerAlign: "center",
      cellAlign: "center",
      sortKey: "status",
      render: (row) => <PaymentStatusBadge status={row.status} />,
    },
    {
      key: "date",
      label: "Date",
      flex: 1,
      headerAlign: "center",
      cellAlign: "center",
      sortKey: "created_at",
      render: (row) => <span>{formatPaymentDate(row.created_at)}</span>,
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
          {hasReceipt(row) && (
            <ActionButton title="Download receipt" onClick={() => onDownloadReceipt(row)}>
              <Receipt size={16} />
            </ActionButton>
          )}
          {row.order_id !== null && (
            <ActionButton title="Download invoice" onClick={() => onDownloadInvoice(row)}>
              <FileText size={16} />
            </ActionButton>
          )}
          {row.can_be_refunded && (
            <ActionButton title="Refund payment" onClick={() => onRefund(row)} danger>
              <RotateCcw size={16} />
            </ActionButton>
          )}
        </div>
      ),
    },
  ];

  return (
    <DataTable<AdminPayment>
      columns={columns}
      rows={payments}
      getRowKey={(row) => row.id}
      emptyMessage={emptyMessage}
      headerVariant="plain"
      showIndex={false}
      rowVariant="card"
      selectedKey={selectedPaymentId}
      currentSort={currentSort}
      onSortChange={onSortChange}
    />
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
  children: ReactNode;
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
