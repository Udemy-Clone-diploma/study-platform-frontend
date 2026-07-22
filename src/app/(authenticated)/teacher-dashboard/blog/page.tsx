"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { PageShell } from "@/shared/ui/PageShell";
import { AccentButton } from "@/shared/ui/AccentButton";
import { useAutoRefresh } from "@/shared/lib/useAutoRefresh";
import { getArticles, getBlogCategories } from "@/entities/blog";
import type { ArticleListItem, ArticleStatus, BlogCategory } from "@/entities/blog";
import { ArticleActionModals, ArticleGrid, useArticleActions } from "@/features/blog";

const TABS = ["All", "Draft", "Under Review", "Rejected", "Published", "Archived"] as const;
type Tab = (typeof TABS)[number];

const TAB_STATUS: Partial<Record<Tab, ArticleStatus>> = {
  Draft: "draft",
  "Under Review": "review",
  Rejected: "rejected",
  Published: "published",
  Archived: "archived",
};

const EMPTY_LABEL: Record<Tab, string> = {
  All: "You haven't written any articles yet.",
  Draft: "No drafts.",
  "Under Review": "Nothing is currently under review.",
  Rejected: "No rejected articles.",
  Published: "No published articles yet.",
  Archived: "No archived articles.",
};

export default function TeacherBlogPage() {
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("All");

  const refresh = useCallback(() => {
    getArticles({ mine: true }).then(setArticles).catch(() => {});
  }, []);

  const actions = useArticleActions(refresh);

  useAutoRefresh(refresh);

  useEffect(() => {
    Promise.all([getArticles({ mine: true }), getBlogCategories()])
      .then(([articleList, categoryList]) => {
        setArticles(articleList);
        setCategories(categoryList);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = articles.filter((a) => {
    const status = TAB_STATUS[activeTab];
    return !status || a.status === status;
  });

  return (
    <PageShell className="bg-(--color-brand-lavender-soft)">
      <div style={{ maxWidth: "1648px", margin: "0 auto" }}>
        <div
          className="flex flex-wrap items-center justify-between"
          style={{ marginBottom: "clamp(16px, 2.22vw, 32px)", gap: "clamp(12px, 1.11vw, 16px)" }}
        >
          <nav aria-label="Article filter" className="flex flex-wrap items-center" style={{ gap: "clamp(16px, 1.67vw, 40px)" }}>
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                aria-current={activeTab === tab ? "page" : undefined}
                className={[
                  "font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-blue)",
                  activeTab === tab
                    ? "text-(--color-text-primary) underline underline-offset-4"
                    : "text-(--color-text-secondary) hover:text-(--color-text-primary)",
                ].join(" ")}
                style={{ fontSize: "clamp(14px, 1.39vw, 24px)" }}
              >
                {tab}
              </button>
            ))}
          </nav>

          <AccentButton href="/blog/create" size="md" style={{ minWidth: "unset", gap: 8, display: "inline-flex", alignItems: "center" }}>
            <Plus size={16} /> Add Article
          </AccentButton>
        </div>

        <section className="min-h-[520px] rounded-[20px] bg-white p-4 shadow-(--shadow-dashboard-card) sm:p-6">
          {loading ? (
            <p className="mt-16 text-center text-lg text-(--color-text-secondary)">Loading...</p>
          ) : (
            <ArticleGrid
              articles={filtered}
              emptyLabel={EMPTY_LABEL[activeTab]}
              currentUserId={articles[0]?.author.id ?? null}
              currentUserRole="teacher"
              onAction={actions.handleAction}
            />
          )}
        </section>
      </div>

      <ArticleActionModals categories={categories} state={actions} />
    </PageShell>
  );
}
