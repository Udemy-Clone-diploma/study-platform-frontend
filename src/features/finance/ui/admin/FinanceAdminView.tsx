"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { PageShell } from "@/shared/ui/PageShell";
import { Pagination } from "@/shared/ui/Pagination";
import { ConfirmActionModal } from "@/shared/ui/ConfirmActionModal";
import {
  downloadOrderInvoice,
  downloadPaymentReceipt,
  formatMoney,
  getAdminPayments,
  getPaymentsSummary,
  getRevenueByCategory,
  getRevenueTimeseries,
  refundPayment,
} from "@/entities/payment";
import type {
  AdminPayment,
  PaymentMethod,
  PaymentStatus,
  PaymentSummary,
  RevenueCategoryRow,
  RevenueTimeseriesRow,
  RevenueTrendGroupBy,
} from "@/entities/payment";
import type { ApiError } from "@/shared/api/base";
import { CURRENCIES, type Currency } from "@/entities/course";
import { FinanceStatTiles } from "./FinanceStatTiles";
import {
  DateRangeFilter,
  FinanceToolbar,
  RefreshButton,
  type RefundFilter,
} from "./FinanceToolbar";
import { PaymentsTable, payerName, refundedSoFar, remainingAmount } from "./PaymentsTable";
import { PaymentDetailPanel } from "./PaymentDetailPanel";
import { RevenueTrendCard } from "./RevenueTrendCard";
import { RevenueCategoryCard } from "./RevenueCategoryCard";
import { CurrencyTabs } from "./CurrencyTabs";
import { FinanceTabs, type FinanceTabKey } from "./FinanceTabs";
import { StaffPayoutPanel } from "./StaffPayoutPanel";

const PAGE_SIZE = 10;
const DEFAULT_ORDERING = "-created_at";
const GROUP_BY_VALUES: RevenueTrendGroupBy[] = ["day", "week", "month"];

const STATUS_VALUES: PaymentStatus[] = [
  "pending",
  "processing",
  "succeeded",
  "failed",
  "canceled",
  "refunded",
];
const METHOD_VALUES: PaymentMethod[] = ["stripe", "manual", "liqpay"];
const TAB_VALUES: FinanceTabKey[] = ["stats", "payments", "payouts"];

function saveBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
}

