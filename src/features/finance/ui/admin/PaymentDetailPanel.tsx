"use client";

import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { X } from "lucide-react";
import { formatMoney } from "@/entities/payment";
import type { AdminPayment } from "@/entities/payment";
import { PaymentStatusBadge } from "./PaymentStatusBadge";
import { formatPaymentDate, payerName, refundedSoFar, remainingAmount } from "./PaymentsTable";

type Props = {
  payment: AdminPayment;
  onClose: () => void;
};

export function PaymentDetailPanel({ payment, onClose }: Props) {
  return (
    <aside
      aria-label="Transaction details"
      className="flex shrink-0 flex-col rounded-[20px] border border-white bg-(--color-white-20) shadow-(--shadow-usp-glass) backdrop-blur-md"
      style={{
        width: "clamp(300px, 24vw, 360px)",
        padding: "clamp(16px, 1.67vw, 24px)",
        gap: "clamp(14px, 1.25vw, 18px)",
      }}
    >
      <div className="flex items-center justify-between" style={{ gap: 12 }}>
        <h2
          className="overflow-hidden font-bold text-ellipsis whitespace-nowrap text-(--color-text-primary)"
          style={{
            fontFamily: "var(--font-base)",
            fontSize: "clamp(16px, 1.25vw, 18px)",
            margin: 0,
          }}
        >
          Transaction #{payment.id}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close details"
          className="flex shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-transparent p-1 text-(--color-text-secondary) transition hover:bg-(--color-brand-lavender-soft)"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex items-center" style={{ gap: 12 }}>
        <span
          className="font-bold text-(--color-text-primary)"
          style={{ fontFamily: "var(--font-base)", fontSize: "clamp(20px, 1.67vw, 24px)" }}
        >
          {formatMoney(payment.amount, payment.currency)}
        </span>
        <PaymentStatusBadge status={payment.status} />
      </div>

      <dl className="flex flex-col" style={{ gap: 10, margin: 0 }}>
        {refundedSoFar(payment) > 0 && (
          <>
            <DetailRow label="Refunded">
              {formatMoney(payment.refunded_amount, payment.currency)}
            </DetailRow>
            <DetailRow label="Remaining">
              {formatMoney(String(remainingAmount(payment)), payment.currency)}
            </DetailRow>
          </>
        )}
        <DetailRow label="Payer">{payerName(payment)}</DetailRow>
        {payment.user?.email && <DetailRow label="Email">{payment.user.email}</DetailRow>}
        <DetailRow label="Method">
          {payment.payment_method === "stripe" ? "Stripe" : "Manual"}
        </DetailRow>
        <DetailRow label="Order">
          {payment.order_id !== null ? `#${payment.order_id}` : "n/a"}
        </DetailRow>
        {payment.installment_number !== null && (
          <DetailRow label="Installment">{payment.installment_number}</DetailRow>
        )}
        <DetailRow label="Created">{formatPaymentDate(payment.created_at)}</DetailRow>
        <DetailRow label="Processed">{formatPaymentDate(payment.processed_at)}</DetailRow>
        {payment.stripe_payment_intent_id && (
          <DetailRow label="Intent">{payment.stripe_payment_intent_id}</DetailRow>
        )}
      </dl>

      <div className="flex flex-col" style={{ gap: 8 }}>
        <span
          className="font-semibold text-(--color-text-secondary) uppercase"
          style={{
            fontFamily: "var(--font-base)",
            fontSize: "clamp(10px, 0.69vw, 11px)",
            letterSpacing: "0.06em",
          }}
        >
          Items
        </span>
        {payment.items.length === 0 ? (
          <span
            className="text-(--color-text-secondary)"
            style={{ fontFamily: "var(--font-base)", fontSize: "clamp(13px, 0.97vw, 15px)" }}
          >
            No course on this payment
          </span>
        ) : (
          payment.items.map((item) => (
            <div
              key={item.id}
              className="flex items-baseline justify-between"
              style={{
                gap: 12,
                fontFamily: "var(--font-base)",
                fontSize: "clamp(13px, 0.97vw, 15px)",
              }}
            >
              <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-(--color-text-primary)">
                {item.course_slug ? (
                  <Link
                    href={`/courses/${item.course_slug}`}
                    target="_blank"
                    className="underline decoration-from-font hover:text-(--color-blue)"
                  >
                    {item.course_title}
                  </Link>
                ) : (
                  item.course_title
                )}
              </span>
              <span className="shrink-0 text-(--color-text-secondary)">
                {formatMoney(item.unit_amount, item.currency)}
              </span>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div
      className="flex items-baseline"
      style={{ gap: 12, fontFamily: "var(--font-base)", fontSize: "clamp(13px, 0.97vw, 15px)" }}
    >
      <dt
        className="shrink-0 text-(--color-text-secondary)"
        style={{ width: "clamp(72px, 5.5vw, 88px)" }}
      >
        {label}
      </dt>
      <dd
        className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-(--color-text-primary)"
        style={{ margin: 0 }}
      >
        {children}
      </dd>
    </div>
  );
}
