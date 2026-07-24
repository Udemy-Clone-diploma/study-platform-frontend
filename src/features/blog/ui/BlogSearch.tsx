"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Search, X } from "lucide-react";

type Props = {
  initialQuery?: string;
};

/** Search box for /blog/all — same look/behavior as the catalog's CourseSearch. */
export function BlogSearch({ initialQuery = "" }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const t = useTranslations("BlogSearch");
  const tCommon = useTranslations("Common");

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

    router.push(params.toString() ? `?${params.toString()}` : "/blog/all", { scroll: false });
  }

  function clearSearch() {
    setQuery("");

    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    params.delete("page");

    router.push(params.toString() ? `?${params.toString()}` : "/blog/all", { scroll: false });
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
      <label className="sr-only" htmlFor="blog-search">
        {t("searchArticles")}
      </label>
      <input
        id="blog-search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={tCommon("search")}
        className="h-full flex-1 bg-transparent text-xl font-medium text-(--color-text-primary) outline-none placeholder:font-normal placeholder:text-(--color-catalog-placeholder)"
      />
      {initialQuery ? (
        <button
          type="button"
          onClick={clearSearch}
          aria-label={t("clearSearch")}
          className="shrink-0 text-(--color-text-secondary) transition-opacity hover:opacity-70"
        >
          <X className="h-5 w-5" />
        </button>
      ) : null}
    </form>
  );
}
