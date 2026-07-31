"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { BlogCategory } from "@/entities/blog";

type Props = {
  categories: BlogCategory[];
  currentSlug: string | undefined;
};

/** Category filter chips for /blog/all — same interaction pattern as the catalog's CategoryFilter, minus search. */
export function BlogCategoryFilterBar({ categories, currentSlug }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("Common");

  function selectCategory(slug: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) params.set("category", slug);
    else params.delete("category");
    router.push(params.toString() ? `?${params.toString()}` : "/blog/all", { scroll: false });
  }

  return (
    <nav aria-label={t("categories")} className="flex flex-wrap items-center gap-3">
      <CategoryButton label={t("all")} active={!currentSlug} onClick={() => selectCategory(null)} />
      {categories.map((cat) => {
        const active = currentSlug === cat.slug;
        return (
          <CategoryButton
            key={cat.id}
            label={cat.name}
            active={active}
            onClick={() => selectCategory(active ? null : cat.slug)}
          />
        );
      })}
    </nav>
  );
}

function CategoryButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-10 shrink-0 items-center rounded-full px-4 text-xl font-medium whitespace-nowrap transition-colors ${
        active
          ? "bg-(--color-catalog-category-active) text-(--color-blue)"
          : "bg-(--color-bg) text-(--color-text-primary) hover:bg-(--color-bg-surface)"
      }`}
    >
      {label}
    </button>
  );
}
