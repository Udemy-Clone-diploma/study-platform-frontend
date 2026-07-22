"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AccentButton } from "@/shared/ui/AccentButton";
import { ConfirmActionModal } from "@/shared/ui/ConfirmActionModal";
import {
  createBlogCategory,
  deleteBlogCategory,
  getBlogCategories,
  updateBlogCategory,
} from "@/entities/blog";
import type { BlogCategory } from "@/entities/blog";
import type { ApiError } from "@/shared/api/base";
import { BlogCategoryFormModal } from "@/features/blog";

/** Administrator-only panel for managing the category blocks shown on /blog. */
export function BlogCategoriesPanel() {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState<"add" | BlogCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BlogCategory | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function refresh() {
    getBlogCategories().then(setCategories).catch(() => {});
  }

  useEffect(() => {
    refresh();
    setLoading(false);
  }, []);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await deleteBlogCategory(deleteTarget.slug);
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      setDeleteError((err as ApiError).message ?? "Failed to delete the category.");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: "var(--font-base)", fontWeight: 600, fontSize: 20, color: "var(--color-text-primary)", margin: 0 }}>
          Blog Categories
        </h2>
        <AccentButton size="md" onClick={() => setFormOpen("add")} style={{ minWidth: "unset", gap: 8, display: "inline-flex", alignItems: "center" }}>
          <Plus size={16} /> Add Category
        </AccentButton>
      </div>

      {loading ? (
        <p className="text-center text-lg text-(--color-text-secondary)">Loading...</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between"
              style={{ padding: "14px 18px", background: "var(--color-input-bg)", borderRadius: 12, gap: 12 }}
            >
              <div style={{ minWidth: 0 }}>
                <p style={{ fontFamily: "var(--font-base)", fontWeight: 600, fontSize: 15, color: "var(--color-text-primary)", margin: 0 }}>
                  {cat.name}
                </p>
                {cat.description && (
                  <p style={{ fontFamily: "var(--font-base)", fontSize: 13, color: "var(--color-text-secondary)", margin: "2px 0 0 0" }}>
                    {cat.description}
                  </p>
                )}
              </div>
              <div className="flex items-center shrink-0" style={{ gap: 4 }}>
                <button
                  type="button"
                  onClick={() => setFormOpen(cat)}
                  aria-label="Edit category"
                  className="flex items-center justify-center rounded-full transition hover:bg-white"
                  style={{ width: 32, height: 32, border: "none", background: "transparent", cursor: "pointer" }}
                >
                  <Pencil size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(cat)}
                  aria-label="Delete category"
                  className="flex items-center justify-center rounded-full transition hover:bg-red-50"
                  style={{ width: 32, height: 32, border: "none", background: "transparent", cursor: "pointer" }}
                >
                  <Trash2 size={15} style={{ color: "var(--color-danger)" }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <BlogCategoryFormModal
          category={formOpen === "add" ? undefined : formOpen}
          onClose={() => setFormOpen(null)}
          onSave={async (values) => {
            if (formOpen === "add") await createBlogCategory(values);
            else await updateBlogCategory(formOpen.slug, values);
            setFormOpen(null);
            refresh();
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmActionModal
          title="Delete Category"
          description={`Delete "${deleteTarget.name}"? Articles using it will need to be reassigned first.`}
          confirmLabel="Delete"
          loading={deleteLoading}
          error={deleteError}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
