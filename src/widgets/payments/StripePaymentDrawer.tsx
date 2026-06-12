"use client";

import type { PaymentIntent, PaymentType } from "@/entities/payment";
import { StripePaymentForm, type PaymentFormSummary } from "./StripePaymentForm";

type StripePaymentDrawerProps = {
  isOpen: boolean;
  intent: PaymentIntent | null;
  paymentType: PaymentType;
  summary: PaymentFormSummary | null;
  onClose: () => void;
  onPaymentStarted?: () => void;
  onPaymentError?: (message: string) => void;
  onPaymentSuccessRedirect?: () => void;
};

function formatMoney(amount: string, currency: string | null): string {
  if (!currency) return Number(amount) === 0 ? "Free" : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(amount));
}

export function StripePaymentDrawer({
  isOpen,
  intent,
  paymentType,
  summary,
  onClose,
  onPaymentStarted,
  onPaymentError,
  onPaymentSuccessRedirect,
}: StripePaymentDrawerProps) {
  if (!isOpen || !intent?.client_secret) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Payment method"
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#B7C7FA]/80 px-4 py-10 md:pt-[112px]"
    >
      <div
        className="flex w-full max-w-[calc(100vw-32px)] flex-col overflow-y-auto rounded-[16px] bg-white px-6 py-8 shadow-[0_0_15px_rgba(0,0,0,0.18)] md:h-[593px] md:w-[1100px] md:max-h-[calc(100vh-80px)] md:max-w-[calc(100vw-32px)] md:px-[60px] md:pt-[60px] md:pb-[72px]"
      >
        <StripePaymentForm
          intent={intent}
          paymentType={paymentType}
          summary={
            summary ?? {
              total: formatMoney(intent.amount, intent.currency),
              due: formatMoney(intent.amount, intent.currency),
              courses: [
                {
                  id: "fallback",
                  title: "Course checkout",
                  subtitle: paymentType === "installments" ? "Partial payment" : "Full payment",
                  amount: formatMoney(intent.amount, intent.currency),
                },
              ],
            }
          }
          onCancel={onClose}
          onPaymentStarted={onPaymentStarted}
          onPaymentError={onPaymentError}
          onPaymentSuccessRedirect={onPaymentSuccessRedirect}
        />
      </div>
    </div>
  );
}
