"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Download } from "lucide-react";
import { getCart, type Cart, type CartItem } from "@/entities/cart";
import {
  createInstallmentPaymentIntent,
  createPaymentIntent,
  getOrders,
  getPayments,
  type Order,
  type Payment,
  type PaymentIntent,
  type PaymentStatus,
  type PaymentType,
} from "@/entities/payment";
import type { ApiError } from "@/shared/api/base";
import { StripePaymentDrawer } from "./StripePaymentDrawer";

type TabId = "card" | "plans" | "history";
type WorkspaceRole = "student" | "teacher";
type CheckoutIntentState = {
  intent: PaymentIntent;
  paymentMode: PaymentType;
  installmentCount: number | null;
};

const allTabs: Array<{ id: TabId; label: string; roles: WorkspaceRole[] }> = [
  { id: "card", label: "Card", roles: ["student"] },
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

function formatMoneyValue(amount: number, currency: string | null): string {
  return formatMoney(amount.toFixed(2), currency);
}

function sumCartItems(items: CartItem[], field: "subtotal" | "installment_amount"): number {
  return items.reduce((total, item) => total + Number(item[field] ?? 0), 0);
}

function installmentOptionForItems(items: CartItem[]) {
  if (items.length === 0) return null;

  const counts = new Set(
    items.map((item) => item.installment_count).filter((value): value is number => Boolean(value)),
  );

  if (counts.size !== 1) return null;

  const count = Array.from(counts)[0];
  if (count < 2 || items.some((item) => !item.installment_amount)) return null;

  const firstAmount = sumCartItems(items, "installment_amount");
  const totalAmount = firstAmount * count;

  return { count, firstAmount, totalAmount };
}

function courseLabel(payment: Payment): string {
  if (payment.items.length === 0) return payment.description || `Payment #${payment.id}`;
  if (payment.items.length === 1) return payment.items[0].course_title;
  return payment.items.map((item) => item.course_title).join(", ");
}

function orderCourseLabel(order: Order): string {
  if (order.items.length === 0) return `Order #${order.id}`;
  if (order.items.length === 1) return order.items[0].course_title;
  return order.items.map((item) => item.course_title).join(", ");
}

function resolveTab(value: string | null, role: WorkspaceRole): TabId {
  const normalizedValue = value === "cart" ? "card" : value;
  const allowedTabs = allTabs.filter((tab) => tab.roles.includes(role)).map((tab) => tab.id);
  return allowedTabs.includes(normalizedValue as TabId)
    ? (normalizedValue as TabId)
    : allowedTabs[0];
}

function parsePositiveInt(value: string | null): number | null {
  if (!value) return null;

  const parsedValue = Number(value);
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

function PaymentTabs({
  tabs,
  activeTab,
  onChange,
}: {
  tabs: Array<{ id: TabId; label: string }>;
  activeTab: TabId;
  onChange: (tab: TabId) => void;
}) {
  return (
    <nav className="flex border-b border-[#B7C7FA]" aria-label="Payment sections">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            aria-current={isActive ? "page" : undefined}
            onClick={() => onChange(tab.id)}
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
  );
}

function PaymentModeToggle({
  mode,
  canUseInstallments,
  onChange,
}: {
  mode: PaymentType;
  canUseInstallments: boolean;
  onChange: (mode: PaymentType) => void;
}) {
  return (
    <div className="inline-flex h-8 rounded-full border border-[#003AFF] bg-white p-0.5 font-mono text-[10px] uppercase text-[#121212]">
      <button
        type="button"
        onClick={() => onChange("full")}
        className={[
          "inline-flex min-w-[118px] items-center justify-center rounded-full px-4 transition-colors",
          mode === "full" ? "bg-(--color-brand-lavender-soft)" : "",
        ].join(" ")}
      >
        Full payment
      </button>
      <button
        type="button"
        onClick={() => canUseInstallments && onChange("installments")}
        disabled={!canUseInstallments}
        className={[
          "inline-flex min-w-[128px] items-center justify-center rounded-full px-4 transition-colors disabled:cursor-not-allowed disabled:opacity-40",
          mode === "installments" ? "bg-(--color-brand-lavender-soft)" : "",
        ].join(" ")}
      >
        Partial payment
      </button>
    </div>
  );
}

function ReceiptButton({
  url,
  label = "Receipt",
}: {
  url?: string | null;
  label?: string;
}) {
  if (!url) {
    // TODO: Enable when backend exposes receipt/invoice URLs for payments.
    return (
      <button
        type="button"
        disabled
        className="inline-flex h-7 min-w-[74px] items-center justify-center rounded-full border border-[#D9D9D9] px-3 font-mono text-[11px] text-[#9A9A9A] disabled:cursor-not-allowed"
      >
        {label}
      </button>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex h-7 min-w-[74px] items-center justify-center rounded-full border border-[#003AFF] px-3 font-mono text-[11px] text-[#003AFF] transition-colors hover:bg-[#EEF3FF]"
    >
      {label}
    </a>
  );
}

function OrderSummary({
  selectedItems,
  currency,
  checkoutMode,
  canUseInstallments,
  checkoutLoading,
  checkoutError,
  onModeChange,
  onPay,
}: {
  selectedItems: CartItem[];
  currency: string | null;
  checkoutMode: PaymentType;
  canUseInstallments: boolean;
  checkoutLoading: boolean;
  checkoutError: string;
  onModeChange: (mode: PaymentType) => void;
  onPay: () => void;
}) {
  const installmentOption = installmentOptionForItems(selectedItems);
  const totalLabel = formatMoneyValue(sumCartItems(selectedItems, "subtotal"), currency);
  const installmentFirstLabel = installmentOption
    ? formatMoneyValue(installmentOption.firstAmount, currency)
    : "";
  const installmentTotalLabel = installmentOption
    ? formatMoneyValue(installmentOption.totalAmount, currency)
    : "";
  const dueLabel =
    checkoutMode === "installments" && installmentOption ? installmentFirstLabel : totalLabel;
  const canPay = selectedItems.length > 0;

  return (
    <aside className="min-w-0 rounded-md border border-[#E7ECFF] bg-[#FBFCFF] p-4">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-mono text-[14px] font-normal text-[#121212]">Order summary</h2>
          <p className="mt-1 font-mono text-[10px] text-[#6A6A6A]">
            {selectedItems.length} selected item{selectedItems.length === 1 ? "" : "s"}
          </p>
        </div>
        {/* TODO: Replace disabled state with backend invoice download once invoice generation exists. */}
        <button
          type="button"
          disabled
          title="Invoice download is not available for unpaid orders yet."
          className="inline-flex h-8 shrink-0 items-center gap-2 rounded-full bg-[#F1F4FF] px-3 font-mono text-[10px] uppercase text-[#9A9A9A] disabled:cursor-not-allowed"
        >
          Download invoice
          <Download size={12} aria-hidden="true" />
        </button>
      </div>

      <div className="mb-4 flex justify-end">
        <PaymentModeToggle
          mode={checkoutMode}
          canUseInstallments={canUseInstallments}
          onChange={onModeChange}
        />
      </div>

      <div className="space-y-2 border-t border-[#E7ECFF] pt-4 font-mono text-[12px] text-[#121212]">
        <div className="flex items-center justify-between gap-4">
          <span>Subtotal</span>
          <span>{totalLabel}</span>
        </div>
        {checkoutMode === "installments" && installmentOption ? (
          <div className="flex items-center justify-between gap-4 text-[#6A6A6A]">
            <span>{installmentOption.count} payments total</span>
            <span>{installmentTotalLabel}</span>
          </div>
        ) : null}
        <div className="flex items-center justify-between gap-4 font-semibold">
          <span>{checkoutMode === "installments" && installmentOption ? "Due now" : "Total"}</span>
          <span>{dueLabel}</span>
        </div>
      </div>

      <p className="mt-4 font-mono text-[9px] leading-3 text-[#121212]">
        By submitting your order, you confirm that you have read and agree to the terms of use.
      </p>

      <button
        type="button"
        onClick={onPay}
        disabled={!canPay || checkoutLoading}
        className="mt-5 inline-flex h-9 w-full items-center justify-center rounded-full bg-black px-5 font-mono text-[12px] text-white transition-colors hover:bg-[#252525] disabled:cursor-not-allowed disabled:bg-[#6A6A6A]"
      >
        {checkoutLoading
          ? "Opening..."
          : checkoutMode === "installments" && installmentOption
            ? "Pay first"
            : "To Pay"}
      </button>

      {checkoutError ? (
        <p role="alert" className="mt-3 font-mono text-[12px] text-[#B42318]">
          {checkoutError}
        </p>
      ) : null}
    </aside>
  );
}

function CartPaymentPanel({
  cart,
  loading,
  error,
  selectedItemIds,
  checkoutMode,
  checkoutLoading,
  checkoutError,
  onToggleItem,
  onToggleAll,
  onModeChange,
  onPay,
}: {
  cart: Cart | null;
  loading: boolean;
  error: string;
  selectedItemIds: number[];
  checkoutMode: PaymentType;
  checkoutLoading: boolean;
  checkoutError: string;
  onToggleItem: (itemId: number) => void;
  onToggleAll: () => void;
  onModeChange: (mode: PaymentType) => void;
  onPay: () => void;
}) {
  if (loading) {
    return (
      <div className="mt-6 flex min-h-[260px] items-center justify-center font-mono text-[12px] text-[#6A6A6A]">
        Loading cart...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 flex min-h-[260px] items-center justify-center font-mono text-[12px] text-[#B42318]">
        {error}
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="mt-6 flex min-h-[260px] items-center justify-center rounded-md border border-dashed border-[#D9D9D9] px-4 text-center font-mono text-[12px] text-[#6A6A6A]">
        Your cart is empty.
      </div>
    );
  }

  const selectedItems = cart.items.filter((item) => selectedItemIds.includes(item.id));
  const allSelected = selectedItemIds.length === cart.items.length;
  const installmentOption = installmentOptionForItems(selectedItems);

  return (
    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
      <section className="min-w-0">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-mono text-[14px] font-normal text-[#121212]">Items in cart</h2>
          <label className="inline-flex cursor-pointer items-center gap-2 font-mono text-[12px] text-[#121212]">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={onToggleAll}
              className="h-4 w-4 accent-[#003AFF]"
            />
            Select all
          </label>
        </div>

        <div className="flex flex-col gap-3">
          {cart.items.map((item) => {
            const isSelected = selectedItemIds.includes(item.id);

            return (
              <label
                key={item.id}
                className={[
                  "flex cursor-pointer items-center gap-3 rounded-md border px-3 py-3 transition-colors",
                  isSelected
                    ? "border-[#B7C7FA] bg-[#EEF3FF]"
                    : "border-[#E7ECFF] bg-white hover:border-[#B7C7FA]",
                ].join(" ")}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleItem(item.id)}
                  className="h-4 w-4 shrink-0 accent-[#003AFF]"
                />
                {item.course.image ? (
                  <img
                    src={item.course.image}
                    alt=""
                    className="h-12 w-12 shrink-0 rounded-md object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 shrink-0 rounded-md bg-[#FDD3D0]" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-[12px] font-semibold text-[#121212]">
                    {item.course.title}
                  </p>
                  <p className="mt-1 font-mono text-[10px] uppercase text-[#6A6A6A]">
                    {item.pricing_plan_kind ?? "Course"}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-[12px] text-[#121212]">
                  {formatMoney(item.subtotal, item.currency)}
                </span>
              </label>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
          {!installmentOption && selectedItems.length > 0 ? (
            <p className="font-mono text-[10px] text-[#6A6A6A]">
              Partial payment is available only for matching installment plans.
            </p>
          ) : null}
        </div>
      </section>

      <OrderSummary
        selectedItems={selectedItems}
        currency={cart.currency}
        checkoutMode={checkoutMode}
        canUseInstallments={Boolean(installmentOption)}
        checkoutLoading={checkoutLoading}
        checkoutError={checkoutError}
        onModeChange={onModeChange}
        onPay={onPay}
      />
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
        No active installment plans yet.
      </div>
    );
  }

  return (
    <div className="mt-6 overflow-x-auto">
      {/* TODO: Prefer a dedicated payment-installments endpoint when backend exposes one. */}
      <div className="min-w-[544px] font-mono text-[12px] text-[#121212]">
        <div className="grid grid-cols-[minmax(130px,1.35fr)_88px_88px_96px_80px] items-center px-3 pb-4 text-[13px] text-[#6A6A6A]">
          <span>Course</span>
          <span>Date</span>
          <span>Amount</span>
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </div>

        <div className="flex flex-col gap-2">
          {rows.map(({ order, installment }) => {
            const isPaying = payingInstallmentId === installment.id;
            const canPay =
              !installment.is_paid &&
              installment.can_start_payment &&
              order.status !== "paid" &&
              order.status !== "canceled";

            return (
              <div
                key={`${order.id}-${installment.id}`}
                className="grid min-h-9 grid-cols-[minmax(130px,1.35fr)_88px_88px_96px_80px] items-center rounded-full bg-[#EEF3FF] px-3 text-[11px]"
              >
                <span className="truncate">
                  {installment.installment_number}/{order.installments_count}{" "}
                  {orderCourseLabel(order)}
                </span>
                <span className="truncate">{formatDate(installment.due_date)}</span>
                <span className="truncate">
                  {formatMoney(installment.amount, installment.currency)}
                </span>
                <button
                  type="button"
                  disabled
                  title="Invoice download is not available yet."
                  className="w-fit text-left text-[11px] text-[#121212] underline underline-offset-2 disabled:cursor-not-allowed"
                >
                  Invoice
                </button>
                <span className="flex justify-end">
                  {canPay ? (
                    <button
                      type="button"
                      onClick={() => onPay(order.id, installment.id)}
                      disabled={isPaying}
                      className="inline-flex h-6 min-w-[70px] items-center justify-center rounded-full bg-black px-4 text-[10px] font-semibold text-white transition-colors hover:bg-[#252525] disabled:cursor-not-allowed disabled:bg-[#6A6A6A]"
                    >
                      {isPaying ? "..." : "To Pay"}
                    </button>
                  ) : null}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PaymentHistoryTable({ payments }: { payments: Payment[] }) {
  const paidPayments = payments.filter((payment) => payment.status === "succeeded");

  if (paidPayments.length === 0) {
    return (
      <div className="mt-6 flex min-h-[160px] items-center justify-center rounded-md border border-dashed border-[#D9D9D9] px-4 text-center font-mono text-[12px] text-[#6A6A6A]">
        No completed payments yet.
      </div>
    );
  }

  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full min-w-[620px] table-fixed border-collapse font-mono text-[12px] text-[#121212]">
        <thead>
          <tr className="border-b border-[#D9D9D9] text-left text-[#6A6A6A]">
            <th className="h-8 px-3 font-normal">Course</th>
            <th className="h-8 px-3 font-normal">Date</th>
            <th className="h-8 px-3 font-normal">Amount</th>
            <th className="h-8 px-3 font-normal">Status</th>
            <th className="h-8 w-[104px] px-3 font-normal">Receipt</th>
          </tr>
        </thead>
        <tbody>
          {paidPayments.map((payment) => (
            <tr key={payment.id} className="border-b border-[#D9D9D9]">
              <td className="h-10 truncate px-3">{courseLabel(payment)}</td>
              <td className="h-10 truncate px-3">
                {formatDate(payment.processed_at ?? payment.created_at)}
              </td>
              <td className="h-10 truncate px-3">
                {formatMoney(payment.amount, payment.currency)}
              </td>
              <td className="h-10 truncate px-3">{STATUS_LABEL[payment.status]}</td>
              <td className="h-10 px-3">
                <ReceiptButton url={payment.receipt_url} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PaymentWorkspace({ role = "student" }: { role?: WorkspaceRole }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedPaymentType =
    searchParams.get("payment_type") === "installments" ? "installments" : null;
  const requestedCartItemId = parsePositiveInt(searchParams.get("cart_item_id"));
  const paymentRequestKey = `${requestedPaymentType ?? "default"}:${requestedCartItemId ?? "all"}`;
  const appliedPaymentRequestRef = useRef<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>(() => resolveTab(searchParams.get("tab"), role));
  const [cart, setCart] = useState<Cart | null>(null);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartError, setCartError] = useState("");
  const [selectedCartItemIds, setSelectedCartItemIds] = useState<number[]>([]);
  const [checkoutMode, setCheckoutMode] = useState<PaymentType>("full");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [cartCheckoutIntent, setCartCheckoutIntent] = useState<CheckoutIntentState | null>(null);
  const [isCartPaymentDrawerOpen, setIsCartPaymentDrawerOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [payingInstallmentId, setPayingInstallmentId] = useState<number | null>(null);
  const [installmentCheckoutIntent, setInstallmentCheckoutIntent] = useState<PaymentIntent | null>(null);
  const [isInstallmentPaymentDrawerOpen, setIsInstallmentPaymentDrawerOpen] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsError, setPaymentsError] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const tabs = useMemo(() => allTabs.filter((tab) => tab.roles.includes(role)), [role]);
  const selectedCartItems = useMemo(
    () => cart?.items.filter((item) => selectedCartItemIds.includes(item.id)) ?? [],
    [cart, selectedCartItemIds],
  );
  const selectedInstallmentOption = useMemo(
    () => installmentOptionForItems(selectedCartItems),
    [selectedCartItems],
  );
  const cartPaymentSummary = useMemo(() => {
    if (!cartCheckoutIntent) return null;

    const totalCurrency = cart?.currency ?? cartCheckoutIntent.intent.currency;
    const isInstallmentPayment = cartCheckoutIntent.paymentMode === "installments";

    return {
      total: formatMoneyValue(sumCartItems(selectedCartItems, "subtotal"), totalCurrency),
      due: formatMoney(cartCheckoutIntent.intent.amount, cartCheckoutIntent.intent.currency),
      courses: selectedCartItems.map((item) => ({
        id: item.id,
        title: item.course.title,
        subtitle: item.pricing_plan_kind ?? "Course",
        amount: formatMoney(
          isInstallmentPayment ? item.installment_amount ?? item.subtotal : item.subtotal,
          item.currency,
        ),
        image: item.course.image,
      })),
    };
  }, [cart, cartCheckoutIntent, selectedCartItems]);
  const installmentPaymentSummary = useMemo(() => {
    if (!installmentCheckoutIntent) return null;

    const order = orders.find((item) =>
      item.installments.some((installment) => installment.id === installmentCheckoutIntent.installment_id),
    );
    const installment = order?.installments.find(
      (item) => item.id === installmentCheckoutIntent.installment_id,
    );

    return {
      total: order
        ? formatMoney(order.total_amount, order.currency)
        : formatMoney(installmentCheckoutIntent.amount, installmentCheckoutIntent.currency),
      due: formatMoney(installmentCheckoutIntent.amount, installmentCheckoutIntent.currency),
      courses:
        order?.items.map((item) => ({
          id: item.id,
          title: item.course_title,
          subtitle: installment
            ? `Installment ${installment.installment_number}/${order.installments_count}`
            : "Partial payment",
          amount: installment
            ? formatMoney(
                (Number(item.unit_amount) / order.installments_count).toFixed(2),
                item.currency,
              )
            : formatMoney(item.unit_amount, item.currency),
          image: null,
        })) ?? [
          {
            id: "installment",
            title: "Installment payment",
            subtitle: "Partial payment",
            amount: formatMoney(
              installmentCheckoutIntent.amount,
              installmentCheckoutIntent.currency,
            ),
            image: null,
          },
        ],
    };
  }, [installmentCheckoutIntent, orders]);

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
    if (role !== "student" || activeTab !== "card") return;

    let cancelled = false;
    setCartLoading(true);
    setCartError("");

    getCart()
      .then((data) => {
        if (cancelled) return;

        setCart(data);
        setSelectedCartItemIds((previousIds) => {
          const currentIds = data.items.map((item) => item.id);
          if (requestedCartItemId && currentIds.includes(requestedCartItemId)) {
            return [requestedCartItemId];
          }

          const keptIds = previousIds.filter((itemId) => currentIds.includes(itemId));
          return keptIds.length > 0 ? keptIds : currentIds;
        });
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
  }, [activeTab, requestedCartItemId, role]);

  useEffect(() => {
    if (checkoutMode === "installments" && !selectedInstallmentOption) {
      setCheckoutMode("full");
      setCartCheckoutIntent(null);
      setIsCartPaymentDrawerOpen(false);
    }
  }, [checkoutMode, selectedInstallmentOption]);

  useEffect(() => {
    if (
      role !== "student" ||
      activeTab !== "card" ||
      requestedPaymentType !== "installments" ||
      appliedPaymentRequestRef.current === paymentRequestKey
    ) {
      return;
    }

    if (selectedInstallmentOption) {
      setCheckoutMode("installments");
      setCheckoutError("");
      appliedPaymentRequestRef.current = paymentRequestKey;
      return;
    }

    if (!cartLoading && selectedCartItems.length > 0) {
      setCheckoutMode("full");
      setCheckoutError("Partial payment is not available for the selected course.");
      appliedPaymentRequestRef.current = paymentRequestKey;
    }
  }, [
    activeTab,
    cartLoading,
    paymentRequestKey,
    requestedPaymentType,
    role,
    selectedCartItems.length,
    selectedInstallmentOption,
  ]);

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

  function handleTabChange(tab: TabId) {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function handleToggleItem(itemId: number) {
    setCartCheckoutIntent(null);
    setIsCartPaymentDrawerOpen(false);
    setCheckoutError("");
    setSelectedCartItemIds((ids) =>
      ids.includes(itemId) ? ids.filter((id) => id !== itemId) : [...ids, itemId],
    );
  }

  function handleToggleAll() {
    if (!cart) return;

    setCartCheckoutIntent(null);
    setIsCartPaymentDrawerOpen(false);
    setCheckoutError("");
    setSelectedCartItemIds((ids) =>
      ids.length === cart.items.length ? [] : cart.items.map((item) => item.id),
    );
  }

  function handleModeChange(mode: PaymentType) {
    setCartCheckoutIntent(null);
    setIsCartPaymentDrawerOpen(false);
    setCheckoutError("");
    setCheckoutMode(mode);
  }

  async function handlePay() {
    if (!cart || selectedCartItems.length === 0 || checkoutLoading) {
      setCheckoutError("Select at least one course to pay.");
      return;
    }

    if (cartCheckoutIntent) {
      setIsCartPaymentDrawerOpen(true);
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError("");
    setIsCartPaymentDrawerOpen(false);

    try {
      const paymentType =
        checkoutMode === "installments" && selectedInstallmentOption ? "installments" : "full";
      const requestedInstallmentCount =
        paymentType === "installments" && selectedInstallmentOption
          ? selectedInstallmentOption.count
          : undefined;
      const intent = await createPaymentIntent({
        selected_cart_item_ids: selectedCartItems.map((item) => item.id),
        payment_type: paymentType,
        installments_count: requestedInstallmentCount,
      });

      setCartCheckoutIntent({
        intent,
        paymentMode: paymentType,
        installmentCount: requestedInstallmentCount ?? null,
      });
      setIsCartPaymentDrawerOpen(true);
    } catch (error) {
      const apiError = error as Partial<ApiError>;
      setCheckoutError(apiError.detail || apiError.message || "Could not start payment.");
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function handlePayInstallment(orderId: number, installmentId: number) {
    if (payingInstallmentId) return;

    if (installmentCheckoutIntent?.installment_id === installmentId) {
      setIsInstallmentPaymentDrawerOpen(true);
      return;
    }

    setPayingInstallmentId(installmentId);
    setOrdersError("");
    setInstallmentCheckoutIntent(null);
    setIsInstallmentPaymentDrawerOpen(false);

    try {
      const intent = await createInstallmentPaymentIntent(orderId, installmentId);
      setInstallmentCheckoutIntent(intent);
      setIsInstallmentPaymentDrawerOpen(true);
    } catch (error) {
      const apiError = error as Partial<ApiError>;
      setOrdersError(apiError.detail || apiError.message || "Could not start installment payment.");
    } finally {
      setPayingInstallmentId(null);
    }
  }

  const isPlansTab = activeTab === "plans";

  return (
    <main className="min-h-[calc(100vh-76px)] bg-[linear-gradient(120deg,#FFFFFF_0%,#FFF7F2_32%,rgba(252,196,195,0.38)_58%,#FFFFFF_100%)] px-4 py-8 sm:px-10">
      {toast ? (
        <div
          role="status"
          className="fixed top-24 right-8 z-50 max-w-[340px] rounded-lg border border-[#B7C7FA] bg-white px-4 py-3 font-mono text-[12px] text-[#121212] shadow-[0_0_15px_rgba(0,0,0,0.18)]"
        >
          {toast}
        </div>
      ) : null}

      <StripePaymentDrawer
        isOpen={isCartPaymentDrawerOpen}
        intent={cartCheckoutIntent?.intent ?? null}
        paymentType={cartCheckoutIntent?.paymentMode ?? checkoutMode}
        summary={cartPaymentSummary}
        onClose={() => setIsCartPaymentDrawerOpen(false)}
        onPaymentError={setCheckoutError}
      />

      <StripePaymentDrawer
        isOpen={isInstallmentPaymentDrawerOpen}
        intent={installmentCheckoutIntent}
        paymentType="installments"
        summary={installmentPaymentSummary}
        onClose={() => setIsInstallmentPaymentDrawerOpen(false)}
        onPaymentError={setOrdersError}
      />

      <section className={`mx-auto w-full ${isPlansTab ? "max-w-[584px]" : "max-w-[1100px]"}`}>
        <h1 className="mb-5 font-mono text-[16px] font-semibold leading-5 text-[#121212]">
          Tuition payment
        </h1>

        <div
          className={
            isPlansTab
              ? "min-h-[367px] rounded-[10px] bg-white px-5 pt-2 pb-8 shadow-[0_0_15px_rgba(0,0,0,0.18)]"
              : "min-h-[593px] rounded-[16px] bg-white px-5 py-4 shadow-[0_0_15px_rgba(0,0,0,0.18)] md:px-[60px] md:pt-[60px] md:pb-[72px]"
          }
        >
          <PaymentTabs tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />

          {activeTab === "card" ? (
            <CartPaymentPanel
              cart={cart}
              loading={cartLoading}
              error={cartError}
              selectedItemIds={selectedCartItemIds}
              checkoutMode={checkoutMode}
              checkoutLoading={checkoutLoading}
              checkoutError={checkoutError}
              onToggleItem={handleToggleItem}
              onToggleAll={handleToggleAll}
              onModeChange={handleModeChange}
              onPay={handlePay}
            />
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
              <>
                <InstallmentPlansTable
                  orders={orders}
                  payingInstallmentId={payingInstallmentId}
                  onPay={handlePayInstallment}
                />
              </>
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
              <PaymentHistoryTable payments={payments} />
            )
          ) : null}
        </div>
      </section>
    </main>
  );
}
