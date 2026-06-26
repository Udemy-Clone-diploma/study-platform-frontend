"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getCalendarEvents,
  getIncomingInvitations,
  respondToInvitation,
} from "@/entities/course";
import type { CalendarEvent } from "@/entities/course/model/calendar";
import type { IncomingInvitation } from "@/entities/course/api/calendarApi";

// ── Helpers ──────────────────────────────────────────────────────────────────

const WEEK_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_FMT = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" });

function pad(n: number) { return String(n).padStart(2, "0"); }
function toISO(d: Date)  { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function fmtShort(iso: string) {
  const [, m, d] = iso.split("-");
  return `${d}.${m}`;
}

/** Returns Sunday ISO strings covering all weeks in the calendar grid. */
function weekStartsForGrid(days: Date[]): string[] {
  const seen = new Set<string>();
  for (const day of days) {
    if (day.getDay() === 0) seen.add(toISO(day)); // Sundays are week starts
  }
  return [...seen];
}

/** Returns the next N week Sunday ISO strings starting from the current Sunday. */
function upcomingWeekStarts(n: number): string[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - today.getDay());
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i * 7);
    return toISO(d);
  });
}

// ── Visuals ───────────────────────────────────────────────────────────────────

const GRADIENT = "linear-gradient(135deg, #a7bafa 0%, #fcc4c3 55%, #fff4da 100%)";

function ChevLeft() {
  return (
    <span style={{
      display: "block", width: 7, height: 7,
      transform: "rotate(45deg)", border: "0 solid",
      borderBottomWidth: 1.8, borderLeftWidth: 1.8, borderColor: "currentColor",
    }} />
  );
}
function ChevRight() {
  return (
    <span style={{
      display: "block", width: 7, height: 7,
      transform: "rotate(45deg)", border: "0 solid",
      borderTopWidth: 1.8, borderRightWidth: 1.8, borderColor: "currentColor",
    }} />
  );
}

// ── Day cell ──────────────────────────────────────────────────────────────────

function DayCell({
  day, inMonth, isSelected, isToday, hasEvent, onClick,
}: {
  day: number;
  inMonth: boolean;
  isSelected: boolean;
  isToday: boolean;
  hasEvent: boolean;
  onClick: () => void;
}) {
  if (!inMonth) {
    return (
      <div className="mx-auto flex h-9 w-9 items-center justify-center text-[11px] text-black/15">
        {day}
      </div>
    );
  }

  if (isToday || isSelected) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="mx-auto flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-semibold text-white"
        style={{ background: GRADIENT }}
      >
        {day}
      </button>
    );
  }

  if (hasEvent) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="mx-auto block h-9 w-9 rounded-full p-[1.5px] transition-opacity hover:opacity-70"
        style={{ background: GRADIENT }}
      >
        <span className="flex h-full w-full items-center justify-center rounded-full bg-white text-[11px] text-black">
          {day}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="mx-auto flex h-9 w-9 items-center justify-center rounded-full text-[11px] text-black transition-colors hover:bg-black/5"
    >
      {day}
    </button>
  );
}

// ── Tab button ────────────────────────────────────────────────────────────────

function TabBtn({ active, onClick, children, badge }: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  badge?: number;
}) {
  const badgeEl = badge ? (
    <span
      className="ml-1.5 inline-flex items-center justify-center rounded-full text-[9px] font-bold leading-none text-white"
      style={{ width: 15, height: 15, minWidth: 15, background: active ? "rgba(0,0,0,0.3)" : "#121212" }}
    >
      {badge}
    </span>
  ) : null;

  if (active) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium text-black"
        style={{ background: GRADIENT }}
      >
        {children}{badgeEl}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center rounded-full border border-black/25 px-3 py-1 text-[11px] font-medium text-black transition-colors hover:border-black/40"
    >
      {children}{badgeEl}
    </button>
  );
}

// ── Event card ────────────────────────────────────────────────────────────────

