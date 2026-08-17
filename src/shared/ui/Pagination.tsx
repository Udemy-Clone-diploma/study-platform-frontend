"use client";

import { useTranslations } from "next-intl";
import { ChevronIcon } from "./icons/ChevronIcon";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Keeps mobile pagination to the current edge, one neighbour, and the last page. */
  compactOnMobile?: boolean;
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

function buildCompactPageItems(currentPage: number, totalPages: number): PageItem[] {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
  if (currentPage <= 2) return [1, 2, ELLIPSIS, totalPages];
  if (currentPage >= totalPages - 1) return [1, ELLIPSIS, totalPages - 1, totalPages];
  return [1, ELLIPSIS, currentPage, ELLIPSIS, totalPages];
}

function PageNumberList({
  items,
  currentPage,
  onPageChange,
  className,
  mobileCompact = false,
}: {
  items: PageItem[];
  currentPage: number;
  onPageChange: (page: number) => void;
  className: string;
  mobileCompact?: boolean;
}) {
  const itemSize = mobileCompact
    ? "h-10 w-10 text-base"
    : "h-8 w-8 text-base lg:h-10 lg:w-10 lg:text-xl";

  return (
    <ul className={className}>
      {items.map((item, index) =>
        item === ELLIPSIS ? (
          <li
            key={`ellipsis-${index}`}
            aria-hidden="true"
            className={`flex shrink-0 items-center justify-center leading-none font-medium ${itemSize}`}
          >
            ...
          </li>
        ) : (
          <li key={item}>
            <button
              type="button"
              onClick={() => onPageChange(item)}
              aria-current={item === currentPage ? "page" : undefined}
              className={`flex shrink-0 items-center justify-center rounded-full leading-none font-medium transition ${itemSize} ${
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
  );
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  compactOnMobile = false,
}: PaginationProps) {
  const isFirst = currentPage <= 1;
  const isLast = currentPage >= totalPages;
  const items = buildPageItems(currentPage, totalPages);
  const compactItems = buildCompactPageItems(currentPage, totalPages);
  const t = useTranslations("Pagination");

  return (
    <nav
      aria-label={t("pagination")}
      className={`mx-auto flex items-center overflow-x-auto rounded-3xl bg-white/60 px-2 text-(--color-text-primary) [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
        compactOnMobile
          ? "w-full max-w-80 justify-between gap-0 py-2 lg:w-fit lg:max-w-full lg:gap-12 lg:py-1.5"
          : "max-w-full gap-2 py-1.5 lg:w-fit lg:gap-12"
      }`}
    >
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={isFirst}
        className={`flex shrink-0 items-center justify-center rounded-full transition hover:bg-(--color-catalog-highlight) disabled:cursor-not-allowed disabled:opacity-40 ${
          compactOnMobile ? "h-10 w-10" : "h-8 w-8 lg:h-10 lg:w-10"
        }`}
        aria-label={t("previousPage")}
      >
        <ChevronIcon
          direction="left"
          className={compactOnMobile ? "h-10 w-10" : "h-8 w-8 lg:h-10 lg:w-10"}
        />
      </button>

      {compactOnMobile ? (
        <>
          <PageNumberList
            items={compactItems}
            currentPage={currentPage}
            onPageChange={onPageChange}
            className="flex flex-1 items-center justify-evenly lg:hidden"
            mobileCompact
          />
          <PageNumberList
            items={items}
            currentPage={currentPage}
            onPageChange={onPageChange}
            className="hidden items-center gap-3 lg:flex"
          />
        </>
      ) : (
        <PageNumberList
          items={items}
          currentPage={currentPage}
          onPageChange={onPageChange}
          className="flex items-center gap-1 lg:gap-3"
        />
      )}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={isLast}
        className={`flex shrink-0 items-center justify-center rounded-full transition hover:bg-(--color-catalog-highlight) disabled:cursor-not-allowed disabled:opacity-40 ${
          compactOnMobile ? "h-10 w-10" : "h-8 w-8 lg:h-10 lg:w-10"
        }`}
        aria-label={t("nextPage")}
      >
        <ChevronIcon
          direction="right"
          className={compactOnMobile ? "h-10 w-10" : "h-8 w-8 lg:h-10 lg:w-10"}
        />
      </button>
    </nav>
  );
}
