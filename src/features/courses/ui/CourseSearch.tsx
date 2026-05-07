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
      className="flex h-[36px] w-full max-w-[430px] items-center gap-2 rounded-full border border-[#a7bafa] bg-white px-7 shadow-[0_0_18px_rgba(252,196,195,0.28)]"
    >
      <label className="sr-only" htmlFor="course-search">
        Search courses
      </label>
      <svg
        aria-hidden="true"
        className="h-5 w-5 shrink-0 text-[#121212]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.3-4.3m1.3-5.7a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
      </svg>
      <input
        id="course-search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search"
        className="h-full min-w-0 flex-1 border-none bg-transparent text-[0.78rem] text-[#121212] outline-none placeholder:text-[#d9d9d9]"
      />
      {initialQuery ? (
        <button
          type="button"
          onClick={clearSearch}
          className="text-[0.7rem] font-medium text-[#5e5e5e] transition hover:text-[#121212]"
        >
          Clear
        </button>
      ) : null}
      <button type="submit" className="sr-only">
        Search
      </button>
    </form>
  );
}
