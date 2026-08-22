"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Award, Check, Pencil, RotateCcw, X } from "lucide-react";
import { DatePicker } from "@/shared/ui/DatePicker";
import {
  completeStudentEnrollment,
  getCourseEnrolledStudents,
  getScheduleSlots,
  uncompleteStudentEnrollment,
  updateEnrollmentPeriod,
} from "@/entities/course";
import { DAY_KEYS } from "@/entities/course/model/schedule";
import type { CourseDetail, EnrolledStudent, ScheduleSlot } from "@/entities/course";
import type { ApiError } from "@/shared/api/base";
import { CourseConfirmModal } from "./CourseConfirmModal";

const ROW: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "8px 12px",
  borderRadius: 10,
  background: "var(--color-bg)",
  border: "1px solid var(--color-border-light)",
};

const NAME_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-base)",
  fontWeight: 600,
  fontSize: "clamp(12px, 0.83vw, 14px)",
  color: "var(--color-text-primary)",
  margin: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const SUB_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-base)",
  fontSize: "clamp(11px, 0.69vw, 12px)",
  color: "var(--color-text-secondary)",
  margin: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const META_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-base)",
  fontSize: "clamp(11px, 0.69vw, 13px)",
  color: "var(--color-text-secondary)",
  flexShrink: 0,
  whiteSpace: "nowrap",
};

const ICON_BTN: React.CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: 4,
  display: "flex",
  alignItems: "center",
  color: "var(--color-text-secondary)",
  flexShrink: 0,
};

const ERROR_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-base)",
  fontSize: "clamp(11px, 0.69vw, 12px)",
  color: "var(--color-danger)",
  margin: "0 0 0 12px",
};

const SAVE_BTN: React.CSSProperties = {
  fontFamily: "var(--font-base)",
  fontWeight: 600,
  fontSize: "clamp(11px, 0.72vw, 12px)",
  color: "#fff",
  background: "var(--color-text-primary)",
  border: "none",
  borderRadius: 999,
  padding: "5px 12px",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  flexShrink: 0,
};

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
    <p
      style={{
        fontFamily: "var(--font-base)",
        fontSize: "clamp(13px, 0.83vw, 15px)",
        color: "var(--color-text-muted)",
        margin: 0,
      }}
    >
      {text}
    </p>
  );
}

