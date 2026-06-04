"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getCart, type Cart } from "@/entities/cart";
import {
  createInstallmentCheckoutSession,
  createCheckoutSession,
  getOrders,
  getPayments,
  type Order,
  type PaymentInstallmentStatus,
  type Payment,
  type PaymentStatus,
  type PaymentType,
} from "@/entities/payment";
import type { ApiError } from "@/shared/api/base";

type TabId = "cart" | "plans" | "history";
type WorkspaceRole = "student" | "teacher";

const allTabs: Array<{ id: TabId; label: string; roles: WorkspaceRole[] }> = [
  { id: "cart", label: "Cart", roles: ["student"] },
  { id: "plans", label: "Plans", roles: ["student", "teacher"] },
  { id: "history", label: "Payment history", roles: ["student", "teacher"] },
];

const COURSE_AVAILABLE_NOTICE = "The course is already available in My Courses.";
const PAYMENT_PROCESSING_NOTICE = "Payment is being processed. Access will appear after confirmation.";
const PAYMENT_CANCELED_NOTICE = "Payment was canceled. Your cart is unchanged.";

const STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  succeeded: "Paid",
  failed: "Failed",
  canceled: "Canceled",
  refunded: "Refunded",
};

const INSTALLMENT_STATUS_LABEL: Record<PaymentInstallmentStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  paid: "Paid",
  failed: "Failed",
  canceled: "Canceled",
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB").format(new Date(value)).replace(/\//g, ".");
}

function formatMoney(amount: string, currency: string | null): string {
  if (!currency) return Number(amount) === 0 ? "Free" : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(amount));
}

function courseLabel(payment: Payment): string {
  if (payment.items.length === 0) return payment.description || `Payment #${payment.id}`;
  if (payment.items.length === 1) return payment.items[0].course_title;
  return payment.items.map((item) => item.course_title).join(", ");
}

function cartInstallmentOption(cart: Cart | null) {
  if (!cart || cart.items.length === 0) return null;

  const counts = new Set(
    cart.items.map((item) => item.installment_count).filter((value): value is number => Boolean(value)),
  );

  if (counts.size !== 1) return null;

  const count = Array.from(counts)[0];
  if (count < 2 || cart.items.some((item) => !item.installment_amount)) return null;

  const firstAmount = cart.items
    .reduce((total, item) => total + Number(item.installment_amount ?? 0), 0)
    .toFixed(2);
  const totalAmount = (Number(firstAmount) * count).toFixed(2);

  return { count, firstAmount, totalAmount };
}

function orderCourseLabel(order: Order): string {
  if (order.items.length === 0) return `Order #${order.id}`;
  if (order.items.length === 1) return order.items[0].course_title;
  return order.items.map((item) => item.course_title).join(", ");
}

