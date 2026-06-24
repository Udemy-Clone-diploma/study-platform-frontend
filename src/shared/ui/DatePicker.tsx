"use client";

import { useEffect, useMemo, useRef, useState } from "react";

// ── Utils ──────────────────────────────────────────────────────────────────────

const MONTH_FMT = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" });
const WEEK_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function pad(n: number) { return String(n).padStart(2, "0"); }

/** YYYY-MM-DD → Date (local) or null */
function parseISO(value: string): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (
    isNaN(date.getTime()) ||
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) return null;
  return date;
}

/** Date → YYYY-MM-DD */
function toISO(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Date → DD.MM.YYYY display */
function toDisplay(date: Date) {
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
}

function sameDay(a: Date | null, b: Date | null) {
  return !!(a && b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate());
}

// ── Calendar icon ──────────────────────────────────────────────────────────────

function CalIcon({ size = 15, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M8 2v4M16 2v4M3 10h18" />
    </svg>
  );
}

// ── Chevrons ───────────────────────────────────────────────────────────────────

function ChevLeft() {
  return <span style={{ display: "block", width: 8, height: 8, transform: "rotate(45deg)", border: "0 solid", borderBottomWidth: 1.8, borderLeftWidth: 1.8, borderColor: "currentColor" }} />;
}
function ChevRight() {
  return <span style={{ display: "block", width: 8, height: 8, transform: "rotate(45deg)", border: "0 solid", borderTopWidth: 1.8, borderRightWidth: 1.8, borderColor: "currentColor" }} />;
}

// ── Sizes ──────────────────────────────────────────────────────────────────────

type Size = "sm" | "md";

const SIZE: Record<Size, { font: string; padding: string; radius: number; labelFont: string }> = {
  sm: {
    font:       "clamp(11px, 0.72vw, 13px)",
    padding:    "5px 12px",
    radius:     999,
    labelFont:  "clamp(10px, 0.63vw, 12px)",
  },
  md: {
    font:       "clamp(13px, 1.04vw, 16px)",
    padding:    "clamp(6px, 0.52vw, 10px) clamp(12px, 1.04vw, 20px)",
    radius:     999,
    labelFont:  "clamp(12px, 0.83vw, 14px)",
  },
};

// ── Props ──────────────────────────────────────────────────────────────────────

interface DatePickerProps {
  /** ISO date value: "YYYY-MM-DD" or "" */
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  /** ISO min date */
  min?: string;
  /** ISO max date */
  max?: string;
  size?: Size;
  error?: string;
}

// ── Component ──────────────────────────────────────────────────────────────────

/** Generic date picker with brand calendar dropdown, matching the course-management pill-input style. */
export function DatePicker({
  value,
  onChange,
  label,
  placeholder = "DD.MM.YYYY",
  min,
  max,
  size = "md",
  error,
}: DatePickerProps) {
  const selected   = parseISO(value);
  const minDate    = min ? parseISO(min) : null;
  const maxDate    = max ? parseISO(max) : null;

  const [viewMonth, setViewMonth] = useState(() => {
    const base = selected ?? new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const sz = SIZE[size];

  // Close on outside click
  useEffect(() => {
    function onDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  // Sync viewMonth when value changes externally
  useEffect(() => {
    if (selected) setViewMonth(new Date(selected.getFullYear(), selected.getMonth(), 1));
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  // 6-week grid
  const days = useMemo(() => {
    const first = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [viewMonth]);

  function isDisabled(d: Date) {
    if (minDate && d < minDate) return true;
    if (maxDate && d > maxDate) return true;
    return false;
  }

  function handleSelect(d: Date) {
    if (isDisabled(d)) return;
    onChange(toISO(d));
    setOpen(false);
  }

  function moveMonth(offset: number) {
    setViewMonth(m => new Date(m.getFullYear(), m.getMonth() + offset, 1));
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const displayValue = selected ? toDisplay(selected) : "";

  const triggerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
    fontFamily: "var(--font-base)",
    fontWeight: 400,
    fontSize: sz.font,
    color: displayValue ? "var(--color-text-primary)" : "var(--color-text-muted)",
    background: "var(--color-bg)",
    border: `1px solid ${error ? "var(--color-pink-dark)" : "var(--color-text-primary)"}`,
    borderRadius: sz.radius,
    padding: sz.padding,
    cursor: "pointer",
    width: "100%",
    textAlign: "left",
    outline: "none",
    boxSizing: "border-box",
    letterSpacing: "-0.011em",
    lineHeight: 1.5,
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: "var(--font-base)",
    fontWeight: 600,
    fontSize: sz.labelFont,
    color: "var(--color-text-secondary)",
    letterSpacing: "-0.011em",
    lineHeight: 1.5,
    marginBottom: 4,
  };

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      {label && <label style={labelStyle}>{label}</label>}

      <button type="button" style={triggerStyle} onClick={() => setOpen(o => !o)}>
        <span>{displayValue || placeholder}</span>
        <CalIcon size={size === "sm" ? 13 : 15} color="var(--color-text-secondary)" />
      </button>

      {error && (
        <p style={{ fontFamily: "var(--font-base)", fontSize: "clamp(11px, 0.72vw, 13px)", color: "var(--color-pink-dark)", margin: "4px 0 0" }}>
          {error}
        </p>
      )}

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 200,
            width: "min(88vw, 300px)",
            background: "#fff",
            borderRadius: 18,
            border: "1px solid #dbe5ff",
            boxShadow: "0 16px 42px rgba(83,98,153,0.20)",
            padding: 16,
          }}
        >
          {/* Month nav */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <button
              type="button"
              onClick={() => moveMonth(-1)}
              aria-label="Previous month"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: "50%", background: "none", border: "none", cursor: "pointer", color: "#111" }}
            >
              <ChevLeft />
            </button>

            <span style={{ fontFamily: "var(--font-base)", fontWeight: 600, fontSize: "clamp(13px, 0.9vw, 16px)", color: "#111" }}>
              {MONTH_FMT.format(viewMonth)}
            </span>

            <button
              type="button"
              onClick={() => moveMonth(1)}
              aria-label="Next month"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: "50%", background: "none", border: "none", cursor: "pointer", color: "#111" }}
            >
              <ChevRight />
            </button>
          </div>

          {/* Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px 0", textAlign: "center" }}>
            {WEEK_DAYS.map(w => (
              <span key={w} style={{ fontFamily: "var(--font-base)", fontSize: "0.75rem", fontWeight: 500, color: "#666" }}>
                {w}
              </span>
            ))}

            {days.map(day => {
              const isCurrentMonth = day.getMonth() === viewMonth.getMonth();
              const isSel          = sameDay(day, selected);
              const disabled       = isDisabled(day);

              const btnStyle: React.CSSProperties = {
                margin: "0 auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                borderRadius: "50%",
                border: "none",
                fontFamily: "var(--font-base)",
                fontSize: "0.875rem",
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.35 : 1,
                background: isSel
                  ? "linear-gradient(135deg, #a7bafa, #fcc4c3, #fff4da)"
                  : "none",
                color: isSel
                  ? "#fff"
                  : isCurrentMonth
                  ? "#111"
                  : "#ccc",
                boxShadow: isSel ? "0 8px 20px rgba(167,186,250,0.5)" : "none",
              };

              return (
                <button
                  key={toISO(day)}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleSelect(day)}
                  style={btnStyle}
                  onMouseEnter={e => {
                    if (!isSel && !disabled)
                      (e.currentTarget as HTMLButtonElement).style.background = "#f3f5ff";
                  }}
                  onMouseLeave={e => {
                    if (!isSel)
                      (e.currentTarget as HTMLButtonElement).style.background = "none";
                  }}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
