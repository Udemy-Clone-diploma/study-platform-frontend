"use client";

import { useEffect, useState } from "react";
import { Link2, Plus, ExternalLink } from "lucide-react";
import { WeekCalendar, toISO } from "./WeekCalendar";
import { padTwo } from "@/shared/lib/time";
import { SidePanel } from "@/shared/ui/SidePanel";
import { SelectField } from "@/shared/ui/SelectField";
import { UnavailabilitySection } from "@/features/courses/ui/CourseManagementScheduleTab";
import {
  getCalendarEvents,
  createCalendarEvent,
  getTeacherCourses,
  getEnrolledCourses,
  getCourseBySlug,
  getCourseEnrolledStudents,
  getCohorts,
  getCohortSchedules,
} from "@/entities/course";
import type { CalendarEventPayload, CalendarEvent } from "@/entities/course/model/calendar";
import type { TeacherUnavailability, CohortSchedule } from "@/entities/course/model/schedule";
import type { CourseListItem } from "@/entities/course/model/types";
import type { CourseLesson } from "@/entities/course/model/module";
import type { CourseCohort } from "@/entities/course/model/cohort";
import type { EnrolledStudent } from "@/entities/course/model/cohortGroup";

function currentWeekMondayISO(): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const jsDay = today.getDay();
  const diff = jsDay === 0 ? -6 : 1 - jsDay;
  today.setDate(today.getDate() + diff);
  return toISO(today);
}

// client-side fallback: backend /calendar/ returns only booked/assigned sessions;
// recurring CohortSchedule entries are aggregated here for the teacher view.
async function fetchGroupEvents(weekStart: string): Promise<CalendarEvent[]> {
  const [y, mo, d] = weekStart.split("-").map(Number);
  const weekMon = new Date(y, mo - 1, d);
  const all: CalendarEvent[] = [];

  let courses: CourseListItem[];
  try { courses = (await getTeacherCourses()).results; } catch { return []; }

  await Promise.all(
    courses.map(async (course) => {
      // getCohorts may return a paginated object on some backends; normalise defensively
      let cohorts: CourseCohort[];
      try {
        const raw = await getCohorts(course.slug);
        cohorts = Array.isArray(raw) ? raw : ((raw as { results?: CourseCohort[] }).results ?? []);
      } catch { return; }

      await Promise.all(
        cohorts.map(async (cohort) => {
          let schedules: CohortSchedule[];
          try { schedules = await getCohortSchedules(course.slug, cohort.id); } catch { return; }

          for (const sched of schedules) {
            const eventDate = new Date(weekMon);
            eventDate.setDate(weekMon.getDate() + sched.day_of_week); // day_of_week: 0=Mon

            // Use proper date comparison, not string lexicographic comparison
            if (cohort.start_date) {
              const [sy, sm, sd] = cohort.start_date.split("-").map(Number);
              if (eventDate < new Date(sy, sm - 1, sd)) continue;
            }

            all.push({
              id: `gen-${cohort.id}-${sched.id}-${toISO(eventDate)}`,
              type: "group_session",
              date: toISO(eventDate),
              start_time: sched.start_time.slice(0, 5),
              end_time:   sched.end_time.slice(0, 5),
              course_title: course.title,
              course_slug:  course.slug,
              cohort_name:  cohort.name,
              student:      null,
              meeting_link: null,
              is_available: null,
            });
          }
        })
      );
    })
  );

  return all;
}

type DrawerState =
  | { type: "new";   date: string; hour: number }
  | { type: "view";  event: CalendarEvent }
  | { type: "block" }
  | null;


