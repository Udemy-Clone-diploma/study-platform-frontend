"use client";

import { createPortal } from "react-dom";
import { useLocale, useTranslations } from "next-intl";
import type { PaymentIntent, PaymentType } from "@/entities/payment";
import { StripePaymentForm, type PaymentFormSummary } from "./StripePaymentForm";

type StripePaymentDrawerProps = {
  isOpen: boolean;
  intent: PaymentIntent | null;
  paymentType: PaymentType;
  summary: PaymentFormSummary | null;
  canPayInInstallments?: boolean;
  onClose: () => void;
  onPaymentTypeChange?: (paymentType: PaymentType) => void;
  onPaymentStarted?: () => void;
  onPaymentError?: (message: string) => void;
  onPaymentSuccessRedirect?: () => void;
};

function formatMoney(amount: string, currency: string | null, freeLabel: string, locale: string): string {
  if (!currency) return Number(amount) === 0 ? freeLabel : amount;
  return new Intl.NumberFormat(locale, {
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
  canPayInInstallments,
  onClose,
  onPaymentTypeChange,
  onPaymentStarted,
  onPaymentError,
  onPaymentSuccessRedirect,
}: StripePaymentDrawerProps) {
  const t = useTranslations("StripePaymentDrawer");
  const locale = useLocale();

  if (!isOpen || !intent?.client_secret) return null;

  if (typeof document === "undefined") return null;

  const freeLabel = t("free");

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("ariaLabel")}
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-[#B7C7FA]/80 px-4 py-10 md:pt-[112px]"
    >
      <div
        className="flex w-full max-w-[calc(100vw-32px)] flex-col overflow-y-auto rounded-[16px] bg-white px-6 py-8 shadow-[0_0_15px_rgba(0,0,0,0.18)] md:h-[593px] md:w-[1100px] md:max-h-[calc(100vh-80px)] md:max-w-[calc(100vw-32px)] md:px-[60px] md:pt-[60px] md:pb-[72px]"
      >
        <StripePaymentForm
          intent={intent}
          paymentType={paymentType}
          canPayInInstallments={canPayInInstallments}
          summary={
            summary ?? {
              total: formatMoney(intent.amount, intent.currency, freeLabel, locale),
              due: formatMoney(intent.amount, intent.currency, freeLabel, locale),
              courses: [
                {
                  id: "fallback",
                  title: t("courseCheckout"),
                  subtitle: paymentType === "installments" ? t("partialPayment") : t("fullPayment"),
                  amount: formatMoney(intent.amount, intent.currency, freeLabel, locale),
                },
              ],
            }
          }
          onCancel={onClose}
          onPaymentTypeChange={onPaymentTypeChange}
          onPaymentStarted={onPaymentStarted}
          onPaymentError={onPaymentError}
          onPaymentSuccessRedirect={onPaymentSuccessRedirect}
        />
      </div>
    </div>,
    document.body,
  );
}
