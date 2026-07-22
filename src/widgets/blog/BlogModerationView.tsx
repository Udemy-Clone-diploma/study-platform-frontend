"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { PageShell } from "@/shared/ui/PageShell";
import { AccentButton } from "@/shared/ui/AccentButton";
import { useAutoRefresh } from "@/shared/lib/useAutoRefresh";
import { getArticles, getBlogCategories } from "@/entities/blog";
import type { ArticleListItem, BlogCategory, GetArticlesParams } from "@/entities/blog";
import type { UserRole } from "@/entities/user";
import { ArticleActionModals, ArticleGrid, useArticleActions } from "@/features/blog";
import { BlogCategoriesPanel } from "./BlogCategoriesPanel";

const ARTICLE_TABS = ["Unassigned", "My Assigned", "Rejected", "Published", "My Articles"] as const;
const TABS = [...ARTICLE_TABS, "Categories"] as const;
type ArticleTab = (typeof ARTICLE_TABS)[number];
type Tab = (typeof TABS)[number];

function isArticleTab(tab: Tab): tab is ArticleTab {
  return (ARTICLE_TABS as readonly string[]).includes(tab);
}

function paramsForTab(tab: ArticleTab): GetArticlesParams {
  switch (tab) {
    case "Unassigned":
      return { assigned: "unassigned" };
    case "My Assigned":
      return { assigned: "mine" };
    case "Rejected":
      return { status: "rejected" };
    case "Published":
      return { status: "published" };
    case "My Articles":
      return { mine: true };
  }
}

const EMPTY_LABEL: Record<ArticleTab, string> = {
  Unassigned: "No articles waiting for a moderator.",
  "My Assigned": "You have no articles assigned for review.",
  Rejected: "No rejected articles.",
  Published: "No published articles.",
  "My Articles": "You haven't written any articles yet.",
};

type Props = { role: Extract<UserRole, "moderator" | "administrator"> };

/** Shared blog moderation dashboard — used by both /moderator-dashboard/blog and /admin/blog. */
export function BlogModerationView({ role }: Props) {
  const visibleTabs = role === "administrator" ? TABS : ARTICLE_TABS;
  const [activeTab, setActiveTab] = useState<Tab>("Unassigned");
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const refresh = useCallback(() => {
    if (!isArticleTab(activeTab)) return;
    getArticles(paramsForTab(activeTab)).then(setArticles).catch(() => {});
  }, [activeTab]);

  const actions = useArticleActions(refresh);

  useAutoRefresh(refresh);

  useEffect(() => {
    if (!isArticleTab(activeTab)) return;
    Promise.all([getArticles(paramsForTab(activeTab)), getBlogCategories()])
      .then(([articleList, categoryList]) => {
        setArticles(articleList);
        setCategories(categoryList);
        if (activeTab === "My Articles" && articleList[0]) setCurrentUserId(articleList[0].author.id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeTab]);

  return (
    <PageShell className="bg-(--color-brand-lavender-soft)">
      <div style={{ maxWidth: "1648px", margin: "0 auto" }}>
        <div
          className="flex flex-wrap items-center justify-between"
          style={{ marginBottom: "clamp(16px, 2.22vw, 32px)", gap: "clamp(12px, 1.11vw, 16px)" }}
        >
          <nav aria-label="Article filter" className="flex flex-wrap items-center" style={{ gap: "clamp(16px, 1.67vw, 40px)" }}>
            {visibleTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setLoading(isArticleTab(tab));
                  setActiveTab(tab);
                }}
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

          {activeTab === "My Articles" && (
            <AccentButton href="/blog/create" size="md" style={{ minWidth: "unset", gap: 8, display: "inline-flex", alignItems: "center" }}>
              <Plus size={16} /> Add Article
            </AccentButton>
          )}
        </div>

        <section className="min-h-[520px] rounded-[20px] bg-white p-4 shadow-(--shadow-dashboard-card) sm:p-6">
          {activeTab === "Categories" ? (
            <BlogCategoriesPanel />
          ) : loading ? (
            <p className="mt-16 text-center text-lg text-(--color-text-secondary)">Loading...</p>
          ) : (
            <ArticleGrid
              articles={articles}
              emptyLabel={EMPTY_LABEL[activeTab]}
              currentUserId={activeTab === "My Articles" ? currentUserId : null}
              currentUserRole={role}
              onAction={actions.handleAction}
            />
          )}
        </section>
      </div>

      <ArticleActionModals categories={categories} state={actions} />
    </PageShell>
  );
}
