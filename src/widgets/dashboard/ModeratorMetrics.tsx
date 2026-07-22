import type { ModeratorDashboardData, ModeratorMetric } from "@/entities/user";

const METRIC_DEFINITIONS = [
  { key: "total_reviewed", label: "Total Content Reviewed" },
  { key: "harmful_content_blocked", label: "Harmful Content Blocked" },
  { key: "pending_reviews", label: "Pending Reviews" },
  { key: "reversal_rate", label: "Decision Reversal Rate" },
  { key: "average_review_time", label: "Avg. Review Time" },
] as const;

type Metrics = ModeratorDashboardData["metrics"];

function formatValue(metric: ModeratorMetric): string {
  if (metric.value === null) return "—";
  if (metric.unit === "percent") return `${metric.value.toLocaleString()}%`;
  if (metric.unit === "hours") {
    if (metric.value < 1) return `${Math.round(metric.value * 60)}m`;
    return `${metric.value.toLocaleString()}h`;
  }
  return metric.value.toLocaleString();
}

function formatChange(metric: ModeratorMetric): string {
  if (metric.value === null) return "No timed reviews this week";
  if (metric.change === null || metric.change_kind === null) return "Current workload";
  const sign = metric.change > 0 ? "+" : "";
  const suffix = metric.change_kind === "percentage_points" ? " pp" : "%";
  return `${sign}${metric.change.toLocaleString()}${suffix} vs last week`;
}

function MetricCard({ label, metric }: { label: string; metric: ModeratorMetric }) {
  return (
    <article className="flex min-h-36 flex-col rounded-xl bg-white p-5 shadow-[0_0_17px_rgba(0,0,0,0.16)]">
      <h2 className="text-base font-normal text-(--color-text-primary)">{label}</h2>
      <div className="my-3 rounded-lg bg-(image:--gradient-student-stat) px-3 py-2">
        <span className="text-[28px] leading-[35px] font-medium text-(--color-blue)">
          {formatValue(metric)}
        </span>
      </div>
      <p className="mt-auto text-sm text-(--color-text-secondary)">{formatChange(metric)}</p>
    </article>
  );
}

export function ModeratorMetricGrid({ metrics }: { metrics: Metrics }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
      {METRIC_DEFINITIONS.map(({ key, label }, index) => (
        <div key={key} className={index < 3 ? "xl:col-span-2" : "xl:col-span-3"}>
          <MetricCard label={label} metric={metrics[key]} />
        </div>
      ))}
    </div>
  );
}
