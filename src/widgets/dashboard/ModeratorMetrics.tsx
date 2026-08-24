import { useLocale, useTranslations } from "next-intl";
import type { ModeratorDashboardData, ModeratorMetric } from "@/entities/user";

const METRIC_DEFINITIONS = [
  { key: "total_reviewed", labelKey: "totalContentReviewed" },
  { key: "harmful_content_blocked", labelKey: "harmfulContentBlocked" },
  { key: "pending_reviews", labelKey: "pendingReviews" },
  { key: "reversal_rate", labelKey: "decisionReversalRate" },
  { key: "average_review_time", labelKey: "avgReviewTime" },
] as const;

type Metrics = ModeratorDashboardData["metrics"];

function formatValue(metric: ModeratorMetric, locale: string): string {
  if (metric.value === null) return "—";
  if (metric.unit === "percent") return `${metric.value.toLocaleString(locale)}%`;
  if (metric.unit === "hours") {
    if (metric.value < 1) return `${Math.round(metric.value * 60)}m`;
    return `${metric.value.toLocaleString(locale)}h`;
  }
  return metric.value.toLocaleString(locale);
}

function formatChange(metric: ModeratorMetric, t: (key: string) => string, locale: string): string {
  if (metric.value === null) return t("noTimedReviewsThisWeek");
  if (metric.change === null || metric.change_kind === null) return t("currentWorkload");
  const sign = metric.change > 0 ? "+" : "";
  const suffix = metric.change_kind === "percentage_points" ? t("percentagePointsSuffix") : "%";
  return `${sign}${metric.change.toLocaleString(locale)}${suffix} ${t("vsLastWeek")}`;
}

function MetricCard({
  label,
  metric,
  t,
  locale,
}: {
  label: string;
  metric: ModeratorMetric;
  t: (key: string) => string;
  locale: string;
}) {
  return (
    <article className="flex min-h-36 flex-col rounded-xl bg-white p-5 shadow-[0_0_17px_rgba(0,0,0,0.16)]">
      <h2 className="text-base font-normal text-(--color-text-primary)">{label}</h2>
      <div className="my-3 rounded-lg bg-(image:--gradient-student-stat) px-3 py-2">
        <span className="text-[28px] leading-[35px] font-medium text-(--color-blue)">
          {formatValue(metric, locale)}
        </span>
      </div>
      <p className="mt-auto text-sm text-(--color-text-secondary)">
        {formatChange(metric, t, locale)}
      </p>
    </article>
  );
}

export function ModeratorMetricGrid({ metrics }: { metrics: Metrics }) {
  const t = useTranslations("ModeratorMetrics");
  const locale = useLocale();
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
      {METRIC_DEFINITIONS.map(({ key, labelKey }, index) => (
        <div key={key} className={index < 3 ? "xl:col-span-2" : "xl:col-span-3"}>
          <MetricCard label={t(labelKey)} metric={metrics[key]} t={t} locale={locale} />
        </div>
      ))}
    </div>
  );
}
