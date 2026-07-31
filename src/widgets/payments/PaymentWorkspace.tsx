"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { X } from "lucide-react";
import { getCart, removeCartItem, type Cart, type CartItem } from "@/entities/cart";
import { DAY_KEYS, enrollInFreeCourse, type DayOfWeek } from "@/entities/course";
import {
  createInstallmentPaymentIntent,
  createPaymentIntent,
  downloadOrderInvoice,
  downloadPaymentReceipt,
  getOrders,
  getPayments,
  type Order,
  type Payment,
  type PaymentIntent,
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

const TAB_ORDER: TabId[] = ["card", "plans", "history"];
const TAB_ROLES: Record<TabId, WorkspaceRole[]> = {
  card: ["student"],
  plans: ["student", "teacher"],
  history: ["student", "teacher"],
};
const TAB_LABEL_KEYS: Record<TabId, string> = {
  card: "tabCard",
  plans: "tabPlans",
  history: "tabHistory",
};

const RECEIPT_ICON_SRC = "/icons/download.svg";
const CART_CARD_GRADIENT = {
  beginner: "var(--gradient-card-yellow)",
  intermediate: "var(--gradient-card-blue)",
  advanced: "var(--gradient-card-pink)",
} as const;

function formatDate(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale).format(new Date(value)).replace(/\//g, ".");
}

function formatMoney(
  amount: string,
  currency: string | null,
  freeLabel: string,
  locale: string,
): string {
  if (!currency) return Number(amount) === 0 ? freeLabel : amount;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(amount));
}

/** Group name / chosen weekly slots + start date, shown under the course title in the cart. */
function getCartItemMeta(
  item: CartItem,
  tDays: (key: string) => string,
  t: (key: string, values?: Record<string, string>) => string,
  locale: string,
): string | null {
  if (item.pricing_plan_kind === "group" && item.cohort) {
    const parts = [t("group", { name: item.cohort.name ?? t("groupFallback") })];
    if (item.cohort.start_date)
      parts.push(t("starts", { date: formatDate(item.cohort.start_date, locale) }));
    return parts.join(" · ");
  }

  if (item.pricing_plan_kind === "individual" && item.schedule_slots.length > 0) {
    const slots = item.schedule_slots
      .map((s) => `${tDays(DAY_KEYS[s.day_of_week as DayOfWeek])} ${s.start_time}–${s.end_time}`)
      .join(", ");
    return t("sessions", { slots });
  }

  return null;
}

