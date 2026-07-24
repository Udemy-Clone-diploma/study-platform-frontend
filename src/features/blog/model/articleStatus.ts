import type { ArticleStatus } from "@/entities/blog";

/** Shared label/color mapping for article statuses, used by both the row badge and the detail panel. */
export const ARTICLE_STATUS_LABELS: Record<ArticleStatus, string> = {
  draft: "Draft",
  review: "Under Review",
  rejected: "Rejected",
  published: "Published",
  archived: "Archived",
};

export const ARTICLE_STATUS_COLORS: Record<ArticleStatus, string> = {
  draft: "var(--color-text-secondary)",
  review: "var(--color-warning)",
  rejected: "var(--color-rejected)",
  published: "var(--color-success)",
  archived: "var(--color-text-secondary)",
};
