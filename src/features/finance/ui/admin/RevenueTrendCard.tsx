"use client";

import { useState } from "react";
import { formatMoney } from "@/entities/payment";
import type { RevenueTimeseriesRow, RevenueTrendGroupBy } from "@/entities/payment";
import type { PricingPlan } from "@/entities/course";
import { ChartCard, ChartMessage } from "./ChartCard";

const X0 = 46;
const X1 = 628;
const Y_TOP = 16;
const Y_BASE = 140;
const VIEW_H = 168;
const GROUP_OPTIONS: { value: RevenueTrendGroupBy; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function periodLabel(period: string, groupBy: RevenueTrendGroupBy): string {
  const parts = period.split("-");
  if (groupBy === "month" && parts.length >= 2) return MONTHS[Number(parts[1]) - 1] ?? period;
  if (parts.length >= 3) return `${parts[2]}.${parts[1]}`;
  return period;
}

function compact(value: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(
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
  const [hover, setHover] = useState<number | null>(null);

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
      title="Revenue trends"
      action={
        <div
          className="flex rounded-full bg-(--color-brand-lavender-soft)"
          style={{ padding: 2, gap: 2 }}
          role="group"
          aria-label="Group revenue by"
        >
          {GROUP_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onGroupByChange(option.value)}
              aria-pressed={groupBy === option.value}
              className="cursor-pointer rounded-full border-none transition"
              style={{
                padding: "3px 12px",
                fontFamily: "var(--font-base)",
                fontSize: "clamp(11px, 0.83vw, 13px)",
                background: groupBy === option.value ? "white" : "transparent",
                color:
                  groupBy === option.value ? "var(--color-blue)" : "var(--color-text-secondary)",
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      }
    >
      {error ? (
        <ChartMessage tone="error">Revenue trend unavailable: {error}</ChartMessage>
      ) : loading ? (
        <ChartMessage>Loading revenue trend…</ChartMessage>
      ) : count === 0 ? (
        <ChartMessage>No revenue in this range.</ChartMessage>
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
            aria-label={`Gross revenue by ${groupBy}, ${count} periods, peak ${formatMoney(String(max), currency)}`}
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
                    {compact(value)}
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
                  {periodLabel(p.period, groupBy)}
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
                {periodLabel(active.period, groupBy)}
              </span>
              <span className="block font-semibold text-(--color-text-primary)">
                {formatMoney(active.gross_revenue, currency)}
              </span>
            </div>
          )}
        </div>
      )}
    </ChartCard>
  );
}
