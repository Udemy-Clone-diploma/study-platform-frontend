"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { CalendarDeadline, CalendarEvent } from "@/entities/course/model/calendar";
import type { TeacherUnavailability } from "@/entities/course/model/schedule";
import { timeToMinutes } from "@/shared/lib/time";

const START_HOUR  = 7;
const END_HOUR    = 23;
const TOTAL_HOURS = END_HOUR - START_HOUR; // 16
const TOTAL_MIN   = TOTAL_HOURS * 60;      // 960
const HOURS = Array.from({ length: TOTAL_HOURS }, (_, i) => i + START_HOUR);
const ROW_H = "clamp(36px, 2.76vw, 56px)";

const DAY_ABBR = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const CHIP_BAR_GRADIENT =
  "linear-gradient(180deg, #A7BAFA 0%, #FCC4C3 50.96%, #FFF4DA 100%)";

function chipColors(event: CalendarEvent): { bg: string; textColor: string; barColor?: string } {
  if (event.type === "group_session")     return { bg: "rgba(252,196,195,0.5)", textColor: "#8B2624" };
  if (event.type === "personal")          return { bg: "rgba(195,235,210,0.5)", textColor: "#1A6633" };
  if (event.type === "personal_shared")   return { bg: "rgba(195,235,210,0.5)", textColor: "#1A6633", barColor: "rgba(59,130,246,0.75)" };
  if (event.type === "extra_session")     return { bg: "rgba(255,225,140,0.5)", textColor: "#7C5000", barColor: "rgba(210,150,0,0.6)" };
  if (event.is_available === true)        return { bg: "rgba(220,220,220,0.45)", textColor: "#777", barColor: "rgba(180,180,180,0.7)" };
  return { bg: "rgba(167,186,250,0.5)", textColor: "var(--color-text-primary)" };
}

function fmtChipTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}


