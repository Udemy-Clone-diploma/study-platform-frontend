import type { CSSProperties, ReactNode } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { useTranslations } from "next-intl";

/** Column definition for {@link DataTable}. */
export type DataTableColumn<T> = {
  key: string;
  label: string;
  render: (row: T, index: number) => ReactNode;
  /** CSS flex-grow controlling relative column width. Default: 1. */
  flex?: number;
  headerAlign?: "left" | "center" | "right";
  cellAlign?: "left" | "center" | "right";
  /** Backend ordering key for this column (e.g. "date_joined"). Omit for non-sortable columns. */
  sortKey?: string;
};

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T, index: number) => string | number;
  emptyMessage?: string;
  /** Starting offset for the built-in № numbering (for pagination). Default: 0. */
  indexOffset?: number;
  /** When true the component fills its flex parent and the row list scrolls internally. */
  scrollable?: boolean;
  /** "plain" renders a white header with secondary text instead of the brand gradient. */
  headerVariant?: "gradient" | "plain";
  /** Set false to hide the built-in № column. Default: true. */
  showIndex?: boolean;
  /** "card" renders each row as a bordered rounded card with gaps instead of divider lines. */
  rowVariant?: "flush" | "card";
  /** Key (as returned by getRowKey) of the row to highlight as selected. Card variant only. */
  selectedKey?: string | number | null;
  /** Current sort ordering string (e.g. "-date_joined"). Controls which header shows a chevron. */
  currentSort?: string | null;
  /** Called when a sortable header is clicked. Receives the new ordering string. */
  onSortChange?: (ordering: string) => void;
  /**
   * Below `lg`, once columns hit their minimum readable size, stop shrinking them
   * further and let the table scroll horizontally instead. Card variant only.
   */
  minWidth?: string;
  /** Shrinks font/padding a step further — for when a sibling panel is eating into the available width. */
  compact?: boolean;
}

/**
 * Reusable branded data table with a gradient header, automatic row numbers,
 * and dividers. Pass different column sets to reuse across teacher dashboard
 * sections (students, gradebook, homework, etc.).
 */
export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  emptyMessage,
  indexOffset = 0,
  scrollable = false,
  headerVariant = "gradient",
  showIndex = true,
  rowVariant = "flush",
  selectedKey = null,
  currentSort = null,
  onSortChange,
  minWidth,
  compact = false,
}: DataTableProps<T>) {
  const t = useTranslations("Common");
  const resolvedEmptyMessage = emptyMessage ?? t("noData");
  const headerTextClass =
    headerVariant === "plain"
      ? "font-semibold text-(--color-text-secondary)"
      : "text-(--color-text-primary)";
  const isCard = rowVariant === "card";
  const fs = isCard
    ? compact
      ? "clamp(10px, 0.9vw, 13px)"
      : "clamp(11px, 1.11vw, 16px)"
    : "clamp(13px, 1.11vw, 20px)";
  const px = compact ? "clamp(8px, 1.11vw, 18px)" : "clamp(12px, 1.67vw, 24px)";
  const gap = compact ? "clamp(6px, 0.83vw, 12px)" : "clamp(10px, 1.11vw, 16px)";
  const numW = "clamp(18px, 1.39vw, 20px)";
  const scrollX = isCard && !!minWidth;

  return (
    <div
      className={[
        "w-full rounded-2xl bg-white",
        scrollable ? "flex min-h-0 flex-1 flex-col" : "",
        scrollX ? "overflow-x-auto lg:overflow-visible" : "overflow-hidden",
      ].join(" ")}
      style={{
        boxShadow: "var(--shadow-dashboard-card)",
        padding: isCard
          ? "clamp(8px, 0.83vw, 12px) clamp(12px, 1.67vw, 24px) clamp(12px, 1.67vw, 24px)"
          : undefined,
        ...(scrollX ? ({ "--table-min-w": minWidth } as CSSProperties) : {}),
      }}
    >
      {scrollX ? (
        <div className="max-lg:min-w-(--table-min-w)">
          <DataTableContent
            columns={columns}
            rows={rows}
            getRowKey={getRowKey}
            resolvedEmptyMessage={resolvedEmptyMessage}
            indexOffset={indexOffset}
            scrollable={scrollable}
            headerVariant={headerVariant}
            headerTextClass={headerTextClass}
            showIndex={showIndex}
            isCard={isCard}
            selectedKey={selectedKey}
            currentSort={currentSort}
            onSortChange={onSortChange}
            t={t}
            fs={fs}
            px={px}
            gap={gap}
            numW={numW}
          />
        </div>
      ) : (
        <DataTableContent
          columns={columns}
          rows={rows}
          getRowKey={getRowKey}
          resolvedEmptyMessage={resolvedEmptyMessage}
          indexOffset={indexOffset}
          scrollable={scrollable}
          headerVariant={headerVariant}
          headerTextClass={headerTextClass}
          showIndex={showIndex}
          isCard={isCard}
          selectedKey={selectedKey}
          currentSort={currentSort}
          onSortChange={onSortChange}
          t={t}
          fs={fs}
          px={px}
          gap={gap}
          numW={numW}
        />
      )}
    </div>
  );
}