function PaymentsTable({
  rows,
  type,
  emptyLabel,
}: {
  rows: Array<Record<string, string>>;
  type: "cart" | "plans" | "history";
  emptyLabel: string;
}) {
  const columns =
    type === "plans"
      ? [
          { key: "plan", label: "Plan" },
          { key: "period", label: "Period" },
          { key: "amount", label: "Amount" },
        ]
      : type === "history"
        ? [
            { key: "course", label: "Course" },
            { key: "date", label: "Date" },
            { key: "amount", label: "Amount" },
            { key: "status", label: "Status" },
          ]
        : [
            { key: "course", label: "Course" },
            { key: "date", label: "Date" },
            { key: "amount", label: "Amount" },
          ];

  if (rows.length === 0) {
    return (
      <div className="mt-6 flex min-h-[160px] items-center justify-center rounded-md border border-dashed border-[#D9D9D9] px-4 text-center font-mono text-[12px] text-[#6A6A6A]">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="mt-6 overflow-hidden">
      <table className="w-full table-fixed border-collapse font-mono text-[12px] text-[#121212]">
        <thead>
          <tr className="border-b border-[#D9D9D9] text-left text-[#6A6A6A]">
            {columns.map((column) => (
              <th key={column.key} className="h-8 px-3 font-normal">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${type}-${row.id ?? index}`} className="border-b border-[#D9D9D9]">
              {columns.map((column) => (
                <td key={column.key} className="h-8 truncate px-3">
                  {row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InstallmentPlansTable({
  orders,
  payingInstallmentId,
  onPay,
}: {
  orders: Order[];
  payingInstallmentId: number | null;
  onPay: (orderId: number, installmentId: number) => void;
}) {
  const rows = orders.flatMap((order) =>
    order.payment_type === "installments"
      ? order.installments.map((installment) => ({
          order,
          installment,
        }))
      : [],
  );

  if (rows.length === 0) {
    return (
      <div className="mt-6 flex min-h-[160px] items-center justify-center rounded-md border border-dashed border-[#D9D9D9] px-4 text-center font-mono text-[12px] text-[#6A6A6A]">
        No payment plans yet.
      </div>
    );
  }

  return (
    <div className="mt-6 overflow-hidden">
      <table className="w-full table-fixed border-collapse font-mono text-[12px] text-[#121212]">
        <thead>
          <tr className="border-b border-[#D9D9D9] text-left text-[#6A6A6A]">
            <th className="h-8 px-3 font-normal">Plan</th>
            <th className="h-8 px-3 font-normal">Period</th>
            <th className="h-8 px-3 font-normal">Amount</th>
            <th className="h-8 px-3 font-normal">Status</th>
            <th className="h-8 w-[92px] px-3 font-normal" aria-label="Action" />
          </tr>
        </thead>
        <tbody>
          {rows.map(({ order, installment }) => {
            const isPaying = payingInstallmentId === installment.id;
            const canPay =
              !installment.is_paid &&
              installment.can_start_payment &&
              order.status !== "paid" &&
              order.status !== "canceled";

            return (
              <tr
                key={`${order.id}-${installment.id}`}
                className="border-b border-[#D9D9D9]"
              >
                <td className="h-9 truncate px-3">{orderCourseLabel(order)}</td>
                <td className="h-9 truncate px-3">
                  {installment.installment_number}/{order.installments_count} -{" "}
                  {formatDate(installment.due_date)}
                </td>
                <td className="h-9 truncate px-3">
                  {formatMoney(installment.amount, installment.currency)}
                </td>
                <td className="h-9 truncate px-3">
                  {INSTALLMENT_STATUS_LABEL[installment.status]}
                </td>
                <td className="h-9 px-3 text-right">
                  {canPay ? (
                    <button
                      type="button"
                      onClick={() => onPay(order.id, installment.id)}
                      disabled={isPaying}
                      className="inline-flex h-7 min-w-[68px] items-center justify-center rounded-full bg-[#003AFF] px-3 text-[11px] font-semibold text-white transition-colors hover:bg-[#002BC0] disabled:cursor-not-allowed disabled:bg-[#B7C7FA]"
                    >
                      {isPaying
                        ? "..."
                        : installment.status === "processing"
                          ? "Continue"
                          : "Pay"}
                    </button>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function resolveTab(value: string | null, role: WorkspaceRole): TabId {
  const allowedTabs = allTabs.filter((tab) => tab.roles.includes(role)).map((tab) => tab.id);
  return allowedTabs.includes(value as TabId) ? (value as TabId) : allowedTabs[0];
}

export function PaymentWorkspace({ role = "student" }: { role?: WorkspaceRole }) {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>(() =>
    resolveTab(searchParams.get("tab"), role),
  );
  const [cart, setCart] = useState<Cart | null>(null);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartError, setCartError] = useState("");
  const [checkoutMode, setCheckoutMode] = useState<PaymentType>("full");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [payingInstallmentId, setPayingInstallmentId] = useState<number | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsError, setPaymentsError] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const tabs = useMemo(
    () => allTabs.filter((tab) => tab.roles.includes(role)),
    [role],
  );

  useEffect(() => {
    setActiveTab(resolveTab(searchParams.get("tab"), role));
  }, [role, searchParams]);

  useEffect(() => {
    const notice = searchParams.get("notice");
    const sessionId = searchParams.get("session_id");
    let message: string | null = null;

    if (notice === "course_available") message = COURSE_AVAILABLE_NOTICE;
    if (notice === "payment_cancelled") message = PAYMENT_CANCELED_NOTICE;
    if (sessionId) message = PAYMENT_PROCESSING_NOTICE;

    if (!message) return;

    setToast(message);
    const timeoutId = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timeoutId);
  }, [searchParams]);

  useEffect(() => {
    if (role !== "student" || activeTab !== "cart") return;

    let cancelled = false;
    setCartLoading(true);
    setCartError("");

    getCart()
      .then((data) => {
        if (!cancelled) setCart(data);
      })
      .catch(() => {
        if (!cancelled) setCartError("Could not load cart.");
      })
      .finally(() => {
        if (!cancelled) setCartLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, role]);

  useEffect(() => {
    if (checkoutMode === "installments" && !cartInstallmentOption(cart)) {
      setCheckoutMode("full");
    }
  }, [cart, checkoutMode]);

  useEffect(() => {
    if (activeTab !== "plans") return;

    let cancelled = false;
    setOrdersLoading(true);
    setOrdersError("");

    getOrders()
      .then((data) => {
        if (!cancelled) setOrders(data.results);
      })
      .catch(() => {
        if (!cancelled) setOrdersError("Could not load payment plans.");
      })
      .finally(() => {
        if (!cancelled) setOrdersLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "history") return;

    let cancelled = false;
    setPaymentsLoading(true);
    setPaymentsError("");

    getPayments()
      .then((data) => {
        if (!cancelled) setPayments(data.results);
      })
      .catch(() => {
        if (!cancelled) setPaymentsError("Could not load payment history.");
      })
      .finally(() => {
        if (!cancelled) setPaymentsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  async function handlePay() {
    if (!cart || cart.items_count === 0 || checkoutLoading) return;

    setCheckoutLoading(true);
    setCheckoutError("");

    try {
      const origin = window.location.origin;
      const installmentOption = cartInstallmentOption(cart);
      const paymentType =
        checkoutMode === "installments" && installmentOption ? "installments" : "full";
      const requestedInstallmentCount =
        paymentType === "installments" && installmentOption
          ? installmentOption.count
          : undefined;
      const session = await createCheckoutSession({
        success_url: `${origin}/student-dashboard/payment?tab=history&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/student-dashboard/payment?tab=cart&notice=payment_cancelled`,
        payment_type: paymentType,
        installments_count: requestedInstallmentCount,
      });
      window.location.assign(session.checkout_url);
    } catch (error) {
      const apiError = error as Partial<ApiError>;
      setCheckoutError(apiError.detail || apiError.message || "Could not start checkout.");
      setCheckoutLoading(false);
    }
  }

  async function handlePayInstallment(orderId: number, installmentId: number) {
    if (payingInstallmentId) return;

    setPayingInstallmentId(installmentId);
    setOrdersError("");

    try {
      const origin = window.location.origin;
      const session = await createInstallmentCheckoutSession(orderId, installmentId, {
        success_url: `${origin}/student-dashboard/payment?tab=plans&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/student-dashboard/payment?tab=plans&notice=payment_cancelled`,
      });
      window.location.assign(session.checkout_url);
    } catch (error) {
      const apiError = error as Partial<ApiError>;
      setOrdersError(apiError.detail || apiError.message || "Could not start installment checkout.");
      setPayingInstallmentId(null);
    }
  }

  const cartRows = useMemo(
    () =>
      cart?.items.map((item) => ({
        id: String(item.id),
        course: item.course.title,
        date: formatDate(item.added_at),
        amount: formatMoney(item.subtotal, item.currency),
      })) ?? [],
    [cart],
  );

  const historyRows = useMemo(
    () =>
      payments.map((payment) => ({
        id: String(payment.id),
        course: courseLabel(payment),
        date: formatDate(payment.processed_at ?? payment.created_at),
        amount: formatMoney(payment.amount, payment.currency),
        status: STATUS_LABEL[payment.status],
      })),
    [payments],
  );

  const installmentOption = useMemo(() => cartInstallmentOption(cart), [cart]);
  const totalLabel = cart ? formatMoney(cart.total_price, cart.currency) : "";
  const installmentFirstLabel =
    cart && installmentOption ? formatMoney(installmentOption.firstAmount, cart.currency) : "";
  const installmentTotalLabel =
    cart && installmentOption ? formatMoney(installmentOption.totalAmount, cart.currency) : "";
  const selectedDueLabel =
    checkoutMode === "installments" && installmentOption ? installmentFirstLabel : totalLabel;
  const canPay = Boolean(cart && cart.items_count > 0);

  return (
    <main className="min-h-[calc(100vh-76px)] bg-[linear-gradient(120deg,#FFFFFF_0%,#FFF7F2_32%,rgba(252,196,195,0.38)_58%,#FFFFFF_100%)] px-10 py-8">
      {toast ? (
        <div
          role="status"
          className="fixed top-24 right-8 z-50 max-w-[340px] rounded-lg border border-[#B7C7FA] bg-white px-4 py-3 font-mono text-[12px] text-[#121212] shadow-[0_0_15px_rgba(0,0,0,0.18)]"
        >
          {toast}
        </div>
      ) : null}

      <section className="mx-auto w-full max-w-[752px]">
        <h1 className="mb-5 font-mono text-[16px] font-semibold leading-5 text-[#121212]">
          Tuition payment
        </h1>

        <div className="min-h-[474px] rounded-lg bg-white px-7 py-4 shadow-[0_0_15px_rgba(0,0,0,0.18)]">
          <nav className="flex border-b border-[#B7C7FA]" aria-label="Payment sections">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setActiveTab(tab.id)}
                  className={[
                    "h-8 min-w-[88px] px-3 text-center font-mono text-[12px] leading-none transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003AFF]",
                    isActive
                      ? "border-b-2 border-[#003AFF] text-[#003AFF]"
                      : "border-b-2 border-transparent text-[#121212] hover:text-[#003AFF]",
                  ].join(" ")}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {activeTab === "cart" ? (
            cartLoading ? (
              <div className="mt-6 flex min-h-[160px] items-center justify-center font-mono text-[12px] text-[#6A6A6A]">
                Loading cart...
              </div>
            ) : cartError ? (
              <div className="mt-6 flex min-h-[160px] items-center justify-center font-mono text-[12px] text-[#B42318]">
                {cartError}
              </div>
            ) : (
              <>
                <PaymentsTable rows={cartRows} type="cart" emptyLabel="Your cart is empty." />
                {cart && cart.items_count > 0 ? (
                  <div className="mt-4 flex flex-col gap-4 font-mono text-[12px] text-[#121212]">
                    {installmentOption ? (
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {[
                          {
                            id: "full" as PaymentType,
                            title: "Pay in full",
                            amount: totalLabel,
                          },
                          {
                            id: "installments" as PaymentType,
                            title: `${installmentOption.count} installments`,
                            amount: `${installmentFirstLabel} now / ${installmentTotalLabel} total`,
                          },
                        ].map((option) => {
                          const isActive = checkoutMode === option.id;

                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => setCheckoutMode(option.id)}
                              className={[
                                "min-h-14 rounded-md border px-3 py-2 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003AFF]",
                                isActive
                                  ? "border-[#003AFF] bg-[#EEF3FF] text-[#003AFF]"
                                  : "border-[#D9D9D9] bg-white text-[#121212] hover:border-[#B7C7FA]",
                              ].join(" ")}
                            >
                              <span className="block font-semibold">{option.title}</span>
                              <span className="block truncate text-[#6A6A6A]">{option.amount}</span>
                            </button>
                          );
                        })}
                      </div>
                    ) : null}

                    <div className="flex items-center justify-between gap-4">
                      <span className="font-semibold">
                        {checkoutMode === "installments" && installmentOption
                          ? `Due now: ${selectedDueLabel}`
                          : `Total: ${totalLabel}`}
                      </span>
                      <button
                        type="button"
                        onClick={handlePay}
                        disabled={!canPay || checkoutLoading}
                        className="inline-flex h-9 min-w-[116px] items-center justify-center rounded-full bg-[#003AFF] px-5 text-[12px] font-semibold text-white transition-colors hover:bg-[#002BC0] disabled:cursor-not-allowed disabled:bg-[#B7C7FA]"
                      >
                        {checkoutLoading
                          ? "Redirecting..."
                          : checkoutMode === "installments" && installmentOption
                            ? "Pay first"
                            : "Pay"}
                      </button>
                    </div>
                  </div>
                ) : null}
                {checkoutError ? (
                  <p role="alert" className="mt-3 font-mono text-[12px] text-[#B42318]">
                    {checkoutError}
                  </p>
                ) : null}
              </>
            )
          ) : null}
          {activeTab === "plans" ? (
            ordersLoading ? (
              <div className="mt-6 flex min-h-[160px] items-center justify-center font-mono text-[12px] text-[#6A6A6A]">
                Loading payment plans...
              </div>
            ) : ordersError ? (
              <div className="mt-6 flex min-h-[160px] items-center justify-center font-mono text-[12px] text-[#B42318]">
                {ordersError}
              </div>
            ) : (
              <InstallmentPlansTable
                orders={orders}
                payingInstallmentId={payingInstallmentId}
                onPay={handlePayInstallment}
              />
            )
          ) : null}
          {activeTab === "history" ? (
            paymentsLoading ? (
              <div className="mt-6 flex min-h-[160px] items-center justify-center font-mono text-[12px] text-[#6A6A6A]">
                Loading payment history...
              </div>
            ) : paymentsError ? (
              <div className="mt-6 flex min-h-[160px] items-center justify-center font-mono text-[12px] text-[#B42318]">
                {paymentsError}
              </div>
            ) : (
              <PaymentsTable
                rows={historyRows}
                type="history"
                emptyLabel="No payment history yet."
              />
            )
          ) : null}
        </div>
      </section>
    </main>
  );
}