function EventCard({ event, badge }: { event: CalendarEvent; badge?: string }) {
  const label =
    event.type === "personal"
      ? (event.title ?? "Personal event")
      : (event.course_title ?? "Session");

  const meta =
    event.type === "personal"
      ? `${event.start_time} – ${event.end_time}`
      : `${event.type === "group_session" ? "Group" : "Individual"}  |  ${event.start_time} – ${event.end_time}`;

  const isCancelled   = event.event_status === "cancelled";
  const isRescheduled = event.event_status === "rescheduled";
  const isReplacement = !!event.rescheduled_from_date;

  return (
    <div className={`flex items-start gap-2 rounded-md bg-white/70 px-3 py-3 shadow-sm ${isCancelled ? "opacity-50" : ""}`}>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-semibold text-black ${isCancelled ? "line-through" : ""}`}>{label}</p>
        <p className="mt-1 text-xs text-black/70">{meta}</p>
        {event.cohort_name && (
          <p className="mt-0.5 text-[11px] text-black/50">{event.cohort_name}</p>
        )}
        {event.student && (
          <p className="mt-0.5 text-[11px] text-black/50">{event.student.name || event.student.email}</p>
        )}
        {isReplacement && event.rescheduled_from_date && (
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-green-600">
            ← Moved from {fmtShort(event.rescheduled_from_date)}
          </p>
        )}
      </div>
      {badge && (
        <span className="shrink-0 whitespace-nowrap text-[11px] font-medium text-[#003aff]">
          {badge}
        </span>
      )}
      {isCancelled && (
        <span className="shrink-0 whitespace-nowrap text-[10px] font-bold uppercase tracking-wide text-red-500">
          Cancelled
        </span>
      )}
      {isRescheduled && event.rescheduled_to_date && (
        <span className="shrink-0 whitespace-nowrap text-[10px] font-bold uppercase tracking-wide text-orange-500">
          → {fmtShort(event.rescheduled_to_date)}
        </span>
      )}
    </div>
  );
}

// ── Invitation card ───────────────────────────────────────────────────────────

function InvitationCard({ inv, onRespond }: { inv: IncomingInvitation; onRespond: () => void }) {
  const [busy, setBusy] = useState(false);

  async function respond(action: "accept" | "decline") {
    setBusy(true);
    try { await respondToInvitation(inv.id, action); onRespond(); }
    catch {} finally { setBusy(false); }
  }

  return (
    <div className="rounded-md bg-white/70 px-3 py-3 shadow-sm">
      <p className="truncate text-sm font-semibold text-black">{inv.event.title}</p>
      <p className="mt-0.5 text-xs text-black/70">
        {fmtShort(inv.event.date)} · {inv.event.start_time} – {inv.event.end_time}
      </p>
      <p className="mt-0.5 text-[11px] text-black/50">by {inv.event.organizer}</p>
      {inv.event.meeting_link && (
        <a
          href={inv.event.meeting_link}
          target="_blank"
          rel="noreferrer"
          className="mt-1 block truncate text-[11px] text-blue-600 underline"
        >
          {inv.event.meeting_link}
        </a>
      )}
      <div className="mt-2.5 flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => respond("accept")}
          className="rounded-full px-3 py-1 text-[11px] font-medium text-black disabled:opacity-50"
          style={{ background: GRADIENT }}
        >
          Accept
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => respond("decline")}
          className="rounded-full border border-black/25 px-3 py-1 text-[11px] font-medium text-black/60 transition-colors hover:border-black/40 disabled:opacity-50"
        >
          Decline
        </button>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

type Tab = "day" | "upcoming" | "invitations";

/** Right-rail calendar + events panel shared by teacher and student dashboards. */
export function ScheduleRail() {
  const todayDate  = useMemo(() => new Date(), []);
  const todayISO   = useMemo(() => toISO(todayDate), [todayDate]);

  const [viewMonth,    setViewMonth]    = useState(() => new Date(todayDate.getFullYear(), todayDate.getMonth(), 1));
  const [selectedISO,  setSelectedISO]  = useState(todayISO);
  const [tab,          setTab]          = useState<Tab>("day");
  const [eventMap,     setEventMap]     = useState<Record<string, CalendarEvent[]>>({});
  const [loading,      setLoading]      = useState(false);
  const [invitations,  setInvitations]  = useState<IncomingInvitation[]>([]);

  // 35- or 42-cell grid
  const days = useMemo(() => {
    const first = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
    const totalCells = (first.getDay() + daysInMonth) > 35 ? 42 : 35;
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay());
    return Array.from({ length: totalCells }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [viewMonth]);

  // Fetch weeks covering the visible month grid
  const fetchMonth = useCallback(async (grid: Date[]) => {
    const weekStarts = weekStartsForGrid(grid);
    setLoading(true);
    try {
      const results = await Promise.all(weekStarts.map(ws => getCalendarEvents(ws).catch(() => null)));
      const merged: Record<string, CalendarEvent[]> = {};
      for (const res of results) {
        if (!res) continue;
        for (const ev of res.events) {
          if (ev.is_available === true) continue;
          (merged[ev.date] ??= []).push(ev);
        }
      }
      setEventMap(prev => ({ ...prev, ...merged }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMonth(days); }, [days, fetchMonth]);

  // Pre-fetch next 12 weeks so "Upcoming" always has data beyond the current month
  useEffect(() => {
    const weekStarts = upcomingWeekStarts(12);
    Promise.all(weekStarts.map(ws => getCalendarEvents(ws).catch(() => null))).then(results => {
      const merged: Record<string, CalendarEvent[]> = {};
      for (const res of results) {
        if (!res) continue;
        for (const ev of res.events) {
          if (ev.is_available === true) continue;
          (merged[ev.date] ??= []).push(ev);
        }
      }
      setEventMap(prev => ({ ...prev, ...merged }));
    });
  }, []); // once on mount

  // Fetch pending invitations
  function loadInvitations() {
    getIncomingInvitations()
      .then(data => setInvitations(data.filter(i => i.status === "pending")))
      .catch(() => {});
  }
  useEffect(() => { loadInvitations(); }, []);

  const allSelectedEvs = eventMap[selectedISO] ?? [];
  const activeSelectedEvs = allSelectedEvs.filter(e => !e.event_status);
  const hiddenProcessedIds = new Set(
    allSelectedEvs
      .filter(e => e.event_status)
      .filter(pe => activeSelectedEvs.some(ae => ae.start_time < pe.end_time && pe.start_time < ae.end_time))
      .map(e => e.id),
  );
  const selectedEvents = allSelectedEvs.filter(e => !hiddenProcessedIds.has(e.id));
  const isSelectedToday = selectedISO === todayISO;
  const dayLabel = isSelectedToday ? "Today" : fmtShort(selectedISO);

  const upcomingEvents = useMemo(() => {
    return Object.entries(eventMap)
      .filter(([iso]) => iso > todayISO)
      .sort(([a], [b]) => a.localeCompare(b))
      .flatMap(([iso, evs]) => evs.filter(e => !e.event_status).map(e => ({ event: e, iso })))
      .slice(0, 10);
  }, [eventMap, todayISO]);

  function selectDate(iso: string) {
    setSelectedISO(iso);
    setTab("day");
  }

  return (
    <aside
      className="flex flex-col rounded-xl gap-4 overflow-hidden bg-[linear-gradient(180deg,#fff4da_0%,#fcc4c3_45%,#a7bafa_100%)]"
      style={{ height: "var(--schedule-height, calc(100vh - 76px))" } as React.CSSProperties}
    >

      {/* ── Calendar card ── */}
      <div className="shrink-0 rounded-xl bg-white p-4 shadow-[0_0_16px_rgba(0,0,0,0.14)]">

        {/* Month nav */}
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setViewMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
            className="flex h-7 w-7 items-center justify-center rounded-full text-black transition-colors hover:bg-black/5"
          >
            <ChevLeft />
          </button>
          <h2 className="text-sm font-semibold text-black">{MONTH_FMT.format(viewMonth)}</h2>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setViewMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
            className="flex h-7 w-7 items-center justify-center rounded-full text-black transition-colors hover:bg-black/5"
          >
            <ChevRight />
          </button>
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-y-3 text-center">
          {WEEK_DAYS.map(d => (
            <span key={d} className="text-[11px] font-medium text-[#5e5e5e]">{d}</span>
          ))}
          {days.map((day, i) => {
            const iso        = toISO(day);
            const inMonth    = day.getMonth() === viewMonth.getMonth();
            const isSelected = iso === selectedISO;
            const isTodayDay = iso === todayISO;
            const hasEvent   = inMonth && (eventMap[iso]?.some(e => !e.event_status) ?? false);
            return (
              <DayCell
                key={`${iso}-${i}`}
                day={day.getDate()}
                inMonth={inMonth}
                isSelected={isSelected}
                isToday={isTodayDay}
                hasEvent={hasEvent}
                onClick={() => selectDate(iso)}
              />
            );
          })}
        </div>

        {loading && (
          <p className="mt-2 text-center text-[10px] text-black/30">Loading…</p>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="shrink-0 flex flex-wrap gap-1.5 px-4">
        <TabBtn active={tab === "day"} onClick={() => setTab("day")}>
          {dayLabel}
        </TabBtn>
        <TabBtn active={tab === "upcoming"} onClick={() => setTab("upcoming")}>
          Upcoming
        </TabBtn>
        <TabBtn
          active={tab === "invitations"}
          onClick={() => setTab("invitations")}
          badge={invitations.length > 0 ? invitations.length : undefined}
        >
          Invitations
        </TabBtn>
      </div>

      {/* ── Content ── */}
      <div
        className="mx-2 mb-4 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto rounded-2xl   p-3 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/50"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.5) transparent" }}
      >
        {tab === "day" && (
          selectedEvents.length > 0
            ? selectedEvents.map((e, i) => <EventCard key={i} event={e} />)
            : <p className="py-2 text-center text-[11px] text-black/50">
                {isSelectedToday ? "No events today" : "No events on this date"}
              </p>
        )}

        {tab === "upcoming" && (
          upcomingEvents.length > 0
            ? upcomingEvents.map(({ event, iso }, i) => (
                <EventCard key={i} event={event} badge={fmtShort(iso)} />
              ))
            : <p className="py-2 text-center text-[11px] text-black/50">No upcoming events</p>
        )}

        {tab === "invitations" && (
          invitations.length > 0
            ? invitations.map(inv => (
                <InvitationCard key={inv.id} inv={inv} onRespond={loadInvitations} />
              ))
            : <p className="py-2 text-center text-[11px] text-black/50">No pending invitations</p>
        )}
      </div>
    </aside>
  );
}
