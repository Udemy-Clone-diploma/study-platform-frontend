"use client";

import type { ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { FileText, Receipt, RotateCcw } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/shared/ui/DataTable";
import { formatDate } from "@/shared/lib/time";
import { formatMoney } from "@/entities/payment";
import type { AdminPayment } from "@/entities/payment";
import { PaymentStatusBadge } from "./PaymentStatusBadge";

type Translator = (key: string, values?: Record<string, string | number>) => string;

export function formatPaymentDate(iso: string | null, locale: string, naLabel: string): string {
  if (!iso) return naLabel;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return naLabel;
  return formatDate(d, locale);
}

export function payerName(payment: AdminPayment, t: Translator): string {
  return payment.user?.full_name || t("unknownPayer");
}

export function paymentCourses(payment: AdminPayment, t: Translator): string {
  const titles = payment.items.map((item) => item.course_title).filter(Boolean);
  if (titles.length === 0) return t("noCourseOnPayment");
  if (titles.length === 1) return titles[0];
  return `${titles[0]} ${t("moreCourses", { count: titles.length - 1 })}`;
}

export function methodLabel(method: AdminPayment["payment_method"], t: Translator): string {
  if (method === "stripe") return t("methodStripe");
  if (method === "liqpay") return t("methodLiqPay");
  return t("methodManual");
}

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
  const t = useTranslations("PaymentsTable");
  const tTeacherPayments = useTranslations("TeacherPaymentsPage");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const naLabel = tCommon("notAvailable");

  const columns: DataTableColumn<AdminPayment>[] = [
    {
      key: "payer",
      label: t("columnPayer"),
      flex: 1.7,
      render: (row) => (
        <button
          type="button"
          onClick={() => onSelect(row)}
          className="flex min-w-0 cursor-pointer flex-col border-none bg-transparent p-0 text-left"
          style={{ font: "inherit", color: "inherit" }}
        >
          <span className="overflow-hidden font-semibold text-ellipsis whitespace-nowrap underline decoration-from-font hover:text-(--color-blue)">
            {payerName(row, t)}
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
      label: t("columnCourse"),
      flex: 2,
      render: (row) => (
        <span
          className="block overflow-hidden text-ellipsis whitespace-nowrap"
          title={paymentCourses(row, t)}
        >
          {paymentCourses(row, t)}
        </span>
      ),
    },
    {
      key: "amount",
      label: tTeacherPayments("columnAmount"),
      flex: 1,
      headerAlign: "center",
      cellAlign: "center",
      sortKey: "amount",
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold whitespace-nowrap">
            {formatMoney(row.amount, row.currency, locale)}
          </span>
          {isPartiallyRefunded(row) && (
            <span
              className="whitespace-nowrap text-(--color-text-secondary)"
              style={{ fontSize: "clamp(11px, 0.83vw, 13px)" }}
            >
              {t("refundedAmount", {
                amount: formatMoney(row.refunded_amount, row.currency, locale),
              })}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "method",
      label: t("columnMethod"),
      flex: 0.9,
      headerAlign: "center",
      cellAlign: "center",
      render: (row) => <span>{methodLabel(row.payment_method, t)}</span>,
    },
    {
      key: "status",
      label: tTeacherPayments("columnStatus"),
      flex: 1.2,
      headerAlign: "center",
      cellAlign: "center",
      sortKey: "status",
      render: (row) => <PaymentStatusBadge status={row.status} />,
    },
    {
      key: "date",
      label: tTeacherPayments("columnDate"),
      flex: 1,
      headerAlign: "center",
      cellAlign: "center",
      sortKey: "created_at",
      render: (row) => <span>{formatPaymentDate(row.created_at, locale, naLabel)}</span>,
    },
    {
      key: "actions",
      label: t("columnActions"),
      flex: 1.1,
      headerAlign: "center",
      cellAlign: "center",
      render: (row) => (
        <div
          className="flex items-center justify-center"
          style={{ gap: "clamp(4px, 0.56vw, 8px)" }}
        >
          {hasReceipt(row) && (
            <ActionButton title={t("actionDownloadReceipt")} onClick={() => onDownloadReceipt(row)}>
              <Receipt size={16} />
            </ActionButton>
          )}
          {row.order_id !== null && (
            <ActionButton title={t("actionDownloadInvoice")} onClick={() => onDownloadInvoice(row)}>
              <FileText size={16} />
            </ActionButton>
          )}
          {row.can_be_refunded && (
            <ActionButton title={t("actionRefundPayment")} onClick={() => onRefund(row)} danger>
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
