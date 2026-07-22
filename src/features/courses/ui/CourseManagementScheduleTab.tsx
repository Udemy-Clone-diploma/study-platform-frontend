"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  Pencil,
  Trash2,
  Check,
  User,
  AlertCircle,
  UserPlus,
  X,
} from "lucide-react";
import { DatePicker } from "@/shared/ui/DatePicker";
import { AddButton } from "@/shared/ui/AddButton";
import type { CourseDetail, CourseDeliveryFormat } from "@/entities/course";
import type {
  DayOfWeek,
  RecurrenceType,
  ScheduleSlot,
  ScheduleSlotPayload,
  TeacherUnavailability,
  TeacherUnavailabilityPayload,
} from "@/entities/course/model/schedule";
import { DAY_LABELS } from "@/entities/course/model/schedule";
import { padTwo, timeToMinutes, minutesToTime, fmtTime } from "@/shared/lib/time";
import type { EnrolledStudent } from "@/entities/course/model/cohortGroup";
import {
  assignScheduleSlot,
  createScheduleSlot,
  createTeacherUnavailability,
  deleteScheduleSlot,
  deleteTeacherUnavailability,
  getCourseEnrolledStudents,
  getScheduleSlots,
  getTeacherUnavailabilities,
  rescheduleSlot,
} from "@/entities/course";
import {
  checkSlotPersonalConflicts,
  checkSlotRescheduleConflicts,
} from "@/entities/course/api/scheduleApi";
import type { SlotPersonalConflict, ScheduleConflicts, ScheduleConflictPersonalEvent } from "@/entities/course/api/scheduleApi";
import { deletePersonalEvent, respondToInvitation, updatePersonalEvent } from "@/entities/course/api/calendarApi";
import type { ApiError } from "@/shared/api/model/types";
import { ModalShell } from "@/shared/ui/ModalShell";

type RescheduleConflictItem = { type: string; title: string; start_time: string; end_time: string };
type RescheduleErr = { message: string; items: RescheduleConflictItem[] };
import { AlertTriangle } from "lucide-react";

// ── Shared styles ──────────────────────────────────────────────────────────────

const CARD: React.CSSProperties = {
  background: "#fff",
  borderRadius: 16,
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  padding: "clamp(16px, 1.25vw, 22px)",
};

const SECTION_TITLE: React.CSSProperties = {
  fontFamily: "var(--font-base)",
  fontWeight: 700,
  fontSize: "clamp(15px, 1.04vw, 19px)",
  color: "var(--color-text-primary)",
  marginBottom: 14,
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
  fontFamily: "var(--font-base)", fontWeight: 600,
  fontSize: "clamp(12px, 0.78vw, 13px)", color: "#fff",
  background: "var(--color-text-primary)", border: "none", borderRadius: 999,
  padding: "6px 16px", cursor: "pointer",
  display: "inline-flex", alignItems: "center", gap: 5,
};

const CANCEL_BTN: React.CSSProperties = {
  fontFamily: "var(--font-base)", fontWeight: 600,
  fontSize: "clamp(12px, 0.78vw, 13px)", color: "var(--color-text-primary)",
  background: "none", border: "1px solid var(--color-text-primary)",
  borderRadius: 999, padding: "6px 16px", cursor: "pointer",
};

const ERR: React.CSSProperties = {
  fontFamily: "var(--font-base)",
  fontSize: "clamp(11px, 0.72vw, 13px)",
  color: "var(--color-pink-dark)",
  marginTop: 4,
};

const DAYS = (Object.keys(DAY_LABELS) as unknown as DayOfWeek[]).map(d => ({
  value: Number(d) as DayOfWeek,
  label: DAY_LABELS[Number(d) as DayOfWeek],
}));

