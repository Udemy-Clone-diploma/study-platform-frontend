"use client";

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

const TILES: { key: TileKey; label: string; hint: string; upIsGood: boolean | null }[] = [
  { key: "gross_revenue", label: "Total revenue", hint: "Charged, before refunds", upIsGood: true },
  { key: "refunded_amount", label: "Refunded", hint: "Returned to students", upIsGood: false },
  { key: "net_revenue", label: "Net revenue", hint: "Gross minus refunds", upIsGood: true },
  { key: "pending_amount", label: "Pending", hint: "Not settled yet", upIsGood: null },
];

function percentChange(current: string, previous: string): number | null {
  const now = Number(current);
  const before = Number(previous);
  if (!Number.isFinite(now) || !Number.isFinite(before) || before === 0) return null;
  return ((now - before) / before) * 100;
}

export function FinanceStatTiles({ summary, currency, error, loading }: Props) {
  const totals: PaymentCurrencyTotals | null =
    summary?.by_currency.find((row) => row.currency === currency) ?? null;
  const previousTotals: PaymentCurrencyTotals | null =
    summary?.previous?.by_currency.find((row) => row.currency === currency) ?? null;
  const counts = summary?.counts;

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
                {totals ? formatMoney(totals[tile.key], currency) : MONEY_UNAVAILABLE}
              </span>

              {change === null ? (
                <span
                  className="text-(--color-text-secondary)"
                  style={{ fontFamily: "var(--font-base)", fontSize: "clamp(11px, 0.83vw, 13px)" }}
                >
                  {tile.hint}
                </span>
              ) : (
                <ChangeCaption change={change} upIsGood={tile.upIsGood} />
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
          <span className="text-(--color-danger)">Totals unavailable: {error}</span>
        ) : loading ? (
          "Loading totals…"
        ) : !counts ? (
          "No transactions match these filters."
        ) : (
          <>
            {`${counts.total} transactions across all currencies: ${counts.succeeded} succeeded, ${counts.pending + counts.processing} pending, ${counts.failed} failed, ${counts.refunded} fully refunded`}
            {counts.partially_refunded > 0 && `, ${counts.partially_refunded} partially refunded`}
            {summary?.previous &&
              ` · compared with ${summary.previous.date_from} to ${summary.previous.date_to}`}
          </>
        )}
      </p>
    </div>
  );
}

function ChangeCaption({ change, upIsGood }: { change: number; upIsGood: boolean | null }) {
  const up = change >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  const color =
    upIsGood === null
      ? "var(--color-text-secondary)"
      : up === upIsGood
        ? "var(--color-success)"
        : "var(--color-rejected)";

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
      {up ? "+" : ""}
      {change.toFixed(1)}% vs previous period
    </span>
  );
}
