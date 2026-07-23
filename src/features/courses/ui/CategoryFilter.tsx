"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Category } from "@/entities/course";

type Props = {
  categories: Category[];
  currentSlug: string | undefined;
};

export function CategoryFilter({ categories, currentSlug }: Props) {
  const items = [...categories].sort(
    (a, b) => (a.featured_order ?? Infinity) - (b.featured_order ?? Infinity),
  );

  const router = useRouter();
  const searchParams = useSearchParams();

  function selectCategory(slug: string | null) {
    const params = new URLSearchParams(searchParams.toString());

    if (slug) {
      params.set("category", slug);
    } else {
      params.delete("category");
    }

    params.delete("page");

    router.push(params.toString() ? `?${params.toString()}` : "/catalog", { scroll: false });
  }

  if (items.length === 0) {
    return (
      <p className="flex-1 text-xl text-(--color-text-secondary)">No categories yet.</p>
    );
  }

  return (
    <nav
      aria-label="Categories"
      className="drag-scroll flex flex-1 flex-nowrap items-center gap-3 overflow-x-auto lg:flex-wrap lg:overflow-visible"
    >
      {items.map((cat) => {
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

function CategoryButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
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
