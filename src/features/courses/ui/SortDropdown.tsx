"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";

export type SortOption = {
  label: string;
  value: string;
};

export const SORT_OPTIONS: SortOption[] = [
  { label: "Newest", value: "-created_at" },
  { label: "Most popular", value: "-students_count" },
  { label: "Top rated", value: "-rating_avg" },
  { label: "Price: low to high", value: "price" },
  { label: "Price: high to low", value: "-price" },
];

type Props = {
  currentSort: string | undefined;
};

export function SortDropdown({ currentSort }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const activeOption = SORT_OPTIONS.find((o) => o.value === currentSort);

  function selectSort(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("sort", value);
    } else {
      params.delete("sort");
    }
    router.push(`?${params.toString()}`);
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
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{activeOption?.label ?? "Sort by"}</span>
        <svg
          className={`h-4 w-4 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-10 mt-1 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          {SORT_OPTIONS.map((option) => (
            <li key={option.value} role="option" aria-selected={option.value === activeOption?.value}>
              <button
                onClick={() => selectSort(option.value)}
                className={`w-full px-4 py-2 text-left text-sm transition hover:bg-slate-50 ${
                  option.value === activeOption?.value
                    ? "font-semibold text-slate-950"
                    : "text-slate-700"
                }`}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
