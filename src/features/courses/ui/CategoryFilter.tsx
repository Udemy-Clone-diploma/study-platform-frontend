"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Category } from "@/features/courses/model/types/category";

type Props = {
  categories: Category[];
  currentSlug: string | undefined;
};

export function CategoryFilter({ categories, currentSlug }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function selectCategory(slug: string | null) {
    const params = new URLSearchParams(searchParams.toString());

    if (slug) {
      params.set("category", slug);
    } else {
      params.delete("category");
    }

    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => selectCategory(null)}
        className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
          !currentSlug
            ? "bg-slate-900 text-white"
            : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
        }`}
      >
        Всі категорії
      </button>

      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => selectCategory(cat.slug)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            currentSlug === cat.slug
              ? "bg-slate-900 text-white"
              : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
