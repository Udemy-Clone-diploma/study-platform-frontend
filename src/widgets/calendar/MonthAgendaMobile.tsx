"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Lock, Plus } from "lucide-react";
import { getCalendarEvents } from "@/entities/course";
import type { CalendarDeadline, CalendarEvent } from "@/entities/course/model/calendar";
import { getWeekdayNames } from "@/shared/lib/time";
import { chipColors } from "./WeekCalendar";

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function toISO(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function weekStartsForGrid(days: Date[]): string[] {
  const seen = new Set<string>();
  for (const day of days) {
    if (day.getDay() === 0) seen.add(toISO(day));
  }
  return [...seen];
}

const GRADIENT = "linear-gradient(90deg, #A7BAFA 0%, #FCC4C3 50.96%, #FFF4DA 100%)";

function NavArrow({
  direction,
  onClick,
  label,
}: {
  direction: "left" | "right";
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex shrink-0 items-center justify-center rounded-lg bg-white text-black shadow-[0_0_4px_rgba(0,0,0,0.16)] transition-colors hover:bg-black/5"
      style={{
        width: "clamp(36px, calc(28.35px + 1.96vw), 46px)",
        height: "clamp(36px, calc(28.35px + 1.96vw), 46px)",
      }}
    >
      <span
        style={{
          display: "block",
          width: "clamp(8px, calc(6.47px + 0.39vw), 10px)",
          height: "clamp(8px, calc(6.47px + 0.39vw), 10px)",
          transform: direction === "left" ? "rotate(-135deg)" : "rotate(45deg)",
          border: "0 solid",
          borderTopWidth: 2,
          borderRightWidth: 2,
          borderColor: "currentColor",
        }}
      />
    </button>
  );
}

function DayCell({
  day,
  inMonth,
  isSelected,
  isToday,
  dotColors,
  onClick,
}: {
  day: number;
  inMonth: boolean;
  isSelected: boolean;
  isToday: boolean;
  dotColors: string[];
  onClick: () => void;
}) {
  const cellFont = "clamp(13px, calc(9.94px + 0.78vw), 17px)";
  const cellWrapH = "clamp(40px, calc(30.82px + 2.35vw), 52px)";
  const circleSize = "clamp(28px, calc(21.88px + 1.57vw), 36px)";
  const dotSize = "clamp(4px, calc(2.47px + 0.39vw), 6px)";

  if (!inMonth) {
    return (
      <div
        className="flex items-center justify-center text-black/20"
        style={{ height: cellWrapH, fontSize: cellFont }}
      >
        {day}
      </div>
    );
  }

  const highlighted = isSelected || isToday;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1"
      style={{ height: cellWrapH }}
    >
      <span
        className={`flex items-center justify-center rounded-lg font-medium ${
          highlighted ? "text-white" : "text-black"
        }`}
        style={{
          width: circleSize,
          height: circleSize,
          fontSize: cellFont,
          ...(highlighted
            ? { background: isSelected ? "var(--color-brand-lavender)" : GRADIENT }
            : {}),
        }}
      >
        {day}
      </span>
      {dotColors.length > 0 && (
        <span className="flex items-center gap-[2px]">
          {dotColors.map((color, i) => (
            <span
              key={i}
              className="rounded-full"
              style={{ width: dotSize, height: dotSize, border: `1.2px solid ${color}` }}
            />
          ))}
        </span>
      )}
    </button>
  );
}

function fmtChipTime(hhmm: string, locale: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(2000, 0, 1, h, m);
  return new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" }).format(d);
}