const DRAWER_LABEL: React.CSSProperties = {
  fontFamily: "var(--font-base)",
  fontWeight: 600,
  fontSize: "clamp(10px, 0.7vw, 12px)",
  color: "var(--color-text-secondary)",
  display: "block",
  marginBottom: 4,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const DRAWER_INPUT: React.CSSProperties = {
  fontFamily: "var(--font-base)",
  fontSize: "clamp(13px, 0.85vw, 15px)",
  color: "var(--color-text-primary)",
  background: "transparent",
  border: "none",
  borderBottom: "1px solid var(--color-border-light)",
  padding: "6px 0",
  width: "100%",
  outline: "none",
};

const DRAWER_ADD_BTN: React.CSSProperties = {
  fontFamily: "var(--font-base)",
  fontWeight: 700,
  fontSize: "clamp(12px, 0.85vw, 14px)",
  color: "#fff",
  background: "var(--color-text-primary)",
  border: "none",
  borderRadius: 999,
  padding: "8px 28px",
  cursor: "pointer",
};

type EventKind = "personal" | "academic";

function KindToggle({ value, onChange }: { value: EventKind; onChange: (v: EventKind) => void }) {
  const btn = (kind: EventKind, label: string) => {
    const active = value === kind;
    return (
      <button
        key={kind}
        type="button"
        onClick={() => onChange(kind)}
        style={{
          flex: 1,
          fontFamily: "var(--font-base)",
          fontWeight: 600,
          fontSize: "clamp(11px, 0.76vw, 13px)",
          color: active ? "#fff" : "var(--color-text-secondary)",
          background: active ? "var(--color-text-primary)" : "transparent",
          border: "none",
          borderRadius: 999,
          padding: "6px 0",
          cursor: "pointer",
          transition: "background 0.15s, color 0.15s",
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div style={{
      display: "flex",
      background: "var(--color-input-bg)",
      borderRadius: 999,
      padding: 3,
      gap: 2,
    }}>
      {btn("personal", "Personal")}
      {btn("academic", "Academic")}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span style={DRAWER_LABEL}>{label}</span>
      {children}
    </div>
  );
}


function NewEventPanel({
  date,
  hour,
  onSubmitSuccess,
  role,
}: {
  date: string;
  hour: number;
  onSubmitSuccess?: () => void;
  role: "teacher" | "student";
}) {
  const [kind, setKind]                         = useState<EventKind>("personal");
  const [name, setName]                         = useState("");
  const [details, setDetails]                   = useState("");
  const [startTime, setStartTime]               = useState(`${padTwo(hour)}:00`);
  const [endTime, setEndTime]                   = useState(`${padTwo(Math.min(hour + 1, 23))}:00`);
  const [isSubmitting, setIsSubmitting]         = useState(false);
  const [submitError, setSubmitError]           = useState<string | null>(null);
  // null = not yet fetched, array = ready (possibly empty)
  const [courses, setCourses]                   = useState<CourseListItem[] | null>(null);
  const [courseSlug, setCourseSlug]             = useState("");
  const [lessons, setLessons]                   = useState<CourseLesson[] | null>(null);
  const [lessonId, setLessonId]                 = useState("");
  const [availableTypes, setAvailableTypes]     = useState<Array<"group" | "individual">>([]);
  const [sessionType, setSessionType]           = useState<"group" | "individual" | "">("");
  const [cohorts, setCohorts]                   = useState<CourseCohort[]>([]);
  const [cohortId, setCohortId]                 = useState("");
  const [students, setStudents]                 = useState<EnrolledStudent[] | null>(null);
  const [studentId, setStudentId]               = useState("");
  const [indivFormatId, setIndivFormatId]       = useState<number | null>(null);
  const [meetingLink, setMeetingLink]           = useState("");

  useEffect(() => {
    if (kind !== "academic") return;
    let cancelled = false;
    const req = role === "teacher" ? getTeacherCourses() : getEnrolledCourses();
    req
      .then(data => { if (!cancelled) setCourses(data.results); })
      .catch(() => { if (!cancelled) setCourses([]); });
    return () => { cancelled = true; };
  }, [kind, role]);

  useEffect(() => {
    if (!courseSlug) return;
    let cancelled = false;
    getCourseBySlug(courseSlug)
      .then(detail => {
        if (!cancelled) {
          setLessons(detail.modules.flatMap(m => m.lessons));
          setLessonId("");

          const types: Array<"group" | "individual"> = [];
          let indivId: number | null = null;
          for (const fmt of detail.delivery_formats) {
            if (fmt.format_type === "group" && !types.includes("group"))       types.push("group");
            if (fmt.format_type === "individual" && !types.includes("individual")) {
              types.push("individual");
              indivId = fmt.id;
            }
          }
          setAvailableTypes(types);
          setSessionType(types.length === 1 ? types[0] : "");
          setCohorts(detail.cohorts);
          setCohortId("");
          setIndivFormatId(indivId);
          setStudents(null);
          setStudentId("");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLessons([]);
          setAvailableTypes([]);
          setCohorts([]);
        }
      });
    return () => { cancelled = true; };
  }, [courseSlug]);

  useEffect(() => {
    if (sessionType !== "individual" || !courseSlug) return;
    let cancelled = false;
    getCourseEnrolledStudents(courseSlug, indivFormatId ?? undefined)
      .then(data => { if (!cancelled) setStudents(data); })
      .catch(() => { if (!cancelled) setStudents([]); });
    return () => { cancelled = true; };
  }, [sessionType, courseSlug, indivFormatId]);

  async function handleAdd() {
    if (kind === "personal" && !name.trim()) { setSubmitError("Event name is required"); return; }
    if (kind === "academic") {
      if (!courseSlug)   { setSubmitError("Please select a course"); return; }
      if (!sessionType)  { setSubmitError("Please select a session type"); return; }
      if (sessionType === "group" && !cohortId)     { setSubmitError("Please select a group"); return; }
      if (sessionType === "individual" && !studentId) { setSubmitError("Please select a student"); return; }
    }

    const base = { date, start_time: startTime, end_time: endTime };
    let payload: CalendarEventPayload;

    if (kind === "personal") {
      payload = { ...base, type: "personal", title: name, notes: details || undefined };
    } else if (sessionType === "group") {
      payload = {
        ...base, type: "group_session",
        course_slug: courseSlug,
        cohort_id: Number(cohortId),
        lesson_id: lessonId ? Number(lessonId) : null,
        meeting_link: meetingLink || null,
      };
    } else {
      payload = {
        ...base, type: "individual_session",
        course_slug: courseSlug,
        student_id: Number(studentId),
        lesson_id: lessonId ? Number(lessonId) : null,
        meeting_link: meetingLink || null,
      };
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await createCalendarEvent(payload);
      onSubmitSuccess?.();
    } catch {
      setSubmitError("Failed to save event. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Date + time range */}
      <Field label="Date">
        <p style={{ fontFamily: "var(--font-accent)", fontSize: "clamp(13px, 0.9vw, 15px)", color: "var(--color-text-secondary)", margin: 0 }}>
          {date}
        </p>
      </Field>
      <div style={{ display: "flex", gap: 12 }}>
        <Field label="Start">
          <input type="time" style={DRAWER_INPUT} value={startTime} onChange={e => setStartTime(e.target.value)} />
        </Field>
        <Field label="End">
          <input type="time" style={DRAWER_INPUT} value={endTime} onChange={e => setEndTime(e.target.value)} />
        </Field>
      </div>

      {/* Type toggle — teachers only */}
      {role === "teacher" && <KindToggle value={kind} onChange={setKind} />}

      {/* Event name — personal */}
      {(kind === "personal" || role === "student") && (
        <>
          <Field label="Event name">
            <input
              style={DRAWER_INPUT}
              placeholder="Title"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </Field>
          <Field label="Details">
            <input
              style={DRAWER_INPUT}
              placeholder="Notes"
              value={details}
              onChange={e => setDetails(e.target.value)}
            />
          </Field>
        </>
      )}

      {role === "teacher" && kind === "academic" && (
        <>
          {/* Course dropdown */}
          <Field label="Course">
            <SelectField
              options={(courses ?? []).map(c => ({ value: c.slug, label: c.title }))}
              value={courseSlug}
              onChange={slug => {
                setCourseSlug(slug);
                setLessons(null); setLessonId("");
                setAvailableTypes([]); setSessionType("");
                setCohorts([]); setCohortId("");
                setStudents(null); setStudentId("");
              }}
              placeholder="Select course"
              disabled={courses === null}
            />
          </Field>

          {/* Lecture dropdown — appears after course is chosen */}
          {courseSlug && (
            <Field label="Lecture (optional)">
              <SelectField
                options={(lessons ?? []).map(l => ({ value: String(l.id), label: l.title }))}
                value={lessonId}
                onChange={setLessonId}
                placeholder="Select lecture"
                disabled={lessons === null}
              />
            </Field>
          )}

          {/* Session type toggle — only when the course supports group/individual */}
          {courseSlug && availableTypes.length > 0 && (
            <Field label="Session type">
              <div style={{ display: "flex", background: "var(--color-input-bg)", borderRadius: 999, padding: 3, gap: 2 }}>
                {availableTypes.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setSessionType(t); setStudents(null); setStudentId(""); setCohortId(""); }}
                    style={{
                      flex: 1,
                      fontFamily: "var(--font-base)",
                      fontWeight: 600,
                      fontSize: "clamp(11px, 0.76vw, 13px)",
                      color: sessionType === t ? "#fff" : "var(--color-text-secondary)",
                      background: sessionType === t ? "var(--color-text-primary)" : "transparent",
                      border: "none",
                      borderRadius: 999,
                      padding: "6px 0",
                      cursor: "pointer",
                      transition: "background 0.15s, color 0.15s",
                    }}
                  >
                    {t === "group" ? "Group" : "Individual"}
                  </button>
                ))}
              </div>
            </Field>
          )}

          {/* Group cohort selector */}
          {sessionType === "group" && (
            <Field label="Group">
              <SelectField
                options={cohorts.map(c => ({ value: String(c.id), label: c.name !== null ? c.name : `Group ${c.id}` }))}
                value={cohortId}
                onChange={setCohortId}
                placeholder="Select group"
              />
            </Field>
          )}

          {/* Individual student selector */}
          {sessionType === "individual" && (
            <Field label="Student">
              <SelectField
                options={(students ?? []).map(s => ({ value: String(s.student_id), label: s.student_name }))}
                value={studentId}
                onChange={setStudentId}
                placeholder="Select student"
                disabled={students === null}
              />
            </Field>
          )}

          {/* Meeting link */}
          <Field label="Meeting link (optional)">
            <input
              style={DRAWER_INPUT}
              placeholder="https://..."
              type="url"
              value={meetingLink}
              onChange={e => setMeetingLink(e.target.value)}
            />
          </Field>
        </>
      )}

      {/* Error message */}
      {submitError && (
        <p style={{ fontFamily: "var(--font-base)", fontSize: "clamp(11px, 0.75vw, 13px)", color: "#c0392b", margin: 0 }}>
          {submitError}
        </p>
      )}

      {/* Actions */}
      <div style={{ marginTop: 4 }}>
        <button
          type="button"
          style={{ ...DRAWER_ADD_BTN, opacity: isSubmitting ? 0.6 : 1 }}
          onClick={handleAdd}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving…" : "ADD"}
        </button>
      </div>
    </div>
  );
}

function EventDetailPanel({ event, role }: { event: CalendarEvent; role: "teacher" | "student" }) {
  const isGroup    = event.type === "group_session";
  const typeBadge  = isGroup ? "Group" : "Individual";
  const typeColor  = isGroup ? "var(--color-brand-pink)" : "var(--color-brand-lavender)";

  const detail = isGroup
    ? event.cohort_name
    : event.student
    ? (event.student.name || event.student.email)
    : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Time */}
      <div>
        <span style={DRAWER_LABEL}>Time</span>
        <p style={{ fontFamily: "var(--font-accent)", fontSize: "clamp(15px, 1.1vw, 20px)", color: "var(--color-text-primary)", margin: 0, fontWeight: 500 }}>
          {event.start_time} – {event.end_time}
        </p>
      </div>

      {/* Type badge */}
      <div style={{ display: "inline-flex", alignSelf: "flex-start", padding: "3px 12px", borderRadius: 999, border: `1.5px solid ${typeColor}`, fontFamily: "var(--font-base)", fontWeight: 600, fontSize: "clamp(11px, 0.72vw, 13px)", color: typeColor }}>
        {typeBadge}
      </div>

      {/* Course */}
      <div>
        <span style={DRAWER_LABEL}>Course</span>
        <p style={{ fontFamily: "var(--font-base)", fontWeight: 600, fontSize: "clamp(13px, 0.9vw, 15px)", color: "var(--color-text-primary)", margin: 0 }}>
          {event.course_title}
        </p>
      </div>

      {/* Group / Student */}
      {detail && (
        <div>
          <span style={DRAWER_LABEL}>{isGroup ? "Group" : "Student"}</span>
          <p style={{ fontFamily: "var(--font-base)", fontSize: "clamp(13px, 0.85vw, 15px)", color: "var(--color-text-secondary)", margin: 0 }}>
            {detail}
          </p>
        </div>
      )}

      {/* Lesson */}
      {event.lesson_title && (
        <div>
          <span style={DRAWER_LABEL}>Lecture</span>
          {role === "student" && event.lesson_url ? (
            <a
              href={event.lesson_url}
              style={{ fontFamily: "var(--font-base)", fontSize: "clamp(13px, 0.85vw, 15px)", color: "var(--color-blue)", display: "flex", alignItems: "center", gap: 5, textDecoration: "none" }}
            >
              <Link2 size={13} />
              {event.lesson_title}
            </a>
          ) : (
            <p style={{ fontFamily: "var(--font-base)", fontSize: "clamp(13px, 0.85vw, 15px)", color: "var(--color-text-secondary)", margin: 0 }}>
              {event.lesson_title}
            </p>
          )}
        </div>
      )}

      {/* Meeting link */}
      {event.meeting_link && (
        <a
          href={event.meeting_link}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            alignSelf: "flex-start",
            fontFamily: "var(--font-base)",
            fontWeight: 600,
            fontSize: "clamp(12px, 0.8vw, 14px)",
            color: "#fff",
            background: "var(--color-blue)",
            borderRadius: 999,
            padding: "7px 18px",
            textDecoration: "none",
          }}
        >
          <ExternalLink size={13} />
          Join meeting
        </a>
      )}
    </div>
  );
}

