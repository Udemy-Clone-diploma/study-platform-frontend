"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { PageShell } from "@/shared/ui/PageShell";
import { Pagination } from "@/shared/ui/Pagination";
import { ConfirmActionModal } from "@/shared/ui/ConfirmActionModal";
import { deleteCategory, getCategoriesPage, updateCategory } from "@/entities/course";
import type { Category } from "@/entities/course";
import type { ApiError } from "@/shared/api/base";
import { CategoriesToolbar } from "./CategoriesToolbar";
import { CategoriesTable } from "./CategoriesTable";
import { CategoryFormModal } from "./CategoryFormModal";

const PAGE_SIZE = 10;

export function CategoriesAdminView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const pageParam = Number(searchParams.get("page"));
  const page = Number.isInteger(pageParam) && pageParam > 1 ? pageParam : 1;
  const search = searchParams.get("search") ?? "";
  const ordering = searchParams.get("ordering") ?? "name_en";

  const [categories, setCategories] = useState<Category[]>([]);
  const [count, setCount] = useState(0);
  const [listError, setListError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  const queryKey = [page, search, ordering, refreshKey].join("|");
  const loading = loadedKey !== queryKey;

  const [creating, setCreating] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [featuredSavingId, setFeaturedSavingId] = useState<number | null>(null);
  const [featuredError, setFeaturedError] = useState<string | null>(null);

  const updateParams = useCallback(
    (updates: Record<string, string | null>, options?: { scroll?: boolean }) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") params.delete(key);
        else params.set(key, value);
      }
      router.push(params.toString() ? `?${params.toString()}` : "/admin/categories", {
        scroll: options?.scroll ?? false,
      });
    },
    [router, searchParams],
  );

  useEffect(() => {
    let cancelled = false;
    getCategoriesPage({ page, page_size: PAGE_SIZE, search: search || undefined, ordering })
      .then((data) => {
        if (cancelled) return;
        setCategories(data.results);
        setCount(data.count);
        setListError(null);
        setLoadedKey(queryKey);
      })
      .catch((err) => {
        if (cancelled) return;
        const apiError = err as ApiError;
        if (apiError.status === 404 && page > 1) {
          updateParams({ page: null });
          return;
        }
        setCategories([]);
        setCount(0);
        setListError(apiError.message ?? "Failed to load categories.");
        setLoadedKey(queryKey);
      });
    return () => {
      cancelled = true;
    };
  }, [page, search, ordering, queryKey, updateParams]);

  const refresh = useCallback(() => setRefreshKey((key) => key + 1), []);

  const handleSearchChange = useCallback(
    (value: string) => {
      updateParams({ search: value || null, page: null });
    },
    [updateParams],
  );

  async function handleFeaturedChange(category: Category, order: number | null) {
    setFeaturedSavingId(category.id);
    setFeaturedError(null);
    try {
      const updated = await updateCategory(category.id, { featured_order: order });
      setCategories((prev) =>
        prev.map((c) => (c.id === updated.id ? { ...c, featured_order: updated.featured_order } : c)),
      );
    } catch (err) {
      setFeaturedError((err as ApiError).message ?? "Failed to update the featured order.");
    } finally {
      setFeaturedSavingId(null);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await deleteCategory(deleteTarget.id);
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      setDeleteError((err as ApiError).message ?? "Something went wrong.");
    } finally {
      setDeleteLoading(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const emptyMessage = loading ? "Loading categories…" : "No categories found.";

  const deleteDescription = deleteTarget
    ? deleteTarget.courses_count
      ? `Delete ${deleteTarget.name}? It is still assigned to ${deleteTarget.courses_count} ${
          deleteTarget.courses_count === 1 ? "course" : "courses"
        }, so deletion may be rejected until they are moved to another category.`
      : `Delete ${deleteTarget.name}? This cannot be undone.`
    : "";

  return (
    <PageShell className="bg-(--color-brand-lavender-soft)">
      <div className="flex w-full flex-col" style={{ maxWidth: 1648, margin: "0 auto" }}>
        <h1
          className="font-semibold text-(--color-text-primary)"
          style={{
            fontFamily: "var(--font-base)",
            fontSize: "clamp(24px, 2.5vw, 36px)",
            margin: "0 0 clamp(16px, 1.67vw, 24px)",
          }}
        >
          Categories
        </h1>

        <div style={{ marginBottom: "clamp(16px, 1.67vw, 24px)" }}>
          <CategoriesToolbar
            search={search}
            onSearchChange={handleSearchChange}
            onRefresh={refresh}
            refreshing={loading}
            onAdd={() => setCreating(true)}
          />
        </div>

        {(listError ?? featuredError) && (
          <p
            className="text-(--color-danger)"
            style={{
              fontFamily: "var(--font-base)",
              fontSize: "clamp(12px, 0.97vw, 14px)",
              margin: "0 0 8px",
            }}
          >
            {listError ?? featuredError}
          </p>
        )}

        <div
          key={refreshKey}
          className={`animate-[table-refresh_400ms_ease-out] transition-opacity ${loading ? "opacity-60" : ""}`}
        >
          <CategoriesTable
            categories={categories}
            emptyMessage={emptyMessage}
            featuredSavingId={featuredSavingId}
            onFeaturedChange={handleFeaturedChange}
            onEdit={setEditCategory}
            onDelete={(category) => {
              setDeleteError(null);
              setDeleteTarget(category);
            }}
            currentSort={ordering}
            onSortChange={(next) => updateParams({ ordering: next === "name_en" ? null : next })}
          />
        </div>

        {totalPages > 1 && (
          <div style={{ marginTop: "clamp(16px, 1.67vw, 24px)" }}>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(next) =>
                updateParams({ page: next > 1 ? String(next) : null }, { scroll: true })
              }
            />
          </div>
        )}
      </div>

      {creating && (
        <CategoryFormModal
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            refresh();
          }}
        />
      )}

      {editCategory && (
        <CategoryFormModal
          category={editCategory}
          onClose={() => setEditCategory(null)}
          onSaved={() => {
            setEditCategory(null);
            refresh();
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmActionModal
          title="Delete category"
          description={deleteDescription}
          confirmLabel="Delete"
          loading={deleteLoading}
          error={deleteError}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </PageShell>
  );
}
