"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { PageShell } from "@/shared/ui/PageShell";
import { GradientButton } from "@/shared/ui/GradientButton";
import { Pagination } from "@/shared/ui/Pagination";
import { useAutoRefresh } from "@/shared/lib/useAutoRefresh";
import {
  createBlogCategory,
  deleteBlogCategory,
  getArticles,
  getBlogCategories,
  getModerationSnapshots,
  updateBlogCategory,
} from "@/entities/blog";
import type {
  ArticleListItem,
  ArticleModerationSnapshot,
  BlogCategory,
  BlogCategoryDeleteResolution,
  GetArticlesParams,
} from "@/entities/blog";
import type { UserRole } from "@/entities/user";
import {
  ArticleActionModals,
  ArticleGrid,
  ArticleModerationSnapshotList,
  BlogCategoryDeleteModal,
  BlogCategoryFormModal,
  useArticleActions,
} from "@/features/blog";
import type { ApiError } from "@/shared/api/base";
import { BlogCategoriesPanel } from "./BlogCategoriesPanel";

type Mode = "mine" | "review" | "categories";
type ReviewFilter = "unassigned" | "mine" | "rejected" | "published";
// Moderators/admins publish their own articles directly (see publish_own_article) --
// their own posts never sit in "review" or "rejected", so those chips are meaningless here.
type MyFilter = "all" | "draft" | "published" | "archived";

const REVIEW_FILTERS: { value: ReviewFilter; label: string }[] = [
  { value: "unassigned", label: "Unassigned" },
  { value: "mine", label: "Assigned to Me" },
  { value: "rejected", label: "Rejected" },
  { value: "published", label: "Published" },
];

const MY_FILTERS: { value: MyFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const REVIEW_EMPTY_LABEL: Record<ReviewFilter, string> = {
  unassigned: "No articles waiting for a moderator.",
  mine: "You have no articles assigned for review.",
  rejected: "No rejected articles.",
  published: "No published articles.",
};

const MY_EMPTY_LABEL: Record<MyFilter, string> = {
  all: "You haven't written any articles yet.",
  draft: "You have no draft articles.",
  published: "You have no published articles.",
  archived: "You have no archived articles.",
};

function modeTabs(role: Extract<UserRole, "moderator" | "administrator">): { value: Mode; label: string }[] {
  const tabs: { value: Mode; label: string }[] = [{ value: "mine", label: "My Publications" }];
  if (role === "moderator") tabs.push({ value: "review", label: "On Review" });
  if (role === "administrator") tabs.push({ value: "categories", label: "Categories" });
  return tabs;
}

/** Only covers the live-queue review filters (unassigned/mine) -- "rejected"/"published"
 * are permanent decision snapshots now, fetched separately via getModerationSnapshots. */
function paramsForMode(mode: Mode, reviewFilter: ReviewFilter, myFilter: MyFilter): GetArticlesParams | null {
  if (mode === "mine") return myFilter === "all" ? { mine: true } : { mine: true, status: myFilter };
  if (mode === "review") {
    if (reviewFilter === "unassigned") return { assigned: "unassigned" };
    if (reviewFilter === "mine") return { assigned: "mine" };
    return null;
  }
  return null;
}

function isSnapshotFilter(mode: Mode, reviewFilter: ReviewFilter): reviewFilter is "rejected" | "published" {
  return mode === "review" && (reviewFilter === "rejected" || reviewFilter === "published");
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`flex h-10 shrink-0 items-center rounded-full px-4 font-medium whitespace-nowrap transition-colors ${
        active
          ? "bg-(--color-catalog-category-active) text-(--color-blue)"
          : "bg-white text-(--color-text-primary) hover:bg-(--color-bg-surface)"
      }`}
      style={{ fontSize: "clamp(13px, 1.11vw, 18px)" }}
    >
      {label}
    </button>
  );
}

const PAGE_SIZE = 6;

type Props = { role: Extract<UserRole, "moderator" | "administrator"> };