function getWeekSunday(d: Date): Date {
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  // Days since most-recent Sunday: jsDay (0=Sun → 0, Mon → 1, …, Sat → 6)
  day.setDate(day.getDate() - day.getDay());
  return day;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isToday(d: Date): boolean {
  const t = new Date();
  return (
    d.getFullYear() === t.getFullYear() &&
    d.getMonth()    === t.getMonth()    &&
    d.getDate()     === t.getDate()
  );
}


function colBg(d: Date): string {
  if (isToday(d)) return "var(--color-calendar-today)";
  return "#fff";
}

function monthLabel(monday: Date): string {
  const sunday = addDays(monday, 6);
  if (monday.getMonth() === sunday.getMonth()) {
    return new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(monday);
  }
  const m1 = new Intl.DateTimeFormat("en", { month: "short" }).format(monday);
  const m2 = new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(sunday);
  return `${m1} / ${m2}`;
}

function pct(minutes: number): string {
  return `${(minutes / TOTAL_MIN) * 100}%`;
}

function eventLayout(start: string, end: string): { top: string; height: string } | null {
  const s = Math.max(timeToMinutes(start) - START_HOUR * 60, 0);
  const e = Math.min(timeToMinutes(end)   - START_HOUR * 60, TOTAL_MIN);
  if (e <= 0 || s >= TOTAL_MIN || e <= s) return null;
  const minH = TOTAL_MIN / TOTAL_HOURS;
  return { top: pct(s), height: pct(Math.max(e - s, minH)) };
}

function jsToBackendDay(jsDay: number): number {
  return jsDay === 0 ? 6 : jsDay - 1;
}

function unavailForDay(blocks: TeacherUnavailability[], d: Date): TeacherUnavailability[] {
  const iso = toISO(d);
  const bd  = jsToBackendDay(d.getDay());
  return blocks.filter(b => {
    if (b.recurrence_type === "weekly")     return b.day_of_week === bd;
    if (b.recurrence_type === "one_time")   return b.date === iso;
    if (b.recurrence_type === "date_range")
      return !!b.date && !!b.date_to && b.date <= iso && iso <= b.date_to;
    return false;
  });
}

function EventChip({
  event,
  onClick,
}: {
  event: CalendarEvent;
  role: "teacher" | "student";
  onClick?: (ev: CalendarEvent) => void;
}) {
  const layout = eventLayout(event.start_time, event.end_time);
  if (!layout) return null;

  const isCancelled   = event.event_status === "cancelled";
  const isRescheduled = event.event_status === "rescheduled";

  const { bg, textColor, barColor } = chipColors(event);
  const chipBar = isCancelled
    ? "rgba(150,150,150,0.65)"
    : isRescheduled
      ? "rgba(230,120,0,0.65)"
      : (barColor ?? CHIP_BAR_GRADIENT);

  const isPersonalEvent = event.type === "personal" || event.type === "personal_shared";
  const subtitle = isPersonalEvent
    ? (event.title ?? "")
    : [event.course_title, event.cohort_name, event.student?.name].filter(Boolean).join(" · ");

  const tooltipText = `${subtitle}${event.lesson_title ? ` — ${event.lesson_title}` : ""}${isCancelled ? " [Cancelled]" : isRescheduled ? ` [→ ${event.rescheduled_to_date ?? ""}]` : ""}`;

  const TINY: React.CSSProperties = {
    fontFamily: "var(--font-accent)",
    fontWeight: 700,
    fontSize: "clamp(7px, 0.48vw, 9px)",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    lineHeight: 1.2,
    marginTop: 1,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };

  return (
    <div
      title={tooltipText}
      onClick={e => { e.stopPropagation(); onClick?.(event); }}
      style={{
        position: "absolute",
        top: layout.top,
        height: layout.height,
        left: 2,
        right: 2,
        borderRadius: 4,
        display: "flex",
        flexDirection: "row",
        alignItems: "stretch",
        overflow: "hidden",
        zIndex: 2,
        cursor: onClick ? "pointer" : "default",
        background: bg,
        opacity: isCancelled ? 0.65 : 1,
        boxSizing: "border-box",
      }}
    >
      <div style={{ width: 3, flexShrink: 0, background: chipBar }} />
      <div style={{ flex: 1, minWidth: 0, padding: "4px 6px", display: "flex", flexDirection: "column", gap: 2, overflow: "hidden" }}>
        <div style={{ fontFamily: "var(--font-accent)", fontWeight: 500, fontSize: "clamp(9px, 0.63vw, 11px)", color: textColor, lineHeight: 1.4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textDecoration: isCancelled ? "line-through" : "none" }}>
          {fmtChipTime(event.start_time)} – {fmtChipTime(event.end_time)}
        </div>
        {subtitle && (
          <div style={{ fontFamily: "var(--font-base)", fontWeight: 600, fontSize: "clamp(8px, 0.56vw, 10px)", color: textColor, lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textDecoration: isCancelled ? "line-through" : "none" }}>
            {subtitle}
          </div>
        )}
        {event.type === "personal_shared" && !isCancelled && !isRescheduled && (
          <div style={{ ...TINY, color: "rgba(59,130,246,0.85)" }}>↗ Shared</div>
        )}
        {isCancelled && <div style={{ ...TINY, color: "rgba(120,0,0,0.8)" }}>✕ Cancelled</div>}
        {isRescheduled && (
          <div style={{ ...TINY, color: "rgba(180,90,0,0.9)" }}>
            {event.rescheduled_to_date ? `→ ${event.rescheduled_to_date.slice(5).split("-").reverse().join(".")}` : "→ Rescheduled"}
          </div>
        )}
      </div>
    </div>
  );
}

function UnavailChip({ block }: { block: TeacherUnavailability }) {
  const layout = eventLayout(block.start_time.slice(0, 5), block.end_time.slice(0, 5));
  if (!layout) return null;
  return (
    <div
      title={block.reason || "Unavailable"}
      style={{
        position: "absolute",
        top: layout.top,
        height: layout.height,
        left: 0,
        right: 0,
        background:
          "repeating-linear-gradient(45deg,rgba(0,0,0,0.04) 0px,rgba(0,0,0,0.04) 4px,transparent 4px,transparent 8px)",
        borderLeft: "2px solid var(--color-text-muted)",
        zIndex: 1,
        pointerEvents: "none",
        boxSizing: "border-box",
      }}
    />
  );
}

function DayColumn({
  date,
  events,
  unavailability,
  isLast,
  role,
  activeHour,
  onSlotClick,
  onEventClick,
}: {
  date: Date;
  events: CalendarEvent[];
  unavailability: TeacherUnavailability[];
  isLast: boolean;
  role: "teacher" | "student";
  activeHour?: number;
  onSlotClick?: (date: string, hour: number) => void;
  onEventClick?: (event: CalendarEvent) => void;
}) {
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);
  const baseBg        = colBg(date);
  const unavailBlocks = unavailForDay(unavailability, date);
  const dateISO       = toISO(date);
  const BORDER        = "1px solid var(--color-calendar-border)";

  const todayISO = toISO(new Date());
  const nowHour  = new Date().getHours();

  return (
    <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
      {HOURS.map(h => {
        const isPastSlot = dateISO < todayISO || (dateISO === todayISO && h < nowHour);
        let bg = baseBg;
        if (isPastSlot) bg = baseBg; // no hover/active tint on past slots
        else if (activeHour === h)  bg = "rgba(167,186,250,0.22)";
        else if (hoveredHour === h && onSlotClick) bg = "rgba(167,186,250,0.09)";
        return (
          <div
            key={h}
            onClick={() => { if (!isPastSlot) onSlotClick?.(dateISO, h); }}
            onMouseEnter={() => setHoveredHour(h)}
            onMouseLeave={() => setHoveredHour(null)}
            style={{
              height: ROW_H,
              background: bg,
              borderBottom: BORDER,
              borderRight: isLast ? "none" : BORDER,
              boxSizing: "border-box",
              cursor: (onSlotClick && !isPastSlot) ? "pointer" : "default",
              transition: "background 0.1s",
            }}
          />
        );
      })}
      {unavailBlocks.map((b, i) => <UnavailChip key={i} block={b} />)}
      {(() => {
        const activeEvs = events.filter(e => !e.event_status);
        const hiddenIds = new Set(
          events
            .filter(e => e.event_status === "cancelled" || e.event_status === "rescheduled")
            .filter(pe => activeEvs.some(ae => ae.start_time < pe.end_time && pe.start_time < ae.end_time))
            .map(e => e.id)
        );
        return events.map(ev =>
          hiddenIds.has(ev.id) ? null : <EventChip key={ev.id} event={ev} role={role} onClick={onEventClick} />
        );
      })()}
    </div>
  );
}

