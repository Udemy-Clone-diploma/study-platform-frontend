"use client";

import { useTranslations } from "next-intl";
import type { BlogCategory } from "@/entities/blog";
import { BlogCategoriesTable } from "@/features/blog";

type Props = {
  categories: BlogCategory[];
  loading: boolean;
  onEdit: (category: BlogCategory) => void;
  onDelete: (category: BlogCategory) => void;
};

/** Administrator-only category table for /admin/blog's Categories tab — the heading and Add
 * button live in the parent's top nav row (BlogModerationView), matching the "My Publications"
 * tab's layout; this just renders the DataTable card list a little below it. */
export function BlogCategoriesPanel({ categories, loading, onEdit, onDelete }: Props) {
  const t = useTranslations("BlogCategoriesPanel");
  return (
    <div style={{ marginTop: "clamp(8px, 0.83vw, 12px)" }}>
      <BlogCategoriesTable
        categories={categories}
        emptyMessage={loading ? t("loadingCategories") : t("noCategoriesFound")}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
}