// ── PillSelect ─────────────────────────────────────────────────────────────────

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
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  const selectedLabel = options.find(o => o.value === value)?.label ?? String(value);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{ ...INPUT, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
      >
        <span>{selectedLabel}</span>
        <ChevronDown size={14} style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s", color: "var(--color-text-primary)" }} />
      </button>

      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 200, background: "var(--color-bg)", borderRadius: 16, padding: "8px 12px 12px", display: "flex", flexDirection: "column", gap: 4, boxShadow: "var(--shadow-card)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 6 }}>
            <span style={{ ...LABEL, color: "var(--color-text-primary)" }}>{selectedLabel}</span>
            <ChevronDown size={14} style={{ transform: "rotate(180deg)", color: "var(--color-text-primary)" }} />
          </div>
          <div style={{ height: 1, background: "var(--color-border-light)", marginBottom: 4 }} />
          {options.map(opt => (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{ background: "none", border: "none", padding: "2px 0", cursor: "pointer", textAlign: "left", fontFamily: "var(--font-base)", fontWeight: opt.value === value ? 600 : 400, fontSize: "clamp(13px, 1.04vw, 16px)", lineHeight: 1.4, color: opt.value === value ? "var(--color-blue)" : "var(--color-text-primary)" }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── TimePicker ─────────────────────────────────────────────────────────────────

const HOURS   = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

export function TimePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  const parts = value.split(":");
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;

  function pick(newH: number, newM: number) { onChange(`${padTwo(newH)}:${padTwo(newM)}`); }

  const cell = (active: boolean): React.CSSProperties => ({
    border: "none", borderRadius: 6, padding: "3px 2px", cursor: "pointer", textAlign: "center",
    fontFamily: "var(--font-base)", fontWeight: active ? 600 : 400,
    fontSize: "clamp(12px, 0.83vw, 14px)", lineHeight: 1.4,
    color: active ? "var(--color-blue)" : "var(--color-text-primary)",
    background: "none",
  });

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{ ...INPUT, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
      >
        <span>{padTwo(h)}:{padTwo(m)}</span>
        <ChevronDown size={14} style={{ flexShrink: 0, color: "var(--color-text-primary)", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
      </button>

      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 200, background: "var(--color-bg)", borderRadius: 16, padding: "10px 12px 14px", boxShadow: "var(--shadow-card)", minWidth: 200 }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 8 }}>
            <span style={{ fontFamily: "var(--font-base)", fontWeight: 600, fontSize: "clamp(13px, 0.9vw, 15px)", color: "var(--color-text-primary)" }}>
              {padTwo(h)}:{padTwo(m)}
            </span>
            <ChevronDown size={14} style={{ transform: "rotate(180deg)", color: "var(--color-text-primary)" }} />
          </div>
          <div style={{ height: 1, background: "var(--color-border-light)", marginBottom: 10 }} />

          {/* Hours — 6-column grid, 4 rows */}
          <div style={{ fontFamily: "var(--font-base)", fontSize: "clamp(10px, 0.63vw, 11px)", fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
            Hour
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 2, marginBottom: 10 }}>
            {HOURS.map(hr => (
              <button key={hr} type="button" onClick={() => pick(hr, m)} style={cell(hr === h)}>
                {padTwo(hr)}
              </button>
            ))}
          </div>

          <div style={{ height: 1, background: "var(--color-border-light)", marginBottom: 10 }} />

          {/* Minutes — 6-column grid, 2 rows */}
          <div style={{ fontFamily: "var(--font-base)", fontSize: "clamp(10px, 0.63vw, 11px)", fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
            Min
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 2 }}>
            {MINUTES.map(mn => (
              <button key={mn} type="button" onClick={() => pick(h, mn)} style={cell(mn === m)}>
                {padTwo(mn)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── IconBtn ────────────────────────────────────────────────────────────────────

function IconBtn({
  icon,
  onClick,
  disabled,
  color = "var(--color-text-secondary)",
  title,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  color?: string;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        background: "none",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        color,
        display: "flex",
        alignItems: "center",
        padding: 4,
        borderRadius: 6,
        opacity: disabled ? 0.4 : 1,
        flexShrink: 0,
      }}
    >
      {icon}
    </button>
  );
}

// ── TimeSlotRow ────────────────────────────────────────────────────────────────

function TimeSlotRow({
  slot,
  enrolledStudents,
  onReschedule,
  onDelete,
  onAssign,
  hideDay,
}: {
  slot: ScheduleSlot;
  enrolledStudents: EnrolledStudent[];
  onReschedule: (s: ScheduleSlot) => void;
  onDelete: (id: number) => Promise<void>;
  onAssign: (slotId: number, enrollmentId: number | null) => Promise<void>;
  hideDay?: boolean;
}) {
  const [deleting, setDeleting]   = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [pickOpen, setPickOpen]   = useState(false);
  const pickRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pickOpen) return;
    function onOutside(e: MouseEvent) {
      if (pickRef.current && !pickRef.current.contains(e.target as Node)) setPickOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [pickOpen]);

  const handleDelete = async () => {
    setDeleting(true);
    try { await onDelete(slot.id); } finally { setDeleting(false); }
  };

  const handleAssign = async (enrollmentId: number) => {
    setAssigning(true);
    setPickOpen(false);
    try { await onAssign(slot.id, enrollmentId); } finally { setAssigning(false); }
  };

  const handleUnassign = async () => {
    setAssigning(true);
    try { await onAssign(slot.id, null); } finally { setAssigning(false); }
  };

  const statusColor = slot.is_available ? "var(--color-success)" : "var(--color-text-muted)";
  const statusLabel = slot.is_available ? "Available" : "Booked";

  // Students not yet assigned to any slot (by student_profile_id)
  const assignedProfileId = slot.booked_by_student?.student_profile_id;
  const unassigned = enrolledStudents.filter(
    s => s.student_id !== assignedProfileId,
  );

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        padding: "8px 12px",
        borderRadius: 10,
        background: "var(--color-bg)",
        border: "1px solid var(--color-border-light)",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--font-base)", fontWeight: 600, fontSize: "clamp(12px, 0.83vw, 14px)", color: "var(--color-text-primary)" }}>
            {!hideDay && <>{DAY_LABELS[slot.day_of_week]} &middot; </>}
            {fmtTime(slot.start_time)} &ndash; {fmtTime(slot.end_time)}
          </span>
          <span style={{ fontFamily: "var(--font-base)", fontWeight: 600, fontSize: "clamp(10px, 0.63vw, 12px)", color: statusColor }}>
            {statusLabel}
          </span>
          {slot.is_rescheduled && (
            <span style={{ fontFamily: "var(--font-base)", fontSize: "clamp(10px, 0.63vw, 11px)", color: "var(--color-warning)", fontStyle: "italic" }}>
              Rescheduled (was {DAY_LABELS[slot.original_day_of_week!]} {fmtTime(slot.original_start_time!)} &ndash; {fmtTime(slot.original_end_time!)})
            </span>
          )}
        </div>

        {/* Assigned student row */}
        {slot.booked_by_student ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <User size={12} style={{ color: "var(--color-text-secondary)", flexShrink: 0 }} />
            <span style={{ fontFamily: "var(--font-base)", fontSize: "clamp(11px, 0.72vw, 13px)", color: "var(--color-text-secondary)" }}>
              {slot.booked_by_student.full_name || slot.booked_by_student.email}
            </span>
            <button
              type="button"
              onClick={handleUnassign}
              disabled={assigning}
              title="Unassign student"
              style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", color: "var(--color-text-muted)", lineHeight: 1 }}
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          /* Assign picker */
          <div ref={pickRef} style={{ position: "relative", alignSelf: "flex-start" }}>
            <button
              type="button"
              onClick={() => setPickOpen(o => !o)}
              disabled={assigning || enrolledStudents.length === 0}
              style={{
                ...CANCEL_BTN,
                padding: "3px 10px",
                fontSize: "clamp(10px, 0.63vw, 12px)",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                opacity: enrolledStudents.length === 0 ? 0.5 : 1,
              }}
            >
              <UserPlus size={11} />
              {assigning ? "…" : "Assign student"}
            </button>

            {pickOpen && unassigned.length > 0 && (
              <div style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                left: 0,
                zIndex: 300,
                background: "var(--color-bg)",
                borderRadius: 12,
                boxShadow: "var(--shadow-card)",
                padding: "6px 0",
                minWidth: 200,
                maxHeight: 220,
                overflowY: "auto",
              }}>
                {unassigned.map(s => (
                  <button
                    key={s.enrollment_id}
                    type="button"
                    onClick={() => handleAssign(s.enrollment_id)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      background: "none",
                      border: "none",
                      padding: "6px 14px",
                      cursor: "pointer",
                      fontFamily: "var(--font-base)",
                      fontSize: "clamp(12px, 0.78vw, 14px)",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    {s.student_name || s.student_email}
                  </button>
                ))}
              </div>
            )}

            {pickOpen && unassigned.length === 0 && (
              <div style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                left: 0,
                zIndex: 300,
                background: "var(--color-bg)",
                borderRadius: 12,
                boxShadow: "var(--shadow-card)",
                padding: "8px 14px",
                fontFamily: "var(--font-base)",
                fontSize: "clamp(11px, 0.72vw, 13px)",
                color: "var(--color-text-muted)",
                whiteSpace: "nowrap",
              }}>
                No unassigned students
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
        <IconBtn icon={<Pencil size={14} />} onClick={() => onReschedule(slot)} title="Reschedule" />
        <IconBtn
          icon={<Trash2 size={14} />}
          onClick={handleDelete}
          disabled={deleting || !slot.is_available}
          color="var(--color-pink-dark)"
          title={!slot.is_available ? "Cannot delete a booked slot" : "Delete slot"}
        />
      </div>
    </div>
  );
}

// ── DayGroup ───────────────────────────────────────────────────────────────────

function DayGroup({
  day,
  slots,
  rescheduling,
  enrolledStudents,
  onReschedule,
  onRescheduleConfirm,
  onRescheduleCancel,
  onDelete,
  onAssign,
}: {
  day: DayOfWeek;
  slots: ScheduleSlot[];
  rescheduling: ScheduleSlot | null;
  enrolledStudents: EnrolledStudent[];
  onReschedule: (s: ScheduleSlot) => void;
  onRescheduleConfirm: (id: number, p: { day_of_week: DayOfWeek; start_time: string; end_time: string }) => Promise<void>;
  onRescheduleCancel: () => void;
  onDelete: (id: number) => Promise<void>;
  onAssign: (slotId: number, enrollmentId: number | null) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const booked = slots.filter(s => !s.is_available).length;
  const available = slots.length - booked;

  return (
    <div style={{ borderRadius: 12, border: "1px solid var(--color-border-light)" }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          width: "100%", padding: "9px 12px",
          background: "var(--color-bg)", border: "none",
          borderTopLeftRadius: 11, borderTopRightRadius: 11,
          borderBottom: open ? "1px solid var(--color-border-light)" : "none",
          cursor: "pointer", gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "var(--font-base)", fontWeight: 700, fontSize: "clamp(13px, 0.87vw, 15px)", color: "var(--color-text-primary)" }}>
            {DAY_LABELS[day]}
          </span>
          <span style={{ fontFamily: "var(--font-base)", fontSize: "clamp(11px, 0.72vw, 13px)", color: "var(--color-text-secondary)" }}>
            {booked > 0 ? `${booked} booked · ` : ""}{available} available
          </span>
        </div>
        <ChevronDown
          size={15}
          style={{
            color: "var(--color-text-secondary)", flexShrink: 0,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.15s",
          }}
        />
      </button>

      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "8px" }}>
          {slots.map(s =>
            rescheduling?.id === s.id ? (
              <div key={s.id} style={{ background: "var(--color-bg)", borderRadius: 10, border: "1px solid var(--color-border-light)", padding: "10px 12px" }}>
                <div style={{ fontFamily: "var(--font-base)", fontWeight: 600, fontSize: "clamp(12px, 0.83vw, 14px)", color: "var(--color-text-primary)", marginBottom: 8 }}>
                  Reschedule: {fmtTime(s.start_time)} &ndash; {fmtTime(s.end_time)}
                </div>
                <RescheduleForm slot={s} onSave={onRescheduleConfirm} onCancel={onRescheduleCancel} />
              </div>
            ) : (
              <TimeSlotRow
                key={s.id}
                slot={s}
                enrolledStudents={enrolledStudents}
                onReschedule={onReschedule}
                onDelete={onDelete}
                onAssign={onAssign}
                hideDay
              />
            ),
          )}
        </div>
      )}
    </div>
  );
}

// ── AddSlotForm ────────────────────────────────────────────────────────────────

