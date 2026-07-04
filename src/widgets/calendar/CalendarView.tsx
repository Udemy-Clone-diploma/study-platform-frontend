"use client";

import { useEffect, useState } from "react";
import {
  Link2,
  Plus,
  ExternalLink,
  Pencil,
  RotateCcw,
  Undo2,
  X,
  AlertTriangle,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { WeekCalendar, toISO } from "./WeekCalendar";
import { padTwo } from "@/shared/lib/time";
import { SidePanel } from "@/shared/ui/SidePanel";
import { SelectField } from "@/shared/ui/SelectField";
import {
  UnavailabilitySection,
  TimePicker,
} from "@/features/courses/ui/CourseManagementScheduleTab";
import { DatePicker } from "@/shared/ui/DatePicker";
import {
  getCalendarEvents,
  updateCalendarEvent,
  createPersonalEvent,
  deletePersonalEvent,
  inviteToEvent,
  getEventInvitations,
  getEventParticipants,
  searchUsers,
  createExtraSession,
  getCourseBySlug,
  getCohorts,
  getTeacherCourses,
  getCourseEnrolledStudents,
} from "@/entities/course";
import {
  checkPersonalEventConflicts,
  updatePersonalEvent,
} from "@/entities/course/api/calendarApi";
import type { PersonalEventConflicts } from "@/entities/course/api/calendarApi";
import type { EnrolledStudent } from "@/entities/course/model/cohortGroup";
import type { CalendarEvent } from "@/entities/course/model/calendar";
import type { TeacherUnavailability } from "@/entities/course/model/schedule";
import type { CourseLesson } from "@/entities/course/model/module";
import type {
  UserSearchResult,
  EventInvitationStatus,
  EventParticipantsResponse,
} from "@/entities/course/api/calendarApi";
import type { CourseListItem } from "@/entities/course/model/types";
import type { CourseCohort } from "@/entities/course/model/cohort";

function currentWeekSundayISO(): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  today.setDate(today.getDate() - today.getDay());
  return toISO(today);
}

type DrawerState =
  | { type: "new"; date: string; hour: number; isUnavailable?: boolean }
  | { type: "view"; event: CalendarEvent; initialMode?: "view" | "reschedule" }
  | { type: "block" }
  | null;

const DRAWER_LABEL: React.CSSProperties = {
  fontFamily: "var(--font-accent)",
  fontWeight: 500,
  fontSize: "clamp(9px, 0.63vw, 11px)",
  color: "var(--color-text-secondary)",
  display: "block",
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
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
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  fontFamily: "var(--font-accent)",
  fontWeight: 500,
  fontSize: "clamp(12px, 1.04vw, 20px)",
  color: "var(--color-text-primary)",
  background: "var(--gradient-brand)",
  border: "none",
  borderRadius: 28,
  padding: "clamp(8px, 0.52vw, 10px) clamp(20px, 1.6vw, 32px)",
  cursor: "pointer",
  textTransform: "uppercase",
  letterSpacing: "0.03em",
  transition: "opacity 0.2s",
  whiteSpace: "nowrap",
};

function UserAvatar({ u, size = 30 }: { u: UserSearchResult; size?: number }) {
  return u.avatar ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={u.avatar}
      alt={u.name}
      style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
    />
  ) : (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "var(--gradient-brand)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-accent)",
          fontWeight: 700,
          fontSize: size * 0.4,
          color: "var(--color-text-primary)",
        }}
      >
        {u.name.charAt(0).toUpperCase()}
      </span>
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

type NewEventMode = "personal" | "personal_invite" | "extra_session";

const SUGGESTION_LIST: React.CSSProperties = {
  position: "absolute",
  top: "100%",
  left: 0,
  right: 0,
  zIndex: 10,
  background: "var(--color-bg)",
  border: "1px solid var(--color-border-light)",
  borderRadius: 10,
  boxShadow: "var(--shadow-sort-dropdown)",
  overflow: "hidden",
};

const SUGGESTION_BTN: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  width: "100%",
  padding: "8px 12px",
  background: "none",
  border: "none",
  cursor: "pointer",
  textAlign: "left",
};

