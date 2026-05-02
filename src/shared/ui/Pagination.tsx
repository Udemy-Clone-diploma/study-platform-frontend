"use client";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const ELLIPSIS = "ellipsis" as const;
type PageItem = number | typeof ELLIPSIS;

function buildPageItems(currentPage: number, totalPages: number): PageItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const items: PageItem[] = [1];

  if (currentPage > 4) {
    items.push(ELLIPSIS);
  }

  const windowStart = Math.max(2, currentPage - 1);
  const windowEnd = Math.min(totalPages - 1, currentPage + 1);

  for (let page = windowStart; page <= windowEnd; page++) {
    items.push(page);
  }

  if (currentPage < totalPages - 3) {
    items.push(ELLIPSIS);
  }

  items.push(totalPages);
  return items;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const isFirst = currentPage <= 1;
  const isLast = currentPage >= totalPages;
  const items = buildPageItems(currentPage, totalPages);

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-center gap-2 py-6"
    >
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={isFirst}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Previous page"
      >
        Prev
      </button>

      <ul className="hidden items-center gap-1 sm:flex">
        {items.map((item, index) =>
          item === ELLIPSIS ? (
            <li key={`ellipsis-${index}`} aria-hidden="true" className="px-2 text-slate-500">
              ...
            </li>
          ) : (
            <li key={item}>
              <button
                type="button"
                onClick={() => onPageChange(item)}
                aria-current={item === currentPage ? "page" : undefined}
                className={`min-w-[2.5rem] rounded-lg px-3 py-2 text-sm font-medium transition ${
                  item === currentPage
                    ? "bg-slate-900 text-white"
                    : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {item}
              </button>
            </li>
          ),
        )}
      </ul>

      <span className="text-sm text-slate-600 sm:hidden" aria-live="polite">
        Page {currentPage} of {totalPages}
      </span>

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={isLast}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Next page"
      >
        Next
      </button>
    </nav>
  );
}
