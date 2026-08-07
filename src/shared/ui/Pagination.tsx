"use client";

import { useTranslations } from "next-intl";
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
  const t = useTranslations("Pagination");

  return (
    <nav
      aria-label={t("pagination")}
      className="mx-auto flex max-w-full items-center gap-2 overflow-x-auto rounded-3xl bg-white/60 px-2 py-1.5 text-(--color-text-primary) [-ms-overflow-style:none] [scrollbar-width:none] lg:w-fit lg:gap-12 [&::-webkit-scrollbar]:hidden"
    >
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={isFirst}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition hover:bg-(--color-catalog-highlight) disabled:cursor-not-allowed disabled:opacity-40 lg:h-10 lg:w-10"
        aria-label={t("previousPage")}
      >
        <ChevronIcon direction="left" className="h-8 w-8 lg:h-10 lg:w-10" />
      </button>

      <ul className="flex items-center gap-1 lg:gap-3">
        {items.map((item, index) =>
          item === ELLIPSIS ? (
            <li
              key={`ellipsis-${index}`}
              aria-hidden="true"
              className="flex h-8 w-8 shrink-0 items-center justify-center text-base leading-none font-medium lg:h-10 lg:w-10 lg:text-xl"
            >
              ...
            </li>
          ) : (
            <li key={item}>
              <button
                type="button"
                onClick={() => onPageChange(item)}
                aria-current={item === currentPage ? "page" : undefined}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base leading-none font-medium transition lg:h-10 lg:w-10 lg:text-xl ${
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
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition hover:bg-(--color-catalog-highlight) disabled:cursor-not-allowed disabled:opacity-40 lg:h-10 lg:w-10"
        aria-label={t("nextPage")}
      >
        <ChevronIcon direction="right" className="h-8 w-8 lg:h-10 lg:w-10" />
      </button>
    </nav>
  );
}
