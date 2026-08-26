"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Lock,
  LockOpen,
  Pencil,
  Trash2,
  UserMinus,
} from "lucide-react";
import { AddButton } from "@/shared/ui/AddButton";
import { ModalShell } from "@/shared/ui/ModalShell";
import { DatePicker } from "@/shared/ui/DatePicker";
import { apiErrorMessage } from "@/shared/api/lib/apiErrorMessage";
import type { CourseDetail } from "@/entities/course";
import type { CourseCohort } from "@/entities/course/model/cohort";
import type { CohortMember, EnrolledStudent } from "@/entities/course/model/cohortGroup";
import type {
  CohortSchedule,
  CohortSchedulePayload,
  DayOfWeek,
} from "@/entities/course/model/schedule";
import { DAY_KEYS } from "@/entities/course/model/schedule";
import type {
  ScheduleConflictPersonalEvent,
  ScheduleConflicts,
} from "@/entities/course/api/scheduleApi";
import type { CohortInput } from "@/entities/course";
import {
  addCohortMember,
  checkCohortScheduleConflicts,
  createCohort,
  createCohortSchedule,
  deleteCohort,
  deleteCohortSchedule,
  deletePersonalEvent,
  deleteTeacherUnavailability,
  getCohortSchedules,
  getCourseEnrolledStudents,
  removeCohortMember,
  respondToInvitation,
  updateCohort,
  updateCohortSchedule,
  updatePersonalEvent,
} from "@/entities/course";

const CARD: React.CSSProperties = {
  background: "#fff",
  borderRadius: 16,
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  padding: "clamp(16px, 1.25vw, 22px)",
};
const LABEL: React.CSSProperties = {
  fontFamily: "var(--font-base)",
  fontWeight: 600,
  fontSize: "clamp(11px, 0.72vw, 13px)",
  color: "var(--color-text-secondary)",
  marginBottom: 4,
  display: "block",
};
const INPUT: React.CSSProperties = {
  fontFamily: "var(--font-base)",
  fontSize: "clamp(13px, 0.83vw, 15px)",
  color: "var(--color-text-primary)",
  background: "var(--color-bg)",
  border: "1px solid var(--color-text-primary)",
  borderRadius: 999,
  padding: "7px 14px",
  width: "100%",
  outline: "none",
  boxSizing: "border-box" as const,
};
const SUBMIT_BTN: React.CSSProperties = {
  fontFamily: "var(--font-base)",
  fontWeight: 600,
  fontSize: "clamp(12px, 0.78vw, 13px)",
  color: "#fff",
  background: "var(--color-text-primary)",
  border: "none",
  borderRadius: 999,
  padding: "6px 16px",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
};
const CANCEL_BTN: React.CSSProperties = {
  fontFamily: "var(--font-base)",
  fontWeight: 600,
  fontSize: "clamp(12px, 0.78vw, 13px)",
  color: "var(--color-text-primary)",
  background: "none",
  border: "1px solid var(--color-text-primary)",
  borderRadius: 999,
  padding: "6px 16px",
  cursor: "pointer",
};
const ERR: React.CSSProperties = {
  fontFamily: "var(--font-base)",
  fontSize: "clamp(11px, 0.72vw, 13px)",
  color: "var(--color-pink-dark)",
  marginTop: 4,
};

const DAY_VALUES = Object.keys(DAY_KEYS).map(Number) as DayOfWeek[];

function useDayOptions(): { value: DayOfWeek; label: string }[] {
  const tDays = useTranslations("Days");
  return DAY_VALUES.map((d) => ({ value: d, label: tDays(DAY_KEYS[d]) }));
}

function fmtTime(t: string) {
  return t.slice(0, 5);
}
function padTwo(n: number) {
  return String(n).padStart(2, "0");
}