function ActionBtn({
  label,
  onClick,
  active,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        fontFamily: "var(--font-accent)",
        fontWeight: 500,
        fontSize: "20px",
        color: active ? "#fff" : "#121212",
        background: active
          ? "#121212"
          : "linear-gradient(90deg, #A7BAFA 0%, #FCC4C3 50.96%, #FFF4DA 100%)",
        border: "none",
        borderRadius: 28,
        padding: "0 28px",
        height: 52,
        minWidth: 200,
        cursor: "pointer",
        letterSpacing: "0.03em",
        textTransform: "uppercase",
        flexShrink: 0,
      }}
    >
      <Plus size={18} strokeWidth={2.5} />
      {label}
    </button>
  );
}

export type CalendarViewProps = {
  role: "teacher" | "student";
};

/** Full-page calendar for the student/teacher schedule route. */
export function CalendarView({ role }: CalendarViewProps) {
  const [events, setEvents]                = useState<CalendarEvent[]>([]);
  const [unavailability, setUnavailability] = useState<TeacherUnavailability[]>([]);
  const [drawer, setDrawer]                = useState<DrawerState>(null);
  const [weekStart, setWeekStart]          = useState<string>(() => currentWeekMondayISO());
  const [refreshTick, setRefreshTick]      = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      // Fetch API events first — always show these even if group aggregation fails
      const apiData = await getCalendarEvents(weekStart);
      if (cancelled) return;
      setEvents(apiData.events);
      setUnavailability(apiData.unavailability);

      // For teacher: merge in client-generated group sessions from CohortSchedule
      // fetchGroupEvents is isolated with .catch so its failure never blocks API events
      if (role !== "teacher") return;
      const groupEvents = await fetchGroupEvents(weekStart).catch(() => [] as CalendarEvent[]);
      if (cancelled) return;
      const apiIds = new Set(apiData.events.map(e => e.id));
      const extra  = groupEvents.filter(e => !apiIds.has(e.id));
      if (extra.length > 0) setEvents([...apiData.events, ...extra]);
    }

    fetchAll().catch(() => {});
    return () => { cancelled = true; };
  }, [weekStart, refreshTick, role]);

  function openNewEvent(date: string, hour: number) {
    setDrawer({ type: "new", date, hour });
  }

  function openEventView(event: CalendarEvent) {
    setDrawer({ type: "view", event });
  }

  function toggleBlock() {
    setDrawer(d => d?.type === "block" ? null : { type: "block" });
  }

  function toggleAddEvent() {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    const iso = `${y}-${m}-${d}`;
    setDrawer(prev => prev?.type === "new" ? null : { type: "new", date: iso, hour: today.getHours() });
  }

  const drawerOpen = drawer !== null;

  const calendarActions = (
    <>
      {role === "teacher" && (
        <ActionBtn
          label="Block time"
          onClick={toggleBlock}
          active={drawer?.type === "block"}
        />
      )}
      <ActionBtn
        label="Add event"
        onClick={toggleAddEvent}
        active={drawer?.type === "new"}
      />
    </>
  );

  return (
    <div style={{
      position: "relative",
      minHeight: "100%",
      paddingInline: "clamp(28px, 4.28vw, 68px)",
      paddingBlock: "clamp(12px, 1.25vw, 20px)",
      background: "var(--color-calendar-bg)",
    }}>

      {/* ── Calendar (always full width) ── */}
      <WeekCalendar
        events={events}
        unavailability={role === "teacher" ? unavailability : []}
        onWeekChange={setWeekStart}
        role={role}
        onSlotClick={openNewEvent}
        onEventClick={openEventView}
        actions={calendarActions}
      />

      {/* ── Side panel overlay ── */}
      <SidePanel
        open={drawerOpen}
        onClose={() => setDrawer(null)}
        title={
          drawer?.type === "new"   ? "New event"        :
          drawer?.type === "view"  ? "Event details"    :
          drawer?.type === "block" ? "My unavailability" : ""
        }
        top={0}
        right={0}
        bottom={0}
        borderRadius={0}
        borderLeft="1px solid var(--color-calendar-border)"
      >
        {drawer?.type === "new" && (
          <NewEventPanel
            date={drawer.date}
            hour={drawer.hour}
            role={role}
            onSubmitSuccess={() => { setRefreshTick(t => t + 1); setDrawer(null); }}
          />
        )}
        {drawer?.type === "view" && (
          <EventDetailPanel event={drawer.event} role={role} />
        )}
        {drawer?.type === "block" && (
          <UnavailabilitySection />
        )}
      </SidePanel>
    </div>
  );
}
