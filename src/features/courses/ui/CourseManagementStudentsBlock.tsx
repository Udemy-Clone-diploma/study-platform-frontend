"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { DatePicker } from "@/shared/ui/DatePicker";
import { getCourseEnrolledStudents, getScheduleSlots, updateEnrollmentPeriod } from "@/entities/course";
import type { CourseDetail, EnrolledStudent, ScheduleSlot } from "@/entities/course";

const DAY_SHORT: Record<number, string> = {
  0: "Mon", 1: "Tue", 2: "Wed", 3: "Thu", 4: "Fri", 5: "Sat", 6: "Sun",
};

const ROW: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 10,
  padding: "8px 12px", borderRadius: 10,
  background: "var(--color-bg)", border: "1px solid var(--color-border-light)",
};

const NAME_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-base)", fontWeight: 600,
  fontSize: "clamp(12px, 0.83vw, 14px)", color: "var(--color-text-primary)",
  margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
};

const SUB_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-base)", fontSize: "clamp(11px, 0.69vw, 12px)",
  color: "var(--color-text-secondary)", margin: 0,
  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
};

const META_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-base)", fontSize: "clamp(11px, 0.69vw, 13px)",
  color: "var(--color-text-secondary)", flexShrink: 0, whiteSpace: "nowrap",
};

const ICON_BTN: React.CSSProperties = {
  background: "none", border: "none", cursor: "pointer",
  padding: 4, display: "flex", alignItems: "center",
  color: "var(--color-text-secondary)", flexShrink: 0,
};

const SAVE_BTN: React.CSSProperties = {
  fontFamily: "var(--font-base)", fontWeight: 600,
  fontSize: "clamp(11px, 0.72vw, 12px)", color: "#fff",
  background: "var(--color-text-primary)", border: "none", borderRadius: 999,
  padding: "5px 12px", cursor: "pointer",
  display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0,
};

// ── Shared helpers ─────────────────────────────────────────────────────────────

function toDateStr(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 10) : "";
}