function AgendaEventCard({ event, onClick }: { event: CalendarEvent; onClick: () => void }) {
  const t = useTranslations("ScheduleRail");
  const tWeek = useTranslations("WeekCalendar");
  const locale = useLocale();
  const { bg, textColor, barColor } = chipColors(event);
  const label =
    event.type === "personal" || event.type === "personal_shared"
      ? (event.title ?? t("personalEvent"))
      : (event.course_title ?? t("session"));
  const isCancelled = event.event_status === "cancelled";
  const isRescheduled = event.event_status === "rescheduled";
  const bar = isCancelled
    ? "rgba(150,150,150,0.65)"
    : isRescheduled
      ? "rgba(230,120,0,0.65)"
      : (barColor ?? GRADIENT);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-stretch overflow-hidden rounded-md text-left ${isCancelled ? "opacity-50" : ""}`}
      style={{ background: bg }}
    >
      <span className="w-[3px] shrink-0 self-stretch" style={{ background: bar }} aria-hidden />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 px-3 py-2">
        <span
          className="font-semibold"
          style={{ color: textColor, fontSize: "clamp(11px, calc(8.71px + 0.59vw), 14px)" }}
        >
          {fmtChipTime(event.start_time, locale)} – {fmtChipTime(event.end_time, locale)}
        </span>
        <span
          className={`truncate font-semibold ${isCancelled ? "line-through" : ""}`}
          style={{ color: textColor, fontSize: "clamp(13px, calc(10.71px + 0.59vw), 16px)" }}
        >
          {label}
        </span>
        {isCancelled && (
          <span
            className="font-bold uppercase tracking-wide"
            style={{
              color: "rgba(120,0,0,0.8)",
              fontSize: "clamp(9px, calc(7.24px + 0.31vw), 11px)",
            }}
          >
            ✕ {t("cancelled")}
          </span>
        )}
        {isRescheduled && (
          <span
            className="font-bold uppercase tracking-wide"
            style={{
              color: "rgba(180,90,0,0.9)",
              fontSize: "clamp(9px, calc(7.24px + 0.31vw), 11px)",
            }}
          >
            {event.rescheduled_to_date
              ? `→ ${event.rescheduled_to_date.slice(5).split("-").reverse().join(".")}`
              : `→ ${tWeek("rescheduledShort")}`}
          </span>
        )}
      </span>
    </button>
  );
}

type Props = {
  role: "teacher" | "student";
  onEventClick: (event: CalendarEvent) => void;
  onAddEvent: (date: string, hour: number) => void;
  onBlockTime?: () => void;
  onDayHeaderClick?: (date: string) => void;
  /** Bump this after any mutation (add/edit/delete/reschedule/cancel/restore) to force a refetch. */
  refreshKey?: number;
};

/** Mobile-only month grid + selected-day agenda, replacing the week grid below `lg`. */
export function MonthAgendaMobile({
  role,
  onEventClick,
  onAddEvent,
  onBlockTime,
  onDayHeaderClick,
  refreshKey,
}: Props) {
  const t = useTranslations("ScheduleRail");
  const tCalendar = useTranslations("CalendarView");
  const locale = useLocale();
  const weekDays = useMemo(() => getWeekdayNames(locale, "short"), [locale]);
  const monthOnlyFmt = useMemo(() => new Intl.DateTimeFormat(locale, { month: "long" }), [locale]);
  const yearOnlyFmt = useMemo(() => new Intl.DateTimeFormat(locale, { year: "numeric" }), [locale]);
  const todayDate = useMemo(() => new Date(), []);
  const todayISO = useMemo(() => toISO(todayDate), [todayDate]);

  const [viewMonth, setViewMonth] = useState(
    () => new Date(todayDate.getFullYear(), todayDate.getMonth(), 1),
  );
  const [selectedISO, setSelectedISO] = useState(todayISO);
  const [eventMap, setEventMap] = useState<Record<string, CalendarEvent[]>>({});
  const [deadlineMap, setDeadlineMap] = useState<Record<string, CalendarDeadline[]>>({});

  const days = useMemo(() => {
    const first = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
    const totalCells = first.getDay() + daysInMonth > 35 ? 42 : 35;
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay());
    return Array.from({ length: totalCells }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [viewMonth]);

  const fetchMonth = useCallback(async (grid: Date[]) => {
    const weekStarts = weekStartsForGrid(grid);
    const results = await Promise.all(
      weekStarts.map((ws) => getCalendarEvents(ws).catch(() => null)),
    );
    const merged: Record<string, CalendarEvent[]> = {};
    const mergedDeadlines: Record<string, CalendarDeadline[]> = {};
    for (const res of results) {
      if (!res) continue;
      for (const ev of res.events) {
        if (ev.is_available === true) continue;
        (merged[ev.date] ??= []).push(ev);
      }
      for (const dl of res.deadlines) {
        (mergedDeadlines[dl.date] ??= []).push(dl);
      }
    }
    setEventMap((prev) => ({ ...prev, ...merged }));
    setDeadlineMap((prev) => ({ ...prev, ...mergedDeadlines }));
  }, []);

  useEffect(() => {
    // refreshKey isn't read, only bumped, to force a refetch after a mutation
    setEventMap({});
    setDeadlineMap({});
    fetchMonth(days);
  }, [days, fetchMonth, refreshKey]);

  function visibleEventsFor(iso: string): CalendarEvent[] {
    const all = eventMap[iso] ?? [];
    const active = all.filter((e) => !e.event_status);
    const hiddenIds = new Set(
      all
        .filter((e) => e.event_status)
        .filter((pe) =>
          active.some((ae) => ae.start_time < pe.end_time && pe.start_time < ae.end_time),
        )
        .map((e) => e.id),
    );
    return all.filter((e) => !hiddenIds.has(e.id));
  }

  const selectedEvents = visibleEventsFor(selectedISO);
  const selectedDeadlines = deadlineMap[selectedISO] ?? [];
  const isSelectedToday = selectedISO === todayISO;

  return (
    <div className="relative flex flex-col gap-4 pb-20">
      <div className="flex items-center justify-between px-4">
        <NavArrow
          direction="left"
          label={t("previousMonth")}
          onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
        />
        <h2 className="flex flex-col items-center font-semibold text-black">
          <span
            className="capitalize"
            style={{ fontSize: "clamp(18px, calc(11.88px + 1.57vw), 26px)" }}
          >
            {monthOnlyFmt.format(viewMonth)}
          </span>
          <span
            className="font-normal text-black/50"
            style={{ fontSize: "clamp(11px, calc(8.71px + 0.59vw), 14px)" }}
          >
            {yearOnlyFmt.format(viewMonth)}
          </span>
        </h2>
        <NavArrow
          direction="right"
          label={t("nextMonth")}
          onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
        />
      </div>

      <div className="grid grid-cols-7 px-2 text-center">
        {weekDays.map((d, i) => (
          <span
            key={i}
            className="font-medium text-[#5e5e5e]"
            style={{ fontSize: "clamp(11px, calc(8.71px + 0.59vw), 14px)" }}
          >
            {d}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-2 px-2">
        {days.map((day, i) => {
          const iso = toISO(day);
          const inMonth = day.getMonth() === viewMonth.getMonth();
          const dayEvents = inMonth ? visibleEventsFor(iso) : [];
          const dotColors = [...new Set(dayEvents.map((e) => chipColors(e).textColor))].slice(0, 3);
          return (
            <DayCell
              key={`${iso}-${i}`}
              day={day.getDate()}
              inMonth={inMonth}
              isSelected={iso === selectedISO}
              isToday={iso === todayISO}
              dotColors={dotColors}
              onClick={() => setSelectedISO(iso)}
            />
          );
        })}
      </div>

      <div className="flex flex-col gap-2 px-4">
        {selectedDeadlines.map((dl) => (
          <button
            key={dl.assignment_id}
            type="button"
            onClick={() => onDayHeaderClick?.(selectedISO)}
            className="flex items-center justify-between rounded-md bg-white px-3 py-2 text-left shadow-sm"
            style={{ border: "1px solid var(--color-blue)" }}
          >
            <span
              className="min-w-0 flex-1 truncate font-semibold text-black"
              style={{ fontSize: "clamp(13px, calc(10.71px + 0.59vw), 16px)" }}
            >
              {dl.title}
            </span>
            <span
              className="shrink-0 font-bold uppercase tracking-wide text-(--color-blue)"
              style={{ fontSize: "clamp(10px, calc(8.47px + 0.39vw), 12px)" }}
            >
              {t("deadline")}
            </span>
          </button>
        ))}
        {selectedEvents.length > 0 ? (
          selectedEvents.map((ev) => (
            <AgendaEventCard key={ev.id} event={ev} onClick={() => onEventClick(ev)} />
          ))
        ) : selectedDeadlines.length === 0 ? (
          <p
            className="py-4 text-center text-black/50"
            style={{ fontSize: "clamp(13px, calc(10.71px + 0.59vw), 16px)" }}
          >
            {isSelectedToday ? t("noEventsToday") : t("noEventsOnDate")}
          </p>
        ) : null}
      </div>

      <div className="fixed bottom-[calc(103px+env(safe-area-inset-bottom)+16px)] left-1/2 z-10 flex -translate-x-1/2 items-center gap-3">
        {role === "teacher" && onBlockTime && (
          <button
            type="button"
            aria-label={tCalendar("blockTime")}
            onClick={onBlockTime}
            className="flex items-center justify-center rounded-full bg-white shadow-[0_3px_30px_rgba(0,0,0,0.16)]"
            style={{
              width: "clamp(44px, calc(38.44px + 1.37vw), 50px)",
              height: "clamp(44px, calc(38.44px + 1.37vw), 50px)",
            }}
          >
            <Lock size={18} color="var(--color-text-primary)" strokeWidth={2} />
          </button>
        )}
        <button
          type="button"
          aria-label={tCalendar("addEvent")}
          onClick={() => onAddEvent(selectedISO, new Date().getHours())}
          className="flex items-center justify-center rounded-full bg-(--color-brand-pink) shadow-[0_3px_30px_rgba(0,0,0,0.08)]"
          style={{
            width: "clamp(50px, calc(43.88px + 1.57vw), 58px)",
            height: "clamp(50px, calc(43.88px + 1.57vw), 58px)",
          }}
        >
          <Plus size={20} color="white" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
