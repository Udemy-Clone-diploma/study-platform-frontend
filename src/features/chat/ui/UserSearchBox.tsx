"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Search } from "lucide-react";
import { searchUsers, type UserSearchResult } from "@/entities/chat";
import { Avatar } from "./Avatar";

type Props = {
  selected: UserSearchResult[];
  onSelect: (user: UserSearchResult) => void;
  excludeIds?: number[];
};

/** Searches chat users and lets the parent collect selected results. */
export function UserSearchBox({ selected, onSelect, excludeIds = [] }: Props) {
  const t = useTranslations("UserSearchBox");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const selectedIds = useMemo(() => new Set(selected.map((user) => user.id)), [selected]);
  const excluded = useMemo(() => new Set(excludeIds), [excludeIds]);
  const trimmedQuery = query.trim();
  const visibleResults = trimmedQuery.length >= 3 ? results : [];

  useEffect(() => {
    if (trimmedQuery.length < 3) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      setLoading(true);
      searchUsers(trimmedQuery)
        .then((items) => {
          if (cancelled) return;
          setResults(items.filter((user) => !selectedIds.has(user.id) && !excluded.has(user.id)));
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [excluded, selectedIds, trimmedQuery]);

  return (
    <div>
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("searchByEmailPlaceholder")}
          className="h-10 w-full rounded-lg border border-[#D8DDEA] bg-white pl-9 pr-3 text-sm outline-none transition focus:border-[#A7BAFA] focus:ring-2 focus:ring-[#D6E0FF]"
        />
      </label>
      <div className="mt-3 max-h-52 overflow-y-auto rounded-lg border border-[#EEF0F6]">
        {trimmedQuery.length >= 3 && loading ? (
          <div className="flex h-20 items-center justify-center text-sm text-[#6B7280]">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("searching")}
          </div>
        ) : visibleResults.length > 0 ? (
          visibleResults.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => {
                onSelect(user);
                setQuery("");
                setResults([]);
              }}
              className="flex w-full items-center gap-3 border-b border-[#EEF0F6] px-3 py-2 text-left last:border-b-0 hover:bg-[#F7F9FF]"
            >
              <Avatar src={user.avatar} label={user.name || user.email} size="sm" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-[#111827]">
                  {user.name || user.email}
                </span>
                <span className="block truncate text-xs text-[#6B7280]">{user.email}</span>
              </span>
            </button>
          ))
        ) : (
          <div className="flex h-20 items-center justify-center px-4 text-center text-sm text-[#6B7280]">
            {trimmedQuery.length >= 3 ? t("noUsersFound") : t("typeAtLeast3Chars")}
          </div>
        )}
      </div>
    </div>
  );
}