function NewEventPanel({
  date,
  hour,
  onSubmitSuccess,
  role,
  isUnavailable = false,
  unavailability = [],
}: {
  date: string;
  hour: number;
  onSubmitSuccess?: () => void;
  role: "teacher" | "student";
  isUnavailable?: boolean;
  unavailability?: TeacherUnavailability[];
}) {
  const [mode, setMode] = useState<NewEventMode>("personal");
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState(`${padTwo(hour)}:00`);
  const [endTime, setEndTime] = useState(`${padTwo(Math.min(hour + 1, 23))}:00`);
  const [meetingLink, setMeetingLink] = useState("");

  // invite state
  const [emailQuery, setEmailQuery] = useState("");
  const [emailSuggestions, setEmailSuggestions] = useState<UserSearchResult[]>([]);
  const [emailSearched, setEmailSearched] = useState(false);
  const [inviteList, setInviteList] = useState<UserSearchResult[]>([]);

  // extra session state
  const [courses, setCourses] = useState<CourseListItem[] | null>(null);
  const [courseId, setCourseId] = useState<string>("");
  const [courseSlug, setCourseSlug] = useState<string>("");
  const [cohorts, setCohorts] = useState<CourseCohort[] | null>(null);
  const [cohortId, setCohortId] = useState<string>("");
  const [extraLessons, setExtraLessons] = useState<CourseLesson[] | null>(null);
  const [lessonId, setLessonId] = useState<string>("");
  const [audience, setAudience] = useState<"group" | "individual">("group");
  const [studentQuery, setStudentQuery] = useState("");
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[] | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<UserSearchResult | null>(null);

  const [localDate, setLocalDate] = useState(date);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [personalConflicts, setPersonalConflicts] = useState<PersonalEventConflicts | null>(null);
  const [sessionConflicts, setSessionConflicts] = useState<PersonalEventConflicts | null>(null);

  // Load teacher courses when entering extra_session mode
  useEffect(() => {
    if (mode !== "extra_session" || courses !== null) return;
    getTeacherCourses()
      .then((d) => setCourses(d.results))
      .catch(() => setCourses([]));
  }, [mode, courses]);

  // Load cohorts + lessons + enrolled students when course changes
  useEffect(() => {
    let cancelled = false;
    if (!courseSlug) {
      Promise.resolve().then(() => {
        if (!cancelled) {
          setCohorts(null);
          setExtraLessons(null);
          setEnrolledStudents(null);
        }
      });
      return () => {
        cancelled = true;
      };
    }
    getCohorts(courseSlug)
      .then((c) => {
        if (!cancelled) setCohorts(c);
      })
      .catch(() => {
        if (!cancelled) setCohorts([]);
      });
    getCourseBySlug(courseSlug)
      .then((d) => {
        if (cancelled) return;
        setExtraLessons(d.modules.flatMap((m) => m.lessons));
        const individualFormat = d.delivery_formats.find((f) => f.format_type === "individual");
        getCourseEnrolledStudents(courseSlug, individualFormat?.id)
          .then((s) => {
            if (!cancelled) setEnrolledStudents(s);
          })
          .catch(() => {
            if (!cancelled) setEnrolledStudents([]);
          });
      })
      .catch(() => {
        if (!cancelled) {
          setExtraLessons([]);
          setEnrolledStudents([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [courseSlug]);

  // Debounced invite email search
  useEffect(() => {
    const t = setTimeout(
      () => {
        if (emailQuery.length < 3) {
          setEmailSuggestions([]);
          setEmailSearched(false);
          return;
        }
        searchUsers(emailQuery)
          .then((r) => {
            setEmailSuggestions(r.filter((u) => !inviteList.some((i) => i.email === u.email)));
            setEmailSearched(true);
          })
          .catch(() => {
            setEmailSuggestions([]);
            setEmailSearched(true);
          });
      },
      emailQuery.length < 3 ? 0 : 300,
    );
    return () => clearTimeout(t);
  }, [emailQuery, inviteList]);

  async function handleSubmit() {
    setError(null);
    setPersonalConflicts(null);
    if (mode === "personal" || mode === "personal_invite") {
      if (!title.trim()) {
        setError("Event name is required");
        return;
      }
      setIsSubmitting(true);
      try {
        const conflicts = await checkPersonalEventConflicts({
          date: localDate,
          start_time: startTime,
          end_time: endTime,
        });
        if (conflicts.sessions.length > 0 || conflicts.personal_events.length > 0) {
          setPersonalConflicts(conflicts);
          setIsSubmitting(false);
          return;
        }
        const result = await createPersonalEvent({
          title: title.trim(),
          date: localDate,
          start_time: startTime,
          end_time: endTime,
          meeting_link: meetingLink || null,
        });
        if (mode === "personal_invite" && inviteList.length > 0) {
          const pk = parseInt(result.id.replace("personal_", ""), 10);
          await Promise.all(inviteList.map((u) => inviteToEvent(pk, u.email).catch(() => {})));
        }
        onSubmitSuccess?.();
      } catch {
        setError("Failed to save. Please try again.");
        setIsSubmitting(false);
      }
    } else {
      if (!courseId) {
        setError("Please select a course");
        return;
      }
      if (audience === "group" && !cohortId) {
        setError("Please select a cohort");
        return;
      }
      if (audience === "individual" && !selectedStudent) {
        setError("Please select a student");
        return;
      }
      const jsDow = new Date(localDate).getDay();
      const backendDow = (jsDow + 6) % 7;
      const blockedByUnavailability = unavailability.some((u) => {
        const uStart = u.start_time.slice(0, 5);
        const uEnd = u.end_time.slice(0, 5);
        const timeOverlap = uStart < endTime && uEnd > startTime;
        if (u.recurrence_type === "weekly") return u.day_of_week === backendDow && timeOverlap;
        if (u.recurrence_type === "one_time") return u.date === localDate && timeOverlap;
        if (u.recurrence_type === "date_range")
          return (
            !!u.date &&
            !!u.date_to &&
            u.date <= localDate &&
            u.date_to >= localDate &&
            u.day_of_week === backendDow &&
            timeOverlap
          );
        return false;
      });
      if (blockedByUnavailability) {
        setError(
          "You have a personal unavailability block at this time. Remove it first before scheduling a session.",
        );
        return;
      }
      setIsSubmitting(true);
      let conflicts: PersonalEventConflicts;
      try {
        conflicts = await checkPersonalEventConflicts({
          date: localDate,
          start_time: startTime,
          end_time: endTime,
          include_free_slots: true,
        });
      } catch {
        conflicts = { sessions: [], personal_events: [] };
      } finally {
        setIsSubmitting(false);
      }
      if (conflicts.sessions.length > 0 || conflicts.personal_events.length > 0) {
        setSessionConflicts(conflicts);
        return;
      }
      setSessionConflicts(null);
      setIsSubmitting(true);
      try {
        await createExtraSession({
          date: localDate,
          start_time: startTime,
          end_time: endTime,
          course_id: Number(courseId),
          audience,
          cohort_id: audience === "group" ? Number(cohortId) : undefined,
          student_email: audience === "individual" ? selectedStudent!.email : undefined,
          lesson_id: lessonId ? Number(lessonId) : null,
          meeting_link: meetingLink || null,
        });
        onSubmitSuccess?.();
      } catch {
        setError("Failed to save. Please try again.");
        setIsSubmitting(false);
      }
    }
  }

  const isPersonal = mode === "personal" || mode === "personal_invite";
  const submitLabel =
    mode === "personal_invite"
      ? "Create & invite"
      : mode === "extra_session"
        ? "Create session"
        : "Add event";

  const SMALL = "clamp(10px, 0.7vw, 12px)";
  const TEXT = "clamp(11px, 0.75vw, 13px)";

  function tabStyle(m: NewEventMode): React.CSSProperties {
    const active = mode === m;
    return {
      fontFamily: "var(--font-accent)",
      fontWeight: 500,
      fontSize: SMALL,
      border: `1.5px solid ${active ? "var(--color-text-primary)" : "var(--color-text-secondary)"}`,
      borderRadius: 999,
      padding: "4px 16px",
      cursor: "pointer",
      transition: "background 0.15s, color 0.15s",
      background: active ? "var(--color-text-primary)" : "transparent",
      color: active ? "#fff" : "var(--color-text-secondary)",
      textTransform: "uppercase",
      letterSpacing: "0.04em",
    };
  }

  function audienceTabStyle(a: "group" | "individual"): React.CSSProperties {
    const active = audience === a;
    return {
      fontFamily: "var(--font-accent)",
      fontWeight: 500,
      fontSize: SMALL,
      border: `1.5px solid ${active ? "var(--color-text-primary)" : "var(--color-text-secondary)"}`,
      borderRadius: 999,
      padding: "4px 16px",
      cursor: "pointer",
      transition: "background 0.15s, color 0.15s",
      background: active ? "var(--color-text-primary)" : "transparent",
      color: active ? "#fff" : "var(--color-text-secondary)",
      textTransform: "uppercase",
      letterSpacing: "0.04em",
    };
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ── Event type tabs ── */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <button type="button" style={tabStyle("personal")} onClick={() => setMode("personal")}>
          Personal
        </button>
        <button
          type="button"
          style={tabStyle("personal_invite")}
          onClick={() => setMode("personal_invite")}
        >
          With invite
        </button>
        {role === "teacher" && !isUnavailable && (
          <button
            type="button"
            style={tabStyle("extra_session")}
            onClick={() => setMode("extra_session")}
          >
            Extra session
          </button>
        )}
      </div>

      {/* ── Date ── */}
      <DatePicker
        label="Date"
        value={localDate}
        onChange={(v) => {
          setLocalDate(v);
          setSessionConflicts(null);
        }}
        size="md"
      />

      {/* ── Time range ── */}
      <div style={{ display: "flex", gap: 12 }}>
        <Field label="Start">
          <TimePicker
            value={startTime}
            onChange={(v) => {
              setStartTime(v);
              setSessionConflicts(null);
            }}
          />
        </Field>
        <Field label="End">
          <TimePicker
            value={endTime}
            onChange={(v) => {
              setEndTime(v);
              setSessionConflicts(null);
            }}
          />
        </Field>
      </div>

      {/* ── Personal / invite fields ── */}
      {isPersonal && (
        <Field label="Event name">
          <input
            style={DRAWER_INPUT}
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
        </Field>
      )}

      {/* Meeting link only for "with invite" personal events */}
      {mode === "personal_invite" && (
        <Field label="Meeting link (optional)">
          <input
            style={DRAWER_INPUT}
            placeholder="https://..."
            type="url"
            value={meetingLink}
            onChange={(e) => setMeetingLink(e.target.value)}
          />
        </Field>
      )}

      {/* ── Invite section ── */}
      {mode === "personal_invite" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={DRAWER_LABEL}>Invite people</span>
          <div style={{ position: "relative" }}>
            <input
              style={DRAWER_INPUT}
              placeholder="Search by email…"
              value={emailQuery}
              onChange={(e) => {
                setEmailQuery(e.target.value);
                setEmailSearched(false);
              }}
            />
            {emailSuggestions.length > 0 && (
              <div style={SUGGESTION_LIST}>
                {emailSuggestions.map((u) => (
                  <button
                    key={u.email}
                    type="button"
                    style={SUGGESTION_BTN}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "var(--color-input-bg)")
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                    onClick={() => {
                      setInviteList((prev) => [...prev, u]);
                      setEmailQuery("");
                      setEmailSuggestions([]);
                      setEmailSearched(false);
                    }}
                  >
                    <UserAvatar u={u} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: "var(--font-base)",
                          fontWeight: 600,
                          fontSize: TEXT,
                          color: "var(--color-text-primary)",
                        }}
                      >
                        {u.name}
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--font-base)",
                          fontSize: SMALL,
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        {u.email}
                      </div>
                    </div>
                    <span
                      style={{
                        fontFamily: "var(--font-accent)",
                        fontSize: "10px",
                        color: "var(--color-text-secondary)",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        flexShrink: 0,
                      }}
                    >
                      {u.role}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {emailSearched && emailSuggestions.length === 0 && emailQuery.length >= 3 && (
              <p
                style={{
                  fontFamily: "var(--font-base)",
                  fontSize: SMALL,
                  color: "var(--color-danger)",
                  margin: "6px 0 0",
                }}
              >
                No user found. Check the email address.
              </p>
            )}
          </div>
          {inviteList.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {inviteList.map((u) => (
                <div
                  key={u.email}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 10px",
                    background: "var(--color-input-bg)",
                    borderRadius: 8,
                  }}
                >
                  <UserAvatar u={u} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: "var(--font-base)",
                        fontWeight: 600,
                        fontSize: TEXT,
                        color: "var(--color-text-primary)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {u.name}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-base)",
                        fontSize: SMALL,
                        color: "var(--color-text-secondary)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {u.email}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setInviteList((prev) => prev.filter((i) => i.email !== u.email))}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--color-text-secondary)",
                      padding: 2,
                      display: "flex",
                      flexShrink: 0,
                    }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Extra session fields ── */}
      {mode === "extra_session" && (
        <>
          <Field label="Course">
            {courses === null ? (
              <p
                style={{
                  fontFamily: "var(--font-base)",
                  fontSize: TEXT,
                  color: "var(--color-text-secondary)",
                  margin: 0,
                }}
              >
                Loading courses…
              </p>
            ) : (
              <SelectField
                options={[
                  { value: "", label: "— Select course —" },
                  ...courses.map((c) => ({ value: String(c.id), label: c.title })),
                ]}
                value={courseId}
                onChange={(v) => {
                  setCourseId(v);
                  const found = courses.find((c) => String(c.id) === v);
                  setCourseSlug(found?.slug ?? "");
                  setCohortId("");
                  setLessonId("");
                }}
                placeholder="Select course"
              />
            )}
          </Field>

          {/* Audience tabs */}
          <div>
            <span style={DRAWER_LABEL}>Audience</span>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                type="button"
                style={audienceTabStyle("group")}
                onClick={() => {
                  setAudience("group");
                  setCohortId("");
                  setSelectedStudent(null);
                  setStudentQuery("");
                }}
              >
                Group
              </button>
              <button
                type="button"
                style={audienceTabStyle("individual")}
                onClick={() => {
                  setAudience("individual");
                  setCohortId("");
                  setSelectedStudent(null);
                  setStudentQuery("");
                }}
              >
                Individual
              </button>
            </div>
          </div>

          {/* Group: cohort picker */}
          {audience === "group" && courseSlug && (
            <Field label="Cohort">
              {cohorts === null ? (
                <p
                  style={{
                    fontFamily: "var(--font-base)",
                    fontSize: TEXT,
                    color: "var(--color-text-secondary)",
                    margin: 0,
                  }}
                >
                  Loading cohorts…
                </p>
              ) : cohorts.length === 0 ? (
                <p
                  style={{
                    fontFamily: "var(--font-base)",
                    fontSize: TEXT,
                    color: "var(--color-text-secondary)",
                    margin: 0,
                  }}
                >
                  No cohorts for this course
                </p>
              ) : (
                <SelectField
                  options={[
                    { value: "", label: "— Select cohort —" },
                    ...cohorts.map((c) => ({
                      value: String(c.id),
                      label: c.name ?? `Cohort #${c.id}`,
                    })),
                  ]}
                  value={cohortId}
                  onChange={setCohortId}
                  placeholder="Select cohort"
                />
              )}
            </Field>
          )}

          {/* Individual: student search */}
          {audience === "individual" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={DRAWER_LABEL}>Student</span>
              {selectedStudent ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 10px",
                    background: "var(--color-input-bg)",
                    borderRadius: 8,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        fontFamily: "var(--font-base)",
                        fontWeight: 600,
                        fontSize: TEXT,
                        color: "var(--color-text-primary)",
                      }}
                    >
                      {selectedStudent.name}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-base)",
                        fontSize: SMALL,
                        color: "var(--color-text-secondary)",
                        marginLeft: 6,
                      }}
                    >
                      {selectedStudent.email}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStudent(null);
                      setStudentQuery("");
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--color-text-secondary)",
                      padding: 2,
                      display: "flex",
                    }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div style={{ position: "relative" }}>
                  <input
                    style={DRAWER_INPUT}
                    placeholder={
                      enrolledStudents === null ? "Loading students…" : "Search by name or email…"
                    }
                    value={studentQuery}
                    onChange={(e) => setStudentQuery(e.target.value)}
                    disabled={enrolledStudents === null}
                  />
                  {enrolledStudents !== null &&
                    studentQuery.trim().length > 0 &&
                    (() => {
                      const q = studentQuery.toLowerCase();
                      const filtered = enrolledStudents.filter(
                        (s) =>
                          s.student_name.toLowerCase().includes(q) ||
                          s.student_email.toLowerCase().includes(q),
                      );
                      if (filtered.length === 0)
                        return (
                          <p
                            style={{
                              fontFamily: "var(--font-base)",
                              fontSize: SMALL,
                              color: "var(--color-text-secondary)",
                              margin: "6px 0 0",
                            }}
                          >
                            No enrolled students found
                          </p>
                        );
                      return (
                        <div style={SUGGESTION_LIST}>
                          {filtered.map((s) => (
                            <button
                              key={s.student_email}
                              type="button"
                              style={SUGGESTION_BTN}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background = "var(--color-input-bg)")
                              }
                              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                              onClick={() => {
                                setSelectedStudent({
                                  name: s.student_name,
                                  email: s.student_email,
                                  role: "student",
                                  avatar: null,
                                });
                                setStudentQuery("");
                              }}
                            >
                              <UserAvatar
                                u={{
                                  name: s.student_name,
                                  email: s.student_email,
                                  role: "student",
                                  avatar: null,
                                }}
                              />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    fontFamily: "var(--font-base)",
                                    fontWeight: 600,
                                    fontSize: TEXT,
                                    color: "var(--color-text-primary)",
                                  }}
                                >
                                  {s.student_name}
                                </div>
                                <div
                                  style={{
                                    fontFamily: "var(--font-base)",
                                    fontSize: SMALL,
                                    color: "var(--color-text-secondary)",
                                  }}
                                >
                                  {s.student_email}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                </div>
              )}
            </div>
          )}

          {/* Lesson picker (optional) */}
          {courseSlug && (
            <Field label="Lecture (optional)">
              {extraLessons === null ? (
                <p
                  style={{
                    fontFamily: "var(--font-base)",
                    fontSize: TEXT,
                    color: "var(--color-text-secondary)",
                    margin: 0,
                  }}
                >
                  Loading lessons…
                </p>
              ) : (
                <SelectField
                  options={[
                    { value: "", label: "— No lecture —" },
                    ...extraLessons.map((l) => ({ value: String(l.id), label: l.title })),
                  ]}
                  value={lessonId}
                  onChange={setLessonId}
                  placeholder="Select lecture"
                />
              )}
            </Field>
          )}

          <Field label="Meeting link (optional)">
            <input
              style={DRAWER_INPUT}
              placeholder="https://..."
              type="url"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
            />
          </Field>
        </>
      )}

      {error && (
        <p
          style={{
            fontFamily: "var(--font-base)",
            fontSize: TEXT,
            color: "var(--color-danger)",
            margin: 0,
          }}
        >
          {error}
        </p>
      )}

      {/* Personal event conflict block */}
      {personalConflicts &&
        (personalConflicts.sessions.length > 0 || personalConflicts.personal_events.length > 0) && (
          <div
            style={{
              background: "#fff0f0",
              borderRadius: 8,
              border: "1px solid #fca5a5",
              padding: "10px 12px",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-base)",
                fontWeight: 700,
                fontSize: TEXT,
                color: "var(--color-danger)",
                margin: 0,
              }}
            >
              Time conflict — cannot create event
            </p>
            {personalConflicts.sessions.map((s) => (
              <p
                key={s.id}
                style={{
                  fontFamily: "var(--font-base)",
                  fontSize: TEXT,
                  color: "var(--color-text-secondary)",
                  margin: 0,
                }}
              >
                {s.type === "group" ? "Group" : "Individual"} session: {s.title} · {s.start_time}–
                {s.end_time}
              </p>
            ))}
            {personalConflicts.personal_events.map((e) => (
              <p
                key={e.id}
                style={{
                  fontFamily: "var(--font-base)",
                  fontSize: TEXT,
                  color: "var(--color-text-secondary)",
                  margin: 0,
                }}
              >
                Personal event: {e.title} · {e.start_time}–{e.end_time}
              </p>
            ))}
          </div>
        )}

      {/* Extra session conflict — hard block, no bypass */}
      {sessionConflicts &&
        (sessionConflicts.sessions.length > 0 || sessionConflicts.personal_events.length > 0) && (
          <div
            style={{
              background: "#fff0f0",
              borderRadius: 8,
              border: "1px solid #fca5a5",
              padding: "10px 12px",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-base)",
                fontWeight: 700,
                fontSize: TEXT,
                color: "var(--color-danger)",
                margin: 0,
              }}
            >
              Time conflict — cannot create session
            </p>
            {sessionConflicts.sessions.map((s) => (
              <p
                key={s.id}
                style={{
                  fontFamily: "var(--font-base)",
                  fontSize: TEXT,
                  color: "var(--color-text-secondary)",
                  margin: 0,
                }}
              >
                {s.type === "group" ? "Group" : s.type === "extra" ? "Extra" : "Individual"}{" "}
                session: {s.title} · {s.start_time}–{s.end_time}
              </p>
            ))}
            {sessionConflicts.personal_events.map((e) => (
              <p
                key={e.id}
                style={{
                  fontFamily: "var(--font-base)",
                  fontSize: TEXT,
                  color: "var(--color-text-secondary)",
                  margin: 0,
                }}
              >
                Personal event: {e.title} · {e.start_time}–{e.end_time}
              </p>
            ))}
          </div>
        )}

      <div style={{ marginTop: 4 }}>
        <button
          type="button"
          style={{ ...DRAWER_ADD_BTN, opacity: isSubmitting ? 0.6 : 1 }}
          onClick={handleSubmit}
          disabled={isSubmitting || !!sessionConflicts}
        >
          {isSubmitting ? "Saving…" : submitLabel}
        </button>
      </div>
    </div>
  );
}