function DataTableContent<T>({
  columns,
  rows,
  getRowKey,
  resolvedEmptyMessage,
  indexOffset,
  scrollable,
  headerVariant,
  headerTextClass,
  showIndex,
  isCard,
  selectedKey,
  currentSort,
  onSortChange,
  t,
  fs,
  px,
  gap,
  numW,
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T, index: number) => string | number;
  resolvedEmptyMessage: string;
  indexOffset: number;
  scrollable: boolean;
  headerVariant: "gradient" | "plain";
  headerTextClass: string;
  showIndex: boolean;
  isCard: boolean;
  selectedKey: string | number | null;
  currentSort: string | null;
  onSortChange?: (ordering: string) => void;
  t: ReturnType<typeof useTranslations>;
  fs: string;
  px: string;
  gap: string;
  numW: string;
}) {
  return (
    <>
      <div
        className="flex shrink-0 items-center"
        style={{
          background: headerVariant === "plain" ? "white" : "var(--gradient-brand)",
          height: "clamp(32px, 2.78vw, 40px)",
          paddingInline: px,
          gap,
        }}
      >
        {showIndex && (
          <span
            className={`shrink-0 text-center font-bold ${headerTextClass}`}
            style={{ width: numW, fontSize: fs, fontFamily: "var(--font-base)" }}
          >
            №
          </span>
        )}
        {columns.map((col) => {
          const isSortable = !!col.sortKey && !!onSortChange;
          const isAsc = !!col.sortKey && currentSort === col.sortKey;
          const isDesc = !!col.sortKey && currentSort === `-${col.sortKey}`;
          const SortIcon = isAsc ? ChevronDown : isDesc ? ChevronUp : ChevronsUpDown;
          const justifyContent =
            col.headerAlign === "center"
              ? "center"
              : col.headerAlign === "right"
                ? "flex-end"
                : "flex-start";
          const baseStyle = { flex: col.flex ?? 1, fontSize: fs, fontFamily: "var(--font-base)" };

          if (isSortable) {
            const nextSort = isAsc ? `-${col.sortKey}` : col.sortKey!;
            return (
              <button
                key={col.key}
                type="button"
                onClick={() => onSortChange!(nextSort)}
                className={`flex min-w-0 cursor-pointer items-center overflow-hidden border-none bg-transparent p-0 transition hover:opacity-70 ${headerTextClass}`}
                style={{ ...baseStyle, gap: 4, justifyContent }}
                aria-label={t("sortByColumn", { column: col.label })}
              >
                <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                  {col.label}
                </span>
                <SortIcon
                  aria-hidden="true"
                  className={`h-4 w-4 shrink-0${!isAsc && !isDesc ? " opacity-70" : ""}`}
                />
              </button>
            );
          }

          return (
            <span
              key={col.key}
              className={`min-w-0 overflow-hidden text-ellipsis whitespace-nowrap ${headerTextClass}`}
              style={{ ...baseStyle, textAlign: col.headerAlign ?? "left" }}
            >
              {col.label}
            </span>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <p
          className="py-14 text-center text-(--color-text-secondary)"
          style={{ fontFamily: "var(--font-base)", fontSize: "clamp(13px, 1.11vw, 16px)" }}
        >
          {resolvedEmptyMessage}
        </p>
      ) : (
        <div
          className={scrollable ? "overflow-y-auto" : ""}
          style={
            isCard
              ? { display: "flex", flexDirection: "column", gap: "clamp(8px, 0.83vw, 12px)" }
              : undefined
          }
        >
          {rows.map((row, i) => {
            const rowKey = getRowKey(row, i);
            const selected = isCard && selectedKey !== null && rowKey === selectedKey;
            const cells = (
              <>
                {showIndex && (
                  <span
                    className="shrink-0 text-center text-(--color-text-primary)"
                    style={{ width: numW, fontSize: fs, fontFamily: "var(--font-base)" }}
                  >
                    {indexOffset + i + 1}
                  </span>
                )}
                {columns.map((col) => (
                  <div
                    key={col.key}
                    className="min-w-0 overflow-hidden break-words"
                    style={{
                      flex: col.flex ?? 1,
                      fontSize: fs,
                      fontFamily: "var(--font-base)",
                      color: "var(--color-text-primary)",
                      textAlign: col.cellAlign ?? "left",
                    }}
                  >
                    {col.render(row, i)}
                  </div>
                ))}
              </>
            );

            if (isCard) {
              return (
                <div
                  key={rowKey}
                  className="flex items-center rounded-xl"
                  style={{
                    minHeight: "clamp(56px, 4.44vw, 64px)",
                    paddingInline: px,
                    gap,
                    border: "1px solid var(--color-border-light)",
                    background: selected ? "var(--color-brand-cream)" : undefined,
                  }}
                >
                  {cells}
                </div>
              );
            }

            return (
              <div key={rowKey}>
                <div className="h-px bg-(--color-border-light)" />
                <div
                  className="flex items-center"
                  style={{
                    minHeight: "clamp(44px, 3.61vw, 52px)",
                    paddingInline: px,
                    gap,
                  }}
                >
                  {cells}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
