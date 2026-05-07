"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Category } from "@/entities/course";

type Props = {
  categories: Category[];
  currentSlug: string | undefined;
};

export function CategoryFilter({ categories, currentSlug }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function selectCategory(slug: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (currentSlug === slug) {
      params.delete("category");
    } else {
      params.set("category", slug);
    }

    params.delete("page");
    router.push(params.toString() ? `?${params.toString()}` : "/catalog");
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => selectCategory(category.slug)}
          className={`h-[22px] rounded-full px-4 text-[0.72rem] font-medium leading-[22px] text-[#121212] transition ${
            currentSlug === category.slug ? "bg-[#a7bafa]" : "bg-white hover:bg-[#fff4da]"
          }`}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}