type DetailMode =
  | "view"
  | "reschedule"
  | "link_edit"
  | "lesson_edit"
  | "confirm_cancel"
  | "confirm_delete";

function fmtDate(iso: string) {
  const [, m, d] = iso.split("-");
  return `${d}.${m}`;
}

function EventDetailPanel({
  event,
  role,
  onEventUpdated,
  onClose,
  onAddNew,
  onOpenEvent,
  initialMode = "view",
  overlappingCancelled = [],
}: {
  event: CalendarEvent;
  role: "teacher" | "student";
  onEventUpdated?: () => void;
  onClose?: () => void;
  onAddNew?: (date: string, hour: number) => void;
  onOpenEvent?: (event: CalendarEvent, mode?: "view" | "reschedule") => void;
  initialMode?: "view" | "reschedule";
  overlappingCancelled?: CalendarEvent[];
}) {
  // Local copy of the event — updated immediately on save so UI reflects changes without reload
  const [ev, setEv] = useState<CalendarEvent>(event);
  const [mode, setMode] = useState<DetailMode>(initialMode);
  const [newDate, setNewDate] = useState(event.date);
  const [newStart, setNewStart] = useState(event.start_time);
  const [newEnd, setNewEnd] = useState(event.end_time);
  const [linkVal, setLinkVal] = useState(event.meeting_link ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lessons, setLessons] = useState<CourseLesson[] | null>(null);
  const [lessonId, setLessonId] = useState<string>("");
  const [invites, setInvites] = useState<EventInvitationStatus[] | null>(null);
  const [resending, setResending] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [participants, setParticipants] = useState<EventParticipantsResponse | null>(null);
  const [inviteQuery, setInviteQuery] = useState("");
  const [inviteSugg, setInviteSugg] = useState<UserSearchResult[]>([]);
  const [inviting, setInviting] = useState(false);
  const [inviteErr, setInviteErr] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(() => !!event.event_status);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [restoreErr, setRestoreErr] = useState<string | null>(null);

  // Sync local state when parent refreshes the event (e.g. after save + refetch)
  useEffect(() => {
    if (mode === "view") {
      setEv(event);
      setLinkVal(event.meeting_link ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    event.id,
    event.meeting_link,
    event.lesson_title,
    event.event_status,
    event.rescheduled_to_date,
  ]);

  const isGroup = ev.type === "group_session";
  const typeBadge = isGroup ? "Group" : "Individual";
  const isPersonal = ev.type === "personal" || ev.type === "personal_shared";
  const isOwner = !!ev.is_owner;
  const personalPk = isPersonal ? parseInt(ev.id.split("_")[1], 10) : 0;
  const isProcessed = !!ev.event_status;
  const isReplacement = !!ev.rescheduled_from_date;
  const todayISO_ = new Date().toISOString().slice(0, 10);
  const nowTime_ = new Date().toTimeString().slice(0, 5);
  const isPastEvent = ev.date < todayISO_ || (ev.date === todayISO_ && ev.end_time <= nowTime_);
  const isFreeSlot = ev.is_available === true;
  const canEdit =
    role === "teacher" &&
    !isPersonal &&
    !isProcessed &&
    !isPastEvent &&
    !isFreeSlot;

  useEffect(() => {
    if (mode !== "lesson_edit" || !ev.course_slug || lessons !== null) return;
    let cancelled = false;
    getCourseBySlug(ev.course_slug)
      .then((detail) => {
        if (!cancelled) setLessons(detail.modules.flatMap((m) => m.lessons));
      })
      .catch(() => {
        if (!cancelled) setLessons([]);
      });
    return () => {
      cancelled = true;
    };
  }, [mode, ev.course_slug, lessons]);

  // Fetch invitation list for personal events (owner view)
  useEffect(() => {
    if (!isPersonal || !isOwner || !personalPk) return;
    let cancelled = false;
    getEventInvitations(personalPk)
      .then((data) => {
        if (!cancelled) setInvites(data);
      })
      .catch(() => {
        if (!cancelled) setInvites([]);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ev.id]);

  // Fetch participants for invitee view (non-owner personal_shared events)
  useEffect(() => {
    if (!isPersonal || isOwner || !personalPk) return;
    let cancelled = false;
    getEventParticipants(personalPk)
      .then((data) => {
        if (!cancelled) setParticipants(data);
      })
      .catch(() => {
        if (!cancelled) setParticipants({ my_invite: null, participants: [] });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ev.id]);

  // Debounced search for invite-more input
  useEffect(() => {
    if (!inviteQuery.trim() || inviteQuery.length < 2) {
      setInviteSugg([]);
      return;
    }
    const t = setTimeout(() => {
      searchUsers(inviteQuery)
        .then(setInviteSugg)
        .catch(() => setInviteSugg([]));
    }, 300);
    return () => clearTimeout(t);
  }, [inviteQuery]);

  async function doInvite(email: string) {
    if (!email.trim()) return;
    setInviting(true);
    setInviteErr(null);
    try {
      await inviteToEvent(personalPk, email.trim());
      // Refresh the invites list
      const fresh = await getEventInvitations(personalPk);
      setInvites(fresh);
      setInviteQuery("");
      setInviteSugg([]);
    } catch {
      setInviteErr("Could not invite this user.");
    } finally {
      setInviting(false);
    }
  }

  async function doResend(email: string, invId: number) {
    setResending(invId);
    try {
      await inviteToEvent(personalPk, email);
      setInvites(
        (prev) =>
          prev?.map((i) =>
            i.id === invId ? { ...i, status: "pending", responded_at: null } : i,
          ) ?? prev,
      );
    } catch {
    } finally {
      setResending(null);
    }
  }

  async function doDelete() {
    setDeleting(true);
    setError(null);
    try {
      await deletePersonalEvent(personalPk);
      onEventUpdated?.();
      onClose?.();
    } catch {
      setError("Failed to delete event. Please try again.");
      setDeleting(false);
      setMode("view");
    }
  }

  const detail = isGroup ? ev.cohort_name : ev.student ? ev.student.name || ev.student.email : null;

  async function doReschedule() {
    if (!newDate || !newStart || !newEnd) {
      setError("All date/time fields are required");
      return;
    }

    // Replacement moved back to original date (only when original is a DIFFERENT day —
    // same-day reschedules always share the date, so we'd never want to auto-restore there).
    if (
      !isPersonal &&
      isReplacement &&
      ev.rescheduled_from_date &&
      ev.date !== ev.rescheduled_from_date && // replacement is on a different day than original
      newDate === ev.rescheduled_from_date // user picked the original day
    ) {
      await doRestore(ev.id);
      return;
    }

    // Same date/time as current event — no real change needed.
    const sameDateTime =
      newDate === ev.date && newStart === ev.start_time && newEnd === ev.end_time;
    if (sameDateTime) {
      if (!isPersonal && ev.event_status) {
        // Cancelled or rescheduled → treat as restore back to original time.
        await doRestore(ev.id);
      } else {
        setMode("view");
      }
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (isPersonal && personalPk) {
        await updatePersonalEvent(personalPk, {
          date: newDate,
          start_time: newStart,
          end_time: newEnd,
        });
        setEv((prev) => ({ ...prev, date: newDate, start_time: newStart, end_time: newEnd }));
        setMode("view");
        onEventUpdated?.();
      } else {
        await updateCalendarEvent(ev.id, {
          action: "reschedule",
          new_date: newDate,
          new_start_time: newStart,
          new_end_time: newEnd,
          meeting_link: linkVal || null,
        });
        if (isReplacement) {
          // Backend updated the replacement in place — reflect the new date/time.
          setEv((prev) => ({ ...prev, date: newDate, start_time: newStart, end_time: newEnd }));
        } else {
          setEv((prev) => ({ ...prev, event_status: "rescheduled", rescheduled_to_date: newDate }));
        }
        setMode("view");
        onEventUpdated?.();
      }
    } catch (e: unknown) {
      setError((e as { message?: string })?.message ?? "Failed to reschedule. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function doRestore(ceId: string) {
    setRestoringId(ceId);
    setRestoreErr(null);
    try {
      await updateCalendarEvent(ceId, { action: "restore" });
      onEventUpdated?.();
      onClose?.();
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message ?? "Failed to restore session.";
      setRestoreErr(msg);
    } finally {
      setRestoringId(null);
    }
  }

  async function doCancel() {
    setSaving(true);
    setError(null);
    try {
      await updateCalendarEvent(ev.id, { action: "cancel" });
      onEventUpdated?.();
      if (isReplacement) {
        onClose?.();
      } else {
        setEv((prev) => ({ ...prev, event_status: "cancelled" }));
        setMode("view");
      }
    } catch {
      setError("Failed to cancel. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function doUpdateLink() {
    setSaving(true);
    setError(null);
    try {
      await updateCalendarEvent(ev.id, { action: "update_link", meeting_link: linkVal || null });
      setEv((prev) => ({ ...prev, meeting_link: linkVal || null }));
      setMode("view");
      onEventUpdated?.();
    } catch {
      setError("Failed to update link. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function doUpdateLesson() {
    setSaving(true);
    setError(null);
    try {
      await updateCalendarEvent(ev.id, {
        action: "update_lesson",
        lesson_id: lessonId ? Number(lessonId) : null,
      });
      const selectedLesson = lessons?.find((l) => String(l.id) === lessonId);
      setEv((prev) => ({ ...prev, lesson_title: selectedLesson?.title ?? null }));
      setMode("view");
      onEventUpdated?.();
    } catch {
      setError("Failed to save lecture. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const SMALL = "clamp(11px, 0.72vw, 13px)";
  const TEXT = "clamp(13px, 0.85vw, 15px)";
  const btnBase: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontFamily: "var(--font-accent)",
    fontWeight: 500,
    fontSize: SMALL,
    border: "none",
    borderRadius: 999,
    padding: "6px 14px",
    cursor: "pointer",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ── Previously section (cancelled / rescheduled events) ── */}
      {isProcessed && mode === "view" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {onAddNew && (
            <button
              type="button"
              onClick={() => onAddNew(ev.date, parseInt(ev.start_time.split(":")[0], 10))}
              style={{
                alignSelf: "flex-start",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "var(--gradient-brand)",
                border: "none",
                borderRadius: 999,
                cursor: "pointer",
                fontFamily: "var(--font-accent)",
                fontWeight: 500,
                fontSize: SMALL,
                color: "var(--color-text-primary)",
                padding: "7px 16px",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              <Plus size={13} />
              Add new event here
            </button>
          )}

          <div
            style={{
              borderRadius: 10,
              border: "1px solid var(--color-border-light)",
              overflow: "hidden",
            }}
          >
            {/* Collapsible header */}
            <button
              type="button"
              onClick={() => setShowDetails((v) => !v)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "9px 14px",
                background: "var(--color-input-bg)",
                border: "none",
                borderBottom: showDetails ? "1px solid var(--color-border-light)" : "none",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-base)",
                  fontWeight: 700,
                  fontSize: SMALL,
                  color: "var(--color-text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Previously
              </span>
              <ChevronDown
                size={12}
                style={{
                  transform: showDetails ? "rotate(180deg)" : "none",
                  transition: "transform 0.2s",
                  color: "var(--color-text-secondary)",
                  flexShrink: 0,
                }}
              />
            </button>

            {/* Rows list */}
            {showDetails &&
              [ev, ...overlappingCancelled].map((ce, idx) => {
                const isExp = expandedIdx === idx;
                const ceLabel = ce.course_title ?? ce.title ?? "Session";
                const ceStatus =
                  ce.event_status === "cancelled"
                    ? "Cancelled"
                    : `Rescheduled → ${ce.rescheduled_to_date ? ce.rescheduled_to_date.slice(5).split("-").reverse().join(".") : ""}`;
                const ceTodayISO = new Date().toISOString().slice(0, 10);
                const ceNowTime = new Date().toTimeString().slice(0, 5);
                const cePast =
                  ce.date < ceTodayISO || (ce.date === ceTodayISO && ce.end_time <= ceNowTime);
                const ceCanReschedule =
                  role === "teacher" &&
                  !isPersonal &&
                  !!ce.event_status &&
                  !ce.rescheduled_from_date &&
                  !cePast;
                const ceCanRestore =
                  role === "teacher" &&
                  !isPersonal &&
                  !!ce.event_status &&
                  !ce.rescheduled_from_date &&
                  !cePast;
                return (
                  <div
                    key={ce.id}
                    style={{ borderTop: idx > 0 ? "1px solid var(--color-border-light)" : "none" }}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedIdx(isExp ? null : idx)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 12px",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <ChevronDown
                        size={12}
                        style={{
                          flexShrink: 0,
                          transform: isExp ? "rotate(180deg)" : "none",
                          transition: "transform 0.2s",
                          color: "var(--color-text-secondary)",
                        }}
                      />
                      <div
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          overflow: "hidden",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-accent)",
                            fontWeight: 500,
                            fontSize: SMALL,
                            color: "var(--color-text-primary)",
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                          }}
                        >
                          {ce.start_time} – {ce.end_time}
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-base)",
                            fontSize: SMALL,
                            color:
                              ce.event_status === "cancelled" ? "var(--color-danger)" : "#ea580c",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {ceStatus}
                        </span>
                      </div>
                    </button>
                    {isExp && (
                      <div
                        style={{
                          padding: "0 12px 12px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 5,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-base)",
                            fontSize: SMALL,
                            color: "var(--color-text-secondary)",
                          }}
                        >
                          {ce.date.split("-").reverse().join(".")}
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-base)",
                            fontWeight: 600,
                            fontSize: SMALL,
                            color: "var(--color-text-primary)",
                          }}
                        >
                          {ceLabel}
                        </span>
                        {(ce.cohort_name || ce.student) && (
                          <span
                            style={{
                              fontFamily: "var(--font-base)",
                              fontSize: SMALL,
                              color: "var(--color-text-secondary)",
                            }}
                          >
                            {ce.cohort_name ??
                              (ce.student ? ce.student.name || ce.student.email : null)}
                          </span>
                        )}
                        {ce.event_status === "rescheduled" && ce.rescheduled_to_date && (
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              padding: "2px 8px",
                              borderRadius: 999,
                              background: "#fff7ed",
                              border: "1px solid #fdba74",
                              alignSelf: "flex-start",
                            }}
                          >
                            <RotateCcw size={10} color="#ea580c" />
                            <span
                              style={{
                                fontFamily: "var(--font-base)",
                                fontSize: "10px",
                                fontWeight: 600,
                                color: "#ea580c",
                              }}
                            >
                              → {ce.rescheduled_to_date.split("-").reverse().join(".")}
                            </span>
                          </div>
                        )}
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 4 }}>
                          {ceCanReschedule && ce.id === ev.id && (
                            <button
                              type="button"
                              onClick={() => setMode("reschedule")}
                              style={{
                                alignSelf: "flex-start",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontFamily: "var(--font-base)",
                                fontWeight: 600,
                                fontSize: SMALL,
                                color: "var(--color-text-primary)",
                                padding: 0,
                              }}
                            >
                              <RotateCcw size={13} />
                              Reschedule
                            </button>
                          )}
                          {ceCanRestore && (
                            <button
                              type="button"
                              disabled={restoringId === ce.id}
                              onClick={() => doRestore(ce.id)}
                              style={{
                                alignSelf: "flex-start",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                                background: "none",
                                border: "none",
                                cursor: restoringId === ce.id ? "default" : "pointer",
                                fontFamily: "var(--font-base)",
                                fontWeight: 600,
                                fontSize: SMALL,
                                color: "#16a34a",
                                padding: 0,
                                opacity: restoringId === ce.id ? 0.5 : 1,
                              }}
                            >
                              <Undo2 size={13} />
                              {restoringId === ce.id ? "Restoring…" : "Restore"}
                            </button>
                          )}
                        </div>
                        {restoreErr && (
                          <p
                            style={{
                              fontFamily: "var(--font-base)",
                              fontSize: "clamp(11px, 0.72vw, 13px)",
                              color: "var(--color-danger)",
                              margin: "4px 0 0",
                            }}
                          >
                            {restoreErr}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      <div
        style={{
          display: !isProcessed || mode !== "view" ? "flex" : "none",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* ── Status badge (replacement only — cancelled/rescheduled shown in Previously card) ── */}
        {isReplacement && ev.rescheduled_from_date && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 8,
              background: "#f0fdf4",
              border: "1px solid #86efac",
            }}
          >
            <RotateCcw size={13} color="#16a34a" />
            <span
              style={{
                fontFamily: "var(--font-base)",
                fontWeight: 700,
                fontSize: SMALL,
                color: "#16a34a",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Rescheduled from {fmtDate(ev.rescheduled_from_date)}
            </span>
          </div>
        )}

        {/* ── Time ── */}
        {!isProcessed && (
          <div>
            <span style={DRAWER_LABEL}>Time</span>
            <p
              style={{
                fontFamily: "var(--font-accent)",
                fontSize: "clamp(15px, 1.1vw, 20px)",
                color: "var(--color-text-primary)",
                margin: 0,
                fontWeight: 500,
              }}
            >
              {ev.start_time} – {ev.end_time}
            </p>
          </div>
        )}

        {/* ── Type badge ── */}
        {!isProcessed &&
          (() => {
            const { bg: badgeBg, text: badgeText } = isPersonal
              ? { bg: "rgba(195,235,210,0.5)", text: "#1A6633" }
              : ev.type === "group_session"
                ? { bg: "rgba(252,196,195,0.5)", text: "#8B2624" }
                : ev.type === "extra_session"
                  ? { bg: "rgba(255,225,140,0.5)", text: "#7C5000" }
                  : { bg: "rgba(167,186,250,0.5)", text: "var(--color-blue-dark)" };
            const badgeLabel = isPersonal
              ? `Personal${invites && invites.length > 0 ? " (shared)" : ""}`
              : typeBadge;
            return (
              <div
                style={{
                  display: "inline-flex",
                  alignSelf: "flex-start",
                  padding: "4px 14px",
                  borderRadius: 999,
                  background: badgeBg,
                  fontFamily: "var(--font-base)",
                  fontWeight: 700,
                  fontSize: SMALL,
                  color: badgeText,
                  letterSpacing: "0.02em",
                }}
              >
                {badgeLabel}
              </div>
            );
          })()}

        {/* ── Title / Date / Creator / Course / Group — hidden for cancelled/rescheduled (shown in Previously card) ── */}
        {!isProcessed && isPersonal && ev.title && (
          <div>
            <span style={DRAWER_LABEL}>Title</span>
            <p
              style={{
                fontFamily: "var(--font-base)",
                fontWeight: 600,
                fontSize: TEXT,
                color: "var(--color-text-primary)",
                margin: 0,
              }}
            >
              {ev.title}
            </p>
          </div>
        )}
        {!isProcessed && isPersonal && ev.date && (
          <div>
            <span style={DRAWER_LABEL}>Date</span>
            <p
              style={{
                fontFamily: "var(--font-base)",
                fontWeight: 600,
                fontSize: TEXT,
                color: "var(--color-text-primary)",
                margin: 0,
              }}
            >
              {ev.date.split("-").reverse().join(".")}
            </p>
          </div>
        )}
        {!isProcessed && ev.type === "personal_shared" && ev.owner_name && (
          <div>
            <span style={DRAWER_LABEL}>Created by</span>
            <p
              style={{
                fontFamily: "var(--font-base)",
                fontWeight: 600,
                fontSize: TEXT,
                color: "var(--color-text-primary)",
                margin: 0,
              }}
            >
              {ev.owner_name}
            </p>
          </div>
        )}
        {!isProcessed && ev.course_title && (
          <div>
            <span style={DRAWER_LABEL}>Course</span>
            <p
              style={{
                fontFamily: "var(--font-base)",
                fontWeight: 600,
                fontSize: TEXT,
                color: "var(--color-text-primary)",
                margin: 0,
              }}
            >
              {ev.course_title}
            </p>
          </div>
        )}
        {!isProcessed && detail && (
          <div>
            <span style={DRAWER_LABEL}>{isGroup ? "Group" : "Student"}</span>
            <p
              style={{
                fontFamily: "var(--font-base)",
                fontSize: TEXT,
                color: "var(--color-text-secondary)",
                margin: 0,
              }}
            >
              {detail}
            </p>
          </div>
        )}

        {/* ── Lecture ── */}
        {mode === "lesson_edit" && canEdit ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={DRAWER_LABEL}>Lecture</span>
            {lessons === null ? (
              <p
                style={{
                  fontFamily: "var(--font-base)",
                  fontSize: SMALL,
                  color: "var(--color-text-secondary)",
                  margin: 0,
                }}
              >
                Loading…
              </p>
            ) : lessons.length === 0 ? (
              <p
                style={{
                  fontFamily: "var(--font-base)",
                  fontSize: SMALL,
                  color: "var(--color-text-secondary)",
                  margin: 0,
                }}
              >
                No lessons found for this course
              </p>
            ) : (
              <SelectField
                options={[
                  { value: "", label: "— No lecture —" },
                  ...lessons.map((l) => ({ value: String(l.id), label: l.title })),
                ]}
                value={lessonId}
                onChange={setLessonId}
                placeholder="Select lecture"
              />
            )}
            {error && (
              <p
                style={{
                  fontFamily: "var(--font-base)",
                  fontSize: SMALL,
                  color: "var(--color-danger)",
                  margin: 0,
                }}
              >
                {error}
              </p>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                style={{
                  ...btnBase,
                  background: "var(--color-text-primary)",
                  color: "#fff",
                  opacity: saving ? 0.6 : 1,
                }}
                onClick={doUpdateLesson}
                disabled={saving || lessons === null}
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                style={{
                  ...btnBase,
                  background: "var(--color-input-bg)",
                  color: "var(--color-text-secondary)",
                }}
                onClick={() => {
                  setMode("view");
                  setError(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {ev.lesson_title ? (
              ev.lesson_url ? (
                <a
                  href={ev.lesson_url}
                  style={{
                    fontFamily: "var(--font-base)",
                    fontSize: TEXT,
                    color: "var(--color-blue)",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    textDecoration: "none",
                  }}
                >
                  <Link2 size={13} />
                  {ev.lesson_title}
                </a>
              ) : (
                <div>
                  <span style={DRAWER_LABEL}>Lecture</span>
                  <p
                    style={{
                      fontFamily: "var(--font-base)",
                      fontSize: TEXT,
                      color: "var(--color-text-secondary)",
                      margin: 0,
                    }}
                  >
                    {ev.lesson_title}
                  </p>
                </div>
              )
            ) : canEdit ? (
              <span
                style={{
                  fontFamily: "var(--font-base)",
                  fontSize: SMALL,
                  color: "var(--color-text-secondary)",
                }}
              >
                No lecture linked
              </span>
            ) : null}
            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  setLessonId("");
                  setMode("lesson_edit");
                }}
                title="Edit linked lecture"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-text-secondary)",
                  padding: 4,
                  display: "flex",
                }}
              >
                <Pencil size={14} />
              </button>
            )}
          </div>
        )}

        {/* ── Meeting link ── */}
        {mode === "link_edit" && canEdit ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={DRAWER_LABEL}>Meeting link</span>
            <input
              type="url"
              style={DRAWER_INPUT}
              placeholder="https://meet.google.com/..."
              value={linkVal}
              onChange={(e) => setLinkVal(e.target.value)}
              autoFocus
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                style={{
                  ...btnBase,
                  background: "var(--color-text-primary)",
                  color: "#fff",
                  opacity: saving ? 0.6 : 1,
                }}
                onClick={doUpdateLink}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                style={{
                  ...btnBase,
                  background: "var(--color-input-bg)",
                  color: "var(--color-text-secondary)",
                }}
                onClick={() => {
                  setMode("view");
                  setLinkVal(ev.meeting_link ?? "");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {ev.meeting_link ? (
              <a
                href={ev.meeting_link}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  alignSelf: "flex-start",
                  fontFamily: "var(--font-accent)",
                  fontWeight: 500,
                  fontSize: TEXT,
                  color: "var(--color-text-primary)",
                  background: "var(--gradient-brand)",
                  borderRadius: 28,
                  padding: "9px 22px",
                  textDecoration: "none",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                <ExternalLink size={13} />
                Join meeting
              </a>
            ) : canEdit ? (
              <span
                style={{
                  fontFamily: "var(--font-base)",
                  fontSize: SMALL,
                  color: "var(--color-text-secondary)",
                }}
              >
                No meeting link
              </span>
            ) : null}
            {canEdit && (
              <button
                type="button"
                onClick={() => setMode("link_edit")}
                title="Edit meeting link"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-text-secondary)",
                  padding: 4,
                  display: "flex",
                }}
              >
                <Pencil size={14} />
              </button>
            )}
          </div>
        )}

        {/* ── Reschedule form ── */}
        {mode === "reschedule" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <DatePicker label="Date" value={newDate} onChange={setNewDate} size="md" />

            <div style={{ display: "flex", gap: 12 }}>
              <Field label="Start">
                <TimePicker value={newStart} onChange={setNewStart} />
              </Field>
              <Field label="End">
                <TimePicker value={newEnd} onChange={setNewEnd} />
              </Field>
            </div>

            <Field label="Meeting link (optional)">
              <input
                type="url"
                style={DRAWER_INPUT}
                placeholder="https://..."
                value={linkVal}
                onChange={(e) => setLinkVal(e.target.value)}
              />
            </Field>

            {error && (
              <p
                style={{
                  fontFamily: "var(--font-base)",
                  fontSize: SMALL,
                  color: "var(--color-danger)",
                  margin: 0,
                }}
              >
                {error}
              </p>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                style={{
                  ...btnBase,
                  background: "var(--color-text-primary)",
                  color: "#fff",
                  opacity: saving ? 0.6 : 1,
                }}
                onClick={doReschedule}
                disabled={saving}
              >
                {saving ? "Saving…" : "Confirm reschedule"}
              </button>
              <button
                type="button"
                style={{
                  ...btnBase,
                  background: "transparent",
                  color: "var(--color-text-secondary)",
                  border: "1px solid var(--color-border-light)",
                }}
                onClick={() => {
                  setMode("view");
                  setError(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── Cancel confirmation ── */}
        {mode === "confirm_cancel" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              padding: "14px",
              background: "#fff0f0",
              borderRadius: 10,
              border: "1px solid #fca5a5",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <AlertTriangle size={15} color="var(--color-danger)" />
              <span
                style={{
                  fontFamily: "var(--font-base)",
                  fontWeight: 700,
                  fontSize: SMALL,
                  color: "var(--color-danger)",
                }}
              >
                Cancel this session?
              </span>
            </div>
            <p
              style={{
                fontFamily: "var(--font-base)",
                fontSize: SMALL,
                color: "var(--color-text-secondary)",
                margin: 0,
              }}
            >
              {isReplacement
                ? "This replacement will be deleted and the original session will be marked as cancelled."
                : "The session will be marked as cancelled. Students will see the cancellation notice."}
            </p>
            {error && (
              <p
                style={{
                  fontFamily: "var(--font-base)",
                  fontSize: SMALL,
                  color: "var(--color-danger)",
                  margin: 0,
                }}
              >
                {error}
              </p>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                style={{
                  ...btnBase,
                  background: "var(--color-danger)",
                  color: "#fff",
                  opacity: saving ? 0.6 : 1,
                }}
                onClick={doCancel}
                disabled={saving}
              >
                {saving ? "Cancelling…" : "Yes, cancel session"}
              </button>
              <button
                type="button"
                style={{
                  ...btnBase,
                  background: "transparent",
                  color: "var(--color-text-secondary)",
                  border: "1px solid var(--color-border-light)",
                }}
                onClick={() => {
                  setMode("view");
                  setError(null);
                }}
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* ── Delete confirmation ── */}
        {mode === "confirm_delete" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              padding: "14px",
              background: "#fff0f0",
              borderRadius: 10,
              border: "1px solid #fca5a5",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <AlertTriangle size={15} color="var(--color-danger)" />
              <span
                style={{
                  fontFamily: "var(--font-base)",
                  fontWeight: 700,
                  fontSize: SMALL,
                  color: "var(--color-danger)",
                }}
              >
                Delete this event?
              </span>
            </div>
            <p
              style={{
                fontFamily: "var(--font-base)",
                fontSize: SMALL,
                color: "var(--color-text-secondary)",
                margin: 0,
              }}
            >
              This will permanently delete the event and cancel all invitations sent to guests.
            </p>
            {error && (
              <p
                style={{
                  fontFamily: "var(--font-base)",
                  fontSize: SMALL,
                  color: "var(--color-danger)",
                  margin: 0,
                }}
              >
                {error}
              </p>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                style={{
                  ...btnBase,
                  background: "var(--color-danger)",
                  color: "#fff",
                  opacity: deleting ? 0.6 : 1,
                }}
                onClick={doDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting…" : "Yes, delete event"}
              </button>
              <button
                type="button"
                style={{
                  ...btnBase,
                  background: "transparent",
                  color: "var(--color-text-secondary)",
                  border: "1px solid var(--color-border-light)",
                }}
                onClick={() => {
                  setMode("view");
                  setError(null);
                }}
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* ── Invitations list + add guest (personal events, owner view) ── */}
        {isPersonal && isOwner && invites !== null && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={DRAWER_LABEL}>Guests</span>

            {/* Add guest input */}
            {mode === "view" && !isPastEvent && (
              <div style={{ position: "relative", marginBottom: 4 }}>
                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    type="email"
                    placeholder="Invite by email…"
                    value={inviteQuery}
                    onChange={(e) => {
                      setInviteQuery(e.target.value);
                      setInviteErr(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        doInvite(inviteQuery);
                      }
                    }}
                    style={{ ...DRAWER_INPUT, flex: 1, fontSize: SMALL, padding: "6px 10px" }}
                  />
                  <button
                    type="button"
                    disabled={inviting || !inviteQuery.trim()}
                    onClick={() => doInvite(inviteQuery)}
                    style={{
                      ...btnBase,
                      background: "var(--gradient-brand)",
                      color: "var(--color-text-primary)",
                      fontSize: SMALL,
                      padding: "6px 14px",
                      opacity: inviting || !inviteQuery.trim() ? 0.6 : 1,
                      flexShrink: 0,
                    }}
                  >
                    {inviting ? "…" : "Invite"}
                  </button>
                </div>
                {inviteSugg.length > 0 && (
                  <div style={SUGGESTION_LIST}>
                    {inviteSugg.map((u) => (
                      <button
                        key={u.email}
                        type="button"
                        style={SUGGESTION_BTN}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "var(--color-input-bg)")
                        }
                        onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                        onClick={() => {
                          setInviteQuery(u.email);
                          setInviteSugg([]);
                        }}
                      >
                        <UserAvatar u={u} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontFamily: "var(--font-base)",
                              fontWeight: 600,
                              fontSize: TEXT,
                              color: "var(--color-text-primary)",
                            }}
                          >
                            {u.name}
                          </div>
                          <div
                            style={{
                              fontFamily: "var(--font-base)",
                              fontSize: SMALL,
                              color: "var(--color-text-secondary)",
                            }}
                          >
                            {u.email}
                          </div>
                        </div>
                        <span
                          style={{
                            fontFamily: "var(--font-accent)",
                            fontSize: "10px",
                            color: "var(--color-text-secondary)",
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                            flexShrink: 0,
                          }}
                        >
                          {u.role}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {inviteErr && (
                  <p
                    style={{
                      fontFamily: "var(--font-base)",
                      fontSize: "10px",
                      color: "var(--color-danger)",
                      margin: "4px 0 0",
                    }}
                  >
                    {inviteErr}
                  </p>
                )}
              </div>
            )}

            {invites.map((inv) => {
              const isPending = inv.status === "pending";
              const isAccepted = inv.status === "accepted";
              const statusBg = isAccepted
                ? "rgba(195,235,210,0.6)"
                : isPending
                  ? "rgba(255,225,140,0.5)"
                  : "rgba(252,196,195,0.5)";
              const statusText = isAccepted ? "#1A6633" : isPending ? "#7C5000" : "#8B2624";
              const statusLabel = isAccepted ? "Accepted" : isPending ? "Pending" : "Declined";
              const initials = (inv.name || inv.email).slice(0, 1).toUpperCase();
              const avatarStyle: React.CSSProperties = {
                width: 28,
                height: 28,
                borderRadius: 999,
                flexShrink: 0,
                objectFit: "cover",
              };
              return (
                <div
                  key={inv.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 0",
                    borderBottom: "1px solid var(--color-border-light)",
                  }}
                >
                  {inv.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={inv.avatar} alt={inv.name} style={avatarStyle} />
                  ) : (
                    <div
                      style={{
                        ...avatarStyle,
                        background: "var(--gradient-brand)",
                        color: "var(--color-text-primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "var(--font-accent)",
                        fontWeight: 700,
                        fontSize: SMALL,
                      }}
                    >
                      {initials}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontFamily: "var(--font-base)",
                        fontWeight: 600,
                        fontSize: SMALL,
                        color: "var(--color-text-primary)",
                        margin: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {inv.name || inv.email}
                    </p>
                    <p
                      style={{
                        fontFamily: "var(--font-base)",
                        fontSize: "10px",
                        color: "var(--color-text-secondary)",
                        margin: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {inv.email}
                    </p>
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-base)",
                      fontSize: "10px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      color: statusText,
                      background: statusBg,
                      borderRadius: 999,
                      padding: "2px 8px",
                      flexShrink: 0,
                    }}
                  >
                    {statusLabel}
                  </span>
                  {inv.status !== "accepted" && (
                    <button
                      type="button"
                      disabled={resending === inv.id}
                      onClick={() => doResend(inv.email, inv.id)}
                      style={{
                        fontFamily: "var(--font-base)",
                        fontSize: "10px",
                        fontWeight: 600,
                        color: "var(--color-blue)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "2px 4px",
                        flexShrink: 0,
                        opacity: resending === inv.id ? 0.5 : 1,
                      }}
                    >
                      {resending === inv.id ? "…" : "Resend"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Invitee view: my invitation + other participants ── */}
        {isPersonal &&
          !isOwner &&
          participants !== null &&
          (() => {
            const fmtDt = (iso: string) => {
              const d = new Date(iso);
              return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
            };
            const statusPill = (status: string) => {
              const isAcc = status === "accepted";
              const isDec = status === "declined";
              return {
                bg: isAcc
                  ? "rgba(195,235,210,0.6)"
                  : isDec
                    ? "rgba(252,196,195,0.5)"
                    : "rgba(255,225,140,0.5)",
                text: isAcc ? "#1A6633" : isDec ? "#8B2624" : "#7C5000",
                label: isAcc ? "Accepted" : isDec ? "Declined" : "Pending",
              };
            };
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {participants.my_invite &&
                  (() => {
                    const inv = participants.my_invite!;
                    const pill = statusPill(inv.status);
                    return (
                      <div>
                        <span style={DRAWER_LABEL}>My invitation</span>
                        <div
                          style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 0 }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "6px 0",
                              borderBottom: "1px solid var(--color-border-light)",
                            }}
                          >
                            <span
                              style={{
                                fontFamily: "var(--font-base)",
                                fontSize: SMALL,
                                color: "var(--color-text-secondary)",
                              }}
                            >
                              Invited
                            </span>
                            <span
                              style={{
                                fontFamily: "var(--font-base)",
                                fontSize: SMALL,
                                fontWeight: 500,
                                color: "var(--color-text-primary)",
                              }}
                            >
                              {fmtDt(inv.invited_at)}
                            </span>
                          </div>
                          {inv.responded_at && (
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "6px 0",
                                borderBottom: "1px solid var(--color-border-light)",
                              }}
                            >
                              <span
                                style={{
                                  fontFamily: "var(--font-base)",
                                  fontSize: SMALL,
                                  color: "var(--color-text-secondary)",
                                }}
                              >
                                Responded
                              </span>
                              <span
                                style={{
                                  fontFamily: "var(--font-base)",
                                  fontSize: SMALL,
                                  fontWeight: 500,
                                  color: "var(--color-text-primary)",
                                }}
                              >
                                {fmtDt(inv.responded_at)}
                              </span>
                            </div>
                          )}
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "6px 0",
                            }}
                          >
                            <span
                              style={{
                                fontFamily: "var(--font-base)",
                                fontSize: SMALL,
                                color: "var(--color-text-secondary)",
                              }}
                            >
                              Status
                            </span>
                            <span
                              style={{
                                fontFamily: "var(--font-base)",
                                fontSize: "10px",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "0.04em",
                                color: pill.text,
                                background: pill.bg,
                                borderRadius: 999,
                                padding: "2px 8px",
                              }}
                            >
                              {pill.label}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                {participants.participants.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={DRAWER_LABEL}>Other participants</span>
                    {participants.participants.map((p, i) => {
                      const pill = statusPill(p.status);
                      const initials = p.name.slice(0, 1).toUpperCase();
                      const pAvatarStyle: React.CSSProperties = {
                        width: 28,
                        height: 28,
                        borderRadius: 999,
                        flexShrink: 0,
                        objectFit: "cover",
                      };
                      return (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "8px 0",
                            borderBottom: "1px solid var(--color-border-light)",
                          }}
                        >
                          {p.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.avatar} alt={p.name} style={pAvatarStyle} />
                          ) : (
                            <div
                              style={{
                                ...pAvatarStyle,
                                background: "var(--gradient-brand)",
                                color: "var(--color-text-primary)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontFamily: "var(--font-accent)",
                                fontWeight: 700,
                                fontSize: SMALL,
                              }}
                            >
                              {initials}
                            </div>
                          )}
                          <span
                            style={{
                              flex: 1,
                              fontFamily: "var(--font-base)",
                              fontWeight: 600,
                              fontSize: SMALL,
                              color: "var(--color-text-primary)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {p.name}
                          </span>
                          <span
                            style={{
                              fontFamily: "var(--font-base)",
                              fontSize: "10px",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: "0.04em",
                              color: pill.text,
                              background: pill.bg,
                              borderRadius: 999,
                              padding: "2px 8px",
                              flexShrink: 0,
                            }}
                          >
                            {pill.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

        {/* ── Reschedule + Delete for personal event owner ── */}
        {isPersonal && isOwner && mode === "view" && !isPastEvent && (
          <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
            <button
              type="button"
              onClick={() => setMode("reschedule")}
              style={{
                alignSelf: "flex-start",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-base)",
                fontWeight: 600,
                fontSize: SMALL,
                color: "var(--color-text-primary)",
                padding: 0,
              }}
            >
              <RotateCcw size={13} />
              Reschedule
            </button>
            <button
              type="button"
              onClick={() => setMode("confirm_delete")}
              style={{
                alignSelf: "flex-start",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-base)",
                fontWeight: 600,
                fontSize: SMALL,
                color: "var(--color-danger)",
                opacity: 0.8,
                padding: 0,
              }}
            >
              <Trash2 size={13} />
              Delete event
            </button>
          </div>
        )}

        {/* ── Teacher action buttons ── */}
        {canEdit && mode === "view" && (
          <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
            <button
              type="button"
              onClick={() => setMode("reschedule")}
              style={{
                alignSelf: "flex-start",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-base)",
                fontWeight: 600,
                fontSize: SMALL,
                color: "var(--color-text-primary)",
                padding: 0,
              }}
            >
              <RotateCcw size={13} />
              Reschedule
            </button>
            <button
              type="button"
              onClick={() => setMode("confirm_cancel")}
              style={{
                alignSelf: "flex-start",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-base)",
                fontWeight: 600,
                fontSize: SMALL,
                color: "var(--color-danger)",
                opacity: 0.8,
                padding: 0,
              }}
            >
              <X size={13} />
              Cancel session
            </button>
          </div>
        )}

      </div>
      {/* end collapsible body */}

      {/* ── Previously cancelled / rescheduled at this slot (active events only) ── */}
      {!isProcessed && overlappingCancelled.length > 0 && (
        <div style={{ borderTop: "1px solid var(--color-border-light)", paddingTop: 14 }}>
          <div
            style={{
              borderRadius: 10,
              border: "1px solid var(--color-border-light)",
              overflow: "hidden",
            }}
          >
            <button
              type="button"
              onClick={() => setShowDetails((v) => !v)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "9px 14px",
                background: "var(--color-input-bg)",
                border: "none",
                borderBottom: showDetails ? "1px solid var(--color-border-light)" : "none",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-base)",
                  fontWeight: 700,
                  fontSize: SMALL,
                  color: "var(--color-text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Previously
              </span>
              <ChevronDown
                size={12}
                style={{
                  transform: showDetails ? "rotate(180deg)" : "none",
                  transition: "transform 0.2s",
                  color: "var(--color-text-secondary)",
                  flexShrink: 0,
                }}
              />
            </button>
            {showDetails &&
              overlappingCancelled.map((ce, idx) => {
                const isExp = expandedIdx === idx;
                const ceLabel = ce.course_title ?? ce.title ?? "Session";
                const ceStatus =
                  ce.event_status === "cancelled"
                    ? "Cancelled"
                    : `Rescheduled → ${ce.rescheduled_to_date ? ce.rescheduled_to_date.slice(5).split("-").reverse().join(".") : ""}`;
                const ceCanReschedule =
                  role === "teacher" &&
                  ce.type !== "personal" &&
                  ce.type !== "personal_shared" &&
                  !!ce.event_status &&
                  !ce.rescheduled_from_date &&
                  !(ce.date < todayISO_ || (ce.date === todayISO_ && ce.end_time <= nowTime_));
                return (
                  <div
                    key={ce.id}
                    style={{ borderTop: idx > 0 ? "1px solid var(--color-border-light)" : "none" }}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedIdx(isExp ? null : idx)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 12px",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <ChevronDown
                        size={12}
                        style={{
                          flexShrink: 0,
                          transform: isExp ? "rotate(180deg)" : "none",
                          transition: "transform 0.2s",
                          color: "var(--color-text-secondary)",
                        }}
                      />
                      <div
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          overflow: "hidden",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-accent)",
                            fontWeight: 500,
                            fontSize: SMALL,
                            color: "var(--color-text-primary)",
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                          }}
                        >
                          {ce.start_time} – {ce.end_time}
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-base)",
                            fontSize: SMALL,
                            color:
                              ce.event_status === "cancelled" ? "var(--color-danger)" : "#ea580c",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {ceStatus}
                        </span>
                      </div>
                    </button>
                    {isExp && (
                      <div
                        style={{
                          padding: "0 12px 12px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 5,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-base)",
                            fontSize: SMALL,
                            color: "var(--color-text-secondary)",
                          }}
                        >
                          {ce.date.split("-").reverse().join(".")}
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-base)",
                            fontWeight: 600,
                            fontSize: SMALL,
                            color: "var(--color-text-primary)",
                          }}
                        >
                          {ceLabel}
                        </span>
                        {(ce.cohort_name || ce.student) && (
                          <span
                            style={{
                              fontFamily: "var(--font-base)",
                              fontSize: SMALL,
                              color: "var(--color-text-secondary)",
                            }}
                          >
                            {ce.cohort_name ??
                              (ce.student ? ce.student.name || ce.student.email : null)}
                          </span>
                        )}
                        {ce.event_status === "rescheduled" && ce.rescheduled_to_date && (
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              padding: "2px 8px",
                              borderRadius: 999,
                              background: "#fff7ed",
                              border: "1px solid #fdba74",
                              alignSelf: "flex-start",
                            }}
                          >
                            <RotateCcw size={10} color="#ea580c" />
                            <span
                              style={{
                                fontFamily: "var(--font-base)",
                                fontSize: "10px",
                                fontWeight: 600,
                                color: "#ea580c",
                              }}
                            >
                              → {ce.rescheduled_to_date.split("-").reverse().join(".")}
                            </span>
                          </div>
                        )}
                        {ceCanReschedule && onOpenEvent && (
                          <button
                            type="button"
                            onClick={() => onOpenEvent(ce, "reschedule")}
                            style={{
                              alignSelf: "flex-start",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              fontFamily: "var(--font-base)",
                              fontWeight: 600,
                              fontSize: SMALL,
                              color: "var(--color-text-primary)",
                              padding: 0,
                              marginTop: 4,
                            }}
                          >
                            <RotateCcw size={13} />
                            Reschedule
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
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
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [unavailability, setUnavailability] = useState<TeacherUnavailability[]>([]);
  const [drawer, setDrawer] = useState<DrawerState>(null);
  const [weekStart, setWeekStart] = useState<string>(() => currentWeekSundayISO());
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      const apiData = await getCalendarEvents(weekStart);
      if (cancelled) return;

      const allEvents = apiData.events;
      setEvents(allEvents);
      setUnavailability(apiData.unavailability);

      // Keep drawer.event in sync so reopening the panel shows fresh data
      setDrawer((prev) => {
        if (!prev || prev.type !== "view") return prev;
        const updated = allEvents.find((e) => e.id === prev.event.id);
        return updated ? { ...prev, event: updated } : prev;
      });
    }

    fetchAll().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [weekStart, refreshTick, role]);

  function openNewEvent(date: string, hour: number) {
    const slotStart = `${padTwo(hour)}:00`;
    const slotEnd = `${padTwo(Math.min(hour + 1, 23))}:00`;
    const jsDow = new Date(date).getDay(); // 0=Sun
    const backendDow = (jsDow + 6) % 7; // 0=Mon … 6=Sun
    const isUnavailable = unavailability.some((u) => {
      const uStart = u.start_time.slice(0, 5);
      const uEnd = u.end_time.slice(0, 5);
      const timeOverlap = uStart < slotEnd && uEnd > slotStart;
      if (u.recurrence_type === "weekly") return u.day_of_week === backendDow && timeOverlap;
      if (u.recurrence_type === "one_time") return u.date === date && timeOverlap;
      if (u.recurrence_type === "date_range")
        return (
          !!u.date &&
          !!u.date_to &&
          u.date <= date &&
          u.date_to >= date &&
          u.day_of_week === backendDow &&
          timeOverlap
        );
      return false;
    });
    setDrawer({ type: "new", date, hour, isUnavailable });
  }

  function openEventView(event: CalendarEvent) {
    setDrawer({ type: "view", event });
  }

  function toggleBlock() {
    setDrawer((d) => (d?.type === "block" ? null : { type: "block" }));
  }

  function toggleAddEvent() {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    const iso = `${y}-${m}-${d}`;
    setDrawer((prev) =>
      prev?.type === "new" ? null : { type: "new", date: iso, hour: today.getHours() },
    );
  }

  const drawerOpen = drawer !== null;

  const calendarActions = (
    <>
      {role === "teacher" && (
        <ActionBtn label="Block time" onClick={toggleBlock} active={drawer?.type === "block"} />
      )}
      <ActionBtn label="Add event" onClick={toggleAddEvent} active={drawer?.type === "new"} />
    </>
  );

  return (
    <div
      style={{
        position: "relative",
        minHeight: "calc(100% + 2 * clamp(14px, 1.5vw, 28px))",
        paddingInline: "clamp(28px, 4.28vw, 68px)",
        paddingBlock: "clamp(12px, 1.25vw, 20px)",
        background: "var(--color-calendar-bg)",
      }}
    >
      {/* ── Calendar (always full width) ── */}
      <WeekCalendar
        events={events}
        unavailability={role === "teacher" ? unavailability : []}
        onWeekChange={setWeekStart}
        role={role}
        onSlotClick={openNewEvent}
        onEventClick={openEventView}
        activeSlot={drawer?.type === "new" ? { date: drawer.date, hour: drawer.hour } : null}
        actions={calendarActions}
      />

      {/* ── Side panel overlay ── */}
      <SidePanel
        open={drawerOpen}
        onClose={() => setDrawer(null)}
        title={
          drawer?.type === "new"
            ? "New event"
            : drawer?.type === "view"
              ? "Event details"
              : drawer?.type === "block"
                ? "My unavailability"
                : ""
        }
        top={0}
        right={0}
        bottom={0}
        borderRadius={0}
        borderLeft="1px solid var(--color-calendar-border)"
      >
        {drawer?.type === "new" && (
          <NewEventPanel
            key={`${drawer.date}-${drawer.hour}`}
            date={drawer.date}
            hour={drawer.hour}
            role={role}
            isUnavailable={drawer.isUnavailable}
            unavailability={unavailability}
            onSubmitSuccess={() => {
              setRefreshTick((t) => t + 1);
              setDrawer(null);
            }}
          />
        )}
        {drawer?.type === "view" && (
          <EventDetailPanel
            key={drawer.event.id + (drawer.initialMode ?? "")}
            event={drawer.event}
            role={role}
            onEventUpdated={() => setRefreshTick((t) => t + 1)}
            onClose={() => setDrawer(null)}
            onAddNew={openNewEvent}
            initialMode={drawer.initialMode}
            onOpenEvent={(e, mode) =>
              setDrawer({ type: "view", event: e, initialMode: mode ?? "view" })
            }
            overlappingCancelled={events.filter(
              (e) =>
                e.date === drawer.event.date &&
                e.id !== drawer.event.id &&
                (e.event_status === "cancelled" || e.event_status === "rescheduled") &&
                e.start_time < drawer.event.end_time &&
                drawer.event.start_time < e.end_time,
            )}
          />
        )}
        {drawer?.type === "block" && <UnavailabilitySection />}
      </SidePanel>
    </div>
  );
}
