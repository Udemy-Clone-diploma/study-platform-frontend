"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { getWeekdayNames } from "@/shared/lib/time";

const YEARS_PER_PAGE = 12;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

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
  )
    return null;
  return date;
}

/** Date → YYYY-MM-DD */
function toISO(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Today, as YYYY-MM-DD (local time). */
export function todayISO() {
  return toISO(new Date());
}

/** Date → display string using the given separator (DD{sep}MM{sep}YYYY) */
function toDisplay(date: Date, sep: string) {
  return `${pad(date.getDate())}${sep}${pad(date.getMonth() + 1)}${sep}${date.getFullYear()}`;
}

/** DD{sep}MM{sep}YYYY (any non-digit separator) → Date, or null if invalid/incomplete */
function parseDisplay(value: string): Date | null {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 8) return null;
  const day = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const year = Number(digits.slice(4, 8));
  const date = new Date(year, month - 1, day);
  if (
    isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  )
    return null;
  return date;
}

/** Reformats raw typed input into DD{sep}MM{sep}YYYY as the user types. */
function formatTypedInput(rawValue: string, sep: string) {
  const digits = rawValue.replace(/\D/g, "").slice(0, 8);
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);
  return [day, month, year].filter(Boolean).join(sep);
}

function sameDay(a: Date | null, b: Date | null) {
  return !!(
    a &&
    b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfMonth(y: number, m: number) {
  return new Date(y, m, 1);
}
function endOfMonth(y: number, m: number) {
  return new Date(y, m + 1, 0);
}

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

function ChevLeft() {
  return (
    <span
      style={{
        display: "block",
        width: 8,
        height: 8,
        transform: "rotate(45deg)",
        border: "0 solid",
        borderBottomWidth: 1.8,
        borderLeftWidth: 1.8,
        borderColor: "currentColor",
      }}
    />
  );
}
function ChevRight() {
  return (
    <span
      style={{
        display: "block",
        width: 8,
        height: 8,
        transform: "rotate(45deg)",
        border: "0 solid",
        borderTopWidth: 1.8,
        borderRightWidth: 1.8,
        borderColor: "currentColor",
      }}
    />
  );
}

type Size = "sm" | "md";

const SIZE: Record<Size, { font: string; padding: string; radius: number; labelFont: string }> = {
  sm: {
    font: "clamp(11px, 0.72vw, 13px)",
    padding: "5px 12px",
    radius: 999,
    labelFont: "clamp(10px, 0.63vw, 12px)",
  },
  md: {
    font: "clamp(13px, 1.04vw, 16px)",
    padding: "clamp(6px, 0.52vw, 10px) clamp(12px, 1.04vw, 20px)",
    radius: 999,
    labelFont: "clamp(12px, 0.83vw, 14px)",
  },
};

type CalendarView = "days" | "months" | "years";

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
  /**
   * "pill" (default) is the rounded pill-button trigger used across course
   * management / payments. "underline" is the auth-style trigger (bottom
   * border, inline icon button) and supports typing a date in by hand.
   */
  variant?: "pill" | "underline";
  /** Allow typing the date by hand instead of only picking it from the grid. Only applies to the "underline" variant. */
  allowTyping?: boolean;
  /** When set, only these ISO dates are selectable; every other day is shown dimmed and disabled. */
  selectableDates?: Set<string>;
  /** Disables the trigger entirely (no popover, no typing). */
  disabled?: boolean;
  /** Fires whenever the displayed month changes (initial mount, navigation, or quick-jump). */
  onViewChange?: (year: number, month: number) => void;
}

/** The single date picker used everywhere a date is chosen: brand calendar dropdown with optional month/year quick-jump and manual typing. */
export function DatePicker({
  value,
  onChange,
  label,
  placeholder,
  min,
  max,
  size = "md",
  error,
  variant = "pill",
  allowTyping = false,
  selectableDates,
  disabled = false,
  onViewChange,
}: DatePickerProps) {
  const locale = useLocale();
  const t = useTranslations("DatePicker");
  const monthFmt = useMemo(() => new Intl.DateTimeFormat(locale, { month: "long" }), [locale]);
  const monthShortFmt = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: "short" }),
    [locale],
  );
  const yearFmt = useMemo(() => new Intl.DateTimeFormat(locale, { year: "numeric" }), [locale]);
  const weekDays = useMemo(() => getWeekdayNames(locale, "short"), [locale]);

  const selected = parseISO(value);
  const minDate = min ? parseISO(min) : null;
  const maxDate = max ? parseISO(max) : null;
  const sep = variant === "underline" ? "-" : ".";
  const resolvedPlaceholder = placeholder ?? `DD${sep}MM${sep}YYYY`;

  const [viewMonth, setViewMonth] = useState(() => {
    const base = selected ?? new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<CalendarView>("days");
  const [draftValue, setDraftValue] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const sz = SIZE[size];

  function closeCalendar() {
    setOpen(false);
    setView("days");
  }

  // The popover can open below the fold inside a scrollable modal -- bring it
  // fully into view instead of leaving the user to scroll it into view by hand,
  // which risks a pointerdown on the scrollbar the "close on outside click"
  // handler below treats as a dismiss.
  useEffect(() => {
    if (open) popoverRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [open]);

  // Close on outside click
  useEffect(() => {
    function onDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) closeCalendar();
    }
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  useEffect(() => {
    if (selected) setViewMonth(new Date(selected.getFullYear(), selected.getMonth(), 1));
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  // Notify the caller whenever the displayed month changes (mount, navigation, quick-jump)
  useEffect(() => {
    onViewChange?.(viewMonth.getFullYear(), viewMonth.getMonth() + 1);
  }, [viewMonth]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const yearRangeStart = Math.floor(viewMonth.getFullYear() / YEARS_PER_PAGE) * YEARS_PER_PAGE;
  const years = Array.from({ length: YEARS_PER_PAGE }, (_, i) => yearRangeStart + i);

  function isDayDisabled(d: Date) {
    if (minDate && d < minDate) return true;
    if (maxDate && d > maxDate) return true;
    if (selectableDates && !selectableDates.has(toISO(d))) return true;
    return false;
  }

  function isMonthDisabled(year: number, month: number) {
    if (maxDate && startOfMonth(year, month) > maxDate) return true;
    if (minDate && endOfMonth(year, month) < minDate) return true;
    return false;
  }

  function isYearDisabled(year: number) {
    if (maxDate && startOfMonth(year, 0) > maxDate) return true;
    if (minDate && endOfMonth(year, 11) < minDate) return true;
    return false;
  }

  function handleSelect(d: Date) {
    if (isDayDisabled(d)) return;
    onChange(toISO(d));
    setDraftValue("");
    closeCalendar();
  }

  function moveMonth(offset: number) {
    setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + offset, 1));
  }
  function moveYear(offset: number) {
    setViewMonth((m) => new Date(m.getFullYear() + offset, m.getMonth(), 1));
  }
  function moveYearPage(offset: number) {
    setViewMonth((m) => new Date(m.getFullYear() + offset * YEARS_PER_PAGE, m.getMonth(), 1));
  }

  function handleNavigate(offset: number) {
    if (view === "days") moveMonth(offset);
    else if (view === "months") moveYear(offset);
    else moveYearPage(offset);
  }

  function handleSelectMonth(monthIndex: number) {
    if (isMonthDisabled(viewMonth.getFullYear(), monthIndex)) return;
    setViewMonth((m) => new Date(m.getFullYear(), monthIndex, 1));
    setView("days");
  }

  function handleSelectYear(year: number) {
    if (isYearDisabled(year)) return;
    setViewMonth((m) => new Date(year, m.getMonth(), 1));
    setView("days");
  }

  function handleTypedChange(event: React.ChangeEvent<HTMLInputElement>) {
    const next = formatTypedInput(event.target.value, sep);
    setDraftValue(next);

    const parsed = parseDisplay(next);
    if (parsed) {
      onChange(toISO(parsed));
      setViewMonth(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
      setDraftValue("");
    } else {
      onChange(next);
    }
  }

  const displayValue =
    variant === "underline" && allowTyping
      ? draftValue || (selected ? toDisplay(selected, sep) : value || "")
      : selected
        ? toDisplay(selected, sep)
        : "";

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

  const errorStyle: React.CSSProperties = {
    fontFamily: "var(--font-base)",
    fontSize: "clamp(11px, 0.72vw, 13px)",
    color: "var(--color-pink-dark)",
    margin: "4px 0 0",
  };

  const iconButtonStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "var(--color-text-secondary)",
  };

  return (
    <div ref={rootRef} style={{ position: "relative", textAlign: "left" }}>
      {label && <label style={labelStyle}>{label}</label>}

      {variant === "underline" ? (
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 10,
            borderBottom: `1px solid ${error ? "var(--color-pink-dark)" : "var(--color-text-primary)"}`,
            paddingBottom: 8,
          }}
        >
          {allowTyping ? (
            <input
              type="text"
              inputMode="numeric"
              placeholder={resolvedPlaceholder}
              value={displayValue}
              disabled={disabled}
              onChange={handleTypedChange}
              onFocus={() => setOpen(true)}
              style={{
                minWidth: 0,
                flex: 1,
                border: 0,
                background: "transparent",
                fontFamily: "var(--font-base)",
                fontSize: sz.font,
                color: "var(--color-text-primary)",
                outline: "none",
              }}
            />
          ) : (
            <button
              type="button"
              disabled={disabled}
              onClick={() => setOpen((o) => !o)}
              style={{
                minWidth: 0,
                flex: 1,
                border: 0,
                background: "transparent",
                textAlign: "left",
                fontFamily: "var(--font-base)",
                fontSize: sz.font,
                color: displayValue ? "var(--color-text-primary)" : "var(--color-text-muted)",
                cursor: disabled ? "not-allowed" : "pointer",
                padding: 0,
              }}
            >
              {displayValue || resolvedPlaceholder}
            </button>
          )}

          <button
            type="button"
            disabled={disabled}
            onClick={() => (open ? closeCalendar() : setOpen(true))}
            aria-label={t("openDatePicker")}
            style={{
              ...iconButtonStyle,
              marginBottom: 2,
              opacity: disabled ? 0.5 : 1,
              cursor: disabled ? "not-allowed" : "pointer",
            }}
          >
            <CalIcon size={size === "sm" ? 13 : 15} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((o) => !o)}
          style={{
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
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.5 : 1,
            width: "100%",
            textAlign: "left",
            outline: "none",
            boxSizing: "border-box",
            letterSpacing: "-0.011em",
            lineHeight: 1.5,
          }}
        >
          <span>{displayValue || resolvedPlaceholder}</span>
          <CalIcon size={size === "sm" ? 13 : 15} color="var(--color-text-secondary)" />
        </button>
      )}

      {error && <p style={errorStyle}>{error}</p>}

      {open && (
        <div
          ref={popoverRef}
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: variant === "underline" ? "50%" : "50%",
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <button
              type="button"
              onClick={() => handleNavigate(-1)}
              aria-label={
                view === "days"
                  ? t("previousMonth")
                  : view === "months"
                    ? t("previousYear")
                    : t("previousYears")
              }
              style={iconButtonStyle}
            >
              <ChevLeft />
            </button>

            {view === "days" ? (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontFamily: "var(--font-base)",
                  fontWeight: 600,
                  fontSize: "clamp(13px, 0.9vw, 16px)",
                  color: "#111",
                }}
              >
                <button
                  type="button"
                  onClick={() => setView("months")}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    borderRadius: 6,
                    padding: "2px 4px",
                    font: "inherit",
                    color: "inherit",
                  }}
                >
                  {monthFmt.format(viewMonth)}
                </button>
                <button
                  type="button"
                  onClick={() => setView("years")}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    borderRadius: 6,
                    padding: "2px 4px",
                    font: "inherit",
                    color: "inherit",
                  }}
                >
                  {yearFmt.format(viewMonth)}
                </button>
              </span>
            ) : view === "months" ? (
              <button
                type="button"
                onClick={() => setView("years")}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  borderRadius: 6,
                  padding: "2px 4px",
                  fontFamily: "var(--font-base)",
                  fontWeight: 600,
                  fontSize: "clamp(13px, 0.9vw, 16px)",
                  color: "#111",
                }}
              >
                {yearFmt.format(viewMonth)}
              </button>
            ) : (
              <span
                style={{
                  fontFamily: "var(--font-base)",
                  fontWeight: 600,
                  fontSize: "clamp(13px, 0.9vw, 16px)",
                  color: "#111",
                }}
              >
                {yearRangeStart} – {yearRangeStart + YEARS_PER_PAGE - 1}
              </span>
            )}

            <button
              type="button"
              onClick={() => handleNavigate(1)}
              aria-label={
                view === "days"
                  ? t("nextMonth")
                  : view === "months"
                    ? t("nextYear")
                    : t("nextYears")
              }
              style={iconButtonStyle}
            >
              <ChevRight />
            </button>
          </div>

          {view === "days" ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: "6px 0",
                textAlign: "center",
              }}
            >
              {weekDays.map((w, i) => (
                <span
                  key={i}
                  style={{
                    fontFamily: "var(--font-base)",
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    color: "#666",
                  }}
                >
                  {w}
                </span>
              ))}

              {days.map((day) => {
                const isCurrentMonth = day.getMonth() === viewMonth.getMonth();
                const isSel = sameDay(day, selected);
                const disabled = isDayDisabled(day);

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
                  background: isSel ? "linear-gradient(135deg, #a7bafa, #fcc4c3, #fff4da)" : "none",
                  color: isSel ? "#fff" : isCurrentMonth ? "#111" : "#ccc",
                  boxShadow: isSel ? "0 8px 20px rgba(167,186,250,0.5)" : "none",
                };

                return (
                  <button
                    key={toISO(day)}
                    type="button"
                    disabled={disabled}
                    onClick={() => handleSelect(day)}
                    style={btnStyle}
                    onMouseEnter={(e) => {
                      if (!isSel && !disabled)
                        (e.currentTarget as HTMLButtonElement).style.background = "#f3f5ff";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSel) (e.currentTarget as HTMLButtonElement).style.background = "none";
                    }}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>
          ) : view === "months" ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 8,
                textAlign: "center",
              }}
            >
              {Array.from({ length: 12 }, (_, monthIndex) => {
                const isSel =
                  selected !== null &&
                  selected.getFullYear() === viewMonth.getFullYear() &&
                  selected.getMonth() === monthIndex;
                const disabled = isMonthDisabled(viewMonth.getFullYear(), monthIndex);

                return (
                  <button
                    key={monthIndex}
                    type="button"
                    disabled={disabled}
                    onClick={() => handleSelectMonth(monthIndex)}
                    style={{
                      borderRadius: 8,
                      padding: "8px 0",
                      border: "none",
                      fontFamily: "var(--font-base)",
                      fontSize: "0.875rem",
                      cursor: disabled ? "not-allowed" : "pointer",
                      opacity: disabled ? 0.35 : 1,
                      background: isSel
                        ? "linear-gradient(135deg, #a7bafa, #fcc4c3, #fff4da)"
                        : "none",
                      color: isSel ? "#fff" : "#111",
                      boxShadow: isSel ? "0 8px 20px rgba(167,186,250,0.5)" : "none",
                    }}
                  >
                    {monthShortFmt.format(new Date(viewMonth.getFullYear(), monthIndex, 1))}
                  </button>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 8,
                textAlign: "center",
              }}
            >
              {years.map((year) => {
                const isSel = selected !== null && selected.getFullYear() === year;
                const disabled = isYearDisabled(year);

                return (
                  <button
                    key={year}
                    type="button"
                    disabled={disabled}
                    onClick={() => handleSelectYear(year)}
                    style={{
                      borderRadius: 8,
                      padding: "8px 0",
                      border: "none",
                      fontFamily: "var(--font-base)",
                      fontSize: "0.875rem",
                      cursor: disabled ? "not-allowed" : "pointer",
                      opacity: disabled ? 0.35 : 1,
                      background: isSel
                        ? "linear-gradient(135deg, #a7bafa, #fcc4c3, #fff4da)"
                        : "none",
                      color: isSel ? "#fff" : "#111",
                      boxShadow: isSel ? "0 8px 20px rgba(167,186,250,0.5)" : "none",
                    }}
                  >
                    {year}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