/** Shared blog moderation dashboard — used by both /moderator-dashboard/blog and /admin/blog.
 * Two-way switch: "My Publications" (this staff member's own articles, with an Add Article
 * button + a status chip row) vs "On Review" (the shared moderation queue, filtered via its
 * own chip row instead). "On Review" is moderator-only: administrators structurally can't have
 * a ModeratorProfile (see ModeratorProfile.clean()), so self-assign/approve/reject would always
 * fail for them -- admins get Categories in that slot instead. */
export function BlogModerationView({ role }: Props) {
  const [mode, setMode] = useState<Mode>("mine");
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("unassigned");
  const [myFilter, setMyFilter] = useState<MyFilter>("all");
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [snapshots, setSnapshots] = useState<ArticleModerationSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoryFormOpen, setCategoryFormOpen] = useState<"add" | BlogCategory | null>(null);
  const [categoryDeleteTarget, setCategoryDeleteTarget] = useState<BlogCategory | null>(null);
  const [categoryDeleteLoading, setCategoryDeleteLoading] = useState(false);
  const [categoryDeleteError, setCategoryDeleteError] = useState<string | null>(null);

  const refreshCategories = useCallback(() => {
    getBlogCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    refreshCategories();
    setCategoriesLoading(false);
  }, [refreshCategories]);

  const refresh = useCallback(() => {
    if (isSnapshotFilter(mode, reviewFilter)) {
      getModerationSnapshots(reviewFilter).then(setSnapshots).catch(() => {});
      return;
    }
    const params = paramsForMode(mode, reviewFilter, myFilter);
    if (!params) return;
    getArticles(params).then(setArticles).catch(() => {});
  }, [mode, reviewFilter, myFilter]);

  const actions = useArticleActions(refresh);

  useAutoRefresh(refresh);

  useEffect(() => {
    if (isSnapshotFilter(mode, reviewFilter)) {
      getModerationSnapshots(reviewFilter)
        .then(setSnapshots)
        .catch(() => {})
        .finally(() => setLoading(false));
      return;
    }
    const params = paramsForMode(mode, reviewFilter, myFilter);
    if (!params) return;
    getArticles(params)
      .then((articleList) => {
        setArticles(articleList);
        if (mode === "mine" && articleList[0]) setCurrentUserId(articleList[0].author.id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [mode, reviewFilter, myFilter]);

  function changeMode(value: Mode) {
    setLoading(true);
    setPage(1);
    setMode(value);
  }

  async function handleCategoryDelete(resolution?: BlogCategoryDeleteResolution) {
    if (!categoryDeleteTarget) return;
    setCategoryDeleteLoading(true);
    setCategoryDeleteError(null);
    try {
      await deleteBlogCategory(categoryDeleteTarget.slug, resolution);
      setCategoryDeleteTarget(null);
      refreshCategories();
    } catch (err) {
      setCategoryDeleteError((err as ApiError).message ?? "Failed to delete the category.");
    } finally {
      setCategoryDeleteLoading(false);
    }
  }

  const showingSnapshots = isSnapshotFilter(mode, reviewFilter);
  const itemCount = showingSnapshots ? snapshots.length : articles.length;
  const totalPages = Math.max(1, Math.ceil(itemCount / PAGE_SIZE));
  const effectivePage = Math.min(page, totalPages);
  const pageArticles = articles.slice((effectivePage - 1) * PAGE_SIZE, effectivePage * PAGE_SIZE);
  const pageSnapshots = snapshots.slice((effectivePage - 1) * PAGE_SIZE, effectivePage * PAGE_SIZE);

  return (
    <PageShell className="bg-(--color-brand-lavender-soft)">
      <div style={{ maxWidth: "1648px", margin: "0 auto" }}>
        <div
          className="flex flex-wrap items-center justify-between"
          style={{ marginBottom: "clamp(12px, 1.11vw, 16px)", gap: "clamp(12px, 1.11vw, 16px)" }}
        >
          <nav aria-label="Blog dashboard mode" className="flex flex-wrap items-center" style={{ gap: "clamp(16px, 1.67vw, 40px)" }}>
            {modeTabs(role).map(({ value, label }) => (
              <button
                key={value}
                onClick={() => changeMode(value)}
                aria-current={mode === value ? "page" : undefined}
                className={[
                  "font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-blue)",
                  mode === value
                    ? "text-(--color-text-primary) underline underline-offset-4"
                    : "text-(--color-text-secondary) hover:text-(--color-text-primary)",
                ].join(" ")}
                style={{ fontSize: "clamp(14px, 1.39vw, 24px)" }}
              >
                {label}
              </button>
            ))}
          </nav>

          {mode === "mine" && (
            <GradientButton href="/blog/create">
              Add Article
              <Image
                src="/icons/add.svg"
                alt=""
                width={14}
                height={14}
                style={{ width: "clamp(18px, 1.94vw, 28px)", height: "clamp(18px, 1.94vw, 28px)" }}
              />
            </GradientButton>
          )}

          {mode === "categories" && (
            <GradientButton onClick={() => setCategoryFormOpen("add")}>
              Add Category
              <Image
                src="/icons/add.svg"
                alt=""
                width={14}
                height={14}
                style={{ width: "clamp(18px, 1.94vw, 28px)", height: "clamp(18px, 1.94vw, 28px)" }}
              />
            </GradientButton>
          )}
        </div>

        {mode !== "categories" && (
          <nav
            aria-label={mode === "mine" ? "Filter my publications" : "Filter review queue"}
            className="flex flex-wrap items-center gap-3"
            style={{ marginBottom: "clamp(16px, 2.22vw, 32px)" }}
          >
            {(mode === "mine" ? MY_FILTERS : REVIEW_FILTERS).map((filter) => (
              <FilterChip
                key={filter.value}
                label={filter.label}
                active={mode === "mine" ? myFilter === filter.value : reviewFilter === filter.value}
                onClick={() => {
                  setLoading(true);
                  setPage(1);
                  if (mode === "mine") setMyFilter(filter.value as MyFilter);
                  else setReviewFilter(filter.value as ReviewFilter);
                }}
              />
            ))}
          </nav>
        )}

        {mode === "categories" ? (
          <BlogCategoriesPanel
            categories={categories}
            loading={categoriesLoading}
            onEdit={setCategoryFormOpen}
            onDelete={(category) => {
              setCategoryDeleteError(null);
              setCategoryDeleteTarget(category);
            }}
          />
        ) : loading ? (
          <section className="min-h-[520px] rounded-[20px] bg-white p-4 shadow-(--shadow-dashboard-card) sm:p-6">
            <p className="mt-16 text-center text-lg text-(--color-text-secondary)">Loading...</p>
          </section>
        ) : (
          <>
            {showingSnapshots ? (
              <ArticleModerationSnapshotList
                snapshots={pageSnapshots}
                emptyLabel={REVIEW_EMPTY_LABEL[reviewFilter]}
              />
            ) : (
              <ArticleGrid
                articles={pageArticles}
                emptyLabel={mode === "mine" ? MY_EMPTY_LABEL[myFilter] : REVIEW_EMPTY_LABEL[reviewFilter]}
                currentUserId={mode === "mine" ? currentUserId : null}
                currentUserRole={role}
                onAction={actions.handleAction}
              />
            )}
            {totalPages > 1 && (
              <div style={{ marginTop: "clamp(16px, 1.67vw, 24px)" }}>
                <Pagination currentPage={effectivePage} totalPages={totalPages} onPageChange={setPage} />
              </div>
            )}
          </>
        )}
      </div>

      <ArticleActionModals categories={categories} state={actions} />

      {categoryFormOpen && (
        <BlogCategoryFormModal
          category={categoryFormOpen === "add" ? undefined : categoryFormOpen}
          onClose={() => setCategoryFormOpen(null)}
          onSave={async (values) => {
            if (categoryFormOpen === "add") await createBlogCategory(values);
            else await updateBlogCategory(categoryFormOpen.slug, values);
            setCategoryFormOpen(null);
            refreshCategories();
          }}
        />
      )}

      {categoryDeleteTarget && (
        <BlogCategoryDeleteModal
          category={categoryDeleteTarget}
          otherCategories={categories.filter((c) => c.id !== categoryDeleteTarget.id)}
          loading={categoryDeleteLoading}
          error={categoryDeleteError}
          onConfirm={handleCategoryDelete}
          onCancel={() => setCategoryDeleteTarget(null)}
        />
      )}
    </PageShell>
  );
}
