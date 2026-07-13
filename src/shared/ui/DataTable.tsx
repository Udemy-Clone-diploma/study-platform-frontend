import type { ReactNode } from "react";

/** Column definition for {@link DataTable}. */
export type DataTableColumn<T> = {
  key: string;
  label: string;
  render: (row: T, index: number) => ReactNode;
  /** CSS flex-grow controlling relative column width. Default: 1. */
  flex?: number;
  headerAlign?: "left" | "center" | "right";
  cellAlign?: "left" | "center" | "right";
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
  emptyMessage = "No data.",
  indexOffset = 0,
  scrollable = false,
  headerVariant = "gradient",
  showIndex = true,
  rowVariant = "flush",
  selectedKey = null,
}: DataTableProps<T>) {
  const headerTextClass =
    headerVariant === "plain"
      ? "font-semibold text-(--color-text-secondary)"
      : "text-(--color-text-primary)";
  const isCard = rowVariant === "card";
  const fs = isCard ? "clamp(13px, 1.11vw, 16px)" : "clamp(13px, 1.11vw, 20px)";
  const px = "clamp(12px, 1.67vw, 24px)";
  const gap = "clamp(10px, 1.11vw, 16px)";
  const numW = "clamp(18px, 1.39vw, 20px)";

  return (
    <div
      className={`w-full overflow-hidden rounded-2xl bg-white${scrollable ? " flex min-h-0 flex-1 flex-col" : ""}`}
      style={{
        boxShadow: "var(--shadow-dashboard-card)",
        padding: isCard ? "clamp(8px, 0.83vw, 12px) clamp(12px, 1.67vw, 24px) clamp(12px, 1.67vw, 24px)" : undefined,
      }}
    >
      {/* Gradient header row */}
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
        {columns.map((col) => (
          <span
            key={col.key}
            className={`min-w-0 overflow-hidden text-ellipsis whitespace-nowrap ${headerTextClass}`}
            style={{
              flex: col.flex ?? 1,
              fontSize: fs,
              fontFamily: "var(--font-base)",
              textAlign: col.headerAlign ?? "left",
            }}
          >
            {col.label}
          </span>
        ))}
      </div>

      {/* Body */}
      {rows.length === 0 ? (
        <p
          className="py-14 text-center text-(--color-text-secondary)"
          style={{ fontFamily: "var(--font-base)", fontSize: "clamp(13px, 1.11vw, 16px)" }}
        >
          {emptyMessage}
        </p>
      ) : (
        <div
          className={scrollable ? "overflow-y-auto" : ""}
          style={isCard ? { display: "flex", flexDirection: "column", gap: "clamp(8px, 0.83vw, 12px)" } : undefined}
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
                    className="min-w-0"
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
    </div>
  );
}
