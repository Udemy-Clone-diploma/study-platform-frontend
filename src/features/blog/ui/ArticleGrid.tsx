"use client";

import { useState } from "react";
import type { ArticleListItem } from "@/entities/blog";
import type { UserRole } from "@/entities/user";
import { ArticleRow } from "./ArticleRow";
import { ArticleDetailPanel } from "./ArticleDetailPanel";
import type { ArticleMenuAction } from "./ArticleCardMenu";

type Props = {
  articles: ArticleListItem[];
  emptyLabel: string;
  currentUserId?: number | null;
  currentUserRole?: UserRole | null;
  onAction: (action: ArticleMenuAction, article: ArticleListItem) => void;
};

/** Master-detail view for dashboard tabs (My Articles / moderation queues): the article list
 * sits in its own white card (same shell as the Reports page), and — same layout as
 * TeacherApplicationsAdminView — a glass detail panel floats outside that card, directly on the
 * page's lavender background, when a row is selected. */
export function ArticleGrid({
  articles,
  emptyLabel,
  currentUserId,
  currentUserRole,
  onAction,
}: Props) {
  const [selected, setSelected] = useState<ArticleListItem | null>(null);

  const selectedArticle = selected ? (articles.find((a) => a.id === selected.id) ?? null) : null;

  return (
    <div className="flex flex-wrap items-start" style={{ gap: "clamp(16px, 1.67vw, 24px)" }}>
      <section
        className="min-h-[520px] rounded-[20px] bg-white p-4 shadow-(--shadow-dashboard-card) sm:p-6"
        style={{ flex: "1 1 480px" }}
      >
        {articles.length === 0 ? (
          <p className="mt-16 text-center text-lg text-(--color-text-secondary)">{emptyLabel}</p>
        ) : (
          <div className="flex flex-col" style={{ gap: "clamp(8px, 1.11vw, 16px)" }}>
            {articles.map((article) => (
              <ArticleRow
                key={article.id}
                article={article}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
                isSelected={selectedArticle?.id === article.id}
                onSelect={setSelected}
              />
            ))}
          </div>
        )}
      </section>

      {selectedArticle && (
        <ArticleDetailPanel
          article={selectedArticle}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          onClose={() => setSelected(null)}
          onAction={(action, article) => {
            onAction(action, article);
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}