function ListWrap({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{children}</div>;
}

export function CompletionBadge({ completed }: { completed: boolean }) {
  const t = useTranslations("CourseManagementStudentsBlock");
  return (
    <span
      style={{
        fontFamily: "var(--font-base)",
        fontWeight: 600,
        fontSize: "clamp(10px, 0.63vw, 12px)",
        borderRadius: 999,
        padding: "2px 10px",
        flexShrink: 0,
        whiteSpace: "nowrap",
        color: completed ? "var(--color-success)" : "var(--color-text-secondary)",
        border: `1px solid ${completed ? "var(--color-success)" : "var(--color-border-light)"}`,
        background: "white",
      }}
    >
      {completed ? t("completed") : t("studying")}
    </span>
  );
}

function StudentRow({
  name,
  email,
  meta,
  badge,
  completed,
  onComplete,
  onUncomplete,
}: {
  name?: string | null;
  email: string;
  meta?: string;
  badge?: string;
  completed?: boolean;
  onComplete?: () => Promise<void>;
  onUncomplete?: () => Promise<void>;
}) {
  const t = useTranslations("CourseManagementStudentsBlock");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<"complete" | "uncomplete" | null>(null);

  async function handleConfirm() {
    setPending(true);
    setError(null);
    try {
      if (action === "complete") await onComplete?.();
      else if (action === "uncomplete") await onUncomplete?.();
      setAction(null);
    } catch (err) {
      setError((err as ApiError).message ?? t("errorGeneric"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={ROW}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={NAME_STYLE}>{name || email}</p>
          {name && <p style={SUB_STYLE}>{email}</p>}
        </div>
        {meta && <span style={META_STYLE}>{meta}</span>}
        {completed != null && <CompletionBadge completed={completed} />}
        {completed === false && onComplete && (
          <button
            type="button"
            onClick={() => setAction("complete")}
            disabled={pending}
            style={ICON_BTN}
            title={t("markAsCompleted")}
          >
            <Award size={14} />
          </button>
        )}
        {completed === true && onUncomplete && (
          <button
            type="button"
            onClick={() => setAction("uncomplete")}
            disabled={pending}
            style={ICON_BTN}
            title={t("returnToCourse")}
          >
            <RotateCcw size={14} />
          </button>
        )}
        {badge && (
          <span
            style={{
              fontFamily: "var(--font-base)",
              fontSize: "clamp(10px, 0.63vw, 12px)",
              background: "var(--color-bg)",
              border: "1px solid var(--color-border-light)",
              borderRadius: 999,
              padding: "2px 10px",
              color: "var(--color-text-secondary)",
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            {badge}
          </span>
        )}
      </div>
      {error && <p style={ERROR_STYLE}>{error}</p>}
      {action && (
        <CourseConfirmModal
          title={action === "complete" ? t("markAsCompleted") : t("returnToCourse")}
          description={
            action === "complete"
              ? t("markCompletedConfirm", { name: name || email })
              : t("returnConfirm", { name: name || email })
          }
          confirmLabel={action === "complete" ? t("complete") : t("return")}
          loading={pending}
          onConfirm={handleConfirm}
          onCancel={() => setAction(null)}
        />
      )}
    </div>
  );
}

function IndividualStudentRow({
  student,
  meta,
  slug,
  fmtId,
  onUpdated,
}: {
  student: EnrolledStudent;
  meta?: string;
  slug: string;
  fmtId: number;
  onUpdated: (updated: EnrolledStudent) => void;
}) {
  const t = useTranslations("CourseManagementStudentsBlock");
  const [editing, setEditing] = useState(false);
  const [start, setStart] = useState(toDateStr(student.access_granted_at));
  const [end, setEnd] = useState(toDateStr(student.access_until));
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [action, setAction] = useState<"complete" | "uncomplete" | null>(null);

  async function handleConfirm() {
    setCompleting(true);
    setCompleteError(null);
    try {
      if (action === "complete") {
        await completeStudentEnrollment(slug, student.enrollment_id);
        onUpdated({ ...student, is_completed: true });
      } else if (action === "uncomplete") {
        await uncompleteStudentEnrollment(slug, student.enrollment_id);
        onUpdated({ ...student, is_completed: false });
      }
      setAction(null);
    } catch (err) {
      setCompleteError((err as ApiError).message ?? t("errorGeneric"));
    } finally {
      setCompleting(false);
    }
  }

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

  const periodLabel = start ? `${fmtShort(start)} – ${end ? fmtShort(end) : "∞"}` : null;

  if (editing) {
    return (
      <div style={{ ...ROW, flexWrap: "wrap", gap: 8, alignItems: "flex-end" }}>
        <div style={{ flex: "0 0 160px", minWidth: 130 }}>
          <p style={NAME_STYLE}>{student.student_name || student.student_email}</p>
          {student.student_name && <p style={SUB_STYLE}>{student.student_email}</p>}
        </div>
        <div style={{ flex: "1 1 130px", minWidth: 110 }}>
          <DatePicker label={t("start")} value={start} onChange={setStart} size="sm" />
        </div>
        <div style={{ flex: "1 1 130px", minWidth: 110 }}>
          <DatePicker label={t("until")} value={end} onChange={setEnd} size="sm" />
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          style={{ ...SAVE_BTN, opacity: saving ? 0.5 : 1 }}
        >
          <Check size={12} /> {t("save")}
        </button>
        <button type="button" onClick={cancel} style={ICON_BTN}>
          <X size={15} />
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={ROW}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={NAME_STYLE}>{student.student_name || student.student_email}</p>
          <p style={SUB_STYLE}>
            {student.student_name ? student.student_email : ""}
            {periodLabel && (student.student_name ? "  ·  " : "")}
            {periodLabel}
          </p>
        </div>
        {meta && <span style={META_STYLE}>{meta}</span>}
        <CompletionBadge completed={student.is_completed} />
        {!student.is_completed ? (
          <button
            type="button"
            onClick={() => setAction("complete")}
            disabled={completing}
            style={ICON_BTN}
            title={t("markAsCompleted")}
          >
            <Award size={14} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setAction("uncomplete")}
            disabled={completing}
            style={ICON_BTN}
            title={t("returnToCourse")}
          >
            <RotateCcw size={14} />
          </button>
        )}
        <button
          type="button"
          onClick={() => setEditing(true)}
          style={ICON_BTN}
          title={t("editPeriod")}
        >
          <Pencil size={14} />
        </button>
      </div>
      {completeError && <p style={ERROR_STYLE}>{completeError}</p>}
      {action && (
        <CourseConfirmModal
          title={action === "complete" ? t("markAsCompleted") : t("returnToCourse")}
          description={
            action === "complete"
              ? t("markCompletedConfirm", { name: student.student_name || student.student_email })
              : t("returnConfirm", { name: student.student_name || student.student_email })
          }
          confirmLabel={action === "complete" ? t("complete") : t("return")}
          loading={completing}
          onConfirm={handleConfirm}
          onCancel={() => setAction(null)}
        />
      )}
    </div>
  );
}

/** List content for the Individual format — shows each student's scheduled days and learning period. */
export function IndividualStudentsList({
  slug,
  fmtId,
  refreshKey,
}: {
  slug: string;
  fmtId: number;
  refreshKey?: number;
}) {
  const t = useTranslations("CourseManagementStudentsBlock");
  const tDays = useTranslations("Days");
  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([getCourseEnrolledStudents(slug, fmtId), getScheduleSlots(slug, fmtId)])
      .then(([s, sl]) => {
        setStudents(s);
        setSlots(sl);
      })
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
    setStudents((prev) =>
      prev.map((s) => (s.enrollment_id === updated.enrollment_id ? updated : s)),
    );
  }

  if (loading) return <EmptyMsg text={t("loading")} />;
  if (students.length === 0) return <EmptyMsg text={t("noStudentsEnrolledYet")} />;

  return (
    <ListWrap>
      {students.map((s) => {
        const mySlots = slotsByStudent.get(s.student_id) ?? [];
        const days = [...new Set(mySlots.map((sl) => sl.day_of_week))].sort((a, b) => a - b);
        const meta =
          mySlots.length > 0
            ? `${t("sessionsCount", { count: mySlots.length })} · ${days.map((d) => tDays(DAY_KEYS[d])).join(", ")}`
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

/** List content for the Group format — shows each student with their cohort badge. */
export function GroupStudentsList({
  course,
  slug,
  onMemberCompleted,
  onMemberUncompleted,
}: {
  course: CourseDetail;
  slug: string;
  onMemberCompleted?: (enrollmentId: number) => void;
  onMemberUncompleted?: (enrollmentId: number) => void;
}) {
  const t = useTranslations("CourseManagementStudentsBlock");
  const rows = useMemo(
    () =>
      (course.cohorts ?? []).flatMap((c) =>
        (c.members ?? []).map((m) => ({ ...m, cohortName: c.name ?? t("unnamedCohort") })),
      ),
    [course.cohorts, t],
  );

  if (rows.length === 0) return <EmptyMsg text={t("noStudentsAssignedYet")} />;

  return (
    <ListWrap>
      {rows.map((r) => (
        <StudentRow
          key={r.enrollment_id}
          name={r.student_name}
          email={r.student_email}
          badge={r.cohortName}
          completed={r.is_completed}
          onComplete={
            r.is_completed
              ? undefined
              : async () => {
                  await completeStudentEnrollment(slug, r.enrollment_id);
                  onMemberCompleted?.(r.enrollment_id);
                }
          }
          onUncomplete={
            !r.is_completed
              ? undefined
              : async () => {
                  await uncompleteStudentEnrollment(slug, r.enrollment_id);
                  onMemberUncompleted?.(r.enrollment_id);
                }
          }
        />
      ))}
    </ListWrap>
  );
}

/** List content for Scheduled or Self-paced formats — plain student list. */
export function SimpleStudentsList({ slug, fmtId }: { slug: string; fmtId: number }) {
  const t = useTranslations("CourseManagementStudentsBlock");
  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCourseEnrolledStudents(slug, fmtId)
      .then(setStudents)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug, fmtId]);

  if (loading) return <EmptyMsg text={t("loading")} />;
  if (students.length === 0) return <EmptyMsg text={t("noStudentsEnrolledYet")} />;

  return (
    <ListWrap>
      {students.map((s) => (
        <StudentRow
          key={s.enrollment_id}
          name={s.student_name}
          email={s.student_email}
          completed={s.is_completed}
        />
      ))}
    </ListWrap>
  );
}
