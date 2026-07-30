import type { ArticleStatus } from "@/entities/blog";

/** Shared label mapping for article statuses, used by every row badge/detail panel/filter chip
 * across the blog moderation UI. Pass `useTranslations("ArticleStatus")` as `t`. */
export function getArticleStatusLabels(t: (key: string) => string): Record<ArticleStatus, string> {
  return {
    draft: t("draft"),
    review: t("review"),
    rejected: t("rejected"),
    published: t("published"),
    archived: t("archived"),
  };
}

export const ARTICLE_STATUS_COLORS: Record<ArticleStatus, string> = {
  draft: "var(--color-text-secondary)",
  review: "var(--color-warning)",
  rejected: "var(--color-rejected)",
  published: "var(--color-success)",
  archived: "var(--color-text-secondary)",
};
