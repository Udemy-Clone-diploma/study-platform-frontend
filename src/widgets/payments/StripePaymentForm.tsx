"use client";

import { FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe, type StripeElementsOptions } from "@stripe/stripe-js";
import { ArrowLeft } from "lucide-react";
import { downloadOrderInvoice, type PaymentIntent, type PaymentType } from "@/entities/payment";
import { PaymentCourseCard } from "./PaymentCourseCard";

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

type CardFieldName = "number" | "expiry" | "cvc";

const CARD_FIELD_ERROR_MESSAGE: Record<CardFieldName, string> = {
  number: "*error",
  expiry: "*error",
  cvc: "*error",
};

const CARD_ELEMENT_STYLE = {
  style: {
    base: {
      color: "#121212",
      fontFamily: "Arial, ui-sans-serif, system-ui, sans-serif",
      fontSize: "16px",
      lineHeight: "20px",
      "::placeholder": {
        color: "#A3A3A3",
      },
    },
    invalid: {
      color: "#D62E2E",
    },
  },
};

const CARD_NUMBER_ELEMENT_OPTIONS = {
  ...CARD_ELEMENT_STYLE,
  showIcon: true,
  iconStyle: "solid" as const,
};

type StripePaymentFormProps = {
  intent: PaymentIntent;
  paymentType: PaymentType;
  summary: PaymentFormSummary;
  submitLabel?: string;
  canPayInInstallments?: boolean;
  onCancel?: () => void;
  onPaymentTypeChange?: (paymentType: PaymentType) => void;
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
  canPayInInstallments = false,
  onCancel,
  onPaymentTypeChange,
  onPaymentStarted,
  onPaymentError,
  onPaymentSuccessRedirect,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<CardFieldName, string>>({
    number: "",
    expiry: "",
    cvc: "",
  });
  const [fieldComplete, setFieldComplete] = useState<Record<CardFieldName, boolean>>({
    number: false,
    expiry: false,
    cvc: false,
  });
  const [walletNotice, setWalletNotice] = useState("");

  function handleCardFieldChange(
    field: CardFieldName,
    event: { complete: boolean; error?: { message?: string } },
  ) {
    setFieldComplete((current) => ({ ...current, [field]: event.complete }));
    setFieldErrors((current) => ({
      ...current,
      [field]: event.error ? CARD_FIELD_ERROR_MESSAGE[field] : "",
    }));
  }

  async function handleInvoiceDownload() {
    if (invoiceLoading) return;

    setInvoiceLoading(true);
    setInvoiceError("");

    try {
      const invoice = await downloadOrderInvoice(intent.order_id);
      const url = window.URL.createObjectURL(invoice);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${intent.order_id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
    } catch {
      setInvoiceError("Could not download invoice.");
    } finally {
      setInvoiceLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stripe || !elements || processing) return;

    const cardNumber = elements.getElement(CardNumberElement);
    if (!cardNumber) {
      const message = "Card fields are unavailable. Please try again.";
      setError(message);
      onPaymentError?.(message);
      return;
    }

    const incompleteFields = (Object.keys(fieldComplete) as CardFieldName[]).filter(
      (field) => !fieldComplete[field],
    );
    if (incompleteFields.length > 0) {
      setFieldErrors((current) => {
        const next = { ...current };
        incompleteFields.forEach((field) => {
          next[field] = CARD_FIELD_ERROR_MESSAGE[field];
        });
        return next;
      });
      return;
    }

    setProcessing(true);
    setError("");
    onPaymentStarted?.();

    const returnUrl = successUrl(intent);
    const result = await stripe.confirmCardPayment(intent.client_secret, {
      payment_method: { card: cardNumber },
      return_url: returnUrl,
    });

    if (result.error) {
      const message = result.error.message || "Payment was not completed.";
      const cardFieldByErrorCode: Partial<Record<string, CardFieldName>> = {
        incomplete_number: "number",
        invalid_number: "number",
        incomplete_expiry: "expiry",
        invalid_expiry: "expiry",
        expired_card: "expiry",
        incomplete_cvc: "cvc",
        invalid_cvc: "cvc",
        incorrect_cvc: "cvc",
      };
      const field = result.error.code ? cardFieldByErrorCode[result.error.code] : undefined;
      if (field) {
        setFieldErrors((current) => ({
          ...current,
          [field]: CARD_FIELD_ERROR_MESSAGE[field],
        }));
      } else {
        setError(message);
        onPaymentError?.(message);
      }
      setProcessing(false);
      return;
    }

    if (onPaymentSuccessRedirect) {
      onPaymentSuccessRedirect();
    } else {
      window.location.href = returnUrl;
    }
  }

  function handleWalletClick() {
    setWalletNotice("Coming soon");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
      <div className="mb-7">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={processing}
            className="inline-flex h-[25px] items-center gap-2 font-(family-name:--font-base) text-[20px] leading-5 font-semibold text-[#121212] transition-colors hover:text-[#003AFF] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ArrowLeft size={20} aria-hidden="true" />
            Go back
          </button>
        ) : null}
      </div>

      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <button
            type="button"
            onClick={handleInvoiceDownload}
            disabled={invoiceLoading}
            title="Download invoice for this order."
            className="inline-flex h-10 w-fit items-center gap-2.5 rounded-[20px] bg-[#D6E0FF] px-5 font-(family-name:--font-accent) text-[16px] leading-5 font-medium uppercase text-[#121212] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {invoiceLoading ? "Downloading..." : "Download invoice"}
            <Image src="/icons/download.svg" alt="" aria-hidden="true" width={20} height={20} />
          </button>
          {invoiceError ? (
            <p role="alert" className="mt-1 text-[12px] leading-4 text-[#B42318]">
              {invoiceError}
            </p>
          ) : null}
        </div>

        <div
          role="group"
          aria-label="Payment type"
          className="inline-flex h-10 w-[340px] gap-2.5 overflow-hidden rounded-[20px] border border-[#003AFF] bg-white font-(family-name:--font-accent) text-[16px] leading-5 font-medium uppercase text-[#121212]"
        >
          <button
            type="button"
            aria-pressed={paymentType === "full"}
            disabled={!onPaymentTypeChange || processing || paymentType === "full"}
            onClick={() => onPaymentTypeChange?.("full")}
            className={[
              "inline-flex h-full shrink-0 items-center justify-center rounded-[20px] px-5 transition-colors disabled:cursor-not-allowed disabled:opacity-60",
              paymentType === "full" ? "bg-[#D6E0FF]" : "",
            ].join(" ")}
          >
            Full payment
          </button>
          <button
            type="button"
            aria-pressed={paymentType === "installments"}
            disabled={
              !onPaymentTypeChange ||
              !canPayInInstallments ||
              processing ||
              paymentType === "installments"
            }
            onClick={() => onPaymentTypeChange?.("installments")}
            className={[
              "inline-flex h-full min-w-0 flex-1 items-center justify-center rounded-[20px] px-2 transition-colors disabled:cursor-not-allowed disabled:opacity-60",
              paymentType === "installments" ? "bg-[#D6E0FF]" : "",
            ].join(" ")}
          >
            Partial payment
          </button>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-8 md:grid-cols-[365px_490px] md:gap-[94px]">
        <section className="flex min-w-0 flex-col">
          <h3 className="mb-4 text-[20px] leading-6 font-normal text-[#121212]">Order summary</h3>

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
            <p className="mb-4 text-[11px] text-[#6A6A6A]">Full order total: {summary.total}</p>
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

          <div className="mt-3 flex max-w-[365px] gap-2">
            <button
              type="button"
              onClick={handleWalletClick}
              aria-label="Google Pay"
              className="inline-flex h-[40px] w-[188px] flex-none items-center justify-center gap-[10px] rounded-[232px] border border-[#121212] px-[10px] text-[14px] leading-none text-[#121212] opacity-100 transition-colors hover:bg-[#F2F2F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#003AFF]"
            >
              <Image src="/icons/G.svg" alt="" aria-hidden="true" width={17} height={18} />
              Pay
            </button>
            <button
              type="button"
              onClick={handleWalletClick}
              aria-label="Apple Pay"
              className="inline-flex h-[40px] w-[188px] flex-none items-center justify-center gap-[10px] rounded-[232px] border border-[#121212] px-[10px] text-[14px] leading-none text-[#121212] opacity-100 transition-colors hover:bg-[#F2F2F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#003AFF]"
            >
              <Image src="/icons/ApplePay.svg" alt="" aria-hidden="true" width={50} height={20} />
            </button>
          </div>

          {walletNotice ? (
            <p role="status" className="mt-2 max-w-[365px] text-center text-[12px] text-[#003AFF]">
              {walletNotice}
            </p>
          ) : null}

          {error ? (
            <p role="alert" className="mt-3 max-w-[330px] font-mono text-[11px] text-[#B42318]">
              {error}
            </p>
          ) : null}
        </section>

        <section className="min-w-0 justify-self-start md:w-full md:max-w-[490px]">
          <h3 className="mb-5 text-[20px] leading-6 font-normal text-[#121212]">Payment method</h3>

          <div className="w-full max-w-[490px]">
            <div>
              <label
                className="mb-1 block text-[14px] leading-5 text-[#6A6A6A]"
                htmlFor="card-number"
              >
                Card number
              </label>
              <div
                className={`flex h-10 items-center rounded-md border px-3 transition-colors ${
                  fieldErrors.number ? "border-[#D62E2E]" : "border-[#DCE5FF]"
                }`}
              >
                <CardNumberElement
                  id="card-number"
                  className="w-full"
                  options={CARD_NUMBER_ELEMENT_OPTIONS}
                  onChange={(event) => handleCardFieldChange("number", event)}
                />
              </div>
              {fieldErrors.number ? (
                <p role="alert" className="mt-1 text-[12px] leading-4 text-[#D62E2E]">
                  {fieldErrors.number}
                </p>
              ) : null}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label
                  className="mb-1 block font-(family-name:--font-base) text-[16px] leading-5 font-semibold text-[#5E5E5E]"
                  htmlFor="card-expiry"
                >
                  Expiry
                </label>
                <div
                  className={`flex h-10 items-center rounded-md border px-3 transition-colors ${
                    fieldErrors.expiry ? "border-[#D62E2E]" : "border-[#DCE5FF]"
                  }`}
                >
                  <CardExpiryElement
                    id="card-expiry"
                    className="w-full"
                    options={CARD_ELEMENT_STYLE}
                    onChange={(event) => handleCardFieldChange("expiry", event)}
                  />
                </div>
                {fieldErrors.expiry ? (
                  <p role="alert" className="mt-1 text-[12px] leading-4 text-[#D62E2E]">
                    {fieldErrors.expiry}
                  </p>
                ) : null}
              </div>

              <div>
                <label
                  className="mb-1 block text-[14px] leading-5 text-[#6A6A6A]"
                  htmlFor="card-cvc"
                >
                  CVC
                </label>
                <div
                  className={`flex h-10 items-center rounded-md border px-3 transition-colors ${
                    fieldErrors.cvc ? "border-[#D62E2E]" : "border-[#DCE5FF]"
                  }`}
                >
                  <CardCvcElement
                    id="card-cvc"
                    className="w-full"
                    options={CARD_ELEMENT_STYLE}
                    onChange={(event) => handleCardFieldChange("cvc", event)}
                  />
                </div>
                {fieldErrors.cvc ? (
                  <p role="alert" className="mt-1 text-[12px] leading-4 text-[#D62E2E]">
                    {fieldErrors.cvc}
                  </p>
                ) : null}
              </div>
            </div>
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