function fmtShort(iso: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y.slice(2)}`;
}

function EmptyMsg({ text }: { text: string }) {
  return (
    <p style={{ fontFamily: "var(--font-base)", fontSize: "clamp(13px, 0.83vw, 15px)", color: "var(--color-text-muted)", margin: 0 }}>
      {text}
    </p>
  );
}

function ListWrap({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{children}</div>;
}

// ── StudentRow (generic) ───────────────────────────────────────────────────────

function StudentRow({ name, email, meta, badge }: {
  name?: string | null; email: string; meta?: string; badge?: string;
}) {
  return (
    <div style={ROW}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={NAME_STYLE}>{name || email}</p>
        {name && <p style={SUB_STYLE}>{email}</p>}
      </div>
      {meta && <span style={META_STYLE}>{meta}</span>}
      {badge && (
        <span style={{ fontFamily: "var(--font-base)", fontSize: "clamp(10px, 0.63vw, 12px)", background: "var(--color-bg)", border: "1px solid var(--color-border-light)", borderRadius: 999, padding: "2px 10px", color: "var(--color-text-secondary)", flexShrink: 0, whiteSpace: "nowrap" }}>
          {badge}
        </span>
      )}
    </div>
  );
}

// ── IndividualStudentRow (with period inline-edit) ─────────────────────────────

function IndividualStudentRow({
  student, meta, slug, fmtId, onUpdated,
}: {
  student: EnrolledStudent;
  meta?: string;
  slug: string;
  fmtId: number;
  onUpdated: (updated: EnrolledStudent) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [start, setStart]     = useState(toDateStr(student.access_granted_at));
  const [end, setEnd]         = useState(toDateStr(student.access_until));
  const [saving, setSaving]   = useState(false);

  async function save() {
    setSaving(true);
    try {
      const updated = await updateEnrollmentPeriod(slug, fmtId, student.enrollment_id, {
        access_granted_at: start || undefined,
        access_until: end || null,
      });
      onUpdated(updated);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setStart(toDateStr(student.access_granted_at));
    setEnd(toDateStr(student.access_until));
    setEditing(false);
  }

  const periodLabel = start
    ? `${fmtShort(start)} – ${end ? fmtShort(end) : "∞"}`
    : null;

  if (editing) {
    return (
      <div style={{ ...ROW, flexWrap: "wrap", gap: 8, alignItems: "flex-end" }}>
        <div style={{ flex: "0 0 160px", minWidth: 130 }}>
          <p style={NAME_STYLE}>{student.student_name || student.student_email}</p>
          {student.student_name && <p style={SUB_STYLE}>{student.student_email}</p>}
        </div>
        <div style={{ flex: "1 1 130px", minWidth: 110 }}>
          <DatePicker label="Start" value={start} onChange={setStart} size="sm" />
        </div>
        <div style={{ flex: "1 1 130px", minWidth: 110 }}>
          <DatePicker label="Until" value={end} onChange={setEnd} size="sm" />
        </div>
        <button type="button" onClick={save} disabled={saving} style={{ ...SAVE_BTN, opacity: saving ? 0.5 : 1 }}>
          <Check size={12} /> Save
        </button>
        <button type="button" onClick={cancel} style={ICON_BTN}>
          <X size={15} />
        </button>
      </div>
    );
  }

  return (
    <div style={ROW}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={NAME_STYLE}>{student.student_name || student.student_email}</p>
        <p style={SUB_STYLE}>
          {student.student_name ? student.student_email : ""}
          {periodLabel && (student.student_name ? "  ·  " : "")}{periodLabel}
        </p>
      </div>
      {meta && <span style={META_STYLE}>{meta}</span>}
      <button type="button" onClick={() => setEditing(true)} style={ICON_BTN} title="Edit period">
        <Pencil size={14} />
      </button>
    </div>
  );
}

// ── Individual: students with booked days + period ─────────────────────────────

/** List content for the Individual format — shows each student's scheduled days and learning period. */
export function IndividualStudentsList({ slug, fmtId, refreshKey }: {
  slug: string; fmtId: number; refreshKey?: number;
}) {
  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [slots, setSlots]       = useState<ScheduleSlot[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([getCourseEnrolledStudents(slug, fmtId), getScheduleSlots(slug, fmtId)])
      .then(([s, sl]) => { setStudents(s); setSlots(sl); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug, fmtId, refreshKey]);

  const slotsByStudent = useMemo(() => {
    const map = new Map<number, ScheduleSlot[]>();
    for (const sl of slots) {
      if (!sl.booked_by_student) continue;
      const id = sl.booked_by_student.student_profile_id;
      const arr = map.get(id) ?? [];
      arr.push(sl);
      map.set(id, arr);
    }
    return map;
  }, [slots]);

  function handleUpdated(updated: EnrolledStudent) {
    setStudents(prev => prev.map(s => s.enrollment_id === updated.enrollment_id ? updated : s));
  }

  if (loading) return <EmptyMsg text="Loading…" />;
  if (students.length === 0) return <EmptyMsg text="No students enrolled yet." />;

  return (
    <ListWrap>
      {students.map(s => {
        const mySlots = slotsByStudent.get(s.student_id) ?? [];
        const days = [...new Set(mySlots.map(sl => sl.day_of_week))].sort((a, b) => a - b);
        const meta = mySlots.length > 0
          ? `${mySlots.length} session${mySlots.length !== 1 ? "s" : ""} · ${days.map(d => DAY_SHORT[d]).join(", ")}`
          : undefined;
        return (
          <IndividualStudentRow
            key={s.enrollment_id}
            student={s}
            meta={meta}
            slug={slug}
            fmtId={fmtId}
            onUpdated={handleUpdated}
          />
        );
      })}
    </ListWrap>
  );
}

// ── Group: students with their cohort name ─────────────────────────────────────

/** List content for the Group format — shows each student with their cohort badge. */
export function GroupStudentsList({ course }: { course: CourseDetail }) {
  const rows = useMemo(() =>
    (course.cohorts ?? []).flatMap(c =>
      (c.members ?? []).map(m => ({ ...m, cohortName: c.name ?? "Unnamed cohort" }))
    ),
    [course.cohorts],
  );

  if (rows.length === 0) return <EmptyMsg text="No students assigned to cohorts yet." />;

  return (
    <ListWrap>
      {rows.map(r => (
        <StudentRow key={r.enrollment_id} name={r.student_name} email={r.student_email} badge={r.cohortName} />
      ))}
    </ListWrap>
  );
}

// ── Scheduled / Self-paced: plain enrolled list ────────────────────────────────

/** List content for Scheduled or Self-paced formats — plain student list. */
export function SimpleStudentsList({ slug, fmtId }: { slug: string; fmtId: number }) {
  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    getCourseEnrolledStudents(slug, fmtId)
      .then(setStudents)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug, fmtId]);

  if (loading) return <EmptyMsg text="Loading…" />;
  if (students.length === 0) return <EmptyMsg text="No students enrolled yet." />;

  return (
    <ListWrap>
      {students.map(s => (
        <StudentRow key={s.enrollment_id} name={s.student_name} email={s.student_email} />
      ))}
    </ListWrap>
  );
}