function formatMoneyValue(
  amount: number,
  currency: string | null,
  freeLabel: string,
  locale: string,
): string {
  return formatMoney(amount.toFixed(2), currency, freeLabel, locale);
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

function courseLabel(payment: Payment, t: (key: string, values?: Record<string, number>) => string): string {
  if (payment.items.length === 0) return payment.description || t("paymentNumber", { id: payment.id });
  if (payment.items.length === 1) return payment.items[0].course_title;
  return payment.items.map((item) => item.course_title).join(", ");
}

function orderCourseLabel(order: Order, t: (key: string, values?: Record<string, number>) => string): string {
  if (order.items.length === 0) return t("orderNumber", { id: order.id });
  if (order.items.length === 1) return order.items[0].course_title;
  return order.items.map((item) => item.course_title).join(", ");
}

function resolveTab(value: string | null, role: WorkspaceRole): TabId {
  const normalizedValue = value === "cart" ? "card" : value;
  const allowedTabs = TAB_ORDER.filter((id) => TAB_ROLES[id].includes(role));
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
  const t = useTranslations("PaymentWorkspace");
  return (
    <nav className="flex border-b border-[#A7BAFA]" aria-label={t("paymentSectionsAriaLabel")}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            aria-current={isActive ? "page" : undefined}
            onClick={() => onChange(tab.id)}
            className={[
              "h-10 min-w-[88px] px-3 text-center font-(family-name:--font-base) text-[20px] leading-5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003AFF]",
              isActive
                ? "border-b-2 border-[#003AFF] font-semibold text-[#003AFF]"
                : "border-b-2 border-transparent font-normal text-[#121212] hover:text-[#003AFF]",
            ].join(" ")}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

function InvoiceButton({ orderId }: { orderId: number }) {
  const t = useTranslations("PaymentWorkspace");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDownload() {
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const invoice = await downloadOrderInvoice(orderId);
      const url = window.URL.createObjectURL(invoice);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
    } catch {
      setError(t("errorDownloadInvoice"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-w-0 flex-col items-start gap-0.5">
      <button
        type="button"
        onClick={handleDownload}
        disabled={loading}
        title={t("invoiceTitle")}
        className="w-fit text-left font-(family-name:--font-base) text-[16px] leading-5 font-normal text-[#121212] underline underline-offset-2 transition-colors hover:text-[#003AFF] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "..." : t("invoice")}
      </button>
      {error ? <span className="text-[9px] leading-3 text-[#B42318]">{error}</span> : null}
    </div>
  );
}

function ReceiptButton({
  paymentId,
  orderId,
  label,
}: {
  paymentId: number;
  orderId: number | null;
  label?: string;
}) {
  const t = useTranslations("PaymentWorkspace");
  const buttonClassName =
    "inline-flex h-7 items-center justify-center gap-1 rounded-full border border-black px-2 font-mono text-[15px] leading-[15px] font-medium text-black";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDownload() {
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const receipt = await downloadPaymentReceipt(paymentId);
      const url = window.URL.createObjectURL(receipt);
      const link = document.createElement("a");
      link.href = url;
      link.download = `receipt-${orderId ?? paymentId}-${paymentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
    } catch {
      setError(t("errorDownloadReceipt"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleDownload}
        disabled={loading}
        className={`${buttonClassName} transition-colors hover:bg-[#F2F2F2] disabled:cursor-not-allowed disabled:opacity-60`}
      >
        {loading ? "..." : (label ?? t("receipt"))}
        {!loading && RECEIPT_ICON_SRC ? (
          <img src={RECEIPT_ICON_SRC} alt="" aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
        ) : null}
      </button>
      {error ? <span className="text-[10px] leading-3 text-[#B42318]">{error}</span> : null}
    </div>
  );
}

function OrderSummary({
  selectedItems,
  currency,
  checkoutLoading,
  checkoutError,
  onPay,
}: {
  selectedItems: CartItem[];
  currency: string | null;
  checkoutLoading: boolean;
  checkoutError: string;
  onPay: () => void;
}) {
  const t = useTranslations("PaymentWorkspace");
  const locale = useLocale();
  const freeLabel = t("free");
  const totalLabel = formatMoneyValue(
    sumCartItems(selectedItems, "subtotal"),
    currency,
    freeLabel,
    locale,
  );
  const canPay = selectedItems.length > 0;

  return (
    <aside className="min-w-0 font-(family-name:--font-base) text-[#121212]">
      <h2 className="text-[22px] leading-7 font-semibold">{t("orderSummary")}</h2>

      <div className="mt-5">
        {selectedItems.map((item) => (
          <div
            key={item.id}
            className="flex items-start justify-between gap-4 border-b border-[#D4D4D4] py-2"
          >
            <span className="line-clamp-2 text-[14px] leading-[18px] text-[#6A6A6A]">
              {item.course.title}
            </span>
            <span className="shrink-0 text-[14px] leading-[18px]">
              {formatMoney(item.subtotal, item.currency, freeLabel, locale)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between border-t-2 border-[#003AFF] pt-2 text-[18px] leading-6 font-semibold">
        <span>{t("total")}</span>
        <span>{totalLabel}</span>
      </div>

      <p className="mt-2 text-[14px] leading-[17px]">{t("termsNotice")}</p>

      <button
        type="button"
        onClick={onPay}
        disabled={!canPay || checkoutLoading}
        className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-full bg-black px-5 text-[22px] leading-6 text-white transition-colors hover:bg-[#252525] disabled:cursor-not-allowed disabled:bg-[#6A6A6A]"
      >
        {checkoutLoading ? t("opening") : t("toPay")}
      </button>

      {checkoutError ? (
        <p role="alert" className="mt-3 text-[12px] text-[#B42318]">
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
  checkoutLoading,
  checkoutError,
  removingItemId,
  onToggleItem,
  onRemoveItem,
  onPay,
}: {
  cart: Cart | null;
  loading: boolean;
  error: string;
  selectedItemIds: number[];
  checkoutLoading: boolean;
  checkoutError: string;
  removingItemId: number | null;
  onToggleItem: (itemId: number) => void;
  onRemoveItem: (itemId: number, courseId: number) => void;
  onPay: () => void;
}) {
  const t = useTranslations("PaymentWorkspace");
  const tDays = useTranslations("Days");
  const locale = useLocale();

  if (loading) {
    return (
      <div className="mt-6 flex min-h-[260px] items-center justify-center font-mono text-[12px] text-[#6A6A6A]">
        {t("loadingCart")}
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
        {t("cartEmpty")}
      </div>
    );
  }

  const selectedItems = cart.items.filter((item) => selectedItemIds.includes(item.id));

  return (
    <div className="mx-6 mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_315px]">
      <section className="min-w-0">
        <h2 className="font-(family-name:--font-base) text-[20px] leading-6 font-normal text-[#5E5E5E]">
          {t("itemsInCart")}
        </h2>

        <div className="mt-7 flex flex-col gap-6">
          {cart.items.map((item) => {
            const isSelected = selectedItemIds.includes(item.id);
            const gradient = CART_CARD_GRADIENT[item.course.level] ?? CART_CARD_GRADIENT.beginner;

            const isRemoving = removingItemId === item.id;
            const meta = getCartItemMeta(item, tDays, t, locale);

            return (
              <label
                key={item.id}
                className="flex w-full max-w-[480px] cursor-pointer items-center gap-7"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleItem(item.id)}
                  className="peer sr-only"
                />
                <span
                  aria-hidden="true"
                  className={[
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-[3px] border border-[#003AFF] text-[18px] leading-none text-[#003AFF]",
                    isSelected ? "bg-[#D6E0FF]" : "bg-white",
                  ].join(" ")}
                >
                  {isSelected ? "✓" : null}
                </span>
                <div
                  className="relative flex min-h-[58px] min-w-0 flex-1 items-start gap-3 rounded-[14px] border border-[#E7E7E7] py-2 pl-5 pr-9 shadow-[0_0_8px_rgba(0,0,0,0.1)]"
                  style={{ background: gradient }}
                >
                  {item.course.image ? (
                    <img
                      src={item.course.image}
                      alt=""
                      className="h-10 w-10 shrink-0 object-contain"
                    />
                  ) : (
                    <div className="h-10 w-10 shrink-0 rounded-full bg-[#FDD3D0]" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="line-clamp-2 font-(family-name:--font-base) text-[14px] leading-4 font-semibold uppercase text-[#121212]">
                        {item.course.title}
                      </p>
                      <span className="shrink-0 font-(family-name:--font-base) text-[20px] leading-6 text-[#121212]">
                        {formatMoney(item.subtotal, item.currency, t("free"), locale)}
                      </span>
                    </div>
                    {meta ? (
                      <p className="mt-1 text-[11px] normal-case leading-tight text-[#5E5E5E]">
                        {meta}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    aria-label={t("removeFromCart")}
                    disabled={isRemoving}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      onRemoveItem(item.id, item.course_id);
                    }}
                    className="absolute right-2 top-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[#6A6A6A] transition-colors hover:bg-black/10 hover:text-[#B42318] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </label>
            );
          })}
        </div>
      </section>

      <OrderSummary
        selectedItems={selectedItems}
        currency={cart.currency}
        checkoutLoading={checkoutLoading}
        checkoutError={checkoutError}
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
  const t = useTranslations("PaymentWorkspace");
  const locale = useLocale();
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
        {t("noInstallmentPlans")}
      </div>
    );
  }

  return (
    <div className="mt-6 overflow-x-auto">
      {/* TODO: Prefer a dedicated payment-installments endpoint when backend exposes one. */}
      <div className="w-[831px] font-(family-name:--font-base) text-[#121212]">
        <div className="grid w-[831px] grid-cols-[minmax(0,1fr)_120px_120px_120px_96px] items-center px-5 pb-4 text-[13px] text-[#6A6A6A]">
          <span>{t("course")}</span>
          <span>{t("date")}</span>
          <span>{t("amount")}</span>
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
                className="grid h-[55px] w-[831px] grid-cols-[minmax(0,1fr)_120px_120px_120px_96px] items-center rounded-full bg-[#EEF3FF] px-5 text-[16px] leading-5 font-normal"
              >
                <span className="truncate">
                  {installment.installment_number}/{order.installments_count}{" "}
                  {orderCourseLabel(order, t)}
                </span>
                <span className="truncate">{formatDate(installment.due_date, locale)}</span>
                <span className="truncate">
                  {formatMoney(installment.amount, installment.currency, t("free"), locale)}
                </span>
                <InvoiceButton orderId={order.id} />
                <span className="flex justify-end">
                  {canPay ? (
                    <button
                      type="button"
                      onClick={() => onPay(order.id, installment.id)}
                      disabled={isPaying}
                      className="inline-flex h-8 min-w-[82px] items-center justify-center rounded-full bg-black px-4 font-(family-name:--font-base) text-[16px] leading-5 font-normal text-white transition-colors hover:bg-[#252525] disabled:cursor-not-allowed disabled:bg-[#6A6A6A]"
                    >
                      {isPaying ? "..." : t("toPay")}
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
  const t = useTranslations("PaymentWorkspace");
  const locale = useLocale();
  const paidPayments = payments.filter((payment) => payment.status === "succeeded");

  if (paidPayments.length === 0) {
    return (
      <div className="mt-6 flex min-h-[160px] items-center justify-center rounded-md border border-dashed border-[#D9D9D9] px-4 text-center font-mono text-[12px] text-[#6A6A6A]">
        {t("noCompletedPayments")}
      </div>
    );
  }

  return (
    <div className="mt-10 overflow-x-auto">
      <table className="w-full min-w-[620px] table-fixed border-collapse font-(family-name:--font-base) text-[16px] leading-4 text-[#121212]">
        <colgroup>
          <col className="w-1/4" />
          <col className="w-[16%]" />
          <col className="w-[18%]" />
          <col />
        </colgroup>
        <thead>
          <tr className="border-b border-[#D4D4D4] text-left text-[#6A6A6A]">
            <th className="h-10 px-4 font-normal text-[20px] leading-5">{t("course")}</th>
            <th className="h-10 px-4 font-normal text-[20px] leading-5">{t("date")}</th>
            <th className="h-10 px-4 font-normal text-[20px] leading-5">{t("amount")}</th>
            <th aria-label={t("receipt")} className="h-10 px-4" />
          </tr>
        </thead>
        <tbody>
          {paidPayments.map((payment) => (
            <tr key={payment.id} className="border-b border-[#D4D4D4]">
              <td className="truncate px-4 py-2 align-middle">{courseLabel(payment, t)}</td>
              <td className="truncate px-4 py-2 align-middle">
                {formatDate(payment.processed_at ?? payment.created_at, locale)}
              </td>
              <td className="truncate px-4 py-2 align-middle">
                {formatMoney(payment.amount, payment.currency, t("free"), locale)}
              </td>
              <td className="h-8 px-4 text-right">
                <ReceiptButton paymentId={payment.id} orderId={payment.order_id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PaymentWorkspace({ role = "student" }: { role?: WorkspaceRole }) {
  const t = useTranslations("PaymentWorkspace");
  const locale = useLocale();
  const freeLabel = t("free");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedPaymentType =
    searchParams.get("payment_type") === "installments" ? "installments" : null;
  const requestedCartItemId = parsePositiveInt(searchParams.get("cart_item_id"));
  const paymentRequestKey = `${requestedPaymentType ?? "default"}:${requestedCartItemId ?? "all"}`;
  const appliedPaymentRequestRef = useRef<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>(() =>
    resolveTab(searchParams.get("tab"), role),
  );
  const [cart, setCart] = useState<Cart | null>(null);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartError, setCartError] = useState("");
  const [selectedCartItemIds, setSelectedCartItemIds] = useState<number[]>([]);
  const [removingItemId, setRemovingItemId] = useState<number | null>(null);
  const [checkoutMode, setCheckoutMode] = useState<PaymentType>("full");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [cartCheckoutIntent, setCartCheckoutIntent] = useState<CheckoutIntentState | null>(null);
  const [isCartPaymentDrawerOpen, setIsCartPaymentDrawerOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [payingInstallmentId, setPayingInstallmentId] = useState<number | null>(null);
  const [installmentCheckoutIntent, setInstallmentCheckoutIntent] = useState<PaymentIntent | null>(
    null,
  );
  const [isInstallmentPaymentDrawerOpen, setIsInstallmentPaymentDrawerOpen] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsError, setPaymentsError] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const tabs = useMemo(
    () =>
      TAB_ORDER.filter((id) => TAB_ROLES[id].includes(role)).map((id) => ({
        id,
        label: t(TAB_LABEL_KEYS[id]),
      })),
    [role, t],
  );
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
      total: formatMoneyValue(
        sumCartItems(selectedCartItems, "subtotal"),
        totalCurrency,
        freeLabel,
        locale,
      ),
      due: formatMoney(
        cartCheckoutIntent.intent.amount,
        cartCheckoutIntent.intent.currency,
        freeLabel,
        locale,
      ),
      courses: selectedCartItems.map((item) => ({
        id: item.id,
        title: item.course.title,
        subtitle: item.pricing_plan_kind ?? t("course"),
        amount: formatMoney(
          isInstallmentPayment ? (item.installment_amount ?? item.subtotal) : item.subtotal,
          item.currency,
          freeLabel,
          locale,
        ),
        image: item.course.image,
      })),
    };
  }, [cart, cartCheckoutIntent, selectedCartItems, freeLabel, locale, t]);
  const installmentPaymentSummary = useMemo(() => {
    if (!installmentCheckoutIntent) return null;

    const order = orders.find((item) =>
      item.installments.some(
        (installment) => installment.id === installmentCheckoutIntent.installment_id,
      ),
    );
    const installment = order?.installments.find(
      (item) => item.id === installmentCheckoutIntent.installment_id,
    );

    return {
      total: order
        ? formatMoney(order.total_amount, order.currency, freeLabel, locale)
        : formatMoney(
            installmentCheckoutIntent.amount,
            installmentCheckoutIntent.currency,
            freeLabel,
            locale,
          ),
      due: formatMoney(
        installmentCheckoutIntent.amount,
        installmentCheckoutIntent.currency,
        freeLabel,
        locale,
      ),
      courses: order?.items.map((item) => ({
        id: item.id,
        title: item.course_title,
        subtitle: installment
          ? t("installmentOf", {
              number: installment.installment_number,
              total: order.installments_count,
            })
          : t("partialPayment"),
        amount: installment
          ? formatMoney(
              (Number(item.unit_amount) / order.installments_count).toFixed(2),
              item.currency,
              freeLabel,
              locale,
            )
          : formatMoney(item.unit_amount, item.currency, freeLabel, locale),
        image: null,
      })) ?? [
        {
          id: "installment",
          title: t("installmentPayment"),
          subtitle: t("partialPayment"),
          amount: formatMoney(
            installmentCheckoutIntent.amount,
            installmentCheckoutIntent.currency,
            freeLabel,
            locale,
          ),
          image: null,
        },
      ],
    };
  }, [installmentCheckoutIntent, orders, freeLabel, locale, t]);

  useEffect(() => {
    setActiveTab(resolveTab(searchParams.get("tab"), role));
  }, [role, searchParams]);

  useEffect(() => {
    const notice = searchParams.get("notice");
    const sessionId = searchParams.get("session_id");
    let message: string | null = null;

    if (notice === "course_available") message = t("noticeCourseAvailable");
    if (notice === "payment_cancelled") message = t("noticePaymentCanceled");
    if (sessionId) message = t("noticePaymentProcessing");

    if (!message) return;

    setToast(message);
    const timeoutId = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timeoutId);
  }, [searchParams, t]);

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
        if (!cancelled) setCartError(t("errorLoadCart"));
      })
      .finally(() => {
        if (!cancelled) setCartLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, requestedCartItemId, role, t]);

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
      setCheckoutError(t("errorPartialNotAvailable"));
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
    t,
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
        if (!cancelled) setOrdersError(t("errorLoadPaymentPlans"));
      })
      .finally(() => {
        if (!cancelled) setOrdersLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, t]);

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
        if (!cancelled) setPaymentsError(t("errorLoadPaymentHistory"));
      })
      .finally(() => {
        if (!cancelled) setPaymentsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, t]);

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

  async function handleRemoveItem(itemId: number, courseId: number) {
    setCartCheckoutIntent(null);
    setIsCartPaymentDrawerOpen(false);
    setCheckoutError("");
    setRemovingItemId(itemId);

    try {
      const updatedCart = await removeCartItem(courseId);
      setCart(updatedCart);
      setSelectedCartItemIds((ids) => ids.filter((id) => id !== itemId));
    } catch {
      setCartError(t("errorRemoveItem"));
    } finally {
      setRemovingItemId(null);
    }
  }

  async function startCartCheckout(paymentType: PaymentType) {
    if (!cart || selectedCartItems.length === 0 || checkoutLoading) {
      setCheckoutError(t("errorSelectCourse"));
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError("");
    setCheckoutMode(paymentType);
    setCartCheckoutIntent(null);
    setIsCartPaymentDrawerOpen(false);

    try {
      const freeCartItems = selectedCartItems.filter((item) => Number(item.unit_price) === 0);
      const paidCartItems = selectedCartItems.filter((item) => Number(item.unit_price) > 0);

      if (freeCartItems.length > 0) {
        await Promise.all(
          freeCartItems.map((item) =>
            enrollInFreeCourse(item.course.slug, {
              pricing_plan_id: item.pricing_plan_id ?? undefined,
              cohort_id: item.cohort?.id,
              schedule_slot_ids: item.schedule_slots.map((slot) => slot.id),
            }),
          ),
        );
        const refreshedCart = await getCart();
        setCart(refreshedCart);
        setSelectedCartItemIds(paidCartItems.map((item) => item.id));

        if (paidCartItems.length === 0) {
          setCartCheckoutIntent(null);
          setToast(t("freeCourseGranted"));
          return;
        }
      }

      const paidInstallmentOption = installmentOptionForItems(paidCartItems);
      if (paymentType === "installments" && !paidInstallmentOption) {
        setCheckoutError(t("errorPartialNotAvailable"));
        return;
      }

      const requestedInstallmentCount =
        paymentType === "installments" && paidInstallmentOption
          ? paidInstallmentOption.count
          : undefined;
      const intent = await createPaymentIntent({
        selected_cart_item_ids: paidCartItems.map((item) => item.id),
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
      setCheckoutError(apiError.detail || apiError.message || t("errorStartPayment"));
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function handlePay() {
    if (cartCheckoutIntent?.paymentMode === checkoutMode) {
      setIsCartPaymentDrawerOpen(true);
      return;
    }

    await startCartCheckout(checkoutMode);
  }

  async function handleCartPaymentTypeChange(paymentType: PaymentType) {
    if (cartCheckoutIntent?.paymentMode === paymentType) return;
    await startCartCheckout(paymentType);
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
      setOrdersError(apiError.detail || apiError.message || t("errorStartInstallment"));
    } finally {
      setPayingInstallmentId(null);
    }
  }

  const isPlansTab = activeTab === "plans";
  const isHistoryTab = activeTab === "history";

  return (
    <main className="relative isolate -m-[clamp(14px,1.5vw,28px)] min-h-[calc(100vh-76px)] overflow-hidden bg-white px-4 py-8 before:pointer-events-none before:absolute before:left-[112.69px] before:top-[-257px] before:z-0 before:h-[1001.87px] before:w-[1367.86px] before:rotate-[-33.8deg] before:rounded-[50%] before:bg-[#FCC4C3] before:opacity-50 before:blur-[300px] before:content-[''] sm:px-10">
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
        canPayInInstallments={Boolean(selectedInstallmentOption)}
        onClose={() => setIsCartPaymentDrawerOpen(false)}
        onPaymentTypeChange={handleCartPaymentTypeChange}
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

      <section className="relative z-10 mx-auto w-full max-w-[890px]">
        <h1 className="mb-6 font-(family-name:--font-base) text-[26px] font-semibold leading-[31px] text-[#121212]">
          {t("tuitionPayment")}
        </h1>

        <div
          className={
            isPlansTab
              ? "h-[560px] overflow-y-auto rounded-[10px] bg-white px-5 pt-2 pb-8 shadow-[0_0_15px_rgba(0,0,0,0.18)]"
              : isHistoryTab
                ? "h-[560px] overflow-y-auto rounded-[16px] bg-white px-5 pt-4 pb-8 shadow-[0_0_15px_rgba(0,0,0,0.18)] md:px-8"
                : "h-[560px] overflow-y-auto rounded-[16px] bg-white px-5 py-4 shadow-[0_0_15px_rgba(0,0,0,0.18)] md:px-8 md:pt-4 md:pb-8"
          }
        >
          <PaymentTabs tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />

          {activeTab === "card" ? (
            <CartPaymentPanel
              cart={cart}
              loading={cartLoading}
              error={cartError}
              selectedItemIds={selectedCartItemIds}
              checkoutLoading={checkoutLoading}
              checkoutError={checkoutError}
              removingItemId={removingItemId}
              onToggleItem={handleToggleItem}
              onRemoveItem={handleRemoveItem}
              onPay={handlePay}
            />
          ) : null}

          {activeTab === "plans" ? (
            ordersLoading ? (
              <div className="mt-6 flex min-h-[160px] items-center justify-center font-mono text-[12px] text-[#6A6A6A]">
                {t("loadingPaymentPlans")}
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
                {t("loadingPaymentHistory")}
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
