"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatMoney } from "@/entities/payment";
import type { RevenueTimeseriesRow, RevenueTrendGroupBy } from "@/entities/payment";
import type { PricingPlan } from "@/entities/course";
import { formatDate } from "@/shared/lib/time";
import { ChartCard, ChartMessage } from "./ChartCard";

const X0 = 46;
const X1 = 628;
const Y_TOP = 16;
const Y_BASE = 140;
const VIEW_H = 168;
const GROUP_OPTIONS: RevenueTrendGroupBy[] = ["day", "week", "month"];

function periodLabel(period: string, groupBy: RevenueTrendGroupBy, locale: string): string {
  const parts = period.split("-");
  if (groupBy === "month" && parts.length >= 2) {
    const date = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
    return new Intl.DateTimeFormat(locale, { month: "short" }).format(date);
  }
  if (parts.length >= 3) {
    return formatDate(period, locale, { day: "2-digit", month: "2-digit" });
  }
  return period;
}

function compact(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(
    value,
  );
}

type Props = {
  rows: RevenueTimeseriesRow[] | null;
  currency: PricingPlan["currency"] | null;
  error: string | null;
  loading: boolean;
  groupBy: RevenueTrendGroupBy;
  onGroupByChange: (value: RevenueTrendGroupBy) => void;
};

export function RevenueTrendCard({
  rows,
  currency,
  error,
  loading,
  groupBy,
  onGroupByChange,
}: Props) {
  const t = useTranslations("RevenueTrendCard");
  const locale = useLocale();
  const [hover, setHover] = useState<number | null>(null);

  const GROUP_LABELS: Record<RevenueTrendGroupBy, string> = {
    day: t("groupDay"),
    week: t("groupWeek"),
    month: t("groupMonth"),
  };

  const points = (rows ?? [])
    .filter((row) => row.currency === currency)
    .slice()
    .sort((a, b) => a.period.localeCompare(b.period));
  const values = points.map((p) => Number(p.gross_revenue) || 0);
  const max = Math.max(1, ...values);
  const count = points.length;

  const xFor = (i: number) => (count <= 1 ? X0 : X0 + (i * (X1 - X0)) / (count - 1));
  const yFor = (v: number) => Y_BASE - (v / max) * (Y_BASE - Y_TOP);

  const lineD = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${xFor(i)} ${yFor(Number(p.gross_revenue) || 0)}`)
    .join(" ");
  const areaD = count > 0 ? `${lineD} L${xFor(count - 1)} ${Y_BASE} L${X0} ${Y_BASE} Z` : "";
  const ticks = [0, 1, 2, 3, 4].map((step) => (max * step) / 4);
  const labelStep = count > 12 ? Math.ceil(count / 12) : 1;

  function handleMove(event: React.MouseEvent<HTMLDivElement>) {
    if (count === 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    const svgX = ratio * 640;
    const index = Math.round(((svgX - X0) / (X1 - X0)) * (count - 1));
    setHover(Math.max(0, Math.min(count - 1, index)));
  }

  const active = hover !== null ? points[hover] : null;

  return (
    <ChartCard
      title={t("title")}
      action={
        <div
          className="flex rounded-full bg-(--color-brand-lavender-soft)"
          style={{ padding: 2, gap: 2 }}
          role="group"
          aria-label={t("groupByAriaLabel")}
        >
          {GROUP_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onGroupByChange(option)}
              aria-pressed={groupBy === option}
              className="cursor-pointer rounded-full border-none transition"
              style={{
                padding: "3px 12px",
                fontFamily: "var(--font-base)",
                fontSize: "clamp(11px, 0.83vw, 13px)",
                background: groupBy === option ? "white" : "transparent",
                color: groupBy === option ? "var(--color-blue)" : "var(--color-text-secondary)",
              }}
            >
              {GROUP_LABELS[option]}
            </button>
          ))}
        </div>
      }
    >
      {error ? (
        <ChartMessage tone="error">{t("errorPrefix", { error })}</ChartMessage>
      ) : loading ? (
        <ChartMessage>{t("loading")}</ChartMessage>
      ) : count === 0 ? (
        <ChartMessage>{t("empty")}</ChartMessage>
      ) : (
        <div
          className="relative"
          onMouseMove={handleMove}
          onMouseLeave={() => setHover(null)}
          style={{ height: "clamp(180px, 16vw, 230px)" }}
        >
          <svg
            className="h-full w-full"
            viewBox={`0 0 640 ${VIEW_H}`}
            role="img"
            aria-label={t("chartAriaLabel", {
              groupBy,
              count,
              peak: formatMoney(String(max), currency, locale),
            })}
          >
            <defs>
              <linearGradient id="revenueTrendFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity="0.32" />
                <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {ticks.map((value, i) => {
              const y = yFor(value);
              return (
                <g key={i}>
                  <line
                    x1={X0}
                    x2={X1}
                    y1={y}
                    y2={y}
                    stroke="var(--color-chart-grid)"
                    strokeWidth="1"
                  />
                  <text
                    x={X0 - 8}
                    y={y + 3.5}
                    textAnchor="end"
                    fill="var(--color-text-secondary)"
                    fontSize="10"
                  >
                    {compact(value, locale)}
                  </text>
                </g>
              );
            })}

            <path d={areaD} fill="url(#revenueTrendFill)" />
            <path
              d={lineD}
              fill="none"
              stroke="var(--color-chart-1)"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {hover !== null && (
              <g>
                <line
                  x1={xFor(hover)}
                  x2={xFor(hover)}
                  y1={Y_TOP}
                  y2={Y_BASE}
                  stroke="var(--color-text-secondary)"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <circle
                  cx={xFor(hover)}
                  cy={yFor(values[hover])}
                  r="4"
                  fill="var(--color-chart-1)"
                  stroke="white"
                  strokeWidth="2"
                />
              </g>
            )}

            {points.map((p, i) =>
              i % labelStep === 0 ? (
                <text
                  key={p.period}
                  x={xFor(i)}
                  y={VIEW_H - 6}
                  textAnchor={i === 0 ? "start" : i === count - 1 ? "end" : "middle"}
                  fill="var(--color-text-secondary)"
                  fontSize="10"
                >
                  {periodLabel(p.period, groupBy, locale)}
                </text>
              ) : null,
            )}
          </svg>

          {active && (
            <div
              className="pointer-events-none absolute rounded-lg bg-white"
              style={{
                left: `${(xFor(hover!) / 640) * 100}%`,
                top: 0,
                transform: "translateX(-50%)",
                padding: "6px 10px",
                boxShadow: "var(--shadow-sort-dropdown)",
                fontFamily: "var(--font-base)",
                fontSize: "clamp(11px, 0.83vw, 13px)",
                whiteSpace: "nowrap",
              }}
            >
              <span className="block text-(--color-text-secondary)">
                {periodLabel(active.period, groupBy, locale)}
              </span>
              <span className="block font-semibold text-(--color-text-primary)">
                {formatMoney(active.gross_revenue, currency, locale)}
              </span>
            </div>
          )}
        </div>
      )}
    </ChartCard>
  );
}
