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
}: DataTableProps<T>) {
  const fs = "clamp(13px, 1.11vw, 20px)";
  const px = "clamp(12px, 1.67vw, 24px)";
  const gap = "clamp(10px, 1.11vw, 16px)";
  const numW = "clamp(18px, 1.39vw, 20px)";

  return (
    <div
      className={`w-full overflow-hidden rounded-2xl bg-white${scrollable ? " flex min-h-0 flex-1 flex-col" : ""}`}
      style={{ boxShadow: "var(--shadow-dashboard-card)" }}
    >
      {/* Gradient header row */}
      <div
        className="flex shrink-0 items-center"
        style={{
          background: "var(--gradient-brand)",
          height: "clamp(32px, 2.78vw, 40px)",
          paddingInline: px,
          gap,
        }}
      >
        <span
          className="shrink-0 text-center font-bold text-(--color-text-primary)"
          style={{ width: numW, fontSize: fs, fontFamily: "var(--font-base)" }}
        >
          №
        </span>
        {columns.map((col) => (
          <span
            key={col.key}
            className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-(--color-text-primary)"
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
        <div className={scrollable ? "overflow-y-auto" : ""}>
          {rows.map((row, i) => (
            <div key={getRowKey(row, i)}>
              <div className="h-px bg-(--color-border-light)" />
              <div
                className="flex items-center"
                style={{
                  minHeight: "clamp(44px, 3.61vw, 52px)",
                  paddingInline: px,
                  gap,
                }}
              >
                <span
                  className="shrink-0 text-center text-(--color-text-primary)"
                  style={{ width: numW, fontSize: fs, fontFamily: "var(--font-base)" }}
                >
                  {indexOffset + i + 1}
                </span>
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
