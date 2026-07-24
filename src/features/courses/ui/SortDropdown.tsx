"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export type SortOption = {
  label: string;
  value: string;
};

const SORT_VALUES = [
  { key: "popularity", value: "-students_count" },
  { key: "rating", value: "-rating_avg" },
  { key: "novelty", value: "-published_at" },
  { key: "cheapFirst", value: "min_price" },
  { key: "expensiveFirst", value: "-min_price" },
] as const;

/**
 * Matches the backend's current default ordering. Keep these in sync — if the
 * backend swaps to a windowed popularity score (see TASK F in BACKEND_TASKS.md),
 * flip this to "-students_count".
 */
export const DEFAULT_SORT = "-published_at";

type Props = {
  currentSort: string | undefined;
};

/** Five-option sort dropdown for the catalog. Writes the choice to `?sort=` on the current URL. */
export function SortDropdown({ currentSort }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const t = useTranslations("SortDropdown");
  const SORT_OPTIONS: SortOption[] = SORT_VALUES.map(({ key, value }) => ({
    label: t(`options.${key}`),
    value,
  }));

  const activeOption = SORT_OPTIONS.find((o) => o.value === currentSort);
  const highlightedValue = activeOption?.value ?? DEFAULT_SORT;

  function selectSort(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("sort", value);
    } else {
      params.delete("sort");
    }
    params.delete("page");
    router.push(`?${params.toString()}`, { scroll: false });
    setOpen(false);
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 text-xl font-medium text-(--color-text-primary) transition-opacity hover:opacity-70"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{activeOption?.label ?? t("sortBy")}</span>
        <ChevronDown
          aria-hidden="true"
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-10 mt-2 flex w-55 flex-col gap-3 rounded-xl bg-(--color-bg) p-5 shadow-(--shadow-sort-dropdown)"
        >
          {SORT_OPTIONS.map((option) => {
            const selected = option.value === highlightedValue;
            return (
              <li key={option.value} role="option" aria-selected={selected} className="w-full">
                <button
                  type="button"
                  onClick={() => selectSort(option.value)}
                  className={`w-full text-left text-xl font-medium transition-colors ${
                    selected
                      ? "text-(--color-blue)"
                      : "text-(--color-text-primary) hover:text-(--color-blue)"
                  }`}
                >
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
