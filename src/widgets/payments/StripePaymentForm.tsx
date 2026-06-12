"use client";

import { FormEvent, useMemo, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type StripeElementsOptions } from "@stripe/stripe-js";
import { ArrowLeft, Download } from "lucide-react";
import type { PaymentIntent, PaymentType } from "@/entities/payment";
import { PaymentCourseCard } from "./PaymentCourseCard";

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

type StripePaymentFormProps = {
  intent: PaymentIntent;
  paymentType: PaymentType;
  summary: PaymentFormSummary;
  submitLabel?: string;
  onCancel?: () => void;
  onPaymentStarted?: () => void;
  onPaymentError?: (message: string) => void;
  onPaymentSuccessRedirect?: () => void;
};

export type PaymentFormSummary = {
  total: string;
  due: string;
  courses: PaymentSummaryCourse[];
};

export type PaymentSummaryCourse = {
  id: string | number;
  title: string;
  subtitle: string;
  amount: string;
  image?: string | null;
};

function successUrl(intent: PaymentIntent): string {
  const url = new URL("/payment/success", window.location.origin);
  url.searchParams.set("order_id", String(intent.order_id));
  url.searchParams.set("payment_id", String(intent.payment_id));
  url.searchParams.set("payment_intent", intent.payment_intent_id);
  if (intent.installment_id) {
    url.searchParams.set("installment_id", String(intent.installment_id));
  }
  return url.toString();
}

function StripePaymentElementForm({
  intent,
  paymentType,
  summary,
  submitLabel = "To Pay",
  onCancel,
  onPaymentStarted,
  onPaymentError,
  onPaymentSuccessRedirect,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stripe || !elements || processing) return;

    setProcessing(true);
    setError("");
    onPaymentStarted?.();

    const returnUrl = successUrl(intent);
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
    });

    if (result.error) {
      const message = result.error.message || "Payment was not completed.";
      setError(message);
      onPaymentError?.(message);
      setProcessing(false);
      return;
    }

    onPaymentSuccessRedirect?.();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
      <div className="mb-7">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={processing}
            className="inline-flex h-8 items-center gap-2 text-[18px] leading-none text-[#121212] transition-colors hover:text-[#003AFF] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Go back
          </button>
        ) : null}
      </div>

      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <button
          type="button"
          disabled
          title="Invoice download is not available for unpaid orders yet."
          className="inline-flex h-8 w-full max-w-[496px] items-center gap-2 rounded-full bg-[#F1F4FF] px-4 font-mono text-[12px] uppercase text-[#121212] disabled:cursor-not-allowed"
        >
          Download invoice
          <Download size={12} aria-hidden="true" />
        </button>

        <div className="inline-flex h-9 w-fit rounded-full border border-[#003AFF] bg-white p-0.5 font-mono text-[12px] uppercase text-[#121212]">
          <span
            className={[
              "inline-flex min-w-[132px] items-center justify-center rounded-full px-4",
              paymentType === "full" ? "bg-(--color-brand-lavender-soft)" : "",
            ].join(" ")}
          >
            Full payment
          </span>
          <span
            className={[
              "inline-flex min-w-[150px] items-center justify-center rounded-full px-4",
              paymentType === "installments" ? "bg-(--color-brand-lavender-soft)" : "",
            ].join(" ")}
          >
            Partial payment
          </span>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-8 md:grid-cols-[365px_490px] md:gap-[94px]">
        <section className="flex min-w-0 flex-col">
          <h3 className="mb-4 text-[20px] leading-6 font-normal text-[#121212]">
            Order summary
          </h3>

          <div className="mb-4 flex max-h-[180px] w-full max-w-[365px] flex-col gap-2 overflow-y-auto pr-1">
            {summary.courses.map((course) => (
              <PaymentCourseCard
                key={course.id}
                title={course.title}
                subtitle={course.subtitle}
                amount={course.amount}
                image={course.image}
              />
            ))}
          </div>

          <div className="mb-3 flex max-w-[365px] items-center justify-between border-t border-[#D9D9D9] pt-2 text-[14px] leading-5 text-[#121212]">
            <span>{paymentType === "installments" ? "Due now" : "Total"}</span>
            <span>{summary.due}</span>
          </div>

          {paymentType === "installments" ? (
            <p className="mb-4 text-[11px] text-[#6A6A6A]">
              Full order total: {summary.total}
            </p>
          ) : null}

          <p className="mb-5 max-w-[365px] text-[11px] leading-[14px] text-[#121212]">
            By submitting your order, you confirm that you have read and agree to the terms of use.
          </p>

          <button
            type="submit"
            disabled={!stripe || !elements || processing}
            className="inline-flex h-10 w-full max-w-[365px] items-center justify-center rounded-full bg-black px-5 text-[18px] leading-none text-white transition-colors hover:bg-[#252525] disabled:cursor-not-allowed disabled:bg-[#6A6A6A]"
          >
            {processing ? "Processing..." : submitLabel}
          </button>

          {error ? (
            <p role="alert" className="mt-3 max-w-[330px] font-mono text-[11px] text-[#B42318]">
              {error}
            </p>
          ) : null}
        </section>

        <section className="min-w-0 justify-self-start md:w-full md:max-w-[490px]">
          <h3 className="mb-5 text-[20px] leading-6 font-normal text-[#121212]">
            Payment method
          </h3>

          <div className="w-full max-w-[490px]">
            <PaymentElement
              options={{
                layout: "tabs",
                fields: {
                  billingDetails: {
                    address: "if_required",
                  },
                },
                terms: {
                  card: "never",
                },
                wallets: {
                  link: "never",
                },
              }}
            />
          </div>
        </section>
      </div>
    </form>
  );
}

export function StripePaymentForm(props: StripePaymentFormProps) {
  const options = useMemo<StripeElementsOptions>(
    () => ({
      clientSecret: props.intent.client_secret,
      appearance: {
        theme: "stripe",
        variables: {
          colorPrimary: "#003AFF",
          colorText: "#121212",
          colorTextSecondary: "#6A6A6A",
          colorDanger: "#B42318",
          colorBackground: "#FFFFFF",
          colorBorder: "#DCE5FF",
          borderRadius: "6px",
          fontFamily: "Arial, ui-sans-serif, system-ui, sans-serif",
          fontSizeBase: "14px",
          spacingUnit: "4px",
        },
        rules: {
          ".Block": {
            boxShadow: "none",
          },
          ".Input": {
            border: "1px solid #DCE5FF",
            boxShadow: "none",
            padding: "8px 10px",
            minHeight: "34px",
          },
          ".Input:focus": {
            border: "1px solid #003AFF",
            boxShadow: "0 0 0 1px #003AFF",
          },
          ".Label": {
            color: "#6A6A6A",
            fontSize: "14px",
          },
          ".Tab": {
            border: "1px solid #DCE5FF",
            boxShadow: "none",
            minHeight: "34px",
          },
          ".Tab--selected": {
            border: "1px solid #003AFF",
            boxShadow: "0 0 0 1px #003AFF",
          },
        },
      },
    }),
    [props.intent.client_secret],
  );

  if (!stripePromise) {
    return (
      <div className="rounded-md border border-[#F2B8B5] bg-[#FFF5F5] px-4 py-3 text-center font-mono text-[12px] text-[#B42318]">
        Stripe publishable key is not configured.
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={options} key={props.intent.client_secret}>
      <StripePaymentElementForm {...props} />
    </Elements>
  );
}
