"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  getModeratorDashboard,
  type ModeratorDashboardData,
  type ModeratorTrend,
} from "@/entities/user";
import type { ApiError } from "@/shared/api/base";
import { PageShell } from "@/shared/ui/PageShell";
import { formatDate } from "@/shared/lib/time";
import { ModeratorMetricGrid } from "./ModeratorMetrics";

const CATEGORY_LABEL_KEYS: Record<string, string> = {
  user_reports: "categoryUserReports",
  chat_reports: "categoryChatSafety",
  course_reviews: "categoryCourseReview",
  reported_reviews: "categoryContentQuality",
};

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-xl bg-white shadow-[0_0_17px_rgba(0,0,0,0.16)] ${className}`.trim()}
    >
      {children}
    </section>
  );
}

function ModerationTrendsCard({ rows }: { rows: ModeratorTrend[] }) {
  const t = useTranslations("ModeratorDashboard");
  const locale = useLocale();
  const scale = Math.max(1, ...rows.flatMap((row) => [row.blocked, row.flagged, row.approved]));

  return (
    <Card className="p-5">
      <h2 className="mb-5 text-base font-normal text-(--color-text-primary)">
        {t("moderationTrends")}
      </h2>
      <div className="flex flex-col gap-4">
        {rows.map((row) => (
          <div key={row.date} className="flex items-center gap-3">
            <span className="w-12 shrink-0 text-xs text-(--color-text-secondary)">
              {formatDate(row.date, locale, { month: "short", day: "numeric" })}
            </span>
            <div
              className="flex flex-1 flex-col gap-1.5"
              aria-label={t("reviewedAriaLabel", { count: row.reviewed })}
            >
              <div
                className="h-1 rounded-full bg-[#f87171] transition-[width]"
                style={{ width: `${(row.blocked / scale) * 100}%` }}
              />
              <div
                className="h-1 rounded-full bg-[#facc15] transition-[width]"
                style={{ width: `${(row.flagged / scale) * 100}%` }}
              />
              <div
                className="h-1 rounded-full bg-[#22c55e] transition-[width]"
                style={{ width: `${(row.approved / scale) * 100}%` }}
              />
            </div>
            <span className="w-10 shrink-0 text-right text-xs text-(--color-text-primary)">
              {row.reviewed.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
        {[
          ["bg-[#f87171]", t("blocked")],
          ["bg-[#facc15]", t("flagged")],
          ["bg-[#22c55e]", t("approved")],
        ].map(([color, label]) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${color}`} />
            <span className="text-xs text-(--color-text-secondary)">{label}</span>
          </span>
        ))}
      </div>
    </Card>
  );
}

function ContentByCategoryCard({ data }: { data: ModeratorDashboardData["categories"] }) {
  const t = useTranslations("ModeratorDashboard");
  return (
    <Card className="p-5">
      <h2 className="mb-5 text-base font-normal text-(--color-text-primary)">
        {t("contentByCategory")}
      </h2>
      <div className="flex flex-col gap-5">
        {data.map((item) => (
          <div key={item.key} className="flex items-center gap-3">
            <span className="w-28 shrink-0 text-xs text-(--color-text-primary)">
              {CATEGORY_LABEL_KEYS[item.key] ? t(CATEGORY_LABEL_KEYS[item.key]) : item.label}
            </span>
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#d9d9d9]/30">
              <div
                className="h-full rounded-full bg-(--color-blue) transition-[width]"
                style={{ width: `${item.percent}%` }}
              />
            </div>
            <span className="w-10 shrink-0 text-right text-xs text-(--color-text-secondary)">
              {item.count.toLocaleString()}
            </span>
            <span className="w-9 shrink-0 text-right text-xs text-(--color-text-secondary)">
              {item.percent}%
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/** Live moderator dashboard backed by moderation audit data. */
export function ModeratorDashboard() {
  const t = useTranslations("ModeratorDashboard");
  const tSidebar = useTranslations("AppSidebar");
  const [data, setData] = useState<ModeratorDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await getModeratorDashboard());
    } catch (requestError) {
      setError((requestError as ApiError).message || t("statsLoadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <PageShell className="bg-white">
      <div className="mx-auto flex w-full max-w-[1648px] flex-col gap-6 font-(family-name:--font-base)">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-(--color-text-primary)">
              {tSidebar("dashboard")}
            </h1>
            <p className="mt-1 text-base text-(--color-text-secondary)">{t("subtitle")}</p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-(--color-brand-lavender) bg-white px-4 text-sm text-(--color-text-primary) transition hover:bg-(--color-brand-lavender-soft) disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {t("refresh")}
          </button>
        </header>

        {error ? (
          <div
            role="alert"
            className="flex items-center gap-3 rounded-xl bg-(--color-brand-cream) p-4 text-(--color-pink-dark)"
          >
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {loading && !data ? (
          <div className="flex min-h-72 items-center justify-center text-(--color-blue)">
            <Loader2 className="h-7 w-7 animate-spin" aria-label={t("loadingStatsAriaLabel")} />
          </div>
        ) : null}

        {data ? (
          <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
            <ModeratorMetricGrid metrics={data.metrics} />
            <div className="mt-6 grid gap-5 xl:grid-cols-2">
              <ModerationTrendsCard rows={data.trends} />
              <ContentByCategoryCard data={data.categories} />
            </div>
          </div>
        ) : null}
      </div>
    </PageShell>
  );
}
