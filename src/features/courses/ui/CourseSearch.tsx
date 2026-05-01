"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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

    router.push(params.toString() ? `?${params.toString()}` : "/catalog");
  }

  function clearSearch() {
    setQuery("");

    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");

    router.push(params.toString() ? `?${params.toString()}` : "/catalog");
  }

  return (
    <form
      onSubmit={submitSearch}
      className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row"
    >
      <label className="sr-only" htmlFor="course-search">
        Search courses
      </label>
      <input
        id="course-search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search by title, teacher, category, or tag"
        className="min-h-11 flex-1 rounded-lg border border-slate-300 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
      />
      <div className="flex gap-2">
        {initialQuery ? (
          <button
            type="button"
            onClick={clearSearch}
            className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Clear
          </button>
        ) : null}
        <button
          type="submit"
          className="min-h-11 rounded-lg bg-slate-900 px-5 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          Search
        </button>
      </div>
    </form>
  );
}
