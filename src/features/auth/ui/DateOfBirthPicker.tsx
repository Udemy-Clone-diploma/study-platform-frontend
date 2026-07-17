"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface DateOfBirthPickerProps {
  value: string;
  error?: string;
  onChange: (value: string) => void;
}

const MONTH_FORMATTER = new Intl.DateTimeFormat("en", {
  month: "long",
});
const YEAR_FORMATTER = new Intl.DateTimeFormat("en", { year: "numeric" });
const MONTH_SHORT_FORMATTER = new Intl.DateTimeFormat("en", { month: "short" });

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const YEARS_PER_PAGE = 12;

type CalendarView = "days" | "months" | "years";

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toDisplayDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${day}-${month}-${year}`;
}

function parseDateInputValue(value: string) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function parseDisplayDateValue(value: string) {
  if (!value) {
    return null;
  }

  const [day, month, year] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function isSameDay(first: Date | null, second: Date | null) {
  return (
    Boolean(first && second) &&
    first?.getFullYear() === second?.getFullYear() &&
    first?.getMonth() === second?.getMonth() &&
    first?.getDate() === second?.getDate()
  );
}

function formatDateInput(rawValue: string) {
  const digits = rawValue.replace(/\D/g, "").slice(0, 8);
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);

  return [day, month, year].filter(Boolean).join("-");
}

export function DateOfBirthPicker({ value, error, onChange }: DateOfBirthPickerProps) {
  const selectedDate = parseDateInputValue(value);
  const today = useMemo(() => new Date(), []);
  const initialMonth = selectedDate ?? new Date(today.getFullYear() - 18, today.getMonth(), 1);
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1),
  );
  const [draftValue, setDraftValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<CalendarView>("days");
  const rootRef = useRef<HTMLDivElement>(null);
  const displayValue = draftValue || (selectedDate ? toDisplayDateValue(selectedDate) : "");

  function closeCalendar() {
    setIsOpen(false);
    setView("days");
  }

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        closeCalendar();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const days = useMemo(() => {
    const firstDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const gridStart = new Date(firstDay);
    gridStart.setDate(firstDay.getDate() - firstDay.getDay());

    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(gridStart);
      day.setDate(gridStart.getDate() + index);
      return day;
    });
  }, [visibleMonth]);

  const yearRangeStart = Math.floor(visibleMonth.getFullYear() / YEARS_PER_PAGE) * YEARS_PER_PAGE;
  const years = Array.from({ length: YEARS_PER_PAGE }, (_, index) => yearRangeStart + index);

  function moveMonth(offset: number) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  function moveYear(offset: number) {
    setVisibleMonth((current) => new Date(current.getFullYear() + offset, current.getMonth(), 1));
  }

  function moveYearPage(offset: number) {
    setVisibleMonth(
      (current) => new Date(current.getFullYear() + offset * YEARS_PER_PAGE, current.getMonth(), 1),
    );
  }

  function handleNavigate(offset: number) {
    if (view === "days") moveMonth(offset);
    else if (view === "months") moveYear(offset);
    else moveYearPage(offset);
  }

  function handleSelectMonth(monthIndex: number) {
    setVisibleMonth((current) => new Date(current.getFullYear(), monthIndex, 1));
    setView("days");
  }

  function handleSelectYear(year: number) {
    setVisibleMonth((current) => new Date(year, current.getMonth(), 1));
    setView("days");
  }

  function handleSelect(day: Date) {
    if (day > today) {
      return;
    }

    onChange(toDateInputValue(day));
    setDraftValue("");
    closeCalendar();
  }

  function handleManualChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextDisplayValue = formatDateInput(event.target.value);
    setDraftValue(nextDisplayValue);

    const parsedDate = parseDisplayDateValue(nextDisplayValue);
    if (parsedDate) {
      onChange(toDateInputValue(parsedDate));
      setVisibleMonth(new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1));
      setDraftValue("");
    } else {
      onChange(nextDisplayValue);
    }
  }

  return (
    <div ref={rootRef} className="relative text-left">
      <label className="mb-2 block text-[1.1rem] font-medium tracking-[0.01em] text-[#1a171b]">
        Date of Birth
      </label>

      <div className="flex items-end gap-3 border-b border-black/35 pb-2 transition focus-within:border-black/70 hover:border-black/55">
        <input
          type="text"
          inputMode="numeric"
          placeholder="DD-MM-YYYY"
          value={displayValue}
          onChange={handleManualChange}
          onFocus={() => setIsOpen(true)}
          className="min-w-0 flex-1 border-0 bg-transparent text-base text-[#1a171b] outline-none placeholder:text-[#8b858d]"
        />

        <button
          type="button"
          onClick={() => (isOpen ? closeCalendar() : setIsOpen(true))}
          aria-label="Open date picker"
          className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition hover:bg-black/5"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-4 w-4 text-[#4d474f]"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M8 2v4M16 2v4M3 10h18" />
          </svg>
        </button>
      </div>

      {error ? <p className="mt-2 text-sm text-[#be3b3b]">{error}</p> : null}

      {isOpen ? (
        <div className="absolute top-full left-1/2 z-30 mt-3 w-[min(88vw,300px)] -translate-x-1/2 rounded-[18px] border border-[#dbe5ff] bg-white p-4 shadow-[0_16px_42px_rgba(83,98,153,0.2)]">
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => handleNavigate(-1)}
              aria-label={
                view === "days" ? "Previous month" : view === "months" ? "Previous year" : "Previous years"
              }
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition hover:bg-black/5"
            >
              <span className="block h-2.5 w-2.5 rotate-45 border-b-2 border-l-2 border-black" />
            </button>

            {view === "days" ? (
              <p className="flex items-center gap-1 text-[1.05rem] font-medium text-[#111111]">
                <button
                  type="button"
                  onClick={() => setView("months")}
                  className="rounded-md px-1 transition hover:bg-[#f3f5ff]"
                >
                  {MONTH_FORMATTER.format(visibleMonth)}
                </button>
                <button
                  type="button"
                  onClick={() => setView("years")}
                  className="rounded-md px-1 transition hover:bg-[#f3f5ff]"
                >
                  {YEAR_FORMATTER.format(visibleMonth)}
                </button>
              </p>
            ) : view === "months" ? (
              <button
                type="button"
                onClick={() => setView("years")}
                className="rounded-md px-1 text-[1.05rem] font-medium text-[#111111] transition hover:bg-[#f3f5ff]"
              >
                {YEAR_FORMATTER.format(visibleMonth)}
              </button>
            ) : (
              <p className="text-[1.05rem] font-medium text-[#111111]">
                {yearRangeStart} - {yearRangeStart + YEARS_PER_PAGE - 1}
              </p>
            )}

            <button
              type="button"
              onClick={() => handleNavigate(1)}
              aria-label={view === "days" ? "Next month" : view === "months" ? "Next year" : "Next years"}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition hover:bg-black/5"
            >
              <span className="block h-2.5 w-2.5 rotate-45 border-r-2 border-t-2 border-black" />
            </button>
          </div>

          {view === "days" ? (
            <div className="grid grid-cols-7 gap-y-2 text-center">
              {DAY_LABELS.map((label) => (
                <span key={label} className="text-[0.78rem] font-medium text-[#666666]">
                  {label}
                </span>
              ))}

              {days.map((day) => {
                const isCurrentMonth = day.getMonth() === visibleMonth.getMonth();
                const isSelected = isSameDay(day, selectedDate);
                const isDisabled = day > today;

                return (
                  <button
                    key={toDateInputValue(day)}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleSelect(day)}
                    className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-[0.88rem] transition disabled:cursor-not-allowed ${
                      isSelected
                        ? "bg-[linear-gradient(135deg,#a7bafa,#fcc4c3,#fff4da)] text-white shadow-[0_8px_20px_rgba(167,186,250,0.5)]"
                        : isCurrentMonth
                          ? "text-[#111111] hover:bg-[#f3f5ff]"
                          : "text-[#d0d0d0]"
                    } ${isDisabled ? "opacity-35 hover:bg-transparent" : ""}`}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>
          ) : view === "months" ? (
            <div className="grid grid-cols-3 gap-2 text-center">
              {Array.from({ length: 12 }, (_, monthIndex) => {
                const monthDate = new Date(visibleMonth.getFullYear(), monthIndex, 1);
                const isSelected =
                  selectedDate !== null &&
                  selectedDate.getFullYear() === visibleMonth.getFullYear() &&
                  selectedDate.getMonth() === monthIndex;
                const isDisabled = monthDate > today;

                return (
                  <button
                    key={monthIndex}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleSelectMonth(monthIndex)}
                    className={`rounded-lg py-2 text-[0.88rem] transition disabled:cursor-not-allowed ${
                      isSelected
                        ? "bg-[linear-gradient(135deg,#a7bafa,#fcc4c3,#fff4da)] text-white shadow-[0_8px_20px_rgba(167,186,250,0.5)]"
                        : "text-[#111111] hover:bg-[#f3f5ff]"
                    } ${isDisabled ? "opacity-35 hover:bg-transparent" : ""}`}
                  >
                    {MONTH_SHORT_FORMATTER.format(monthDate)}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 text-center">
              {years.map((year) => {
                const isSelected = selectedDate !== null && selectedDate.getFullYear() === year;
                const isDisabled = year > today.getFullYear();

                return (
                  <button
                    key={year}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleSelectYear(year)}
                    className={`rounded-lg py-2 text-[0.88rem] transition disabled:cursor-not-allowed ${
                      isSelected
                        ? "bg-[linear-gradient(135deg,#a7bafa,#fcc4c3,#fff4da)] text-white shadow-[0_8px_20px_rgba(167,186,250,0.5)]"
                        : "text-[#111111] hover:bg-[#f3f5ff]"
                    } ${isDisabled ? "opacity-35 hover:bg-transparent" : ""}`}
                  >
                    {year}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
