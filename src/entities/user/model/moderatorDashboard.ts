import type { ModeratorProfile } from "./profiles";
import type { UserData } from "./types";

export type ModeratorMetricUnit = "count" | "percent" | "hours";
export type ModeratorMetricChangeKind = "percent" | "percentage_points" | null;

export type ModeratorMetric = {
  value: number | null;
  unit: ModeratorMetricUnit;
  change: number | null;
  change_kind: ModeratorMetricChangeKind;
};

export type ModeratorTrend = {
  date: string;
  label: string;
  reviewed: number;
  blocked: number;
  flagged: number;
  approved: number;
};

export type ModeratorCategory = {
  key: string;
  label: string;
  count: number;
  percent: number;
};

export type ModeratorDashboardData = {
  moderator: UserData<ModeratorProfile>;
  period: {
    days: number;
    start: string;
    end: string;
  };
  metrics: {
    total_reviewed: ModeratorMetric;
    harmful_content_blocked: ModeratorMetric;
    pending_reviews: ModeratorMetric;
    reversal_rate: ModeratorMetric;
    average_review_time: ModeratorMetric;
  };
  trends: ModeratorTrend[];
  categories: ModeratorCategory[];
};
