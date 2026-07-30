"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatMoney } from "@/entities/payment";
import type { RevenueCategoryRow } from "@/entities/payment";
import type { PricingPlan } from "@/entities/course";
import { ChartCard, ChartMessage } from "./ChartCard";

const MAX_SLICES = 6;
const SIZE = 200;
const RADIUS = 74;
const STROKE = 26;
const GAP = 3;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SERIES = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-chart-6)",
];

type Slice = { label: string; amount: number; share: number };

function toSlices(rows: RevenueCategoryRow[], uncategorizedLabel: string, otherLabel: string): Slice[] {
  const sorted = rows
    .map((row) => ({
      label: row.category ?? uncategorizedLabel,
      amount: Number(row.gross_revenue) || 0,
    }))
    .filter((row) => row.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const total = sorted.reduce((sum, row) => sum + row.amount, 0);
  if (total <= 0) return [];

  const capped =
    sorted.length <= MAX_SLICES
      ? sorted
      : [
          ...sorted.slice(0, MAX_SLICES - 1),
          {
            label: otherLabel,
            amount: sorted.slice(MAX_SLICES - 1).reduce((sum, row) => sum + row.amount, 0),
          },
        ];

  return capped.map((row) => ({ ...row, share: row.amount / total }));
}

type Props = {
  rows: RevenueCategoryRow[] | null;
  currency: PricingPlan["currency"] | null;
  error: string | null;
  loading: boolean;
};

export function RevenueCategoryCard({ rows, currency, error, loading }: Props) {
  const t = useTranslations("RevenueCategoryCard");
  const locale = useLocale();
  const [hover, setHover] = useState<number | null>(null);

  const slices = toSlices(
    (rows ?? []).filter((row) => row.currency === currency),
    t("uncategorized"),
    t("other"),
  );

  const gap = slices.length > 1 ? GAP : 0;
  const arcs = slices.map((slice, index) => ({
    slice,
    index,
    length: Math.max(0, slice.share * CIRCUMFERENCE - gap),
    offset:
      slices.slice(0, index).reduce((sum, previous) => sum + previous.share, 0) * CIRCUMFERENCE,
  }));

  return (
    <ChartCard title={t("title")}>
      {error ? (
        <ChartMessage tone="error">{t("errorPrefix", { error })}</ChartMessage>
      ) : loading ? (
        <ChartMessage>{t("loading")}</ChartMessage>
      ) : slices.length === 0 ? (
        <ChartMessage>{t("empty")}</ChartMessage>
      ) : (
        <div className="flex flex-wrap items-center" style={{ gap: "clamp(16px, 1.67vw, 28px)" }}>
          <svg
            width={SIZE}
            height={SIZE}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className="shrink-0"
            role="img"
            aria-label={t("ariaLabel", {
              currency: currency ?? "",
              breakdown: slices
                .map((s) => `${s.label} ${Math.round(s.share * 100)}%`)
                .join(", "),
            })}
          >
            <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
              {arcs.map(({ slice, index, length, offset }) => (
                <circle
                  key={slice.label}
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  stroke={SERIES[index]}
                  strokeWidth={hover === index ? STROKE + 6 : STROKE}
                  strokeDasharray={`${length} ${CIRCUMFERENCE - length}`}
                  strokeDashoffset={-offset}
                  onMouseEnter={() => setHover(index)}
                  onMouseLeave={() => setHover(null)}
                  style={{ transition: "stroke-width 120ms" }}
                />
              ))}
            </g>
            {hover !== null && slices[hover] && (
              <text
                x={SIZE / 2}
                y={SIZE / 2}
                textAnchor="middle"
                fill="var(--color-text-primary)"
                fontSize="15"
                fontWeight="600"
              >
                {Math.round(slices[hover].share * 100)}%
              </text>
            )}
          </svg>

          <ul
            className="flex min-w-0 flex-1 flex-col"
            style={{ gap: "clamp(8px, 0.83vw, 12px)", margin: 0, padding: 0, listStyle: "none" }}
          >
            {slices.map((slice, index) => (
              <li
                key={slice.label}
                className="flex min-w-0 items-center"
                style={{
                  gap: 10,
                  fontFamily: "var(--font-base)",
                  fontSize: "clamp(12px, 0.97vw, 15px)",
                }}
                onMouseEnter={() => setHover(index)}
                onMouseLeave={() => setHover(null)}
              >
                <span
                  aria-hidden="true"
                  className="shrink-0 rounded-full"
                  style={{ width: 10, height: 10, background: SERIES[index] }}
                />
                <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-(--color-text-primary)">
                  {slice.label}
                </span>
                <span className="shrink-0 text-(--color-text-secondary)">
                  {formatMoney(String(slice.amount), currency, locale)}
                </span>
                <span
                  className="shrink-0 text-right font-semibold text-(--color-text-primary)"
                  style={{ width: 44 }}
                >
                  {Math.round(slice.share * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </ChartCard>
  );
}
