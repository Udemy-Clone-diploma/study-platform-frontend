"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { getCalendarEvents, getIncomingInvitations, respondToInvitation } from "@/entities/course";
import type { CalendarDeadline, CalendarEvent } from "@/entities/course/model/calendar";
import type { IncomingInvitation, InvitationConflict } from "@/entities/course/api/calendarApi";
import { getWeekdayNames } from "@/shared/lib/time";
import { apiErrorMessage } from "@/shared/api/lib/apiErrorMessage";

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function toISO(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
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

const GRADIENT = "linear-gradient(135deg, #a7bafa 0%, #fcc4c3 55%, #fff4da 100%)";
// Fits 7 day-cells inside the dashboard's calendar column down to a 1024px viewport, unchanged above ~1259px.
const CELL_SIZE = "clamp(28px, calc(23.43px + 0.45vw), 32px)";
const CARD_PADDING = "clamp(10px, calc(3.14px + 0.67vw), 16px)";
const MONTH_TITLE_SIZE = "clamp(13px, calc(9.57px + 0.34vw), 16px)";
const CALENDAR_TEXT_SIZE = "clamp(11px, calc(7.57px + 0.34vw), 14px)";

function ChevLeft() {
  return (
    <span
      style={{
        display: "block",
        width: 7,
        height: 7,
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
        width: 7,
        height: 7,
        transform: "rotate(45deg)",
        border: "0 solid",
        borderTopWidth: 1.8,
        borderRightWidth: 1.8,
        borderColor: "currentColor",
      }}
    />
  );
}

function DeadlineDot() {
  return (
    <span
      aria-hidden
      className="absolute rounded-full"
      style={{
        top: -2,
        right: -2,
        width: 8,
        height: 8,
        background: "var(--color-blue)",
        border: "1.5px solid white",
      }}
    />
  );
}

function DayCell({
  day,
  inMonth,
  isSelected,
  isToday,
  hasEvent,
  hasDeadline,
  onClick,
}: {
  day: number;
  inMonth: boolean;
  isSelected: boolean;
  isToday: boolean;
  hasEvent: boolean;
  hasDeadline: boolean;
  onClick: () => void;
}) {
  if (!inMonth) {
    return (
      <div
        className="mx-auto flex items-center justify-center text-black/15"
        style={{ height: CELL_SIZE, width: CELL_SIZE, fontSize: CALENDAR_TEXT_SIZE }}
      >
        {day}
      </div>
    );
  }

  let inner: React.ReactNode;
  if (isToday || isSelected) {
    inner = (
      <button
        type="button"
        onClick={onClick}
        className="mx-auto flex items-center justify-center rounded-full font-semibold text-white"
        style={{
          height: CELL_SIZE,
          width: CELL_SIZE,
          fontSize: CALENDAR_TEXT_SIZE,
          background: GRADIENT,
        }}
      >
        {day}
      </button>
    );
  } else if (hasEvent) {
    inner = (
      <button
        type="button"
        onClick={onClick}
        className="mx-auto block rounded-full p-[1.5px] transition-opacity hover:opacity-70"
        style={{ height: CELL_SIZE, width: CELL_SIZE, background: GRADIENT }}
      >
        <span
          className="flex h-full w-full items-center justify-center rounded-full bg-white text-black"
          style={{ fontSize: CALENDAR_TEXT_SIZE }}
        >
          {day}
        </span>
      </button>
    );
  } else {
    inner = (
      <button
        type="button"
        onClick={onClick}
        className="mx-auto flex items-center justify-center rounded-full text-black transition-colors hover:bg-black/5"
        style={{ height: CELL_SIZE, width: CELL_SIZE, fontSize: CALENDAR_TEXT_SIZE }}
      >
        {day}
      </button>
    );
  }

  if (!hasDeadline) return inner;

  return (
    <div className="relative mx-auto" style={{ width: CELL_SIZE, height: CELL_SIZE }}>
      {inner}
      <DeadlineDot />
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  badge?: number;
}) {
  const badgeEl = badge ? (
    <span
      className="ml-1.5 inline-flex items-center justify-center rounded-full text-[9px] font-bold leading-none text-white"
      style={{
        width: 15,
        height: 15,
        minWidth: 15,
        background: active ? "rgba(0,0,0,0.3)" : "#121212",
      }}
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
        {children}
        {badgeEl}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center rounded-full border border-black/25 px-3 py-1 text-[11px] font-medium text-black transition-colors hover:border-black/40"
    >
      {children}
      {badgeEl}
    </button>
  );
}

function EventCard({ event, badge }: { event: CalendarEvent; badge?: string }) {
  const t = useTranslations("ScheduleRail");
  const label =
    event.type === "personal"
      ? (event.title ?? t("personalEvent"))
      : (event.course_title ?? t("session"));

  const meta =
    event.type === "personal"
      ? `${event.start_time} – ${event.end_time}`
      : `${event.type === "group_session" ? t("groupSession") : t("individualSession")}  |  ${event.start_time} – ${event.end_time}`;

  const isCancelled = event.event_status === "cancelled";
  const isRescheduled = event.event_status === "rescheduled";
  const isReplacement = !!event.rescheduled_from_date;

  return (
    <div
      className={`flex items-start gap-2 rounded-md bg-white/70 px-3 py-3 shadow-sm ${isCancelled ? "opacity-50" : ""}`}
    >
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm font-semibold text-black ${isCancelled ? "line-through" : ""}`}
        >
          {label}
        </p>
        <p className="mt-1 text-xs text-black/70">{meta}</p>
        {event.cohort_name && (
          <p className="mt-0.5 text-[11px] text-black/50">{event.cohort_name}</p>
        )}
        {event.student && (
          <p className="mt-0.5 text-[11px] text-black/50">
            {event.student.name || event.student.email}
          </p>
        )}
        {isReplacement && event.rescheduled_from_date && (
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-green-600">
            {t("movedFrom", { date: fmtShort(event.rescheduled_from_date) })}
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
          {t("cancelled")}
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

function DeadlineCard({ deadline, badge }: { deadline: CalendarDeadline; badge?: string }) {
  const t = useTranslations("ScheduleRail");
  return (
    <div
      className="flex items-start gap-2 rounded-md bg-white/70 px-3 py-3 shadow-sm"
      style={{ border: "1px solid var(--color-blue)" }}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-black">{deadline.title}</p>
        <p className="mt-1 text-xs text-black/70">{deadline.course_title}</p>
      </div>
      <span className="shrink-0 whitespace-nowrap text-[10px] font-bold uppercase tracking-wide text-[#003aff]">
        {badge ?? t("deadline")}
      </span>
    </div>
  );
}

function conflictLabel(c: InvitationConflict, t: (key: string) => string): string {
  const prefix =
    c.type === "session"
      ? t("session")
      : c.type === "shared_event"
        ? t("sharedEvent")
        : t("personalEvent");
  return `${prefix}: ${c.title} · ${c.start_time}–${c.end_time}`;
}

function InvitationCard({ inv, onRespond }: { inv: IncomingInvitation; onRespond: () => void }) {
  const t = useTranslations("ScheduleRail");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const hasConflicts = inv.conflicts.length > 0;

  async function respond(action: "accept" | "decline") {
    setBusy(true);
    setErr("");
    try {
      await respondToInvitation(inv.id, action);
      onRespond();
    } catch (e) {
      setErr(apiErrorMessage(e, t("respondFailed")));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-md bg-white/70 px-3 py-3 shadow-sm">
      <p className="truncate text-sm font-semibold text-black">{inv.event.title}</p>
      <p className="mt-0.5 text-xs text-black/70">
        {fmtShort(inv.event.date)} · {inv.event.start_time} – {inv.event.end_time}
      </p>
      <p className="mt-0.5 text-[11px] text-black/50">
        {t("invitedBy", { organizer: inv.event.organizer })}
      </p>
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

      {hasConflicts && (
        <div className="mt-2 rounded bg-red-50 px-2 py-1.5 text-[10px] text-red-600">
          <p className="mb-0.5 font-semibold uppercase tracking-wide">{t("scheduleConflict")}</p>
          {inv.conflicts.map((c, i) => (
            <p key={i} className="truncate">
              {conflictLabel(c, t)}
            </p>
          ))}
        </div>
      )}

      <div className="mt-2.5 flex gap-2">
        <button
          type="button"
          disabled={busy || hasConflicts}
          onClick={() => respond("accept")}
          className="rounded-full px-3 py-1 text-[11px] font-medium text-black disabled:cursor-not-allowed disabled:opacity-40"
          style={{ background: hasConflicts ? "rgba(0,0,0,0.08)" : GRADIENT }}
        >
          {t("accept")}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => respond("decline")}
          className="rounded-full border border-black/25 px-3 py-1 text-[11px] font-medium text-black/60 transition-colors hover:border-black/40 disabled:opacity-50"
        >
          {t("decline")}
        </button>
      </div>

      {err && (
        <p role="alert" className="mt-2 text-[11px] font-medium text-(--color-danger)">
          {err}
        </p>
      )}
    </div>
  );
}

type Tab = "day" | "upcoming" | "invitations";

/** Right-rail calendar + events panel shared by teacher and student dashboards. */
export function ScheduleRail() {
  const t = useTranslations("ScheduleRail");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const weekDays = useMemo(() => getWeekdayNames(locale, "short"), [locale]);
  const monthFmt = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }),
    [locale],
  );
  const todayDate = useMemo(() => new Date(), []);
  const todayISO = useMemo(() => toISO(todayDate), [todayDate]);

  const searchParams = useSearchParams();
  const [viewMonth, setViewMonth] = useState(
    () => new Date(todayDate.getFullYear(), todayDate.getMonth(), 1),
  );
  const [selectedISO, setSelectedISO] = useState(todayISO);
  const [tab, setTab] = useState<Tab>(() =>
    searchParams.get("tab") === "invitations" ? "invitations" : "day",
  );
  const [eventMap, setEventMap] = useState<Record<string, CalendarEvent[]>>({});
  const [deadlineMap, setDeadlineMap] = useState<Record<string, CalendarDeadline[]>>({});
  const [loading, setLoading] = useState(false);
  const [invitations, setInvitations] = useState<IncomingInvitation[]>([]);

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
    setLoading(true);
    try {
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
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMonth(days);
  }, [days, fetchMonth]);

  // Pre-fetch next 12 weeks so "Upcoming" always has data beyond the current month
  useEffect(() => {
    const weekStarts = upcomingWeekStarts(12);
    Promise.all(weekStarts.map((ws) => getCalendarEvents(ws).catch(() => null))).then((results) => {
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
    });
  }, []);

  function loadInvitations() {
    getIncomingInvitations()
      .then((data) => setInvitations(data.filter((i) => i.status === "pending")))
      .catch(() => {});
  }
  useEffect(() => {
    loadInvitations();
  }, []);

  const allSelectedEvs = eventMap[selectedISO] ?? [];
  const activeSelectedEvs = allSelectedEvs.filter((e) => !e.event_status);
  const hiddenProcessedIds = new Set(
    allSelectedEvs
      .filter((e) => e.event_status)
      .filter((pe) =>
        activeSelectedEvs.some((ae) => ae.start_time < pe.end_time && pe.start_time < ae.end_time),
      )
      .map((e) => e.id),
  );
  const selectedEvents = allSelectedEvs.filter((e) => !hiddenProcessedIds.has(e.id));
  const selectedDeadlines = deadlineMap[selectedISO] ?? [];
  const isSelectedToday = selectedISO === todayISO;
  const dayLabel = isSelectedToday ? t("today") : fmtShort(selectedISO);

  const upcomingEvents = useMemo(() => {
    return Object.entries(eventMap)
      .filter(([iso]) => iso > todayISO)
      .sort(([a], [b]) => a.localeCompare(b))
      .flatMap(([iso, evs]) => evs.filter((e) => !e.event_status).map((e) => ({ event: e, iso })))
      .slice(0, 10);
  }, [eventMap, todayISO]);

  const upcomingDeadlines = useMemo(() => {
    return Object.entries(deadlineMap)
      .filter(([iso]) => iso > todayISO)
      .sort(([a], [b]) => a.localeCompare(b))
      .flatMap(([, dls]) => dls)
      .slice(0, 10);
  }, [deadlineMap, todayISO]);

  function selectDate(iso: string) {
    setSelectedISO(iso);
    setTab("day");
  }

  return (
    <aside className="flex h-[620px] flex-col rounded-xl gap-4 bg-[linear-gradient(180deg,#fff4da_0%,#fcc4c3_45%,#a7bafa_100%)] lg:h-[var(--schedule-height,calc(100vh-76px))]">
      <div
        className="shrink-0 rounded-xl bg-[#fafafa] shadow-[0px_0px_17px_rgba(0,0,0,0.16)]"
        style={{ padding: CARD_PADDING }}
      >
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            aria-label={t("previousMonth")}
            onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
            className="flex h-7 w-7 items-center justify-center rounded-full text-black transition-colors hover:bg-black/5"
          >
            <ChevLeft />
          </button>
          <h2 className="font-semibold text-black" style={{ fontSize: MONTH_TITLE_SIZE }}>
            {monthFmt.format(viewMonth)}
          </h2>
          <button
            type="button"
            aria-label={t("nextMonth")}
            onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
            className="flex h-7 w-7 items-center justify-center rounded-full text-black transition-colors hover:bg-black/5"
          >
            <ChevRight />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-y-3 text-center">
          {weekDays.map((d, i) => (
            <span
              key={i}
              className="font-medium text-[#5e5e5e]"
              style={{ fontSize: CALENDAR_TEXT_SIZE }}
            >
              {d}
            </span>
          ))}
          {days.map((day, i) => {
            const iso = toISO(day);
            const inMonth = day.getMonth() === viewMonth.getMonth();
            const isSelected = iso === selectedISO;
            const isTodayDay = iso === todayISO;
            const hasEvent = inMonth && (eventMap[iso]?.some((e) => !e.event_status) ?? false);
            const hasDeadline = inMonth && (deadlineMap[iso]?.length ?? 0) > 0;
            return (
              <DayCell
                key={`${iso}-${i}`}
                day={day.getDate()}
                inMonth={inMonth}
                isSelected={isSelected}
                isToday={isTodayDay}
                hasEvent={hasEvent}
                hasDeadline={hasDeadline}
                onClick={() => selectDate(iso)}
              />
            );
          })}
        </div>

        {loading && (
          <p className="mt-2 text-center text-[10px] text-black/30">{tCommon("loading")}</p>
        )}
      </div>

      <div className="shrink-0 flex flex-wrap gap-1.5 px-4">
        <TabBtn active={tab === "day"} onClick={() => setTab("day")}>
          {dayLabel}
        </TabBtn>
        <TabBtn active={tab === "upcoming"} onClick={() => setTab("upcoming")}>
          {t("upcoming")}
        </TabBtn>
        <TabBtn
          active={tab === "invitations"}
          onClick={() => setTab("invitations")}
          badge={invitations.length > 0 ? invitations.length : undefined}
        >
          {t("invitations")}
        </TabBtn>
      </div>

      <div
        className="mx-2 mb-4 flex min-h-[180px] flex-1 flex-col gap-2 overflow-y-auto rounded-2xl   p-3 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/50"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.5) transparent" }}
      >
        {tab === "day" &&
          (selectedEvents.length > 0 || selectedDeadlines.length > 0 ? (
            <>
              {selectedEvents.map((e, i) => (
                <EventCard key={`ev-${i}`} event={e} />
              ))}
              {selectedDeadlines.map((dl) => (
                <DeadlineCard key={`dl-${dl.assignment_id}`} deadline={dl} />
              ))}
            </>
          ) : (
            <p className="py-2 text-center text-[11px] text-black/50">
              {isSelectedToday ? t("noEventsToday") : t("noEventsOnDate")}
            </p>
          ))}

        {tab === "upcoming" &&
          (upcomingEvents.length > 0 || upcomingDeadlines.length > 0 ? (
            <>
              {upcomingEvents.map(({ event, iso }, i) => (
                <EventCard key={`ev-${i}`} event={event} badge={fmtShort(iso)} />
              ))}
              {upcomingDeadlines.map((dl) => (
                <DeadlineCard
                  key={`dl-${dl.assignment_id}`}
                  deadline={dl}
                  badge={fmtShort(dl.date)}
                />
              ))}
            </>
          ) : (
            <p className="py-2 text-center text-[11px] text-black/50">{t("noUpcomingEvents")}</p>
          ))}

        {tab === "invitations" &&
          (invitations.length > 0 ? (
            invitations.map((inv) => (
              <InvitationCard key={inv.id} inv={inv} onRespond={loadInvitations} />
            ))
          ) : (
            <p className="py-2 text-center text-[11px] text-black/50">
              {t("noPendingInvitations")}
            </p>
          ))}
      </div>
    </aside>
  );
}
