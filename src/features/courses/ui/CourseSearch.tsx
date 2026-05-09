"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

type Props = {
  initialQuery?: string;
};

export function CourseSearch({ initialQuery = "" }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const params = new URLSearchParams(searchParams.toString());
    const nextQuery = query.trim();

    if (nextQuery) {
      params.set("search", nextQuery);
    } else {
      params.delete("search");
    }

    params.delete("page");

    router.push(params.toString() ? `?${params.toString()}` : "/catalog");
  }

  function clearSearch() {
    setQuery("");

    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    params.delete("page");

    router.push(params.toString() ? `?${params.toString()}` : "/catalog");
  }

  return (
    <form
      onSubmit={submitSearch}
      className="gradient-border flex h-[60px] w-full shrink-0 items-center gap-3 rounded-[40px] px-[30px] lg:w-[460px]"
    >
      <Search
        aria-hidden="true"
        strokeWidth={2.25}
        className="h-6 w-6 shrink-0 text-(--color-text-primary)"
      />
      <label className="sr-only" htmlFor="course-search">
        Search courses
      </label>
      <input
        id="course-search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search"
        className="h-full flex-1 bg-transparent text-xl font-medium text-(--color-text-primary) outline-none placeholder:font-normal placeholder:text-(--color-catalog-placeholder)"
      />
      {initialQuery ? (
        <button
          type="button"
          onClick={clearSearch}
          aria-label="Clear search"
          className="shrink-0 text-(--color-text-secondary) transition-opacity hover:opacity-70"
        >
          <X className="h-5 w-5" />
        </button>
      ) : null}
    </form>
  );
}
