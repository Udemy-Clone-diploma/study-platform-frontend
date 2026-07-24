"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { PageShell } from "@/shared/ui/PageShell";
import { GradientButton } from "@/shared/ui/GradientButton";
import { Pagination } from "@/shared/ui/Pagination";
import { useAutoRefresh } from "@/shared/lib/useAutoRefresh";
import { getArticles, getBlogCategories } from "@/entities/blog";
import type { ArticleListItem, ArticleStatus, BlogCategory } from "@/entities/blog";
import { ArticleActionModals, ArticleCard, useArticleActions } from "@/features/blog";

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

const PAGE_SIZE = 12;

export default function TeacherBlogPage() {
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("All");
  const [page, setPage] = useState(1);

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const effectivePage = Math.min(page, totalPages);
  const pageArticles = filtered.slice((effectivePage - 1) * PAGE_SIZE, effectivePage * PAGE_SIZE);

  return (
    <PageShell className="bg-my-courses">
      <div style={{ maxWidth: "1648px", margin: "0 auto" }}>
        <div
          className="flex flex-wrap items-center justify-between"
          style={{ marginBottom: "clamp(16px, 2.22vw, 32px)", gap: "clamp(12px, 1.11vw, 16px)" }}
        >
          <nav aria-label="Article filter" className="flex flex-wrap items-center" style={{ gap: "clamp(16px, 1.67vw, 40px)" }}>
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setPage(1);
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

          <GradientButton href="/blog/create" style={{ gap: 8 }}>
            <Plus size={16} /> Add Article
          </GradientButton>
        </div>

        {loading ? (
          <p className="mt-16 text-center text-lg text-(--color-text-secondary)">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="mt-16 text-center text-lg text-(--color-text-secondary)">{EMPTY_LABEL[activeTab]}</p>
        ) : (
          <>
            <div className="flex flex-wrap" style={{ gap: "1.04vw" }}>
              {pageArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  currentUserId={articles[0]?.author.id ?? null}
                  currentUserRole="teacher"
                  onAction={actions.handleAction}
                />
              ))}
            </div>
            {totalPages > 1 && (
              <div style={{ marginTop: "clamp(16px, 1.67vw, 24px)" }}>
                <Pagination currentPage={effectivePage} totalPages={totalPages} onPageChange={setPage} />
              </div>
            )}
          </>
        )}
      </div>

      <ArticleActionModals categories={categories} state={actions} />
    </PageShell>
  );
}
