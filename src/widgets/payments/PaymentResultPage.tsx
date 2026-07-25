"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { getEnrolledCourses } from "@/entities/course";
import {
  downloadPaymentReceipt,
  getPayment,
  getOrder,
  syncPaymentIntentStatus,
  type Order,
} from "@/entities/payment";

type ResultMode = "success" | "failed";
type ConfirmationState = "missing" | "checking" | "pending" | "confirmed" | "failed";

const POLL_DELAY_MS = 2500;
const MAX_ATTEMPTS = 12;

function hasEnrollmentForOrder(order: Order, enrolledCourseIds: Set<number>): boolean {
  const orderCourseIds = order.items
    .map((item) => item.course_id)
    .filter((courseId): courseId is number => courseId !== null);

  if (orderCourseIds.length === 0) return false;
  return orderCourseIds.some((courseId) => enrolledCourseIds.has(courseId));
}

export function PaymentResultPage({ mode }: { mode: ResultMode }) {
  const searchParams = useSearchParams();
  const orderId = Number(searchParams.get("order_id"));
  const paymentId = Number(searchParams.get("payment_id"));
  const paymentIntentId = searchParams.get("payment_intent") ?? "";
  const hasValidOrderId = Number.isInteger(orderId) && orderId > 0;
  const hasValidPaymentId = Number.isInteger(paymentId) && paymentId > 0;
  const hasValidPaymentRef = hasValidPaymentId && paymentIntentId.length > 0;
  const [confirmationState, setConfirmationState] = useState<ConfirmationState>("checking");
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [receiptError, setReceiptError] = useState("");
  const [receiptAvailable, setReceiptAvailable] = useState(false);
  const state: ConfirmationState =
    mode === "failed" ? "failed" : hasValidOrderId ? confirmationState : "missing";

  useEffect(() => {
    setReceiptAvailable(false);
    if (mode !== "success") return;
    if (!hasValidOrderId) return;

    let cancelled = false;
    let timeoutId: number | undefined;
    let attempts = 0;
    let hasSyncedPaymentIntent = false;

    async function poll() {
      attempts += 1;

      try {
        if (!hasSyncedPaymentIntent && hasValidPaymentRef) {
          hasSyncedPaymentIntent = true;
          const syncResult = await syncPaymentIntentStatus({
            payment_id: paymentId,
            payment_intent_id: paymentIntentId,
          }).catch(() => null);

          if (cancelled) return;

          if (
            syncResult?.payment_status === "failed" ||
            syncResult?.payment_status === "canceled" ||
            syncResult?.order_status === "failed" ||
            syncResult?.order_status === "canceled"
          ) {
            setConfirmationState("failed");
            return;
          }
        }

        const order = await getOrder(orderId);

        if (cancelled) return;

        if (order.status === "failed" || order.status === "canceled") {
          setConfirmationState("failed");
          return;
        }

        if (order.status === "paid" || order.status === "partially_paid") {
          const enrolled = await getEnrolledCourses().catch(() => null);

          if (cancelled) return;

          const enrolledCourseIds = new Set(enrolled?.results.map((course) => course.id) ?? []);
          if (hasEnrollmentForOrder(order, enrolledCourseIds)) {
            if (hasValidPaymentId) {
              const payment = await getPayment(paymentId).catch(() => null);
              if (cancelled) return;
              setReceiptAvailable(payment?.status === "succeeded");
            }
            setConfirmationState("confirmed");
            return;
          }
        }

        setConfirmationState("pending");
      } catch {
        if (!cancelled) setConfirmationState("pending");
      }

      if (!cancelled && attempts < MAX_ATTEMPTS) {
        timeoutId = window.setTimeout(poll, POLL_DELAY_MS);
      }
    }

    poll();

    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [
    mode,
    orderId,
    hasValidOrderId,
    hasValidPaymentId,
    hasValidPaymentRef,
    paymentId,
    paymentIntentId,
  ]);

  const isFailed = mode === "failed" || state === "failed";
  const title = isFailed ? "Payment was not completed." : "Payment is being confirmed.";
  const description = isFailed
    ? "Try again when you are ready. No course access is activated until the backend confirms payment."
    : state === "confirmed"
      ? "Payment confirmed. Your course access is active."
      : "Your course access will be activated shortly.";

  async function handleReceiptDownload() {
    if (receiptLoading || !hasValidPaymentId) return;

    setReceiptLoading(true);
    setReceiptError("");

    try {
      const receipt = await downloadPaymentReceipt(paymentId);
      const url = window.URL.createObjectURL(receipt);
      const link = document.createElement("a");
      link.href = url;
      link.download = `receipt-${orderId}-${paymentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
    } catch {
      setReceiptError("Could not download receipt.");
    } finally {
      setReceiptLoading(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-76px)] bg-[linear-gradient(120deg,#FFFFFF_0%,#FFF7F2_32%,rgba(252,196,195,0.38)_58%,#FFFFFF_100%)] px-4 py-8 sm:px-10">
      <section className="mx-auto flex min-h-[460px] w-full max-w-[720px] flex-col justify-center rounded-[16px] bg-white px-6 py-10 shadow-[0_0_15px_rgba(0,0,0,0.18)] md:px-[60px]">
        <p className="mb-3 font-mono text-[11px] uppercase text-[#6A6A6A]">Tuition payment</p>
        <h1 className="font-mono text-[22px] font-semibold text-[#121212]">{title}</h1>
        <p className="mt-4 max-w-[560px] font-mono text-[13px] leading-5 text-[#121212]">
          {description}
        </p>

        {mode === "success" && state !== "confirmed" && !isFailed ? (
          <p className="mt-4 font-mono text-[11px] text-[#6A6A6A]">
            Checking backend confirmation{state === "pending" ? "..." : "."}
          </p>
        ) : null}

        {state === "missing" ? (
          <p className="mt-4 font-mono text-[11px] text-[#B42318]">
            Order id is missing, so the page cannot check payment status.
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          {state === "confirmed" ? (
            <Link
              href="/student-dashboard/courses"
              className="inline-flex h-9 min-w-[150px] items-center justify-center rounded-full bg-black px-5 font-mono text-[12px] text-white transition-colors hover:bg-[#252525]"
            >
              Go to My Courses
            </Link>
          ) : null}
          {state === "confirmed" && receiptAvailable ? (
            <button
              type="button"
              onClick={handleReceiptDownload}
              disabled={receiptLoading}
              className="inline-flex h-9 min-w-[150px] items-center justify-center rounded-full border border-[#003AFF] px-5 font-mono text-[12px] text-[#003AFF] transition-colors hover:bg-[#EEF3FF] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {receiptLoading ? "Downloading..." : "Download receipt"}
            </button>
          ) : null}
          <Link
            href="/student-dashboard/payment?tab=card"
            className="inline-flex h-9 min-w-[140px] items-center justify-center rounded-full border border-[#003AFF] px-5 font-mono text-[12px] text-[#003AFF] transition-colors hover:bg-[#EEF3FF]"
          >
            {isFailed ? "Try again" : "Back to payment"}
          </Link>
          <Link
            href="/student-dashboard/payment?tab=history"
            className="inline-flex h-9 min-w-[150px] items-center justify-center rounded-full border border-[#D9D9D9] px-5 font-mono text-[12px] text-[#121212] transition-colors hover:border-[#003AFF] hover:text-[#003AFF]"
          >
            Payment history
          </Link>
        </div>

        {receiptError ? (
          <p role="alert" className="mt-3 font-mono text-[11px] text-[#B42318]">
            {receiptError}
          </p>
        ) : null}
      </section>
    </main>
  );
}
