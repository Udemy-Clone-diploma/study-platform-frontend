"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Search } from "lucide-react";
import { useTranslations } from "next-intl";

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  refreshing: boolean;
};

/** Search + refresh row for the teacher applications table, styled to match UsersToolbar on the admin Users page. */
export function ApplicationsToolbar({ search, onSearchChange, onRefresh, refreshing }: Props) {
  const t = useTranslations("TeacherApplicationsAdmin");
  const tCommon = useTranslations("Common");
  const [query, setQuery] = useState(search);
  const [prevSearch, setPrevSearch] = useState(search);

  if (search !== prevSearch) {
    setPrevSearch(search);
    setQuery(search);
  }

  useEffect(() => {
    if (query === search) return;
    const timer = setTimeout(() => onSearchChange(query), 400);
    return () => clearTimeout(timer);
  }, [query, search, onSearchChange]);

  return (
    <div className="flex flex-wrap items-center" style={{ gap: "clamp(12px, 1.94vw, 28px)" }}>
      <label
        className="gradient-border flex cursor-text items-center gap-2"
        style={{
          minWidth: "clamp(200px, 17vw, 330px)",
          height: "clamp(40px, 3.33vw, 48px)",
          borderRadius: 40,
          padding: "clamp(6px, 0.56vw, 8px) clamp(14px, 1.25vw, 20px)",
        }}
      >
        <Search
          aria-hidden="true"
          className="shrink-0 text-(--color-text-secondary)"
          style={{ width: "clamp(16px, 1.39vw, 20px)", height: "clamp(16px, 1.39vw, 20px)" }}
        />
        <input
          type="search"
          placeholder={tCommon("search")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="min-w-0 flex-1 bg-transparent outline-none"
          style={{
            fontFamily: "var(--font-base)",
            fontSize: "clamp(14px, 1.11vw, 18px)",
            color: "var(--color-text-primary)",
          }}
          aria-label={t("searchAriaLabel")}
        />
      </label>

      <button
        type="button"
        onClick={onRefresh}
        title={t("refreshAriaLabel")}
        aria-label={t("refreshAriaLabel")}
        className="flex cursor-pointer items-center justify-center rounded-full bg-white text-(--color-text-primary) transition hover:opacity-80"
        style={{
          width: "clamp(34px, 2.78vw, 40px)",
          height: "clamp(34px, 2.78vw, 40px)",
          border: "none",
        }}
      >
        <RefreshCw
          aria-hidden="true"
          className={refreshing ? "animate-spin" : undefined}
          style={{ width: "clamp(14px, 1.11vw, 18px)", height: "clamp(14px, 1.11vw, 18px)" }}
        />
      </button>
    </div>
  );
}