const NAV_BTN: React.CSSProperties = {
  background: "rgba(255,255,255,0.6)",
  border: "none",
  borderRadius: 20,
  width: 40,
  height: 40,
  padding: 8,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  color: "var(--color-text-primary)",
  boxSizing: "border-box",
};

export type WeekCalendarProps = {
  events: CalendarEvent[];
  unavailability?: TeacherUnavailability[];
  deadlines?: CalendarDeadline[];
  onWeekChange?: (weekStart: string) => void;
  role?: "teacher" | "student";
  onSlotClick?: (date: string, hour: number) => void;
  onEventClick?: (event: CalendarEvent) => void;
  /** Called when a day header with deadlines is clicked. */
  onDayHeaderClick?: (date: string) => void;
  /** The currently selected slot — that cell gets an active highlight. */
  activeSlot?: { date: string; hour: number } | null;
  /** Extra buttons rendered in the toolbar to the right of navigation. */
  actions?: React.ReactNode;
};

/** Full-width weekly grid calendar. Week runs Monday–Sunday. */
export function WeekCalendar({
  events,
  unavailability = [],
  deadlines = [],
  onWeekChange,
  role = "student",
  onSlotClick,
  onEventClick,
  onDayHeaderClick,
  activeSlot,
  actions,
}: WeekCalendarProps) {
  const [sunday, setSunday] = useState<Date>(() => getWeekSunday(new Date()));

  function navigate(delta: number) {
    const next = addDays(sunday, delta * 7);
    setSunday(next);
    onWeekChange?.(toISO(next));
  }

  function goToday() {
    const s = getWeekSunday(new Date());
    setSunday(s);
    onWeekChange?.(toISO(s));
  }

  const columns  = Array.from({ length: 7 }, (_, i) => addDays(sunday, i));
  const todayISO = toISO(new Date());
  const TIME_W   = "clamp(36px, 2.5vw, 48px)";
  const TIME_GAP = "clamp(8px, 0.97vw, 14px)";
  const BORDER   = "1px solid var(--color-calendar-border)";

  function eventsForCol(d: Date): CalendarEvent[] {
    return events.filter(e => e.date === toISO(d));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", background: "var(--color-calendar-bg)" }}>

      {/* ── Toolbar ── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingBlock: "clamp(8px, 0.6vw, 12px)",
        flexShrink: 0,
        gap: 12,
      }}>
        {/* Left: arrows + month label — offset to align with day columns */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginLeft: `calc(${TIME_W} + ${TIME_GAP})` }}>
          <button type="button" onClick={() => navigate(-1)} style={NAV_BTN}><ChevronLeft size={18} /></button>
          <button type="button" onClick={() => navigate(1)}  style={NAV_BTN}><ChevronRight size={18} /></button>
          <span style={{
            fontFamily: "var(--font-accent)",
            fontWeight: 400,
            fontSize: "28px",
            color: "#000000",
            textTransform: "capitalize",
          }}>
            {monthLabel(sunday)}
          </span>
        </div>

        {/* Right: Today + actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button type="button" onClick={goToday} style={{
            fontFamily: "var(--font-base)",
            fontWeight: 600,
            fontSize: "clamp(11px, 0.72vw, 13px)",
            color: "var(--color-text-primary)",
            background: "rgba(255,255,255,0.7)",
            border: "1px solid var(--color-calendar-border)",
            borderRadius: 999,
            padding: "4px 14px",
            cursor: "pointer",
          }}>
            Today
          </button>
          {actions}
        </div>
      </div>

      {/* ── Day header row ── */}
      <div style={{ display: "flex", flexShrink: 0, borderBottom: BORDER }}>
        <div style={{ width: TIME_W, flexShrink: 0, marginRight: TIME_GAP }} />
        {columns.map((d, i) => {
          const bg     = colBg(d);
          const active = toISO(d) === todayISO;
          const dayDeadlines = deadlines.filter(dl => dl.date === toISO(d));
          const hasDeadlines = dayDeadlines.length > 0;
          return (
            <div
              key={i}
              onClick={hasDeadlines ? () => onDayHeaderClick?.(toISO(d)) : undefined}
              style={{
                position: "relative",
                flex: 1,
                minWidth: 0,
                height: "clamp(48px, 4.44vw, 68px)",
                background: bg,
                borderRight: i === 6 ? "none" : BORDER,
                padding: "4px clamp(4px, 0.52vw, 8px) 0",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                gap: 2,
                cursor: hasDeadlines ? "pointer" : "default",
              }}
            >
              {hasDeadlines && (
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "var(--color-blue)",
                  }}
                />
              )}
              <span style={{
                fontFamily: "var(--font-base)",
                fontWeight: 700,
                fontSize: "clamp(9px, 0.63vw, 11px)",
                color: "var(--color-text-secondary)",
                lineHeight: 1,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}>
                {DAY_ABBR[i]}
              </span>
              <span style={{
                fontFamily: "var(--font-accent)",
                fontWeight: 500,
                fontSize: "clamp(16px, 1.46vw, 24px)",
                color: active ? "var(--color-blue)" : "var(--color-text-primary)",
                lineHeight: 1,
              }}>
                {d.getDate()}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Body ── */}
      <div style={{ display: "flex" }}>

        {/* Time labels */}
        <div style={{ width: TIME_W, flexShrink: 0, marginRight: TIME_GAP }}>
          {HOURS.map(h => (
            <div key={h} style={{
              height: ROW_H,
              display: "flex",
              alignItems: "flex-start",
              paddingTop: 3,
              justifyContent: "flex-end",
              borderBottom: BORDER,
              boxSizing: "border-box",
            }}>
              <span style={{
                fontFamily: "var(--font-accent)",
                fontWeight: 500,
                fontSize: "clamp(9px, 0.63vw, 12px)",
                color: "var(--color-text-secondary)",
                lineHeight: 1,
              }}>
                {h === 12 ? "12 PM" : h > 12 ? `${h - 12} PM` : `${h} AM`}
              </span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        {columns.map((d, i) => {
          const colISO     = toISO(d);
          const activeHour = activeSlot?.date === colISO ? activeSlot.hour : undefined;
          return (
          <DayColumn
            key={i}
            date={d}
            events={eventsForCol(d)}
            unavailability={unavailability}
            isLast={i === 6}
            role={role}
            activeHour={activeHour}
            onSlotClick={onSlotClick}
            onEventClick={onEventClick}
          />
          );
        })}
      </div>
    </div>
  );
}