function AddSlotForm({
  onAdd,
  onCancel,
}: {
  onAdd: (p: ScheduleSlotPayload) => Promise<void>;
  onCancel: () => void;
}) {
  const [day, setDay] = useState<DayOfWeek>(0);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (end <= start) { setErr("End time must be after start time."); return; }
    setSaving(true);
    setErr(null);
    try {
      await onAdd({ day_of_week: day, start_time: start, end_time: end });
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message ?? "Failed to add slot.";
      setErr(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <div>
          <label style={LABEL}>Day</label>
          <PillSelect options={DAYS} value={day} onChange={v => setDay(v as DayOfWeek)} />
        </div>
        <div>
          <label style={LABEL}>Start time</label>
          <TimePicker value={start} onChange={setStart} />
        </div>
        <div>
          <label style={LABEL}>End time</label>
          <TimePicker value={end} onChange={setEnd} />
        </div>
      </div>
      {err && <p style={ERR}>{err}</p>}
      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" disabled={saving} style={{ ...SUBMIT_BTN, opacity: saving ? 0.7 : 1, cursor: saving ? "not-allowed" : "pointer" }}>
          <Check size={13} /> {saving ? "Saving…" : "Add slot"}
        </button>
        <button type="button" onClick={onCancel} style={CANCEL_BTN}>Cancel</button>
      </div>
    </form>
  );
}

// ── RescheduleForm ─────────────────────────────────────────────────────────────

function RescheduleForm({
  slot,
  onSave,
  onCancel,
}: {
  slot: ScheduleSlot;
  onSave: (id: number, p: { day_of_week: DayOfWeek; start_time: string; end_time: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [day, setDay] = useState<DayOfWeek>(slot.day_of_week);
  const [start, setStart] = useState(fmtTime(slot.start_time));
  const [end, setEnd] = useState(fmtTime(slot.end_time));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (end <= start) { setErr("End time must be after start time."); return; }
    setSaving(true);
    setErr(null);
    try {
      await onSave(slot.id, { day_of_week: day, start_time: start, end_time: end });
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message ?? "Failed to reschedule.";
      setErr(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <div>
          <label style={LABEL}>Day</label>
          <PillSelect options={DAYS} value={day} onChange={v => setDay(v as DayOfWeek)} />
        </div>
        <div>
          <label style={LABEL}>Start time</label>
          <TimePicker value={start} onChange={setStart} />
        </div>
        <div>
          <label style={LABEL}>End time</label>
          <TimePicker value={end} onChange={setEnd} />
        </div>
      </div>
      {err && <p style={ERR}>{err}</p>}
      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" disabled={saving} style={{ ...SUBMIT_BTN, opacity: saving ? 0.7 : 1, cursor: saving ? "not-allowed" : "pointer" }}>
          <Check size={13} /> {saving ? "Saving…" : "Save"}
        </button>
        <button type="button" onClick={onCancel} style={CANCEL_BTN}>Cancel</button>
      </div>
    </form>
  );
}

// ── GenerateSlotsForm ──────────────────────────────────────────────────────────

const DURATION_OPTIONS = [30, 45, 60, 90, 120].map(m => ({ value: m, label: `${m} min` }));
const BREAK_OPTIONS    = [0, 5, 10, 15, 30].map(m => ({ value: m, label: m === 0 ? "No break" : `${m} min` }));

function GenerateSlotsForm({
  onGenerate,
  onCancel,
}: {
  onGenerate: (slots: ScheduleSlotPayload[]) => Promise<void>;
  onCancel: () => void;
}) {
  const [day,      setDay]      = useState<DayOfWeek>(0);
  const [from,     setFrom]     = useState("09:00");
  const [to,       setTo]       = useState("17:00");
  const [duration, setDuration] = useState(60);
  const [breakMin, setBreakMin] = useState(15);
  const [saving,   setSaving]   = useState(false);
  const [err,      setErr]      = useState<string | null>(null);

  function buildPreview() {
    const slots: { start: string; end: string }[] = [];
    let cur = timeToMinutes(from);
    const limit = timeToMinutes(to);
    while (cur + duration <= limit) {
      slots.push({ start: minutesToTime(cur), end: minutesToTime(cur + duration) });
      cur += duration + breakMin;
    }
    return slots;
  }

  const preview = buildPreview();

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (preview.length === 0) { setErr("No slots fit in this window with the current duration and break settings."); return; }
    setSaving(true); setErr(null);
    try {
      await onGenerate(preview.map(s => ({ day_of_week: day, start_time: s.start, end_time: s.end })));
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? "Failed to create slots.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Row 1: day + window */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <div>
          <label style={LABEL}>Day</label>
          <PillSelect options={DAYS} value={day} onChange={v => setDay(v as DayOfWeek)} />
        </div>
        <div>
          <label style={LABEL}>Window start</label>
          <TimePicker value={from} onChange={setFrom} />
        </div>
        <div>
          <label style={LABEL}>Window end</label>
          <TimePicker value={to} onChange={setTo} />
        </div>
      </div>

      {/* Row 2: session duration + break */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <label style={LABEL}>Session duration</label>
          <PillSelect options={DURATION_OPTIONS} value={duration} onChange={v => setDuration(v as number)} />
        </div>
        <div>
          <label style={LABEL}>Break between sessions</label>
          <PillSelect options={BREAK_OPTIONS} value={breakMin} onChange={v => setBreakMin(v as number)} />
        </div>
      </div>

      {/* Live preview */}
      <div style={{ background: "var(--color-bg)", borderRadius: 12, padding: "10px 14px" }}>
        <p style={{ ...LABEL, color: "var(--color-text-primary)", marginBottom: 8 }}>
          Preview — {preview.length} slot{preview.length !== 1 ? "s" : ""} will be created
        </p>
        {preview.length === 0 ? (
          <p style={{ fontFamily: "var(--font-base)", fontSize: "clamp(12px, 0.78vw, 13px)", color: "var(--color-text-muted)" }}>
            No slots fit in this window.
          </p>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {preview.map((s, i) => (
              <span
                key={i}
                style={{
                  fontFamily: "var(--font-base)", fontSize: "clamp(11px, 0.76vw, 13px)",
                  color: "var(--color-text-primary)", background: "#fff",
                  border: "1px solid var(--color-border-light)", borderRadius: 999,
                  padding: "3px 10px",
                }}
              >
                {s.start}–{s.end}
              </span>
            ))}
          </div>
        )}
      </div>

      {err && <p style={ERR}>{err}</p>}
      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" disabled={saving || preview.length === 0} style={{ ...SUBMIT_BTN, opacity: saving || preview.length === 0 ? 0.5 : 1, cursor: saving || preview.length === 0 ? "not-allowed" : "pointer" }}>
          <Check size={13} /> {saving ? `Creating…` : `Create ${preview.length} slot${preview.length !== 1 ? "s" : ""}`}
        </button>
        <button type="button" onClick={onCancel} style={CANCEL_BTN}>Cancel</button>
      </div>
    </form>
  );
}

// ── IndividualFormatSection ────────────────────────────────────────────────────

function IndividualFormatSection({
  fmt,
  slug,
  onAssigned,
}: {
  fmt: CourseDeliveryFormat;
  slug: string;
  onAssigned?: () => void;
}) {
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [rescheduling, setRescheduling] = useState<ScheduleSlot | null>(null);
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);

  // Slot assign personal conflict modal
  type AssignConflictState = { slotId: number; enrollmentId: number; pending: SlotPersonalConflict[] };
  const [assignConflict, setAssignConflict] = useState<AssignConflictState | null>(null);
  const [assignConflictLoading, setAssignConflictLoading] = useState<number | null>(null);
  const [conflictRescheduleState, setConflictRescheduleState] = useState<{ eventId: number; date: string; start: string; end: string } | null>(null);

  // Slot reschedule conflict modal
  type ReschedulePayload = { day_of_week: DayOfWeek; start_time: string; end_time: string };
  const [rescheduleConflictModal, setRescheduleConflictModal] = useState<{ conflicts: ScheduleConflicts; slotId: number; payload: ReschedulePayload } | null>(null);
  const [reschedulePendingEvents, setReschedulePendingEvents] = useState<ScheduleConflictPersonalEvent[]>([]);
  const [rescheduleModalSaving, setRescheduleModalSaving] = useState(false);
  const [rescheduleEventReschedule, setRescheduleEventReschedule] = useState<{ eventId: number; date: string; start: string; end: string } | null>(null);
  const [rescheduleEventLoading, setRescheduleEventLoading] = useState<number | null>(null);

  // Add / generate slot conflict modal
  const [addConflictModal, setAddConflictModal] = useState<{ conflicts: ScheduleConflicts; payloads: ScheduleSlotPayload[] } | null>(null);
  const [addPendingEvents, setAddPendingEvents] = useState<ScheduleConflictPersonalEvent[]>([]);
  const [addModalSaving, setAddModalSaving] = useState(false);
  const [addEventReschedule, setAddEventReschedule] = useState<{ eventId: number; date: string; start: string; end: string } | null>(null);
  const [addEventLoading, setAddEventLoading] = useState<number | null>(null);
  const [assignConflictRescheduleErr, setAssignConflictRescheduleErr] = useState<RescheduleErr | null>(null);

  useEffect(() => {
    getScheduleSlots(slug, fmt.id).then(setSlots).finally(() => setLoading(false));
    getCourseEnrolledStudents(slug, fmt.id).then(setEnrolledStudents).catch(() => {});
  }, [slug, fmt.id]);

  const resolveAndCreateSlots = async (payloads: ScheduleSlotPayload[]) => {
    const combined: ScheduleConflicts = { group: [], individual: [], personal: [], personal_events: [] };
    for (const p of payloads) {
      const c = await checkSlotRescheduleConflicts(slug, fmt.id, {
        day_of_week: p.day_of_week,
        start_time: p.start_time,
        end_time: p.end_time,
      });
      for (const x of c.group) if (!combined.group.find(y => y.id === x.id)) combined.group.push(x);
      for (const x of c.individual) if (!combined.individual.find(y => y.id === x.id)) combined.individual.push(x);
      for (const x of c.personal) if (!combined.personal.find(y => y.id === x.id)) combined.personal.push(x);
      for (const x of c.personal_events) if (!combined.personal_events.find(y => y.id === x.id)) combined.personal_events.push(x);
    }
    const hasAny = combined.group.length > 0 || combined.individual.length > 0 ||
      combined.personal.length > 0 || combined.personal_events.length > 0;
    if (hasAny) {
      setAddConflictModal({ conflicts: combined, payloads });
      setAddPendingEvents(combined.personal_events);
      setAddEventReschedule(null);
      setAddOpen(false);
      setGenerateOpen(false);
      return;
    }
    const created: ScheduleSlot[] = [];
    for (const p of payloads) {
      const slot = await createScheduleSlot(slug, fmt.id, p);
      created.push(slot);
    }
    setSlots(prev => [...prev, ...created]);
    setAddOpen(false);
    setGenerateOpen(false);
  };

  const handleAdd = async (payload: ScheduleSlotPayload) => resolveAndCreateSlots([payload]);
  const handleGenerate = async (payloads: ScheduleSlotPayload[]) => resolveAndCreateSlots(payloads);

  // Add slot conflict modal handlers
  const resolveAddEvent = (eventId: number) => {
    setAddPendingEvents(prev => prev.filter(e => e.id !== eventId));
    setAddEventReschedule(rs => rs?.eventId === eventId ? null : rs);
  };

  const handleAddDeleteEvent = async (ev: ScheduleConflictPersonalEvent) => {
    setAddEventLoading(ev.id);
    try { await deletePersonalEvent(ev.id); resolveAddEvent(ev.id); }
    catch { /* ignore */ } finally { setAddEventLoading(null); }
  };

  const handleAddDeclineEvent = async (ev: ScheduleConflictPersonalEvent) => {
    if (!ev.invitation_id) return;
    setAddEventLoading(ev.id);
    try { await respondToInvitation(ev.invitation_id, "decline"); resolveAddEvent(ev.id); }
    catch { /* ignore */ } finally { setAddEventLoading(null); }
  };

  const handleAddRescheduleEvent = async (ev: ScheduleConflictPersonalEvent) => {
    if (!addEventReschedule || addEventReschedule.eventId !== ev.id) return;
    setAddEventLoading(ev.id);
    try {
      await updatePersonalEvent(ev.id, { date: addEventReschedule.date, start_time: addEventReschedule.start, end_time: addEventReschedule.end });
      resolveAddEvent(ev.id);
    } catch { /* ignore */ } finally { setAddEventLoading(null); }
  };

  const handleAddDeleteBlocksAndSave = async () => {
    if (!addConflictModal) return;
    setAddModalSaving(true);
    try {
      await Promise.all(addConflictModal.conflicts.personal.map(b => deleteTeacherUnavailability(b.id)));
      const created: ScheduleSlot[] = [];
      for (const p of addConflictModal.payloads) { created.push(await createScheduleSlot(slug, fmt.id, p)); }
      setSlots(prev => [...prev, ...created]);
      setAddConflictModal(null);
    } catch { /* ignore */ } finally { setAddModalSaving(false); }
  };

  const handleAddProceed = async () => {
    if (!addConflictModal) return;
    setAddModalSaving(true);
    try {
      const created: ScheduleSlot[] = [];
      for (const p of addConflictModal.payloads) { created.push(await createScheduleSlot(slug, fmt.id, p)); }
      setSlots(prev => [...prev, ...created]);
      setAddConflictModal(null);
    } catch { /* ignore */ } finally { setAddModalSaving(false); }
  };

  const doReschedule = async (slotId: number, payload: ReschedulePayload) => {
    const updated = await rescheduleSlot(slug, fmt.id, slotId, payload);
    setSlots(prev => prev.map(s => (s.id === slotId ? updated : s)));
    setRescheduling(null);
    setRescheduleConflictModal(null);
  };

  const handleReschedule = async (id: number, payload: ReschedulePayload) => {
    const conflicts = await checkSlotRescheduleConflicts(slug, fmt.id, {
      day_of_week: payload.day_of_week,
      start_time: payload.start_time,
      end_time: payload.end_time,
      slot_id: id,
    });
    const hasAny = conflicts.group.length > 0 || conflicts.individual.length > 0 ||
      conflicts.personal.length > 0 || conflicts.personal_events.length > 0;
    if (hasAny) {
      setRescheduleConflictModal({ conflicts, slotId: id, payload });
      setReschedulePendingEvents(conflicts.personal_events);
      setRescheduleEventReschedule(null);
      return;
    }
    await doReschedule(id, payload);
  };

  // Reschedule slot conflict modal handlers
  const resolveRescheduleEvent = (eventId: number) => {
    setReschedulePendingEvents(prev => prev.filter(e => e.id !== eventId));
    setRescheduleEventReschedule(rs => rs?.eventId === eventId ? null : rs);
  };

  const handleRescheduleDeleteEvent = async (ev: ScheduleConflictPersonalEvent) => {
    setRescheduleEventLoading(ev.id);
    try { await deletePersonalEvent(ev.id); resolveRescheduleEvent(ev.id); }
    catch { /* ignore */ } finally { setRescheduleEventLoading(null); }
  };

  const handleRescheduleDeclineEvent = async (ev: ScheduleConflictPersonalEvent) => {
    if (!ev.invitation_id) return;
    setRescheduleEventLoading(ev.id);
    try { await respondToInvitation(ev.invitation_id, "decline"); resolveRescheduleEvent(ev.id); }
    catch { /* ignore */ } finally { setRescheduleEventLoading(null); }
  };

  const handleRescheduleRescheduleEvent = async (ev: ScheduleConflictPersonalEvent) => {
    if (!rescheduleEventReschedule || rescheduleEventReschedule.eventId !== ev.id) return;
    setRescheduleEventLoading(ev.id);
    try {
      await updatePersonalEvent(ev.id, { date: rescheduleEventReschedule.date, start_time: rescheduleEventReschedule.start, end_time: rescheduleEventReschedule.end });
      resolveRescheduleEvent(ev.id);
    } catch { /* ignore */ } finally { setRescheduleEventLoading(null); }
  };

  const handleRescheduleDeleteBlocksAndSave = async () => {
    if (!rescheduleConflictModal) return;
    setRescheduleModalSaving(true);
    try {
      await Promise.all(rescheduleConflictModal.conflicts.personal.map(b => deleteTeacherUnavailability(b.id)));
      await doReschedule(rescheduleConflictModal.slotId, rescheduleConflictModal.payload);
    } catch { /* ignore */ } finally { setRescheduleModalSaving(false); }
  };

  const handleRescheduleProceed = async () => {
    if (!rescheduleConflictModal) return;
    setRescheduleModalSaving(true);
    try { await doReschedule(rescheduleConflictModal.slotId, rescheduleConflictModal.payload); }
    catch { /* ignore */ } finally { setRescheduleModalSaving(false); }
  };

  const handleDelete = async (id: number) => {
    await deleteScheduleSlot(slug, fmt.id, id);
    setSlots(prev => prev.filter(s => s.id !== id));
  };

  const doAssign = async (slotId: number, enrollmentId: number | null) => {
    const updated = await assignScheduleSlot(slug, fmt.id, slotId, enrollmentId);
    setSlots(prev => prev.map(s => (s.id === slotId ? updated : s)));
    onAssigned?.();
  };

  const handleAssign = async (slotId: number, enrollmentId: number | null) => {
    if (enrollmentId === null) { await doAssign(slotId, null); return; }
    const conflicts = await checkSlotPersonalConflicts(slug, fmt.id, slotId);
    if (conflicts.length > 0) {
      setAssignConflict({ slotId, enrollmentId, pending: conflicts });
    } else {
      await doAssign(slotId, enrollmentId);
    }
  };

  const handleConflictDelete = async (ev: SlotPersonalConflict) => {
    setAssignConflictLoading(ev.id);
    try {
      await deletePersonalEvent(ev.id);
      setAssignConflict(prev => prev ? { ...prev, pending: prev.pending.filter(p => p.id !== ev.id) } : null);
    } finally { setAssignConflictLoading(null); }
  };

  const handleConflictDecline = async (ev: SlotPersonalConflict) => {
    if (!ev.invitation_id) return;
    setAssignConflictLoading(ev.id);
    try {
      await respondToInvitation(ev.invitation_id, "decline");
      setAssignConflict(prev => prev ? { ...prev, pending: prev.pending.filter(p => p.id !== ev.id) } : null);
    } finally { setAssignConflictLoading(null); }
  };

  const handleConflictReschedule = async (ev: SlotPersonalConflict, newDate: string, newStart: string, newEnd: string) => {
    setAssignConflictLoading(ev.id);
    setAssignConflictRescheduleErr(null);
    if (newDate === ev.date && newStart === ev.start_time && newEnd === ev.end_time) {
      setAssignConflictRescheduleErr({ message: "Please choose a different date or time.", items: [] });
      setAssignConflictLoading(null);
      return;
    }
    try {
      await updatePersonalEvent(ev.id, { date: newDate, start_time: newStart, end_time: newEnd });
      setAssignConflict(prev => prev ? { ...prev, pending: prev.pending.filter(p => p.id !== ev.id) } : null);
    } catch (err: unknown) {
      const e = err as ApiError;
      const items = ((e.fields as Record<string, unknown>)?.conflicts ?? []) as RescheduleConflictItem[];
      setAssignConflictRescheduleErr({ message: e.message || "Cannot reschedule.", items });
      throw err;
    } finally { setAssignConflictLoading(null); }
  };

  const booked    = slots.filter(s => !s.is_available).length;
  const available = slots.filter(s => s.is_available).length;
  const formOpen  = addOpen || generateOpen;

  const groupedDays = useMemo(() => {
    const byDay = new Map<number, ScheduleSlot[]>();
    for (const s of slots) {
      const group = byDay.get(s.day_of_week) ?? [];
      group.push(s);
      byDay.set(s.day_of_week, group);
    }
    return Array.from(byDay.entries())
      .sort(([a], [b]) => a - b)
      .map(([day, daySlots]) => ({ day: day as DayOfWeek, daySlots }));
  }, [slots]);

  return (
    <div style={CARD}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
        <div>
          <p style={SECTION_TITLE}>Individual sessions</p>
          <p style={{ fontFamily: "var(--font-base)", fontSize: "clamp(12px, 0.78vw, 14px)", color: "var(--color-text-secondary)", margin: 0 }}>
            {booked} booked &middot; {available} available
          </p>
        </div>
        {!formOpen && (
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <AddButton onClick={() => { setGenerateOpen(true); setAddConflictModal(null); }}>Generate slots</AddButton>
            <AddButton onClick={() => { setAddOpen(true); setAddConflictModal(null); }}>Add slot</AddButton>
          </div>
        )}
      </div>

      {!formOpen && (
        <p style={{ fontFamily: "var(--font-base)", fontSize: "clamp(11px, 0.72vw, 13px)", color: "var(--color-text-muted)", margin: "0 0 12px", display: "flex", alignItems: "center", gap: 5 }}>
          <AlertCircle size={12} style={{ flexShrink: 0 }} />
          Each slot is one session that a single student can book. Create one slot per time you are available, e.g. 09:00–10:00, 10:15–11:15. Use &ldquo;Generate slots&rdquo; to create many at once.
        </p>
      )}

      {loading && (
        <p style={{ fontFamily: "var(--font-base)", fontSize: "clamp(12px, 0.78vw, 14px)", color: "var(--color-text-muted)" }}>
          Loading…
        </p>
      )}

      {!loading && slots.length === 0 && !formOpen && (
        <p style={{ fontFamily: "var(--font-base)", fontSize: "clamp(12px, 0.78vw, 14px)", color: "var(--color-text-muted)" }}>
          No slots yet.
        </p>
      )}

      {!loading && slots.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: formOpen ? 14 : 0 }}>
          {groupedDays.map(({ day, daySlots }) => (
            <DayGroup
              key={day}
              day={day}
              slots={daySlots}
              rescheduling={rescheduling}
              enrolledStudents={enrolledStudents}
              onReschedule={setRescheduling}
              onRescheduleConfirm={handleReschedule}
              onRescheduleCancel={() => setRescheduling(null)}
              onDelete={handleDelete}
              onAssign={handleAssign}
            />
          ))}
        </div>
      )}

      {addOpen && (
        <div style={{ borderTop: slots.length > 0 ? "1px solid var(--color-border-light)" : undefined, paddingTop: slots.length > 0 ? 14 : 0 }}>
          <AddSlotForm onAdd={handleAdd} onCancel={() => { setAddOpen(false); setAddConflictModal(null); }} />
        </div>
      )}

      {generateOpen && (
        <div style={{ borderTop: slots.length > 0 ? "1px solid var(--color-border-light)" : undefined, paddingTop: slots.length > 0 ? 14 : 0 }}>
          <GenerateSlotsForm onGenerate={handleGenerate} onCancel={() => { setGenerateOpen(false); setAddConflictModal(null); }} />
        </div>
      )}

            {/* Unified conflict modal for add/generate slot */}
      {addConflictModal && (() => {
        const info = addConflictModal.conflicts;
        const hasPersonalBlocks = info.personal.length > 0;
        const hasPendingEvents = addPendingEvents.length > 0;
        const hasSessionConflicts = info.group.length > 0 || info.individual.length > 0;
        const blocked = hasPersonalBlocks || hasPendingEvents;
        const CROW: React.CSSProperties = { fontFamily: "var(--font-base)", fontSize: "clamp(12px, 0.78vw, 13px)", color: "var(--color-text-primary)", padding: "8px 0", borderBottom: "1px solid var(--color-border-light)" };
        const CMUTED: React.CSSProperties = { color: "var(--color-text-muted)" };
        const CLABEL: React.CSSProperties = { fontFamily: "var(--font-base)", fontWeight: 600, fontSize: "clamp(11px, 0.72vw, 12px)", color: "var(--color-text-secondary)", marginBottom: 6, display: "block" };
        const CNOTE: React.CSSProperties = { fontFamily: "var(--font-base)", fontSize: "clamp(11px, 0.7vw, 12px)", color: "var(--color-text-muted)", margin: "6px 0 0" };
        const CBTN = (danger = false): React.CSSProperties => ({
          fontFamily: "var(--font-base)", fontWeight: 600, fontSize: "clamp(11px, 0.7vw, 12px)",
          color: danger ? "var(--color-pink-dark)" : "var(--color-text-primary)",
          background: "none", border: `1px solid ${danger ? "var(--color-pink-dark)" : "var(--color-border-light)"}`,
          borderRadius: 999, padding: "3px 10px", cursor: "pointer",
        });
        return (
          <ModalShell
            onClose={() => !addModalSaving && !addEventLoading && (setAddConflictModal(null), setAddPendingEvents([]), setAddEventReschedule(null))}
            title="Schedule conflicts"
            icon={<AlertTriangle size={18} style={{ color: "var(--color-pink-dark)" }} />}
            width="clamp(560px, 52vw, 740px)"
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 18, minHeight: "clamp(320px, 40vh, 520px)" }}>
              {info.group.length > 0 && (
                <div>
                  <span style={CLABEL}>Group sessions</span>
                  {info.group.map(c => (
                    <div key={c.id} style={CROW}>
                      {c.course_title}{c.cohort_name ? ` — ${c.cohort_name}` : ""}
                      &nbsp;<span style={CMUTED}>{c.start_time}&ndash;{c.end_time}</span>
                    </div>
                  ))}
                </div>
              )}
              {info.individual.length > 0 && (
                <div>
                  <span style={CLABEL}>Individual sessions</span>
                  {info.individual.map(c => (
                    <div key={c.id} style={CROW}>
                      {c.course_title}&nbsp;<span style={CMUTED}>{c.start_time}&ndash;{c.end_time}</span>
                    </div>
                  ))}
                </div>
              )}
              {hasPersonalBlocks && (
                <div>
                  <span style={CLABEL}>Personal unavailability blocks</span>
                  {info.personal.map(b => (
                    <div key={b.id} style={CROW}>
                      {b.reason || "Personal block"}&nbsp;<span style={CMUTED}>{b.start_time}&ndash;{b.end_time}</span>
                    </div>
                  ))}
                  <p style={CNOTE}>These blocks must be deleted before saving.</p>
                </div>
              )}
              {addPendingEvents.length > 0 && (
                <div>
                  <span style={CLABEL}>Personal events</span>
                  {addPendingEvents.map(ev => {
                    const isLoading = addEventLoading === ev.id;
                    const isRescheduling = addEventReschedule?.eventId === ev.id;
                    return (
                      <div key={ev.id} style={{ ...CROW, display: "flex", flexDirection: "column", gap: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                          <span>
                            <strong>{ev.title}</strong>
                            &nbsp;<span style={CMUTED}>{ev.date} &middot; {ev.start_time}&ndash;{ev.end_time}</span>
                            {!ev.is_owner && <span style={{ ...CMUTED, marginLeft: 6 }}>(invited)</span>}
                          </span>
                          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                            {ev.is_owner ? (
                              <>
                                <button type="button" disabled={isLoading || !!addEventLoading}
                                  onClick={() => setAddEventReschedule(isRescheduling ? null : { eventId: ev.id, date: ev.date, start: ev.start_time, end: ev.end_time })}
                                  style={CBTN()}>
                                  {isRescheduling ? "Cancel" : "Reschedule"}
                                </button>
                                <button type="button" disabled={isLoading || !!addEventLoading}
                                  onClick={() => handleAddDeleteEvent(ev)} style={CBTN(true)}>
                                  {isLoading ? "…" : "Delete"}
                                </button>
                              </>
                            ) : (
                              <button type="button" disabled={isLoading || !!addEventLoading}
                                onClick={() => handleAddDeclineEvent(ev)} style={CBTN(true)}>
                                {isLoading ? "…" : "Decline invite"}
                              </button>
                            )}
                          </div>
                        </div>
                        {isRescheduling && addEventReschedule && (
                          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap", paddingTop: 4 }}>
                            <div>
                              <DatePicker size="sm" label="New date" value={addEventReschedule.date}
                                onChange={value => setAddEventReschedule(s => s ? { ...s, date: value } : s)} />
                            </div>
                            <div>
                              <label style={CLABEL}>Start</label>
                              <TimePicker value={addEventReschedule.start} onChange={v => setAddEventReschedule(s => s ? { ...s, start: v } : s)} />
                            </div>
                            <div>
                              <label style={CLABEL}>End</label>
                              <TimePicker value={addEventReschedule.end} onChange={v => setAddEventReschedule(s => s ? { ...s, end: v } : s)} />
                            </div>
                            <button type="button" disabled={isLoading}
                              onClick={() => handleAddRescheduleEvent(ev)}
                              style={{ ...SUBMIT_BTN, opacity: isLoading ? 0.7 : 1 }}>
                              {isLoading ? "Saving…" : "Confirm"}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {blocked && <p style={CNOTE}>Resolve all personal events and blocks to continue.</p>}
              {hasSessionConflicts && !blocked && (
                <p style={{ ...CNOTE, color: "var(--color-danger)" }}>Resolve the conflicting sessions above before saving.</p>
              )}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {hasPersonalBlocks && (
                  <button type="button" onClick={handleAddDeleteBlocksAndSave}
                    disabled={addModalSaving || hasPendingEvents}
                    style={{ ...SUBMIT_BTN, background: "var(--color-pink-dark)", opacity: (addModalSaving || hasPendingEvents) ? 0.5 : 1, cursor: (addModalSaving || hasPendingEvents) ? "not-allowed" : "pointer" }}>
                    {addModalSaving ? "Saving…" : "Delete blocks & Save"}
                  </button>
                )}
                {!blocked && !hasSessionConflicts && (
                  <button type="button" onClick={handleAddProceed} disabled={addModalSaving}
                    style={{ ...SUBMIT_BTN, opacity: addModalSaving ? 0.7 : 1, cursor: addModalSaving ? "not-allowed" : "pointer" }}>
                    {addModalSaving ? "Saving…" : "Save"}
                  </button>
                )}
                <button type="button" disabled={addModalSaving}
                  onClick={() => { setAddConflictModal(null); setAddPendingEvents([]); setAddEventReschedule(null); }}
                  style={CANCEL_BTN}>
                  Cancel
                </button>
              </div>
            </div>
          </ModalShell>
        );
      })()}

      {/* Unified conflict modal for slot reschedule */}
      {rescheduleConflictModal && (() => {
        const info = rescheduleConflictModal.conflicts;
        const hasPersonalBlocks = info.personal.length > 0;
        const hasPendingEvents = reschedulePendingEvents.length > 0;
        const hasSessionConflicts = info.group.length > 0 || info.individual.length > 0;
        const blocked = hasPersonalBlocks || hasPendingEvents;
        const CROW: React.CSSProperties = { fontFamily: "var(--font-base)", fontSize: "clamp(12px, 0.78vw, 13px)", color: "var(--color-text-primary)", padding: "8px 0", borderBottom: "1px solid var(--color-border-light)" };
        const CMUTED: React.CSSProperties = { color: "var(--color-text-muted)" };
        const CLABEL: React.CSSProperties = { fontFamily: "var(--font-base)", fontWeight: 600, fontSize: "clamp(11px, 0.72vw, 12px)", color: "var(--color-text-secondary)", marginBottom: 6, display: "block" };
        const CNOTE: React.CSSProperties = { fontFamily: "var(--font-base)", fontSize: "clamp(11px, 0.7vw, 12px)", color: "var(--color-text-muted)", margin: "6px 0 0" };
        const CBTN = (danger = false): React.CSSProperties => ({
          fontFamily: "var(--font-base)", fontWeight: 600, fontSize: "clamp(11px, 0.7vw, 12px)",
          color: danger ? "var(--color-pink-dark)" : "var(--color-text-primary)",
          background: "none", border: `1px solid ${danger ? "var(--color-pink-dark)" : "var(--color-border-light)"}`,
          borderRadius: 999, padding: "3px 10px", cursor: "pointer",
        });
        return (
          <ModalShell
            onClose={() => !rescheduleModalSaving && !rescheduleEventLoading && (setRescheduleConflictModal(null), setReschedulePendingEvents([]), setRescheduleEventReschedule(null))}
            title="Schedule conflicts"
            icon={<AlertTriangle size={18} style={{ color: "var(--color-pink-dark)" }} />}
            width="clamp(560px, 52vw, 740px)"
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 18, minHeight: "clamp(320px, 40vh, 520px)" }}>
              {info.group.length > 0 && (
                <div>
                  <span style={CLABEL}>Group sessions</span>
                  {info.group.map(c => (
                    <div key={c.id} style={CROW}>
                      {c.course_title}{c.cohort_name ? ` — ${c.cohort_name}` : ""}
                      &nbsp;<span style={CMUTED}>{c.start_time}&ndash;{c.end_time}</span>
                    </div>
                  ))}
                </div>
              )}
              {info.individual.length > 0 && (
                <div>
                  <span style={CLABEL}>Individual sessions</span>
                  {info.individual.map(c => (
                    <div key={c.id} style={CROW}>
                      {c.course_title}&nbsp;<span style={CMUTED}>{c.start_time}&ndash;{c.end_time}</span>
                    </div>
                  ))}
                </div>
              )}
              {hasPersonalBlocks && (
                <div>
                  <span style={CLABEL}>Personal unavailability blocks</span>
                  {info.personal.map(b => (
                    <div key={b.id} style={CROW}>
                      {b.reason || "Personal block"}&nbsp;<span style={CMUTED}>{b.start_time}&ndash;{b.end_time}</span>
                    </div>
                  ))}
                  <p style={CNOTE}>These blocks must be deleted before saving.</p>
                </div>
              )}
              {reschedulePendingEvents.length > 0 && (
                <div>
                  <span style={CLABEL}>Personal events</span>
                  {reschedulePendingEvents.map(ev => {
                    const isLoading = rescheduleEventLoading === ev.id;
                    const isRescheduling = rescheduleEventReschedule?.eventId === ev.id;
                    return (
                      <div key={ev.id} style={{ ...CROW, display: "flex", flexDirection: "column", gap: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                          <span>
                            <strong>{ev.title}</strong>
                            &nbsp;<span style={CMUTED}>{ev.date} &middot; {ev.start_time}&ndash;{ev.end_time}</span>
                            {!ev.is_owner && <span style={{ ...CMUTED, marginLeft: 6 }}>(invited)</span>}
                          </span>
                          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                            {ev.is_owner ? (
                              <>
                                <button type="button" disabled={isLoading || !!rescheduleEventLoading}
                                  onClick={() => setRescheduleEventReschedule(isRescheduling ? null : { eventId: ev.id, date: ev.date, start: ev.start_time, end: ev.end_time })}
                                  style={CBTN()}>
                                  {isRescheduling ? "Cancel" : "Reschedule"}
                                </button>
                                <button type="button" disabled={isLoading || !!rescheduleEventLoading}
                                  onClick={() => handleRescheduleDeleteEvent(ev)} style={CBTN(true)}>
                                  {isLoading ? "…" : "Delete"}
                                </button>
                              </>
                            ) : (
                              <button type="button" disabled={isLoading || !!rescheduleEventLoading}
                                onClick={() => handleRescheduleDeclineEvent(ev)} style={CBTN(true)}>
                                {isLoading ? "…" : "Decline invite"}
                              </button>
                            )}
                          </div>
                        </div>
                        {isRescheduling && rescheduleEventReschedule && (
                          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap", paddingTop: 4 }}>
                            <div>
                              <DatePicker size="sm" label="New date" value={rescheduleEventReschedule.date}
                                onChange={value => setRescheduleEventReschedule(s => s ? { ...s, date: value } : s)} />
                            </div>
                            <div>
                              <label style={CLABEL}>Start</label>
                              <TimePicker value={rescheduleEventReschedule.start} onChange={v => setRescheduleEventReschedule(s => s ? { ...s, start: v } : s)} />
                            </div>
                            <div>
                              <label style={CLABEL}>End</label>
                              <TimePicker value={rescheduleEventReschedule.end} onChange={v => setRescheduleEventReschedule(s => s ? { ...s, end: v } : s)} />
                            </div>
                            <button type="button" disabled={isLoading}
                              onClick={() => handleRescheduleRescheduleEvent(ev)}
                              style={{ ...SUBMIT_BTN, opacity: isLoading ? 0.7 : 1 }}>
                              {isLoading ? "Saving…" : "Confirm"}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {blocked && <p style={CNOTE}>Resolve all personal events and blocks to continue.</p>}
              {hasSessionConflicts && !blocked && (
                <p style={{ ...CNOTE, color: "var(--color-danger)" }}>Resolve the conflicting sessions above before saving.</p>
              )}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {hasPersonalBlocks && (
                  <button type="button" onClick={handleRescheduleDeleteBlocksAndSave}
                    disabled={rescheduleModalSaving || hasPendingEvents}
                    style={{ ...SUBMIT_BTN, background: "var(--color-pink-dark)", opacity: (rescheduleModalSaving || hasPendingEvents) ? 0.5 : 1, cursor: (rescheduleModalSaving || hasPendingEvents) ? "not-allowed" : "pointer" }}>
                    {rescheduleModalSaving ? "Saving…" : "Delete blocks & Save"}
                  </button>
                )}
                {!blocked && !hasSessionConflicts && (
                  <button type="button" onClick={handleRescheduleProceed} disabled={rescheduleModalSaving}
                    style={{ ...SUBMIT_BTN, opacity: rescheduleModalSaving ? 0.7 : 1, cursor: rescheduleModalSaving ? "not-allowed" : "pointer" }}>
                    {rescheduleModalSaving ? "Saving…" : "Save slot"}
                  </button>
                )}
                <button type="button" disabled={rescheduleModalSaving}
                  onClick={() => { setRescheduleConflictModal(null); setReschedulePendingEvents([]); setRescheduleEventReschedule(null); }}
                  style={CANCEL_BTN}>
                  Cancel
                </button>
              </div>
            </div>
          </ModalShell>
        );
      })()}

{/* Personal event conflict modal shown before slot assignment */}
      {assignConflict && (
        <ModalShell
          title="Personal event conflicts"
          icon={<AlertTriangle size={16} />}
          onClose={() => !assignConflictLoading && (setAssignConflict(null), setConflictRescheduleState(null))}
          width="clamp(620px, 56vw, 800px)"
          minHeight="640px"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ fontFamily: "var(--font-base)", fontSize: "clamp(12px, 0.78vw, 14px)", color: "var(--color-text-secondary)", margin: 0 }}>
              The following personal events conflict with this slot&apos;s time. Resolve them to proceed with assignment.
            </p>

            {assignConflict.pending.map(ev => {
              const isRescheduling = conflictRescheduleState?.eventId === ev.id;
              return (
                <div key={ev.id} style={{ borderRadius: 8, border: "1px solid var(--color-border-light)", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <p style={{ fontFamily: "var(--font-base)", fontWeight: 600, fontSize: "clamp(12px, 0.78vw, 14px)", color: "var(--color-text-primary)", margin: 0 }}>{ev.title}</p>
                      <p style={{ fontFamily: "var(--font-base)", fontSize: "clamp(11px, 0.72vw, 13px)", color: "var(--color-text-secondary)", margin: 0 }}>{ev.date} · {ev.start_time}–{ev.end_time}</p>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      {!isRescheduling && (
                        <button type="button" disabled={!!assignConflictLoading}
                          onClick={() => { setConflictRescheduleState({ eventId: ev.id, date: ev.date, start: ev.start_time, end: ev.end_time }); setAssignConflictRescheduleErr(null); }}
                          style={{ fontFamily: "var(--font-base)", fontSize: "clamp(11px, 0.72vw, 13px)", fontWeight: 600, color: "var(--color-text-primary)", background: "none", border: "1px solid var(--color-border-light)", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>
                          Reschedule
                        </button>
                      )}
                      {ev.is_owner ? (
                        <button type="button" disabled={assignConflictLoading === ev.id}
                          onClick={() => handleConflictDelete(ev)}
                          style={{ fontFamily: "var(--font-base)", fontSize: "clamp(11px, 0.72vw, 13px)", fontWeight: 600, color: "var(--color-danger)", background: "none", border: "1px solid #fca5a5", borderRadius: 6, padding: "4px 10px", cursor: "pointer", opacity: assignConflictLoading === ev.id ? 0.5 : 1 }}>
                          {assignConflictLoading === ev.id ? "…" : "Delete"}
                        </button>
                      ) : (
                        <button type="button" disabled={assignConflictLoading === ev.id}
                          onClick={() => handleConflictDecline(ev)}
                          style={{ fontFamily: "var(--font-base)", fontSize: "clamp(11px, 0.72vw, 13px)", fontWeight: 600, color: "var(--color-danger)", background: "none", border: "1px solid #fca5a5", borderRadius: 6, padding: "4px 10px", cursor: "pointer", opacity: assignConflictLoading === ev.id ? 0.5 : 1 }}>
                          {assignConflictLoading === ev.id ? "…" : "Decline invite"}
                        </button>
                      )}
                    </div>
                  </div>
                  {isRescheduling && conflictRescheduleState && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, paddingTop: 4 }}>
                      <div>
                        <DatePicker size="sm" label="Date" value={conflictRescheduleState.date}
                          onChange={v => setConflictRescheduleState(s => s ? { ...s, date: v } : s)} />
                      </div>
                      <div>
                        <label style={{ fontFamily: "var(--font-base)", fontSize: "clamp(10px, 0.63vw, 11px)", color: "var(--color-text-secondary)", display: "block", marginBottom: 3 }}>Start</label>
                        <TimePicker value={conflictRescheduleState.start} onChange={v => setConflictRescheduleState(s => s ? { ...s, start: v } : s)} />
                      </div>
                      <div>
                        <label style={{ fontFamily: "var(--font-base)", fontSize: "clamp(10px, 0.63vw, 11px)", color: "var(--color-text-secondary)", display: "block", marginBottom: 3 }}>End</label>
                        <TimePicker value={conflictRescheduleState.end} onChange={v => setConflictRescheduleState(s => s ? { ...s, end: v } : s)} />
                      </div>
                      <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8 }}>
                        <button type="button" disabled={!!assignConflictLoading}
                          onClick={() => handleConflictReschedule(ev, conflictRescheduleState.date, conflictRescheduleState.start, conflictRescheduleState.end).then(() => setConflictRescheduleState(null))}
                          style={{ fontFamily: "var(--font-base)", fontWeight: 600, fontSize: "clamp(11px, 0.72vw, 13px)", background: "var(--gradient-brand)", border: "none", borderRadius: 6, padding: "5px 14px", cursor: "pointer" }}>
                          Confirm
                        </button>
                        <button type="button" onClick={() => { setConflictRescheduleState(null); setAssignConflictRescheduleErr(null); }}
                          style={{ fontFamily: "var(--font-base)", fontSize: "clamp(11px, 0.72vw, 13px)", background: "none", border: "1px solid var(--color-border-light)", borderRadius: 6, padding: "5px 14px", cursor: "pointer" }}>
                          Cancel
                        </button>
                      </div>
                      {assignConflictRescheduleErr && (
                        <div style={{ gridColumn: "1 / -1", background: "#fff0f0", borderRadius: 6, padding: "6px 10px" }}>
                          <p style={{ fontFamily: "var(--font-base)", fontSize: "clamp(11px, 0.72vw, 13px)", fontWeight: 600, color: "var(--color-danger)", margin: "0 0 2px" }}>{assignConflictRescheduleErr.message}</p>
                          {assignConflictRescheduleErr.items.map((c, i) => (
                            <p key={i} style={{ fontFamily: "var(--font-base)", fontSize: "clamp(10px, 0.63vw, 11px)", color: "var(--color-text-secondary)", margin: "1px 0" }}>
                              {c.type === "group" ? "Group" : c.type === "individual" ? "Individual" : "Personal"}: {c.title} · {c.start_time}–{c.end_time}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            <div style={{ display: "flex", gap: 8 }}>
              {assignConflict.pending.length === 0 && (
                <button type="button"
                  onClick={() => { doAssign(assignConflict.slotId, assignConflict.enrollmentId); setAssignConflict(null); }}
                  style={{ fontFamily: "var(--font-base)", fontWeight: 600, fontSize: "clamp(12px, 0.78vw, 14px)", background: "var(--gradient-brand)", border: "none", borderRadius: 8, padding: "7px 18px", cursor: "pointer" }}>
                  Assign
                </button>
              )}
              <button type="button"
                onClick={() => { setAssignConflict(null); setConflictRescheduleState(null); }}
                style={{ fontFamily: "var(--font-base)", fontSize: "clamp(12px, 0.78vw, 14px)", background: "none", border: "1px solid var(--color-border-light)", borderRadius: 8, padding: "7px 18px", cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </ModalShell>
      )}

    </div>
  );
}

// ── UnavailabilityRow ─────────────────────────────────────────────────────────

function UnavailabilityRow({
  block,
  onDelete,
}: {
  block: TeacherUnavailability;
  onDelete: (id: number) => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);

  const isAllDay = block.start_time.startsWith("00:00") && block.end_time >= "23:59";
  const timeStr = isAllDay ? "All day" : `${fmtTime(block.start_time)} – ${fmtTime(block.end_time)}`;
  function fmtDate(iso: string | null) {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    return `${d}.${m}.${y}`;
  }
  const dateStr =
    block.recurrence_type === "date_range"
      ? `${fmtDate(block.date)} – ${fmtDate(block.date_to)}`
      : block.recurrence_type === "one_time"
      ? fmtDate(block.date) || block.day_of_week_display
      : block.day_of_week_display;

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 14px 10px 12px", borderRadius: 12,
      background: "rgba(167,186,250,0.1)",
      borderLeft: "3px solid var(--color-brand-lavender)",
      gap: 10,
    }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1, minWidth: 0 }}>
        <span style={{
          fontFamily: "var(--font-base)", fontWeight: 700,
          fontSize: "clamp(12px, 0.83vw, 14px)", color: "var(--color-text-primary)",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {dateStr} &middot; {timeStr}
        </span>
        <span style={{
          fontFamily: "var(--font-accent)", fontWeight: 500,
          fontSize: "clamp(9px, 0.6vw, 11px)", color: "var(--color-text-secondary)",
          textTransform: "uppercase", letterSpacing: "0.04em",
        }}>
          {block.recurrence_type_display}
          {block.reason ? ` — ${block.reason}` : ""}
        </span>
      </div>
      <IconBtn
        icon={<Trash2 size={14} />}
        onClick={async () => { setDeleting(true); try { await onDelete(block.id); } finally { setDeleting(false); } }}
        disabled={deleting}
        color="var(--color-pink-dark)"
        title="Remove block"
      />
    </div>
  );
}

// ── AddUnavailabilityForm ─────────────────────────────────────────────────────

function AddUnavailabilityForm({
  onAdd,
  onCancel,
}: {
  onAdd: (p: TeacherUnavailabilityPayload) => Promise<void>;
  onCancel: () => void;
}) {
  const [recurrence, setRecurrence] = useState<RecurrenceType>("weekly");
  const [day, setDay] = useState<DayOfWeek>(0);
  const [date, setDate] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const PL: React.CSSProperties = {
    fontFamily: "var(--font-accent)", fontWeight: 500,
    fontSize: "clamp(9px, 0.63vw, 11px)", color: "var(--color-text-secondary)",
    display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em",
  };

  const tabBtn = (active: boolean): React.CSSProperties => ({
    fontFamily: "var(--font-accent)", fontWeight: 500,
    fontSize: "clamp(9px, 0.63vw, 11px)", letterSpacing: "0.04em", textTransform: "uppercase",
    padding: "4px 14px", borderRadius: 999, cursor: "pointer",
    border: `1.5px solid ${active ? "var(--color-text-primary)" : "var(--color-text-secondary)"}`,
    background: active ? "var(--color-text-primary)" : "transparent",
    color: active ? "#fff" : "var(--color-text-secondary)",
    transition: "background 0.15s, color 0.15s",
  });

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!allDay && end <= start) { setErr("End time must be after start time."); return; }
    if (recurrence === "one_time" && !date) { setErr("Date is required for one-time block."); return; }
    if (recurrence === "date_range" && (!date || !dateTo)) { setErr("Both start and end dates are required."); return; }
    if (recurrence === "date_range" && dateTo < date) { setErr("End date must be on or after start date."); return; }
    setSaving(true); setErr(null);
    try {
      const resolvedStart = allDay ? "00:00" : start;
      const resolvedEnd   = allDay ? "23:59" : end;
      const payload: TeacherUnavailabilityPayload = {
        recurrence_type: recurrence,
        start_time: resolvedStart,
        end_time: resolvedEnd,
        reason: reason || undefined,
      };
      if (recurrence === "weekly") {
        payload.day_of_week = day;
      } else if (recurrence === "one_time") {
        payload.date = date;
      } else {
        payload.date = date;
        payload.date_to = dateTo;
      }
      await onAdd(payload);
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Type */}
      <div>
        <label style={PL}>Type</label>
        <PillSelect
          options={[
            { value: "weekly" as RecurrenceType, label: "Every week (recurring)" },
            { value: "one_time" as RecurrenceType, label: "One-time" },
            { value: "date_range" as RecurrenceType, label: "Date range" },
          ]}
          value={recurrence}
          onChange={v => setRecurrence(v as RecurrenceType)}
        />
      </div>

      {/* Day / Date */}
      {recurrence === "weekly" ? (
        <div>
          <label style={PL}>Day</label>
          <PillSelect options={DAYS} value={day} onChange={v => setDay(v as DayOfWeek)} />
        </div>
      ) : recurrence === "one_time" ? (
        <DatePicker label="Date" value={date} onChange={setDate} size="md" />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <DatePicker label="From" value={date} onChange={setDate} size="md" />
          <DatePicker label="To" value={dateTo} onChange={setDateTo} size="md" min={date || undefined} />
        </div>
      )}

      {/* Hours toggle */}
      <div>
        <span style={PL}>Hours</span>
        <div style={{ display: "flex", gap: 6 }}>
          <button type="button" style={tabBtn(!allDay)} onClick={() => setAllDay(false)}>Specific</button>
          <button type="button" style={tabBtn(allDay)}  onClick={() => setAllDay(true)}>All day</button>
        </div>
      </div>

      {/* Time range */}
      {!allDay && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={PL}>Start time</label>
            <TimePicker value={start} onChange={setStart} />
          </div>
          <div>
            <label style={PL}>End time</label>
            <TimePicker value={end} onChange={setEnd} />
          </div>
        </div>
      )}

      {/* Reason */}
      <div>
        <label style={PL}>Reason (optional)</label>
        <input
          type="text"
          style={INPUT}
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="e.g. personal plans, vacation…"
          maxLength={255}
        />
      </div>

      {err && <p style={ERR}>{err}</p>}

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button
          type="submit"
          disabled={saving}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontFamily: "var(--font-accent)", fontWeight: 500,
            fontSize: "clamp(12px, 1.04vw, 20px)", color: "var(--color-text-primary)",
            background: "var(--gradient-brand)", border: "none", borderRadius: 28,
            padding: "clamp(6px, 0.42vw, 8px) clamp(18px, 1.4vw, 28px)",
            cursor: saving ? "not-allowed" : "pointer",
            textTransform: "uppercase", letterSpacing: "0.03em",
            opacity: saving ? 0.65 : 1, transition: "opacity 0.2s",
            whiteSpace: "nowrap",
          }}
        >
          <Check size={13} /> {saving ? "Saving…" : "Add block"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            fontFamily: "var(--font-accent)", fontWeight: 500,
            fontSize: "clamp(10px, 0.7vw, 12px)", color: "var(--color-text-secondary)",
            background: "transparent", border: "1.5px solid var(--color-text-secondary)",
            borderRadius: 999, padding: "5px 18px", cursor: "pointer",
            textTransform: "uppercase", letterSpacing: "0.04em",
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── UnavailabilitySection ─────────────────────────────────────────────────────

export function UnavailabilitySection() {
  const [blocks, setBlocks] = useState<TeacherUnavailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    getTeacherUnavailabilities()
      .then(setBlocks)
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async (payload: TeacherUnavailabilityPayload) => {
    const block = await createTeacherUnavailability(payload);
    setBlocks(prev => [...prev, block]);
    setAddOpen(false);
  };

  const handleDelete = async (id: number) => {
    await deleteTeacherUnavailability(id);
    setBlocks(prev => prev.filter(b => b.id !== id));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Description */}
      <p style={{
        fontFamily: "var(--font-base)", fontSize: "clamp(11px, 0.76vw, 13px)",
        color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.5,
      }}>
        Times blocked here won&apos;t be available for student bookings across all your courses.
      </p>

      {/* Existing blocks */}
      {loading && (
        <p style={{ fontFamily: "var(--font-accent)", fontSize: "clamp(10px, 0.65vw, 12px)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Loading…
        </p>
      )}

      {!loading && blocks.length === 0 && !addOpen && (
        <p style={{ fontFamily: "var(--font-base)", fontSize: "clamp(12px, 0.78vw, 13px)", color: "var(--color-text-muted)" }}>
          No time blocks set yet.
        </p>
      )}

      {!loading && blocks.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {blocks.map(b => (
            <UnavailabilityRow key={b.id} block={b} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Add form or Add button */}
      {addOpen ? (
        <div style={{ borderTop: "1px solid var(--color-border-light)", paddingTop: 16 }}>
          <AddUnavailabilityForm onAdd={handleAdd} onCancel={() => setAddOpen(false)} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          style={{
            alignSelf: "flex-start",
            display: "inline-flex", alignItems: "center", gap: 6,
            fontFamily: "var(--font-accent)", fontWeight: 500,
            fontSize: "clamp(12px, 1.04vw, 20px)", color: "var(--color-text-primary)",
            background: "var(--gradient-brand)", border: "none", borderRadius: 28,
            padding: "clamp(6px, 0.42vw, 8px) clamp(18px, 1.4vw, 28px)",
            cursor: "pointer", textTransform: "uppercase",
            letterSpacing: "0.03em", transition: "opacity 0.2s",
          }}
        >
          + Block time
        </button>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

/** Individual-format schedule management: slot creation by day, student assignment, and teacher unavailability blocks. */
export function CourseManagementScheduleTab({
  course,
  slug,
  onSlotsChanged,
}: {
  course: CourseDetail;
  slug: string;
  onSlotsChanged?: () => void;
}) {
  const individualFmt = course.delivery_formats?.find(f => f.format_type === "individual");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {individualFmt && (
        <IndividualFormatSection fmt={individualFmt} slug={slug} onAssigned={onSlotsChanged} />
      )}
    </div>
  );
}