export function FinanceAdminView() {
  const t = useTranslations("FinanceAdminView");
  const tPaymentsTable = useTranslations("PaymentsTable");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  const pageParam = Number(searchParams.get("page"));
  const page = Number.isInteger(pageParam) && pageParam > 1 ? pageParam : 1;
  const statusParam = searchParams.get("status");
  const status = STATUS_VALUES.includes(statusParam as PaymentStatus)
    ? (statusParam as PaymentStatus)
    : null;
  const methodParam = searchParams.get("method");
  const method = METHOD_VALUES.includes(methodParam as PaymentMethod)
    ? (methodParam as PaymentMethod)
    : null;
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const search = searchParams.get("search") ?? "";
  const ordering = searchParams.get("ordering") ?? DEFAULT_ORDERING;
  const groupParam = searchParams.get("group");
  const groupBy = GROUP_BY_VALUES.includes(groupParam as RevenueTrendGroupBy)
    ? (groupParam as RevenueTrendGroupBy)
    : "month";

  const refundsParam = searchParams.get("refunds");
  const refunds: RefundFilter =
    refundsParam === "true" || refundsParam === "false" ? refundsParam : null;
  const hasRefund = refunds === null ? undefined : refunds === "true";

  const currencyParam = searchParams.get("currency");
  const tabParam = searchParams.get("tab");
  const tab: FinanceTabKey = TAB_VALUES.includes(tabParam as FinanceTabKey)
    ? (tabParam as FinanceTabKey)
    : "stats";

  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [count, setCount] = useState(0);
  const [listError, setListError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  const filterKey = [status ?? "", method ?? "", refunds ?? "", from, to, search, refreshKey].join(
    "|",
  );
  const queryKey = [page, ordering, filterKey].join("|");
  const statsKey = [from, to, refreshKey].join("|");
  const loading = loadedKey !== queryKey;

  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryLoadedKey, setSummaryLoadedKey] = useState<string | null>(null);

  const [trend, setTrend] = useState<RevenueTimeseriesRow[] | null>(null);
  const [trendError, setTrendError] = useState<string | null>(null);
  const [trendLoadedKey, setTrendLoadedKey] = useState<string | null>(null);

  const [categories, setCategories] = useState<RevenueCategoryRow[] | null>(null);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [categoriesLoadedKey, setCategoriesLoadedKey] = useState<string | null>(null);

  const [detailPayment, setDetailPayment] = useState<AdminPayment | null>(null);
  const [noticeError, setNoticeError] = useState<string | null>(null);
  const [refundTarget, setRefundTarget] = useState<AdminPayment | null>(null);
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);

  const updateParams = useCallback(
    (updates: Record<string, string | null>, options?: { scroll?: boolean }) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") params.delete(key);
        else params.set(key, value);
      }
      router.push(params.toString() ? `?${params.toString()}` : "/admin/payment", {
        scroll: options?.scroll ?? false,
      });
    },
    [router, searchParams],
  );

  useEffect(() => {
    if (tab !== "payments") return;
    let cancelled = false;
    getAdminPayments({
      page,
      page_size: PAGE_SIZE,
      ordering,
      search: search || undefined,
      status: status ?? undefined,
      payment_method: method ?? undefined,
      has_refund: hasRefund,
      date_from: from || undefined,
      date_to: to || undefined,
    })
      .then((data) => {
        if (cancelled) return;
        setPayments(data.results);
        setCount(data.count);
        setListError(null);
        setLoadedKey(queryKey);
      })
      .catch((err) => {
        if (cancelled) return;
        const apiError = err as ApiError;
        if (apiError.status === 404 && page > 1) {
          updateParams({ page: null });
          return;
        }
        setPayments([]);
        setCount(0);
        setListError(apiError.message ?? t("errorLoadTransactions"));
        setLoadedKey(queryKey);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, page, ordering, status, method, hasRefund, from, to, search, queryKey, updateParams, t]);

  useEffect(() => {
    if (tab !== "stats") return;
    let cancelled = false;
    getPaymentsSummary({
      date_from: from || undefined,
      date_to: to || undefined,
    })
      .then((data) => {
        if (cancelled) return;
        setSummary(data);
        setSummaryError(null);
        setSummaryLoadedKey(statsKey);
      })
      .catch((err) => {
        if (cancelled) return;
        setSummary(null);
        setSummaryError((err as ApiError).message ?? t("errorLoadTotals"));
        setSummaryLoadedKey(statsKey);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, from, to, statsKey, t]);

  const trendKey = [statsKey, groupBy].join("|");

  useEffect(() => {
    if (tab !== "stats") return;
    let cancelled = false;
    getRevenueTimeseries({
      group_by: groupBy,
      date_from: from || undefined,
      date_to: to || undefined,
    })
      .then((data) => {
        if (cancelled) return;
        setTrend(data);
        setTrendError(null);
        setTrendLoadedKey(trendKey);
      })
      .catch((err) => {
        if (cancelled) return;
        setTrend(null);
        setTrendError((err as ApiError).message ?? t("errorLoadRevenueTrend"));
        setTrendLoadedKey(trendKey);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, groupBy, from, to, trendKey, t]);

  useEffect(() => {
    if (tab !== "stats") return;
    let cancelled = false;
    getRevenueByCategory({
      date_from: from || undefined,
      date_to: to || undefined,
    })
      .then((data) => {
        if (cancelled) return;
        setCategories(data);
        setCategoriesError(null);
        setCategoriesLoadedKey(statsKey);
      })
      .catch((err) => {
        if (cancelled) return;
        setCategories(null);
        setCategoriesError((err as ApiError).message ?? t("errorLoadCategoryBreakdown"));
        setCategoriesLoadedKey(statsKey);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, from, to, statsKey, t]);

  const refresh = useCallback(() => setRefreshKey((key) => key + 1), []);

  const handleSearchChange = useCallback(
    (value: string) => {
      updateParams({ search: value || null, page: null });
    },
    [updateParams],
  );

  async function handleDownload(payment: AdminPayment, kind: "receipt" | "invoice") {
    setNoticeError(null);
    try {
      if (kind === "receipt") {
        saveBlob(await downloadPaymentReceipt(payment.id), `receipt-${payment.id}.pdf`);
      } else if (payment.order_id !== null) {
        saveBlob(await downloadOrderInvoice(payment.order_id), `invoice-${payment.order_id}.pdf`);
      }
    } catch (err) {
      const apiError = err as ApiError;
      setNoticeError(
        apiError.message ??
          (kind === "receipt" ? t("errorDownloadReceipt") : t("errorDownloadInvoice")),
      );
    }
  }

  function requestRefund(payment: AdminPayment) {
    setRefundError(null);
    setRefundTarget(payment);
  }

  async function handleConfirmRefund() {
    if (!refundTarget) return;
    setRefundLoading(true);
    setRefundError(null);
    try {
      const updated = await refundPayment(refundTarget.id, {
        amount: remainingAmount(refundTarget).toFixed(2),
      });
      if (detailPayment?.id === refundTarget.id) setDetailPayment(updated);
      setRefundTarget(null);
      refresh();
    } catch (err) {
      setRefundError((err as ApiError).message ?? t("errorRefundGeneric"));
    } finally {
      setRefundLoading(false);
    }
  }

  const earningCurrencies = (summary?.by_currency ?? [])
    .slice()
    .sort((a, b) => (Number(b.gross_revenue) || 0) - (Number(a.gross_revenue) || 0))
    .map((row) => row.currency);
  const currency: Currency = CURRENCIES.includes(currencyParam as Currency)
    ? (currencyParam as Currency)
    : (earningCurrencies[0] ?? "USD");

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const emptyMessage = loading ? t("loadingTransactions") : t("noTransactionsFound");
  const summaryLoading = summaryLoadedKey !== statsKey;

  const TABS = [
    { key: "stats", label: t("tabStatistics") },
    { key: "payments", label: t("tabPaymentHistory") },
    { key: "payouts", label: t("tabTeacherPayouts") },
  ] as const;

  return (
    <PageShell className="bg-(--color-brand-lavender-soft)">
      <div className="flex w-full flex-col" style={{ maxWidth: 1648, margin: "0 auto" }}>
        <div
          className="flex flex-wrap items-center justify-between"
          style={{ gap: 16, margin: "0 0 clamp(16px, 1.67vw, 24px)" }}
        >
          <h1
            className="font-semibold text-(--color-text-primary)"
            style={{
              fontFamily: "var(--font-base)",
              fontSize: "clamp(24px, 2.5vw, 36px)",
              margin: 0,
            }}
          >
            {t("heading")}
          </h1>
          <FinanceTabs
            tabs={TABS}
            active={tab}
            onChange={(next) => updateParams({ tab: next === "stats" ? null : next })}
            ariaLabel={t("tabsAriaLabel")}
          />
        </div>

        {tab === "stats" && (
          <div
            role="tabpanel"
            id="finance-panel-stats"
            aria-labelledby="finance-tab-stats"
            className="flex flex-col"
          >
            <div
              className="flex flex-wrap items-center justify-between"
              style={{ gap: 16, marginBottom: "clamp(16px, 1.67vw, 24px)" }}
            >
              <div className="flex flex-wrap items-center" style={{ gap: 12 }}>
                <DateRangeFilter
                  from={from}
                  to={to}
                  onDateChange={(updates) => updateParams({ ...updates, page: null })}
                  locale={locale}
                />
                <RefreshButton onRefresh={refresh} refreshing={summaryLoading} />
              </div>
              <CurrencyTabs
                currencies={CURRENCIES}
                active={currency}
                onChange={(next) => updateParams({ currency: next })}
              />
            </div>

            <div style={{ marginBottom: "clamp(16px, 1.67vw, 24px)" }}>
              <FinanceStatTiles
                summary={summary}
                currency={currency}
                error={summaryError}
                loading={summaryLoading && !summaryError}
              />
            </div>

            <div
              className="flex flex-wrap items-stretch"
              style={{ gap: "clamp(12px, 1.11vw, 16px)" }}
            >
              <div className="flex min-w-0 flex-col" style={{ flex: "2 1 520px" }}>
                <RevenueTrendCard
                  rows={trend}
                  currency={currency}
                  error={trendError}
                  loading={trendLoadedKey !== trendKey && !trendError}
                  groupBy={groupBy}
                  onGroupByChange={(next) =>
                    updateParams({ group: next === "month" ? null : next })
                  }
                />
              </div>
              <div className="flex min-w-0 flex-col" style={{ flex: "1 1 340px" }}>
                <RevenueCategoryCard
                  rows={categories}
                  currency={currency}
                  error={categoriesError}
                  loading={categoriesLoadedKey !== statsKey && !categoriesError}
                />
              </div>
            </div>
          </div>
        )}

        {tab === "payments" && (
          <div role="tabpanel" id="finance-panel-payments" aria-labelledby="finance-tab-payments">
            <div style={{ marginBottom: "clamp(16px, 1.67vw, 24px)" }}>
              <FinanceToolbar
                search={search}
                onSearchChange={handleSearchChange}
                status={status}
                onStatusChange={(next) => updateParams({ status: next, page: null })}
                method={method}
                onMethodChange={(next) => updateParams({ method: next, page: null })}
                refunds={refunds}
                onRefundsChange={(next) => updateParams({ refunds: next, page: null })}
                from={from}
                to={to}
                onDateChange={(updates) => updateParams({ ...updates, page: null })}
                onRefresh={refresh}
                refreshing={loading}
              />
            </div>

            {(listError || noticeError) && (
              <p
                className="text-(--color-danger)"
                style={{
                  fontFamily: "var(--font-base)",
                  fontSize: "clamp(12px, 0.97vw, 14px)",
                  margin: "0 0 8px",
                }}
              >
                {listError ?? noticeError}
              </p>
            )}

            <div
              className="flex flex-wrap items-start"
              style={{ gap: "clamp(16px, 1.67vw, 24px)" }}
            >
              <div className="flex min-w-0 flex-col" style={{ flex: "1 1 640px" }}>
                <div
                  key={refreshKey}
                  className={`animate-[table-refresh_400ms_ease-out] transition-opacity ${loading ? "opacity-60" : ""}`}
                >
                  <PaymentsTable
                    payments={payments}
                    emptyMessage={emptyMessage}
                    selectedPaymentId={detailPayment?.id ?? null}
                    onSelect={setDetailPayment}
                    onDownloadReceipt={(payment) => handleDownload(payment, "receipt")}
                    onDownloadInvoice={(payment) => handleDownload(payment, "invoice")}
                    onRefund={requestRefund}
                    currentSort={ordering}
                    onSortChange={(next) =>
                      updateParams({ ordering: next === DEFAULT_ORDERING ? null : next })
                    }
                  />
                </div>

                {totalPages > 1 && (
                  <div style={{ marginTop: "clamp(16px, 1.67vw, 24px)" }}>
                    <Pagination
                      currentPage={page}
                      totalPages={totalPages}
                      onPageChange={(next) =>
                        updateParams({ page: next > 1 ? String(next) : null }, { scroll: true })
                      }
                    />
                  </div>
                )}
              </div>

              {detailPayment && (
                <PaymentDetailPanel
                  payment={detailPayment}
                  onClose={() => setDetailPayment(null)}
                />
              )}
            </div>
          </div>
        )}

        {tab === "payouts" && (
          <div role="tabpanel" id="finance-panel-payouts" aria-labelledby="finance-tab-payouts">
            <StaffPayoutPanel />
          </div>
        )}
      </div>

      {refundTarget && (
        <ConfirmActionModal
          title={
            refundedSoFar(refundTarget) > 0
              ? t("refundRemainingBalanceTitle")
              : t("refundPaymentTitle")
          }
          description={[
            t("refundDescription", {
              amount: formatMoney(
                String(remainingAmount(refundTarget)),
                refundTarget.currency,
                locale,
              ),
              currency: refundTarget.currency,
              payer: payerName(refundTarget, tPaymentsTable),
              id: refundTarget.id,
            }),
            refundedSoFar(refundTarget) > 0
              ? t("refundAlreadyRefunded", {
                  amount: formatMoney(refundTarget.refunded_amount, refundTarget.currency, locale),
                })
              : null,
            t("refundIrreversibleNotice"),
          ]
            .filter(Boolean)
            .join(" ")}
          confirmLabel={t("refundConfirmLabel")}
          loading={refundLoading}
          error={refundError}
          onConfirm={handleConfirmRefund}
          onCancel={() => setRefundTarget(null)}
        />
      )}
    </PageShell>
  );
}