function PillSelect<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOut(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOut);
    return () => document.removeEventListener("mousedown", onOut);
  }, []);

  const label = options.find((o) => o.value === value)?.label ?? String(value);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          ...INPUT,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
        }}
      >
        <span>{label}</span>
        <ChevronDown
          size={14}
          style={{
            flexShrink: 0,
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.15s",
            color: "var(--color-text-primary)",
          }}
        />
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 200,
            background: "var(--color-bg)",
            borderRadius: 16,
            padding: "8px 12px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
            boxShadow: "var(--shadow-card)",
          }}
        >
          {options.map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              style={{
                background: "none",
                border: "none",
                padding: "2px 0",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "var(--font-base)",
                fontWeight: opt.value === value ? 600 : 400,
                fontSize: "clamp(13px, 1.04vw, 16px)",
                lineHeight: 1.4,
                color: opt.value === value ? "var(--color-blue)" : "var(--color-text-primary)",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

function TimePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const t = useTranslations("CourseManagementGroupTab");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOut(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOut);
    return () => document.removeEventListener("mousedown", onOut);
  }, []);

  const [hh, mm] = value.split(":").map((n) => parseInt(n, 10) || 0);
  function pick(h: number, m: number) {
    onChange(`${padTwo(h)}:${padTwo(m)}`);
  }
  const cell = (active: boolean): React.CSSProperties => ({
    border: "none",
    borderRadius: 6,
    padding: "3px 2px",
    cursor: "pointer",
    textAlign: "center",
    fontFamily: "var(--font-base)",
    fontWeight: active ? 600 : 400,
    fontSize: "clamp(12px, 0.83vw, 14px)",
    lineHeight: 1.4,
    background: "none",
    color: active ? "var(--color-blue)" : "var(--color-text-primary)",
  });

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          ...INPUT,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
        }}
      >
        <span>
          {padTwo(hh)}:{padTwo(mm)}
        </span>
        <ChevronDown
          size={14}
          style={{
            flexShrink: 0,
            color: "var(--color-text-primary)",
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.15s",
          }}
        />
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            zIndex: 200,
            background: "var(--color-bg)",
            borderRadius: 16,
            padding: "10px 12px 14px",
            boxShadow: "var(--shadow-card)",
            minWidth: 200,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-base)",
              fontSize: "clamp(10px, 0.63vw, 11px)",
              fontWeight: 600,
              color: "var(--color-text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 6,
            }}
          >
            {t("hour")}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, 1fr)",
              gap: 2,
              marginBottom: 10,
            }}
          >
            {HOURS.map((h) => (
              <button key={h} type="button" onClick={() => pick(h, mm)} style={cell(h === hh)}>
                {padTwo(h)}
              </button>
            ))}
          </div>
          <div style={{ height: 1, background: "var(--color-border-light)", marginBottom: 10 }} />
          <div
            style={{
              fontFamily: "var(--font-base)",
              fontSize: "clamp(10px, 0.63vw, 11px)",
              fontWeight: 600,
              color: "var(--color-text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 6,
            }}
          >
            {t("min")}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 2 }}>
            {MINUTES.map((m) => (
              <button key={m} type="button" onClick={() => pick(hh, m)} style={cell(m === mm)}>
                {padTwo(m)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AddStudentDropdown({
  enrolledStudents,
  takenIds,
  onAdd,
}: {
  enrolledStudents: EnrolledStudent[];
  takenIds: Set<number>;
  onAdd: (enrollmentId: number) => Promise<void>;
}) {
  const t = useTranslations("CourseManagementGroupTab");
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOut(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOut);
    return () => document.removeEventListener("mousedown", onOut);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
      setTimeout(
        () => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }),
        50,
      );
    } else setSearch("");
  }, [open]);

  const available = enrolledStudents.filter(
    (s) =>
      !takenIds.has(s.enrollment_id) &&
      (s.student_name.toLowerCase().includes(search.toLowerCase()) ||
        s.student_email.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div ref={rootRef} style={{ position: "relative", display: "inline-block" }}>
      <AddButton onClick={() => setOpen((v) => !v)}>{t("addStudent")}</AddButton>
      {open && (
        <div
          ref={panelRef}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            zIndex: 50,
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 8px 32px rgba(83,98,153,0.18)",
            border: "1px solid var(--color-border-light)",
            width: "clamp(240px, 22vw, 320px)",
            overflow: "hidden",
          }}
        >
          <div
            style={{ padding: "10px 12px", borderBottom: "1px solid var(--color-border-light)" }}
          >
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchPlaceholder")}
              style={{
                fontFamily: "var(--font-base)",
                fontSize: "clamp(12px, 0.78vw, 14px)",
                color: "var(--color-text-primary)",
                background: "var(--color-bg)",
                borderRadius: 999,
                border: "1px solid var(--color-text-primary)",
                padding: "6px 14px",
                width: "100%",
                outline: "none",
                boxSizing: "border-box" as const,
              }}
            />
          </div>
          <div
            onMouseDown={(e) => e.preventDefault()}
            style={{ maxHeight: 240, overflowY: "auto", padding: "6px 0 12px" }}
          >
            {available.length === 0 ? (
              <p
                style={{
                  fontFamily: "var(--font-base)",
                  fontSize: "clamp(12px, 0.78vw, 14px)",
                  color: "var(--color-text-muted)",
                  textAlign: "center",
                  padding: "18px 14px",
                  margin: 0,
                }}
              >
                {enrolledStudents.length === 0 ? t("noEnrolledStudentsYet") : t("noMatches")}
              </p>
            ) : (
              available.map((s) => (
                <button
                  key={s.enrollment_id}
                  type="button"
                  onClick={async () => {
                    setAdding(s.enrollment_id);
                    try {
                      await onAdd(s.enrollment_id);
                      setOpen(false);
                    } finally {
                      setAdding(null);
                    }
                  }}
                  disabled={adding === s.enrollment_id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    textAlign: "left",
                    padding: "8px 14px",
                    background: "none",
                    border: "none",
                    cursor: adding === s.enrollment_id ? "not-allowed" : "pointer",
                    opacity: adding === s.enrollment_id ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "var(--color-bg)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "none";
                  }}
                >
                  {s.student_avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={s.student_avatar}
                      alt={s.student_name}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        objectFit: "cover",
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 28,
                        height: 28,
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
                          fontSize: 9,
                          color: "var(--color-text-primary)",
                          lineHeight: 1,
                        }}
                      >
                        {memberInitials(s.student_name || "?")}
                      </span>
                    </div>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span
                      style={{
                        fontFamily: "var(--font-base)",
                        fontWeight: 600,
                        fontSize: "clamp(12px, 0.83vw, 14px)",
                        color: "var(--color-text-primary)",
                      }}
                    >
                      {s.student_name || "—"}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-base)",
                        fontSize: "clamp(11px, 0.72vw, 13px)",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      {s.student_email}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function memberInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

function MemberRow({
  member,
  onRemove,
}: {
  member: CohortMember;
  onRemove: (id: number) => Promise<void>;
}) {
  const t = useTranslations("CourseManagementGroupTab");
  const [removing, setRemoving] = useState(false);
  const avatarSize = "clamp(28px, 2.22vw, 32px)";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 12px",
        borderRadius: 10,
        background: "var(--color-bg)",
        border: "1px solid var(--color-border-light)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {member.student_avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={member.student_avatar}
            alt={member.student_name}
            style={{
              width: avatarSize,
              height: avatarSize,
              borderRadius: "50%",
              objectFit: "cover",
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            style={{
              width: avatarSize,
              height: avatarSize,
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
                fontSize: "clamp(7px, 0.5vw, 9px)",
                color: "var(--color-text-primary)",
                lineHeight: 1,
              }}
            >
              {memberInitials(member.student_name || "?")}
            </span>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span
            style={{
              fontFamily: "var(--font-base)",
              fontWeight: 600,
              fontSize: "clamp(12px, 0.8vw, 14px)",
              color: "var(--color-text-primary)",
            }}
          >
            {member.student_name || "—"}
          </span>
          <span
            style={{
              fontFamily: "var(--font-base)",
              fontSize: "clamp(11px, 0.72vw, 13px)",
              color: "var(--color-text-secondary)",
            }}
          >
            {member.student_email}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={async () => {
          setRemoving(true);
          try {
            await onRemove(member.id);
          } finally {
            setRemoving(false);
          }
        }}
        disabled={removing}
        title={t("removeFromCohort")}
        style={{
          background: "none",
          border: "none",
          cursor: removing ? "not-allowed" : "pointer",
          color: "var(--color-pink-dark)",
          display: "flex",
          alignItems: "center",
          padding: 4,
          borderRadius: 6,
          opacity: removing ? 0.5 : 1,
        }}
      >
        <UserMinus size={15} />
      </button>
    </div>
  );
}

function CohortScheduleRow({
  entry,
  onDelete,
  onEdit,
}: {
  entry: CohortSchedule;
  onDelete: (id: number) => Promise<void>;
  onEdit: (e: CohortSchedule) => void;
}) {
  const t = useTranslations("CourseManagementGroupTab");
  const tDays = useTranslations("Days");
  const [deleting, setDeleting] = useState(false);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 12px",
        borderRadius: 10,
        background: "var(--color-bg)",
        border: "1px solid var(--color-border-light)",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-base)",
          fontWeight: 600,
          fontSize: "clamp(12px, 0.83vw, 14px)",
          color: "var(--color-text-primary)",
        }}
      >
        {tDays(DAY_KEYS[entry.day_of_week])} &middot; {fmtTime(entry.start_time)} &ndash;{" "}
        {fmtTime(entry.end_time)}
      </span>
      <div style={{ display: "flex", gap: 2 }}>
        <button
          type="button"
          onClick={() => onEdit(entry)}
          title={t("edit")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--color-text-secondary)",
            display: "flex",
            alignItems: "center",
            padding: 4,
            borderRadius: 6,
          }}
        >
          <Pencil size={14} />
        </button>
        <button
          type="button"
          title={t("delete")}
          disabled={deleting}
          onClick={async () => {
            setDeleting(true);
            try {
              await onDelete(entry.id);
            } finally {
              setDeleting(false);
            }
          }}
          style={{
            background: "none",
            border: "none",
            cursor: deleting ? "not-allowed" : "pointer",
            color: "var(--color-pink-dark)",
            display: "flex",
            alignItems: "center",
            padding: 4,
            borderRadius: 6,
            opacity: deleting ? 0.4 : 1,
          }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

function CohortScheduleForm({
  initial,
  onSave,
  onCancel,
  slug,
  cohortId,
  excludeScheduleId,
}: {
  initial?: { day_of_week: DayOfWeek; start_time: string; end_time: string };
  onSave: (p: CohortSchedulePayload) => Promise<void>;
  onCancel: () => void;
  slug: string;
  cohortId: number;
  excludeScheduleId?: number;
}) {
  const t = useTranslations("CourseManagementGroupTab");
  const tSchedule = useTranslations("CourseManagementScheduleTab");
  const days = useDayOptions();
  const [day, setDay] = useState<DayOfWeek>(initial?.day_of_week ?? 0);
  const [start, setStart] = useState(initial ? fmtTime(initial.start_time) : "09:00");
  const [end, setEnd] = useState(initial ? fmtTime(initial.end_time) : "10:00");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [conflictModal, setConflictModal] = useState<{
    info: ScheduleConflicts;
    payload: CohortSchedulePayload;
  } | null>(null);
  const [pendingEvents, setPendingEvents] = useState<ScheduleConflictPersonalEvent[]>([]);
  const [modalSaving, setModalSaving] = useState(false);
  const [modalErr, setModalErr] = useState("");
  // Per-event reschedule inline form: { eventId, date, start, end }
  const [rescheduleState, setRescheduleState] = useState<{
    eventId: number;
    date: string;
    start: string;
    end: string;
  } | null>(null);
  const [eventLoading, setEventLoading] = useState<number | null>(null);

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (end <= start) {
      setErr(t("errorEndAfterStart"));
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      const payload: CohortSchedulePayload = { day_of_week: day, start_time: start, end_time: end };
      const conflicts = await checkCohortScheduleConflicts(slug, cohortId, {
        ...payload,
        ...(excludeScheduleId !== undefined ? { schedule_id: excludeScheduleId } : {}),
      });
      const hasConflicts =
        conflicts.group.length > 0 ||
        conflicts.individual.length > 0 ||
        conflicts.personal.length > 0 ||
        conflicts.personal_events.length > 0;
      if (hasConflicts) {
        setConflictModal({ info: conflicts, payload });
        setPendingEvents(conflicts.personal_events);
        setRescheduleState(null);
      } else {
        await onSave(payload);
      }
    } catch (ex: unknown) {
      setErr((ex as { message?: string })?.message ?? t("errorSaveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const resolveEvent = (eventId: number) => {
    setPendingEvents((prev) => prev.filter((e) => e.id !== eventId));
    setRescheduleState((rs) => (rs?.eventId === eventId ? null : rs));
  };

  const handleDeleteEvent = async (ev: ScheduleConflictPersonalEvent) => {
    setEventLoading(ev.id);
    setModalErr("");
    try {
      await deletePersonalEvent(ev.id);
      resolveEvent(ev.id);
    } catch (e) {
      setModalErr(apiErrorMessage(e, t("errorSaveFailed")));
    } finally {
      setEventLoading(null);
    }
  };

  const handleDeclineEvent = async (ev: ScheduleConflictPersonalEvent) => {
    if (!ev.invitation_id) return;
    setEventLoading(ev.id);
    setModalErr("");
    try {
      await respondToInvitation(ev.invitation_id, "decline");
      resolveEvent(ev.id);
    } catch (e) {
      setModalErr(apiErrorMessage(e, t("errorSaveFailed")));
    } finally {
      setEventLoading(null);
    }
  };

  const handleRescheduleEvent = async (ev: ScheduleConflictPersonalEvent) => {
    if (!rescheduleState || rescheduleState.eventId !== ev.id) return;
    setEventLoading(ev.id);
    setModalErr("");
    try {
      await updatePersonalEvent(ev.id, {
        date: rescheduleState.date,
        start_time: rescheduleState.start,
        end_time: rescheduleState.end,
      });
      resolveEvent(ev.id);
    } catch (e) {
      setModalErr(apiErrorMessage(e, t("errorSaveFailed")));
    } finally {
      setEventLoading(null);
    }
  };

  const handleDeleteBlocksAndSave = async () => {
    if (!conflictModal) return;
    setModalSaving(true);
    try {
      await Promise.all(conflictModal.info.personal.map((b) => deleteTeacherUnavailability(b.id)));
      await onSave(conflictModal.payload);
      setConflictModal(null);
    } catch (ex: unknown) {
      setErr((ex as { message?: string })?.message ?? t("errorSaveFailed"));
      setConflictModal(null);
    } finally {
      setModalSaving(false);
    }
  };

  const handleProceed = async () => {
    if (!conflictModal) return;
    setModalSaving(true);
    try {
      await onSave(conflictModal.payload);
      setConflictModal(null);
    } catch (ex: unknown) {
      setErr((ex as { message?: string })?.message ?? t("errorSaveFailed"));
      setConflictModal(null);
    } finally {
      setModalSaving(false);
    }
  };

  const ROW: React.CSSProperties = {
    fontFamily: "var(--font-base)",
    fontSize: "clamp(12px, 0.78vw, 13px)",
    color: "var(--color-text-primary)",
    padding: "8px 0",
    borderBottom: "1px solid var(--color-border-light)",
  };
  const MUTED: React.CSSProperties = { color: "var(--color-text-muted)" };
  const ACTION_BTN = (danger = false): React.CSSProperties => ({
    fontFamily: "var(--font-base)",
    fontWeight: 600,
    fontSize: "clamp(11px, 0.7vw, 12px)",
    color: danger ? "var(--color-pink-dark)" : "var(--color-text-primary)",
    background: "none",
    border: `1px solid ${danger ? "var(--color-pink-dark)" : "var(--color-border-light)"}`,
    borderRadius: 999,
    padding: "3px 10px",
    cursor: "pointer",
  });

  return (
    <>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <div>
            <label style={LABEL}>{t("day")}</label>
            <PillSelect options={days} value={day} onChange={(v) => setDay(v as DayOfWeek)} />
          </div>
          <div>
            <label style={LABEL}>{t("startTime")}</label>
            <TimePicker value={start} onChange={setStart} />
          </div>
          <div>
            <label style={LABEL}>{t("endTime")}</label>
            <TimePicker value={end} onChange={setEnd} />
          </div>
        </div>
        {err && <p style={ERR}>{err}</p>}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              ...SUBMIT_BTN,
              opacity: saving ? 0.7 : 1,
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            <Check size={13} /> {saving ? t("checking") : t("save")}
          </button>
          <button type="button" onClick={onCancel} style={CANCEL_BTN}>
            {t("cancel")}
          </button>
        </div>
      </form>

      {conflictModal &&
        (() => {
          const hasPersonalBlocks = conflictModal.info.personal.length > 0;
          const hasPendingEvents = pendingEvents.length > 0;
          const hasSessionConflicts =
            conflictModal.info.group.length > 0 || conflictModal.info.individual.length > 0;
          const blocked = hasPersonalBlocks || hasPendingEvents;

          return (
            <ModalShell
              onClose={() => !modalSaving && !eventLoading && setConflictModal(null)}
              title={tSchedule("scheduleConflicts")}
              icon={<AlertTriangle size={18} style={{ color: "var(--color-pink-dark)" }} />}
              width="clamp(560px, 52vw, 740px)"
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 18,
                  minHeight: "clamp(320px, 40vh, 520px)",
                }}
              >
                {conflictModal.info.group.length > 0 && (
                  <div>
                    <p style={{ ...LABEL, marginBottom: 6 }}>{tSchedule("groupSessions")}</p>
                    {conflictModal.info.group.map((c) => (
                      <div key={c.id} style={ROW}>
                        {c.course_title}
                        {c.cohort_name ? ` — ${c.cohort_name}` : ""}
                        &nbsp;
                        <span style={MUTED}>
                          {c.start_time}–{c.end_time}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {conflictModal.info.individual.length > 0 && (
                  <div>
                    <p style={{ ...LABEL, marginBottom: 6 }}>{tSchedule("individualSessions")}</p>
                    {conflictModal.info.individual.map((c) => (
                      <div key={c.id} style={ROW}>
                        {c.course_title}&nbsp;
                        <span style={MUTED}>
                          {c.start_time}–{c.end_time}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {hasPersonalBlocks && (
                  <div>
                    <p style={{ ...LABEL, marginBottom: 6 }}>
                      {tSchedule("personalUnavailabilityBlocks")}
                    </p>
                    {conflictModal.info.personal.map((b) => (
                      <div key={b.id} style={ROW}>
                        {b.reason || tSchedule("personalBlockFallback")}&nbsp;
                        <span style={MUTED}>
                          {b.start_time}–{b.end_time}
                        </span>
                      </div>
                    ))}
                    <p
                      style={{
                        fontFamily: "var(--font-base)",
                        fontSize: "clamp(11px, 0.7vw, 12px)",
                        color: "var(--color-text-muted)",
                        margin: "6px 0 0",
                      }}
                    >
                      {tSchedule("blocksMustBeDeleted")}
                    </p>
                  </div>
                )}

                {pendingEvents.length > 0 && (
                  <div>
                    <p style={{ ...LABEL, marginBottom: 6 }}>{tSchedule("personalEvents")}</p>
                    {pendingEvents.map((ev) => {
                      const isLoading = eventLoading === ev.id;
                      const isRescheduling = rescheduleState?.eventId === ev.id;
                      return (
                        <div
                          key={ev.id}
                          style={{ ...ROW, display: "flex", flexDirection: "column", gap: 6 }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 8,
                              flexWrap: "wrap",
                            }}
                          >
                            <span>
                              <strong>{ev.title}</strong>
                              &nbsp;
                              <span style={MUTED}>
                                {ev.date} · {ev.start_time}–{ev.end_time}
                              </span>
                              {!ev.is_owner && (
                                <span style={{ ...MUTED, marginLeft: 6 }}>
                                  {tSchedule("invited")}
                                </span>
                              )}
                            </span>
                            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                              {ev.is_owner ? (
                                <>
                                  <button
                                    type="button"
                                    disabled={isLoading || !!eventLoading}
                                    onClick={() =>
                                      setRescheduleState(
                                        isRescheduling
                                          ? null
                                          : {
                                              eventId: ev.id,
                                              date: ev.date,
                                              start: ev.start_time,
                                              end: ev.end_time,
                                            },
                                      )
                                    }
                                    style={ACTION_BTN()}
                                  >
                                    {isRescheduling ? tSchedule("cancel") : tSchedule("reschedule")}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isLoading || !!eventLoading}
                                    onClick={() => handleDeleteEvent(ev)}
                                    style={ACTION_BTN(true)}
                                  >
                                    {isLoading ? "…" : tSchedule("delete")}
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  disabled={isLoading || !!eventLoading}
                                  onClick={() => handleDeclineEvent(ev)}
                                  style={ACTION_BTN(true)}
                                >
                                  {isLoading ? "…" : tSchedule("declineInvite")}
                                </button>
                              )}
                            </div>
                          </div>

                          {isRescheduling && rescheduleState && (
                            <div
                              style={{
                                display: "flex",
                                gap: 8,
                                alignItems: "flex-end",
                                flexWrap: "wrap",
                                paddingTop: 4,
                              }}
                            >
                              <div>
                                <DatePicker
                                  size="sm"
                                  label={tSchedule("newDate")}
                                  value={rescheduleState.date}
                                  onChange={(value) =>
                                    setRescheduleState((s) => (s ? { ...s, date: value } : s))
                                  }
                                />
                              </div>
                              <div>
                                <label style={LABEL}>{tSchedule("start")}</label>
                                <TimePicker
                                  value={rescheduleState.start}
                                  onChange={(v) =>
                                    setRescheduleState((s) => (s ? { ...s, start: v } : s))
                                  }
                                />
                              </div>
                              <div>
                                <label style={LABEL}>{tSchedule("end")}</label>
                                <TimePicker
                                  value={rescheduleState.end}
                                  onChange={(v) =>
                                    setRescheduleState((s) => (s ? { ...s, end: v } : s))
                                  }
                                />
                              </div>
                              <button
                                type="button"
                                disabled={isLoading}
                                onClick={() => handleRescheduleEvent(ev)}
                                style={{ ...SUBMIT_BTN, opacity: isLoading ? 0.7 : 1 }}
                              >
                                {isLoading ? tSchedule("saving") : tSchedule("confirm")}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {blocked && (
                  <p
                    style={{
                      fontFamily: "var(--font-base)",
                      fontSize: "clamp(11px, 0.7vw, 12px)",
                      color: "var(--color-text-muted)",
                      margin: 0,
                    }}
                  >
                    {tSchedule("resolveAllToContinue")}
                  </p>
                )}

                {hasSessionConflicts && !hasPendingEvents && (
                  <p
                    style={{
                      fontFamily: "var(--font-base)",
                      fontSize: "clamp(11px, 0.72vw, 13px)",
                      color: "var(--color-danger)",
                      margin: 0,
                    }}
                  >
                    {tSchedule("resolveSessionsAbove")}
                  </p>
                )}

                {modalErr && (
                  <p role="alert" style={ERR}>
                    {modalErr}
                  </p>
                )}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {hasPersonalBlocks && (
                    <button
                      type="button"
                      onClick={handleDeleteBlocksAndSave}
                      disabled={modalSaving || hasPendingEvents}
                      style={{
                        ...SUBMIT_BTN,
                        background: "var(--color-pink-dark)",
                        opacity: modalSaving || hasPendingEvents ? 0.5 : 1,
                        cursor: modalSaving || hasPendingEvents ? "not-allowed" : "pointer",
                      }}
                    >
                      {modalSaving ? tSchedule("saving") : tSchedule("deleteBlocksAndSave")}
                    </button>
                  )}
                  {!blocked && !hasSessionConflicts && (
                    <button
                      type="button"
                      onClick={handleProceed}
                      disabled={modalSaving}
                      style={{
                        ...SUBMIT_BTN,
                        opacity: modalSaving ? 0.7 : 1,
                        cursor: modalSaving ? "not-allowed" : "pointer",
                      }}
                    >
                      {modalSaving ? tSchedule("saving") : tSchedule("save")}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setConflictModal(null);
                      setPendingEvents([]);
                      setRescheduleState(null);
                    }}
                    disabled={modalSaving}
                    style={CANCEL_BTN}
                  >
                    {tSchedule("cancel")}
                  </button>
                </div>
              </div>
            </ModalShell>
          );
        })()}
    </>
  );
}

function CohortForm({
  slug,
  formatId,
  initial,
  onSave,
  onCancel,
}: {
  slug: string;
  formatId: number;
  initial?: CourseCohort;
  onSave: (c: CourseCohort) => void;
  onCancel: () => void;
}) {
  const t = useTranslations("CourseManagementGroupTab");
  const isEdit = !!initial?.id;
  const [name, setName] = useState(initial?.name ?? "");
  const [startDate, setStartDate] = useState(initial?.start_date ?? "");
  const [deadline, setDeadline] = useState(initial?.enrollment_deadline ?? "");
  const [duration, setDuration] = useState(String(initial?.duration_months || ""));
  const [hpw, setHpw] = useState(String(initial?.hours_per_week || ""));
  const [groupSize, setGroupSize] = useState(String(initial?.group_size ?? ""));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const FINPUT: React.CSSProperties = {
    ...INPUT,
    fontSize: "clamp(12px, 0.78vw, 14px)",
    padding: "6px 12px",
  };

  async function handleSubmit() {
    setSaving(true);
    setError(null);
    try {
      const payload: CohortInput = {
        delivery_format: formatId,
        name: name.trim() || null,
        duration_months: Number(duration) || 0,
        hours_per_week: Number(hpw) || 0,
        group_size: groupSize ? Number(groupSize) : null,
        start_date: startDate || null,
        enrollment_deadline: deadline || null,
        is_enrollment_open: initial?.is_enrollment_open ?? true,
      };
      const result =
        isEdit && initial?.id
          ? await updateCohort(slug, initial.id, payload)
          : await createCohort(slug, payload);
      onSave(result);
    } catch (e: unknown) {
      setError((e as { message?: string })?.message ?? t("errorSaveFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        borderRadius: 12,
        padding: "14px 16px",
        background: isEdit ? "transparent" : "var(--color-bg)",
        border: isEdit ? "none" : "1.5px dashed var(--color-border-light)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {!isEdit && (
        <span
          style={{
            fontFamily: "var(--font-base)",
            fontWeight: 700,
            fontSize: "clamp(13px, 0.83vw, 15px)",
            color: "var(--color-text-primary)",
          }}
        >
          {t("newCohort")}
        </span>
      )}
      <div>
        <label style={LABEL}>{t("groupName")}</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("groupNamePlaceholder")}
          style={FINPUT}
        />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <div>
          <DatePicker
            size="sm"
            label={t("startDateLabel")}
            value={startDate}
            onChange={setStartDate}
          />
        </div>
        <div>
          <DatePicker
            size="sm"
            label={t("enrollDeadline")}
            value={deadline}
            onChange={setDeadline}
          />
        </div>
        <div>
          <label style={LABEL}>{t("durationMonths")}</label>
          <input
            type="number"
            min={0}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="0"
            style={FINPUT}
          />
        </div>
        <div>
          <label style={LABEL}>{t("hoursPerWeek")}</label>
          <input
            type="number"
            min={0}
            value={hpw}
            onChange={(e) => setHpw(e.target.value)}
            placeholder="0"
            style={FINPUT}
          />
        </div>
        <div>
          <label style={LABEL}>{t("maxGroupSize")}</label>
          <input
            type="number"
            min={1}
            value={groupSize}
            onChange={(e) => setGroupSize(e.target.value)}
            placeholder="—"
            style={FINPUT}
          />
        </div>
      </div>
      {error && <p style={ERR}>{error}</p>}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          style={{
            ...SUBMIT_BTN,
            opacity: saving ? 0.7 : 1,
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          <Check size={13} />{" "}
          {saving
            ? isEdit
              ? t("saving")
              : t("creating")
            : isEdit
              ? t("saveChanges")
              : t("createCohort")}
        </button>
        <button type="button" onClick={onCancel} style={CANCEL_BTN}>
          {t("cancel")}
        </button>
      </div>
    </div>
  );
}

function GroupCohortCard({
  cohort,
  slug,
  formatId,
  takenIds,
  onMembersChanged,
  onTakenChanged,
  onDeleted,
  onUpdated,
}: {
  cohort: CourseCohort;
  slug: string;
  formatId: number;
  takenIds: Set<number>;
  onMembersChanged: (count: number) => void;
  onTakenChanged: (enrollmentId: number, added: boolean) => void;
  onDeleted: (id: number) => void;
  onUpdated: (c: CourseCohort) => void;
}) {
  const t = useTranslations("CourseManagementGroupTab");
  const [localCohort, setLocalCohort] = useState<CourseCohort>(cohort);
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [subTab, setSubTab] = useState<"students" | "schedule">("students");
  const [members, setMembers] = useState<CohortMember[]>(cohort.members ?? []);
  const [isOpen, setIsOpen] = useState(cohort.is_enrollment_open);
  const [toggling, setToggling] = useState(false);
  const [enrolled, setEnrolled] = useState<EnrolledStudent[]>([]);
  const [enrolledLoaded, setEnrolledLoaded] = useState(false);
  const [schedules, setSchedules] = useState<CohortSchedule[]>([]);
  const [schedulesLoaded, setSchedulesLoaded] = useState(false);
  const [addingSchedule, setAddingSchedule] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<CohortSchedule | null>(null);

  useEffect(() => {
    if (!expanded || enrolledLoaded) return;
    getCourseEnrolledStudents(slug, cohort.delivery_format ?? undefined)
      .then((s) => {
        setEnrolled(s);
        setEnrolledLoaded(true);
      })
      .catch(() => setEnrolledLoaded(true));
  }, [expanded, enrolledLoaded, slug, cohort.delivery_format]);

  useEffect(() => {
    if (!expanded || schedulesLoaded) return;
    getCohortSchedules(slug, cohort.id)
      .then((s) => {
        setSchedules(s);
        setSchedulesLoaded(true);
      })
      .catch(() => setSchedulesLoaded(true));
  }, [expanded, schedulesLoaded, slug, cohort.id]);

  const today = new Date().toISOString().split("T")[0];
  const isFull = !!(localCohort.group_size && members.length >= localCohort.group_size);
  const isDeadlinePassed = !!(
    localCohort.enrollment_deadline && localCohort.enrollment_deadline < today
  );
  const effectivelyClosed = !isOpen || isDeadlinePassed;
  const canAdd = !effectivelyClosed && !isFull;

  const handleToggleOpen = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setToggling(true);
    try {
      await updateCohort(slug, cohort.id, { is_enrollment_open: !isOpen });
      setIsOpen((v) => !v);
    } finally {
      setToggling(false);
    }
  };

  const handleAddMember = async (enrollmentId: number) => {
    const m = await addCohortMember(slug, cohort.id, enrollmentId);
    setMembers((prev) => {
      const next = [...prev, m];
      onMembersChanged(next.length);
      return next;
    });
    onTakenChanged(enrollmentId, true);
  };

  const handleRemoveMember = async (memberId: number) => {
    const snapshot = members.find((m) => m.id === memberId);
    const enrollmentId = snapshot?.enrollment_id;
    setMembers((prev) => {
      const next = prev.filter((m) => m.id !== memberId);
      onMembersChanged(next.length);
      return next;
    });
    try {
      await removeCohortMember(slug, cohort.id, memberId);
      if (enrollmentId !== undefined) onTakenChanged(enrollmentId, false);
    } catch {
      if (snapshot)
        setMembers((prev) => {
          const r = [...prev, snapshot];
          onMembersChanged(r.length);
          return r;
        });
    }
  };

  const handleAddSchedule = async (payload: CohortSchedulePayload) => {
    const entry = await createCohortSchedule(slug, cohort.id, payload);
    setSchedules((prev) => [...prev, entry]);
    setAddingSchedule(false);
  };

  const handleEditSchedule = async (payload: CohortSchedulePayload) => {
    if (!editingSchedule) return;
    const updated = await updateCohortSchedule(slug, cohort.id, editingSchedule.id, payload);
    setSchedules((prev) => prev.map((s) => (s.id === editingSchedule.id ? updated : s)));
    setEditingSchedule(null);
  };

  const handleDeleteSchedule = async (id: number) => {
    await deleteCohortSchedule(slug, cohort.id, id);
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  };

  const meta: string[] = [];
  if (localCohort.start_date) meta.push(t("startsOn", { date: localCohort.start_date }));
  if (localCohort.enrollment_deadline)
    meta.push(t("enrollBy", { date: localCohort.enrollment_deadline }));
  if (localCohort.duration_months)
    meta.push(t("monthsShort", { count: localCohort.duration_months }));
  if (localCohort.hours_per_week)
    meta.push(t("hoursPerWeekShort", { count: localCohort.hours_per_week }));

  const statusLabel = isFull
    ? t("statusFull")
    : effectivelyClosed
      ? t("statusClosed")
      : t("statusOpen");
  const statusColor = isFull
    ? "var(--color-text-muted)"
    : effectivelyClosed
      ? "var(--color-rejected)"
      : "var(--color-success)";
  const statusBg = isFull ? "var(--color-bg)" : effectivelyClosed ? "#fff3f3" : "#f0faf0";
  const statusBdr = isFull
    ? "var(--color-border-light)"
    : effectivelyClosed
      ? "#ffc5c5"
      : "#b8e6b8";

  const ICON_BTN: React.CSSProperties = {
    background: "none",
    border: "none",
    padding: 4,
    borderRadius: 6,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    color: "var(--color-text-secondary)",
  };

  const subTabBtn = (id: "students" | "schedule", label: string) => (
    <button
      type="button"
      onClick={() => setSubTab(id)}
      style={{
        fontFamily: "var(--font-base)",
        fontWeight: 600,
        fontSize: "clamp(12px, 0.78vw, 14px)",
        padding: "5px 14px",
        borderRadius: 999,
        cursor: "pointer",
        border: "none",
        background: subTab === id ? "var(--color-text-primary)" : "transparent",
        color: subTab === id ? "#fff" : "var(--color-text-secondary)",
        transition: "all 0.15s",
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={CARD}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: editing ? "default" : "pointer",
        }}
        onClick={() => {
          if (!editing) setExpanded((v) => !v);
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontFamily: "var(--font-base)",
                fontWeight: 700,
                fontSize: "clamp(14px, 0.97vw, 18px)",
                color: "var(--color-text-primary)",
              }}
            >
              {localCohort.name || t("unnamedCohort")}
            </span>
            <span
              style={{
                fontFamily: "var(--font-base)",
                fontWeight: 600,
                fontSize: "clamp(10px, 0.63vw, 12px)",
                color: statusColor,
                background: statusBg,
                border: `1px solid ${statusBdr}`,
                borderRadius: 999,
                padding: "2px 10px",
              }}
            >
              {statusLabel}
            </span>
          </div>
          {meta.length > 0 && (
            <span
              style={{
                fontFamily: "var(--font-base)",
                fontSize: "clamp(12px, 0.78vw, 14px)",
                color: "var(--color-text-secondary)",
              }}
            >
              {meta.join(" · ")}
            </span>
          )}
          <span
            style={{
              fontFamily: "var(--font-base)",
              fontSize: "clamp(11px, 0.72vw, 13px)",
              color: "var(--color-text-muted)",
            }}
          >
            {t("studentsCount", { count: members.length })}
            {localCohort.group_size ? ` / ${localCohort.group_size}` : ""}
            {schedules.length > 0 ? ` · ${t("sessionsCount", { count: schedules.length })}` : ""}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            type="button"
            onClick={handleToggleOpen}
            disabled={toggling || isFull}
            title={
              isFull
                ? t("groupIsFull")
                : effectivelyClosed
                  ? t("openEnrollment")
                  : t("closeEnrollment")
            }
            style={{
              ...ICON_BTN,
              color:
                !effectivelyClosed && !isFull ? "var(--color-success)" : "var(--color-text-muted)",
              cursor: toggling || isFull ? "not-allowed" : "pointer",
              opacity: toggling ? 0.5 : 1,
            }}
          >
            {effectivelyClosed || isFull ? <Lock size={15} /> : <LockOpen size={15} />}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setEditing((v) => !v);
              setExpanded(true);
            }}
            title={editing ? t("cancelEdit") : t("editCohort")}
            style={{
              ...ICON_BTN,
              color: editing ? "var(--color-blue)" : "var(--color-text-secondary)",
            }}
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setDeleting(true);
            }}
            title={t("deleteCohort")}
            style={{ ...ICON_BTN, color: "var(--color-pink-dark)" }}
          >
            <Trash2 size={14} />
          </button>
          <ChevronDown
            size={18}
            style={{
              color: "var(--color-text-secondary)",
              flexShrink: 0,
              transform: expanded && !editing ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.15s",
            }}
          />
        </div>
      </div>

      {editing && (
        <div style={{ marginTop: 14 }}>
          <div style={{ height: 1, background: "var(--color-border-light)", marginBottom: 12 }} />
          <CohortForm
            slug={slug}
            formatId={formatId}
            initial={localCohort}
            onSave={(updated) => {
              setLocalCohort(updated);
              onUpdated(updated);
              setEditing(false);
            }}
            onCancel={() => setEditing(false)}
          />
        </div>
      )}

      {deleting && (
        <ModalShell
          onClose={() => !deleteBusy && setDeleting(false)}
          title={t("deleteCohortTitle")}
          width="clamp(320px, 28vw, 420px)"
        >
          <p
            style={{
              fontFamily: "var(--font-base)",
              fontSize: "clamp(12px, 0.78vw, 14px)",
              color: "var(--color-text-secondary)",
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            {t.rich("deleteConfirmMessage", {
              name: localCohort.name || t("thisCohort"),
              membersClause:
                members.length > 0 ? t("andRemoveStudents", { count: members.length }) : "",
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
          </p>
          {deleteError && (
            <p
              style={{
                fontFamily: "var(--font-base)",
                fontSize: "clamp(11px, 0.72vw, 13px)",
                color: "var(--color-pink-dark)",
                marginTop: 8,
                marginBottom: 0,
              }}
            >
              {deleteError}
            </p>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 18, justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={() => setDeleting(false)}
              disabled={deleteBusy}
              style={{ ...CANCEL_BTN, opacity: deleteBusy ? 0.5 : 1 }}
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              disabled={deleteBusy}
              onClick={async () => {
                setDeleteBusy(true);
                setDeleteError(null);
                try {
                  await deleteCohort(slug, cohort.id);
                  setDeleting(false);
                  onDeleted(cohort.id);
                } catch (e: unknown) {
                  setDeleteError((e as { message?: string })?.message ?? t("errorDeleteFailed"));
                } finally {
                  setDeleteBusy(false);
                }
              }}
              style={{
                ...SUBMIT_BTN,
                background: "var(--color-pink-dark)",
                opacity: deleteBusy ? 0.7 : 1,
                cursor: deleteBusy ? "not-allowed" : "pointer",
              }}
            >
              {deleteBusy ? t("deleting") : t("delete")}
            </button>
          </div>
        </ModalShell>
      )}

      {/* Expanded content (hidden while editing) */}
      {expanded && !editing && (
        <div style={{ marginTop: 16 }}>
          <div style={{ height: 1, background: "var(--color-border-light)", marginBottom: 14 }} />

          <div
            style={{
              display: "flex",
              gap: 4,
              marginBottom: 14,
              background: "var(--color-bg)",
              borderRadius: 999,
              padding: 4,
              alignSelf: "flex-start",
              width: "fit-content",
            }}
          >
            {subTabBtn("students", t("studentsTab", { count: members.length }))}
            {subTabBtn("schedule", t("scheduleTab", { count: schedules.length }))}
          </div>

          {subTab === "students" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {members.length > 0 ? (
                members.map((m) => (
                  <MemberRow key={m.id} member={m} onRemove={handleRemoveMember} />
                ))
              ) : (
                <p
                  style={{
                    fontFamily: "var(--font-base)",
                    fontSize: "clamp(12px, 0.78vw, 14px)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  {t("noStudentsYet")}
                </p>
              )}
              {!canAdd && (
                <p
                  style={{
                    fontFamily: "var(--font-base)",
                    fontSize: "clamp(11px, 0.72vw, 13px)",
                    color: "var(--color-text-muted)",
                    fontStyle: "italic",
                  }}
                >
                  {isFull ? t("groupIsFull") : t("enrollmentClosed")}
                </p>
              )}
              {canAdd && enrolledLoaded && (
                <AddStudentDropdown
                  enrolledStudents={enrolled}
                  takenIds={takenIds}
                  onAdd={handleAddMember}
                />
              )}
              {canAdd && !enrolledLoaded && (
                <p
                  style={{
                    fontFamily: "var(--font-base)",
                    fontSize: "clamp(12px, 0.78vw, 14px)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  {t("loadingStudents")}
                </p>
              )}
            </div>
          )}

          {subTab === "schedule" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {!schedulesLoaded && (
                <p
                  style={{
                    fontFamily: "var(--font-base)",
                    fontSize: "clamp(12px, 0.78vw, 14px)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  {t("loading")}
                </p>
              )}
              {schedulesLoaded && schedules.length === 0 && !addingSchedule && (
                <p
                  style={{
                    fontFamily: "var(--font-base)",
                    fontSize: "clamp(12px, 0.78vw, 14px)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  {t("noSessionsScheduled")}
                </p>
              )}
              {schedulesLoaded &&
                schedules.map((s) =>
                  editingSchedule?.id === s.id ? (
                    <div
                      key={s.id}
                      style={{
                        borderRadius: 10,
                        border: "1px solid var(--color-border-light)",
                        padding: "10px 12px",
                      }}
                    >
                      <CohortScheduleForm
                        initial={{
                          day_of_week: s.day_of_week,
                          start_time: s.start_time,
                          end_time: s.end_time,
                        }}
                        onSave={handleEditSchedule}
                        onCancel={() => setEditingSchedule(null)}
                        slug={slug}
                        cohortId={cohort.id}
                        excludeScheduleId={s.id}
                      />
                    </div>
                  ) : (
                    <CohortScheduleRow
                      key={s.id}
                      entry={s}
                      onDelete={handleDeleteSchedule}
                      onEdit={setEditingSchedule}
                    />
                  ),
                )}
              {addingSchedule && (
                <div
                  style={{
                    borderRadius: 10,
                    border: "1px solid var(--color-border-light)",
                    padding: "10px 12px",
                  }}
                >
                  <CohortScheduleForm
                    onSave={handleAddSchedule}
                    onCancel={() => setAddingSchedule(false)}
                    slug={slug}
                    cohortId={cohort.id}
                  />
                </div>
              )}
              {schedulesLoaded && !addingSchedule && !editingSchedule && (
                <AddButton
                  onClick={() => setAddingSchedule(true)}
                  style={{ alignSelf: "flex-start" }}
                >
                  {t("addSession")}
                </AddButton>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Group format tab: per-cohort member assignment, weekly schedule management, and cohort creation. */
export function CourseManagementGroupTab({
  course,
  slug,
  onCohortsChanged,
}: {
  course: CourseDetail;
  slug: string;
  onCohortsChanged?: (cohorts: CourseCohort[]) => void;
}) {
  const t = useTranslations("CourseManagementGroupTab");
  const [cohorts, setCohorts] = useState<CourseCohort[]>(course.cohorts ?? []);
  const [adding, setAdding] = useState(false);
  const [takenIds, setTakenIds] = useState<Set<number>>(
    () =>
      new Set((course.cohorts ?? []).flatMap((c) => (c.members ?? []).map((m) => m.enrollment_id))),
  );

  const groupFormat = (course.delivery_formats ?? []).find((f) => f.format_type === "group");
  const groupFormatId = groupFormat?.id;

  function updateCohorts(next: CourseCohort[]) {
    setCohorts(next);
    onCohortsChanged?.(next);
  }

  function handleMembersChanged(cohortId: number, count: number) {
    updateCohorts(cohorts.map((c) => (c.id === cohortId ? { ...c, members_count: count } : c)));
  }

  function handleTakenChanged(enrollmentId: number, added: boolean) {
    setTakenIds((prev) => {
      const next = new Set(prev);
      if (added) next.add(enrollmentId);
      else next.delete(enrollmentId);
      return next;
    });
  }

  function handleCohortCreated(c: CourseCohort) {
    updateCohorts([...cohorts, c]);
    setAdding(false);
  }

  function handleCohortUpdated(updated: CourseCohort) {
    updateCohorts(cohorts.map((c) => (c.id === updated.id ? updated : c)));
  }

  function handleCohortDeleted(id: number) {
    updateCohorts(cohorts.filter((c) => c.id !== id));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        {groupFormatId && !adding && (
          <AddButton onClick={() => setAdding(true)}>{t("addCohort")}</AddButton>
        )}
      </div>

      {adding && groupFormatId && (
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            padding: "clamp(16px, 1.25vw, 22px)",
          }}
        >
          <CohortForm
            slug={slug}
            formatId={groupFormatId}
            onSave={handleCohortCreated}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      {cohorts.length === 0 && !adding && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "clamp(160px, 14vw, 220px)",
            gap: 8,
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-base)",
              fontSize: "clamp(14px, 0.97vw, 18px)",
              fontWeight: 600,
              color: "var(--color-text-primary)",
            }}
          >
            {t("noCohortsYet")}
          </p>
          <p
            style={{
              fontFamily: "var(--font-base)",
              fontSize: "clamp(12px, 0.83vw, 15px)",
              color: "var(--color-text-secondary)",
              textAlign: "center",
              maxWidth: 360,
            }}
          >
            {groupFormatId ? t("noCohortsHintWithFormat") : t("noCohortsHintNoFormat")}
          </p>
        </div>
      )}

      {cohorts.map((cohort) => (
        <GroupCohortCard
          key={cohort.id}
          cohort={cohort}
          slug={slug}
          formatId={groupFormatId ?? 0}
          takenIds={takenIds}
          onMembersChanged={(count) => handleMembersChanged(cohort.id, count)}
          onTakenChanged={handleTakenChanged}
          onDeleted={handleCohortDeleted}
          onUpdated={handleCohortUpdated}
        />
      ))}
    </div>
  );
}
