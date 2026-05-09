"use client";

import { ChevronIcon } from "./icons/ChevronIcon";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const ELLIPSIS = "ellipsis" as const;
type PageItem = number | typeof ELLIPSIS;

const ANCHOR = 4;
const WING = 4;

function buildPageItems(currentPage: number, totalPages: number): PageItem[] {
  if (totalPages <= ANCHOR * 2 + WING * 2 + 1) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const visible = new Set<number>();
  for (let i = 1; i <= ANCHOR; i++) visible.add(i);
  for (let i = totalPages - ANCHOR + 1; i <= totalPages; i++) visible.add(i);
  for (let i = currentPage - WING; i <= currentPage + WING; i++) {
    if (i >= 1 && i <= totalPages) visible.add(i);
  }

  const sorted = Array.from(visible).sort((a, b) => a - b);
  const items: PageItem[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) items.push(ELLIPSIS);
    items.push(sorted[i]);
  }
  return items;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const isFirst = currentPage <= 1;
  const isLast = currentPage >= totalPages;
  const items = buildPageItems(currentPage, totalPages);

  return (
    <nav
      aria-label="Pagination"
      className="mx-auto flex w-fit items-center gap-12 rounded-3xl bg-white/60 px-2 py-1.5 text-(--color-text-primary)"
    >
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={isFirst}
        className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-(--color-catalog-highlight) disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Previous page"
      >
        <ChevronIcon direction="left" className="h-10 w-10" />
      </button>

      <ul className="flex items-center gap-3">
        {items.map((item, index) =>
          item === ELLIPSIS ? (
            <li
              key={`ellipsis-${index}`}
              aria-hidden="true"
              className="flex h-10 w-10 items-center justify-center text-xl font-medium leading-none"
            >
              ...
            </li>
          ) : (
            <li key={item}>
              <button
                type="button"
                onClick={() => onPageChange(item)}
                aria-current={item === currentPage ? "page" : undefined}
                className={`flex h-10 w-10 items-center justify-center rounded-full text-xl font-medium leading-none transition ${
                  item === currentPage
                    ? "bg-(--color-text-primary) text-white"
                    : "hover:bg-(--color-catalog-highlight)"
                }`}
              >
                {item}
              </button>
            </li>
          ),
        )}
      </ul>

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={isLast}
        className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-(--color-catalog-highlight) disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Next page"
      >
        <ChevronIcon direction="right" className="h-10 w-10" />
      </button>
    </nav>
  );
}
