"use client";

import type { ArticleListItem } from "@/entities/blog";
import type { UserRole } from "@/entities/user";
import { ArticleRow } from "./ArticleRow";
import type { ArticleMenuAction } from "./ArticleCardMenu";

type Props = {
  articles: ArticleListItem[];
  emptyLabel: string;
  currentUserId?: number | null;
  currentUserRole?: UserRole | null;
  onAction: (action: ArticleMenuAction, article: ArticleListItem) => void;
};

/** Stacked list of horizontal article rows for dashboard tabs (My Articles / moderation queues). */
export function ArticleGrid({ articles, emptyLabel, currentUserId, currentUserRole, onAction }: Props) {
  if (articles.length === 0) {
    return <p className="mt-16 text-center text-lg text-(--color-text-secondary)">{emptyLabel}</p>;
  }

  return (
    <div className="flex flex-col" style={{ gap: "clamp(8px, 1.11vw, 16px)" }}>
      {articles.map((article) => (
        <ArticleRow
          key={article.id}
          article={article}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          onAction={onAction}
        />
      ))}
    </div>
  );
}
