"use client";

import { useLocale, useTranslations } from "next-intl";
import { TrendingDown, TrendingUp } from "lucide-react";
import { formatMoney, MONEY_UNAVAILABLE } from "@/entities/payment";
import type {
  PaymentCurrencyTotals,
  PaymentPeriodTotals,
  PaymentSummary,
} from "@/entities/payment";
import type { PricingPlan } from "@/entities/course";

type TileKey = keyof PaymentPeriodTotals;

type Props = {
  summary: PaymentSummary | null;
  currency: PricingPlan["currency"] | null;
  error: string | null;
  loading: boolean;
};

function percentChange(current: string, previous: string): number | null {
  const now = Number(current);
  const before = Number(previous);
  if (!Number.isFinite(now) || !Number.isFinite(before) || before === 0) return null;
  return ((now - before) / before) * 100;
}

export function FinanceStatTiles({ summary, currency, error, loading }: Props) {
  const t = useTranslations("FinanceStatTiles");
  const locale = useLocale();

  const TILES: { key: TileKey; label: string; hint: string; upIsGood: boolean | null }[] = [
    { key: "gross_revenue", label: t("totalRevenue"), hint: t("totalRevenueHint"), upIsGood: true },
    { key: "refunded_amount", label: t("refunded"), hint: t("refundedHint"), upIsGood: false },
    { key: "net_revenue", label: t("netRevenue"), hint: t("netRevenueHint"), upIsGood: true },
    { key: "pending_amount", label: t("pending"), hint: t("pendingHint"), upIsGood: null },
  ];

  const totals: PaymentCurrencyTotals | null =
    summary?.by_currency.find((row) => row.currency === currency) ?? null;
  const previousTotals: PaymentCurrencyTotals | null =
    summary?.previous?.by_currency.find((row) => row.currency === currency) ?? null;
  const counts = summary?.counts;

  const summaryText = counts
    ? [
        `${t("summaryTotal", { count: counts.total })}: ${[
          t("summarySucceeded", { count: counts.succeeded }),
          t("summaryPending", { count: counts.pending + counts.processing }),
          t("summaryFailed", { count: counts.failed }),
          t("summaryRefunded", { count: counts.refunded }),
        ].join(", ")}`,
        counts.partially_refunded > 0
          ? `, ${t("summaryPartiallyRefunded", { count: counts.partially_refunded })}`
          : "",
        summary?.previous
          ? ` · ${t("summaryComparedWith", { from: summary.previous.date_from, to: summary.previous.date_to })}`
          : "",
      ].join("")
    : "";

  return (
    <div className="flex flex-col" style={{ gap: "clamp(8px, 0.83vw, 12px)" }}>
      <div className="flex flex-wrap" style={{ gap: "clamp(8px, 0.83vw, 12px)" }}>
        {TILES.map((tile) => {
          const change =
            totals && previousTotals
              ? percentChange(totals[tile.key], previousTotals[tile.key])
              : null;

          return (
            <div
              key={tile.key}
              className="flex min-w-0 flex-col rounded-2xl bg-white"
              style={{
                flex: "1 1 200px",
                padding: "clamp(14px, 1.25vw, 20px) clamp(16px, 1.39vw, 24px)",
                gap: 10,
                boxShadow: "var(--shadow-dashboard-card)",
              }}
            >
              <span
                className="text-(--color-text-primary)"
                style={{ fontFamily: "var(--font-base)", fontSize: "clamp(13px, 1.11vw, 17px)" }}
              >
                {tile.label}
              </span>

              <span
                className="block overflow-hidden rounded-lg bg-(--color-brand-lavender-soft) text-ellipsis whitespace-nowrap text-(--color-blue)"
                style={{
                  fontFamily: "var(--font-base)",
                  fontSize: "clamp(20px, 1.94vw, 28px)",
                  fontWeight: 500,
                  padding: "4px 10px",
                }}
              >
                {totals ? formatMoney(totals[tile.key], currency, locale) : MONEY_UNAVAILABLE}
              </span>

              {change === null ? (
                <span
                  className="text-(--color-text-secondary)"
                  style={{ fontFamily: "var(--font-base)", fontSize: "clamp(11px, 0.83vw, 13px)" }}
                >
                  {tile.hint}
                </span>
              ) : (
                <ChangeCaption
                  change={change}
                  upIsGood={tile.upIsGood}
                  locale={locale}
                  suffix={t("vsPreviousPeriod")}
                />
              )}
            </div>
          );
        })}
      </div>

      <p
        className="text-(--color-text-secondary)"
        style={{
          fontFamily: "var(--font-base)",
          fontSize: "clamp(12px, 0.97vw, 14px)",
          margin: 0,
        }}
      >
        {error ? (
          <span className="text-(--color-danger)">{t("errorPrefix", { error })}</span>
        ) : loading ? (
          t("loadingTotals")
        ) : !counts ? (
          t("noTransactionsMatch")
        ) : (
          summaryText
        )}
      </p>
    </div>
  );
}

function ChangeCaption({
  change,
  upIsGood,
  locale,
  suffix,
}: {
  change: number;
  upIsGood: boolean | null;
  locale: string;
  suffix: string;
}) {
  const up = change >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  const color =
    upIsGood === null
      ? "var(--color-text-secondary)"
      : up === upIsGood
        ? "var(--color-success)"
        : "var(--color-rejected)";

  const formattedChange = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    signDisplay: "exceptZero",
  }).format(change);

  return (
    <span
      className="flex items-center"
      style={{
        gap: 4,
        color,
        fontFamily: "var(--font-base)",
        fontSize: "clamp(11px, 0.83vw, 13px)",
      }}
    >
      <Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
      {formattedChange}% {suffix}
    </span>
  );
}
