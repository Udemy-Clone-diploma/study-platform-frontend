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

function TimePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
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
    <div style={{ borderRadius: 12, border: "1px solid var(--color-border-light)", overflow: "hidden" }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          width: "100%", padding: "9px 12px",
          background: "var(--color-bg)", border: "none",
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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


  useEffect(() => {
    getScheduleSlots(slug, fmt.id).then(setSlots).finally(() => setLoading(false));
    getCourseEnrolledStudents(slug, fmt.id).then(setEnrolledStudents).catch(() => {});
  }, [slug, fmt.id]);

  const handleAdd = async (payload: ScheduleSlotPayload) => {
    const slot = await createScheduleSlot(slug, fmt.id, payload);
    setSlots(prev => [...prev, slot]);
    setAddOpen(false);
  };

  const handleGenerate = async (payloads: ScheduleSlotPayload[]) => {
    const created: ScheduleSlot[] = [];
    for (const p of payloads) {
      const slot = await createScheduleSlot(slug, fmt.id, p);
      created.push(slot);
    }
    setSlots(prev => [...prev, ...created]);
    setGenerateOpen(false);
  };

  const handleReschedule = async (
    id: number,
    payload: { day_of_week: DayOfWeek; start_time: string; end_time: string },
  ) => {
    const updated = await rescheduleSlot(slug, fmt.id, id, payload);
    setSlots(prev => prev.map(s => (s.id === id ? updated : s)));
    setRescheduling(null);
  };

  const handleDelete = async (id: number) => {
    await deleteScheduleSlot(slug, fmt.id, id);
    setSlots(prev => prev.filter(s => s.id !== id));
  };

  const handleAssign = async (slotId: number, enrollmentId: number | null) => {
    const updated = await assignScheduleSlot(slug, fmt.id, slotId, enrollmentId);
    setSlots(prev => prev.map(s => (s.id === slotId ? updated : s)));
    onAssigned?.();
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
            <AddButton onClick={() => setGenerateOpen(true)}>Generate slots</AddButton>
            <AddButton onClick={() => setAddOpen(true)}>Add slot</AddButton>
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
          <AddSlotForm onAdd={handleAdd} onCancel={() => setAddOpen(false)} />
        </div>
      )}

      {generateOpen && (
        <div style={{ borderTop: slots.length > 0 ? "1px solid var(--color-border-light)" : undefined, paddingTop: slots.length > 0 ? 14 : 0 }}>
          <GenerateSlotsForm onGenerate={handleGenerate} onCancel={() => setGenerateOpen(false)} />
        </div>
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
    <div
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 12px", borderRadius: 10,
        background: "var(--color-bg)", border: "1px solid var(--color-border-light)",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span
          style={{
            fontFamily: "var(--font-base)", fontWeight: 600,
            fontSize: "clamp(12px, 0.83vw, 14px)", color: "var(--color-text-primary)",
          }}
        >
          {dateStr} &middot; {timeStr}
        </span>
        <span
          style={{
            fontFamily: "var(--font-base)", fontSize: "clamp(11px, 0.72vw, 13px)",
            color: "var(--color-text-secondary)",
          }}
        >
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

  const toggleStyle = (active: boolean): React.CSSProperties => ({
    padding: "5px 14px", borderRadius: 999, cursor: "pointer",
    fontFamily: "var(--font-base)", fontWeight: 500, fontSize: "clamp(11px, 0.76vw, 13px)",
    border: `1px solid ${active ? "var(--color-text-primary)" : "var(--color-border-light)"}`,
    background: active ? "var(--color-text-primary)" : "transparent",
    color: active ? "#fff" : "var(--color-text-secondary)",
    transition: "all 0.15s",
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Type + day/date picker */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <label style={LABEL}>Type</label>
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
        {recurrence === "weekly" ? (
          <div>
            <label style={LABEL}>Day</label>
            <PillSelect options={DAYS} value={day} onChange={v => setDay(v as DayOfWeek)} />
          </div>
        ) : recurrence === "one_time" ? (
          <DatePicker label="Date" value={date} onChange={setDate} size="md" />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <DatePicker label="From" value={date} onChange={setDate} size="md" />
            <DatePicker label="To" value={dateTo} onChange={setDateTo} size="md" min={date || undefined} />
          </div>
        )}
      </div>

      {/* All day toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={LABEL}>Hours</span>
        <div style={{ display: "flex", gap: 6 }}>
          <button type="button" style={toggleStyle(!allDay)} onClick={() => setAllDay(false)}>Specific</button>
          <button type="button" style={toggleStyle(allDay)}  onClick={() => setAllDay(true)}>All day</button>
        </div>
      </div>

      {/* Time pickers — only shown when not all day */}
      {!allDay && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={LABEL}>Start time</label>
            <TimePicker value={start} onChange={setStart} />
          </div>
          <div>
            <label style={LABEL}>End time</label>
            <TimePicker value={end} onChange={setEnd} />
          </div>
        </div>
      )}

      <div>
        <label style={LABEL}>Reason (optional)</label>
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
      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" disabled={saving} style={{ ...SUBMIT_BTN, opacity: saving ? 0.7 : 1, cursor: saving ? "not-allowed" : "pointer" }}>
          <Check size={13} /> {saving ? "Saving…" : "Add block"}
        </button>
        <button type="button" onClick={onCancel} style={CANCEL_BTN}>Cancel</button>
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
    <div style={CARD}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
        <div>
          <p style={SECTION_TITLE}>My unavailability</p>
          <p
            style={{
              fontFamily: "var(--font-base)",
              fontSize: "clamp(12px, 0.78vw, 14px)",
              color: "var(--color-text-secondary)",
              margin: 0,
            }}
          >
            Times when you are not available for any classes. These times are blocked for all your courses.
          </p>
        </div>
        {!addOpen && (
          <AddButton onClick={() => setAddOpen(true)}>Block time</AddButton>
        )}
      </div>

      {loading && (
        <p style={{ fontFamily: "var(--font-base)", fontSize: "clamp(12px, 0.78vw, 14px)", color: "var(--color-text-muted)" }}>
          Loading…
        </p>
      )}

      {!loading && blocks.length === 0 && !addOpen && (
        <p style={{ fontFamily: "var(--font-base)", fontSize: "clamp(12px, 0.78vw, 14px)", color: "var(--color-text-muted)" }}>
          No unavailability blocks set.
        </p>
      )}

      {!loading && blocks.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: addOpen ? 14 : 0 }}>
          {blocks.map(b => (
            <UnavailabilityRow key={b.id} block={b} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {addOpen && (
        <div style={{ borderTop: blocks.length > 0 ? "1px solid var(--color-border-light)" : undefined, paddingTop: blocks.length > 0 ? 14 : 0 }}>
          <AddUnavailabilityForm onAdd={handleAdd} onCancel={() => setAddOpen(false)} />
        </div>
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
