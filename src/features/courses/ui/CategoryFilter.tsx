"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Category } from "@/entities/course";

const DEFAULT_CATEGORIES: Pick<Category, "id" | "name" | "slug">[] = [
  { id: -1, name: "Programming & IT", slug: "programming-it" },
  { id: -2, name: "Design", slug: "design" },
  { id: -3, name: "Marketing", slug: "marketing" },
  { id: -4, name: "Languages", slug: "languages" },
  { id: -5, name: "Personal development", slug: "personal-development" },
];

type Props = {
  categories: Category[];
  currentSlug: string | undefined;
};

export function CategoryFilter({ categories, currentSlug }: Props) {
  const items = categories.length > 0 ? categories : DEFAULT_CATEGORIES;

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

    router.push(params.toString() ? `?${params.toString()}` : "/catalog");
  }

  return (
    <nav aria-label="Categories" className="flex flex-1 flex-wrap items-center gap-3">
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
