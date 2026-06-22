"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Lock, LockOpen, UserMinus, UserPlus } from "lucide-react";
import {
  addCohortMember,
  getCourseEnrolledStudents,
  removeCohortMember,
  updateCohort,
} from "@/entities/course";
import type { CourseCohort } from "@/entities/course/model/cohort";
import type { CohortMember, EnrolledStudent } from "@/entities/course/model/cohortGroup";
import type { CourseDetail } from "@/entities/course";

// ── Style constants ──────────────────────────────────────────────────────────

const CARD: React.CSSProperties = {
  background: "#fff",
  borderRadius: 16,
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  padding: "clamp(16px, 1.25vw, 22px)",
};

// ── AddStudentDropdown ───────────────────────────────────────────────────────

function AddStudentDropdown({
  enrolledStudents,
  existingIds,
  onAdd,
}: {
  enrolledStudents: EnrolledStudent[];
  existingIds: Set<number>;
  onAdd: (enrollmentId: number) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  const available = enrolledStudents.filter(
    s =>
      !existingIds.has(s.enrollment_id) &&
      (s.student_name.toLowerCase().includes(search.toLowerCase()) ||
        s.student_email.toLowerCase().includes(search.toLowerCase())),
  );

  const handleAdd = async (enrollmentId: number) => {
    setAdding(enrollmentId);
    try {
      await onAdd(enrollmentId);
      setOpen(false);
      setSearch("");
    } finally {
      setAdding(null);
    }
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontFamily: "var(--font-base)", fontWeight: 600,
          fontSize: "clamp(12px, 0.8vw, 14px)", color: "var(--color-blue)",
          background: "none", border: "1px solid var(--color-blue)",
          borderRadius: 999, padding: "6px 14px", cursor: "pointer",
        }}
      >
        <UserPlus size={14} /> Add student
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 20,
          background: "#fff", borderRadius: 12,
          boxShadow: "0 4px 20px rgba(0,0,0,0.12)", width: 280, overflow: "hidden",
        }}>
          <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--color-border-light)" }}>
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              style={{
                fontFamily: "var(--font-base)", fontSize: "clamp(12px, 0.78vw, 13px)",
                color: "var(--color-text-primary)", background: "var(--color-bg)",
                borderRadius: 999, border: "1px solid var(--color-text-primary)",
                padding: "5px 12px", width: "100%", outline: "none", boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ maxHeight: 220, overflowY: "auto" }}>
            {available.length === 0 ? (
              <p style={{
                fontFamily: "var(--font-base)", fontSize: "clamp(12px, 0.78vw, 13px)",
                color: "var(--color-text-muted)", textAlign: "center", padding: "16px 12px",
              }}>
                {enrolledStudents.length === 0 ? "No enrolled students" : "No matches"}
              </p>
            ) : available.map(s => (
              <button
                key={s.enrollment_id} type="button"
                onClick={() => handleAdd(s.enrollment_id)}
                disabled={adding === s.enrollment_id}
                style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: "10px 14px", background: "none", border: "none",
                  cursor: adding === s.enrollment_id ? "not-allowed" : "pointer",
                  borderBottom: "1px solid var(--color-border-light)",
                  opacity: adding === s.enrollment_id ? 0.6 : 1,
                }}
              >
                <div style={{ fontFamily: "var(--font-base)", fontWeight: 600, fontSize: "clamp(12px, 0.8vw, 14px)", color: "var(--color-text-primary)" }}>
                  {s.student_name || "—"}
                </div>
                <div style={{ fontFamily: "var(--font-base)", fontSize: "clamp(11px, 0.72vw, 13px)", color: "var(--color-text-secondary)" }}>
                  {s.student_email}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── MemberRow ────────────────────────────────────────────────────────────────

function MemberRow({ member, onRemove }: { member: CohortMember; onRemove: (id: number) => Promise<void> }) {
  const [removing, setRemoving] = useState(false);

  const handleRemove = async () => {
    setRemoving(true);
    try { await onRemove(member.id); }
    finally { setRemoving(false); }
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "8px 12px", borderRadius: 10,
      background: "var(--color-bg)", border: "1px solid var(--color-border-light)",
    }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontFamily: "var(--font-base)", fontWeight: 600, fontSize: "clamp(12px, 0.8vw, 14px)", color: "var(--color-text-primary)" }}>
          {member.student_name || "—"}
        </span>
        <span style={{ fontFamily: "var(--font-base)", fontSize: "clamp(11px, 0.72vw, 13px)", color: "var(--color-text-secondary)" }}>
          {member.student_email}
        </span>
      </div>
      <button
        type="button" onClick={handleRemove} disabled={removing}
        style={{
          background: "none", border: "none", cursor: removing ? "not-allowed" : "pointer",
          color: "var(--color-pink-dark)", display: "flex", alignItems: "center",
          padding: 4, borderRadius: 6, opacity: removing ? 0.5 : 1,
        }}
        title="Remove from cohort"
      >
        <UserMinus size={15} />
      </button>
    </div>
  );
}

// ── CohortCard ───────────────────────────────────────────────────────────────

function CohortCard({ cohort, slug, onMembersChanged }: {
  cohort: CourseCohort;
  slug: string;
  onMembersChanged: (count: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [members, setMembers] = useState<CohortMember[]>(cohort.members ?? []);
  const [isOpen, setIsOpen] = useState(cohort.is_enrollment_open);
  const [toggling, setToggling] = useState(false);
  const [enrolled, setEnrolled] = useState<EnrolledStudent[]>([]);
  const [enrolledLoaded, setEnrolledLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const isFull = !!(cohort.group_size && members.length >= cohort.group_size);
  const canAdd = isOpen && !isFull;

  useEffect(() => {
    if (!expanded || enrolledLoaded) return;
    getCourseEnrolledStudents(slug)
      .then(s => { setEnrolled(s); setEnrolledLoaded(true); })
      .catch(() => { setLoadError("Failed to load students."); setEnrolledLoaded(true); });
  }, [expanded, enrolledLoaded, slug]);

  const existingIds = new Set(members.map(m => m.enrollment_id));

  const handleToggleOpen = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setToggling(true);
    try {
      await updateCohort(slug, cohort.id, { is_enrollment_open: !isOpen });
      setIsOpen(v => !v);
    } finally {
      setToggling(false);
    }
  };

  const handleAdd = async (enrollmentId: number) => {
    const newMember = await addCohortMember(slug, cohort.id, enrollmentId);
    setMembers(prev => {
      const next = [...prev, newMember];
      onMembersChanged(next.length);
      return next;
    });
  };

  const handleRemove = async (memberId: number) => {
    const snapshot = members.find(m => m.id === memberId);
    setMembers(prev => {
      const next = prev.filter(m => m.id !== memberId);
      onMembersChanged(next.length);
      return next;
    });
    try {
      await removeCohortMember(slug, cohort.id, memberId);
    } catch {
      if (snapshot) setMembers(prev => {
        const restored = [...prev, snapshot];
        onMembersChanged(restored.length);
        return restored;
      });
    }
  };

  const meta: string[] = [];
  if (cohort.start_date) meta.push(`Starts ${cohort.start_date}`);
  if (cohort.enrollment_deadline) meta.push(`Enroll by ${cohort.enrollment_deadline}`);
  if (cohort.duration_months) meta.push(`${cohort.duration_months} mo`);
  if (cohort.hours_per_week) meta.push(`${cohort.hours_per_week} h/wk`);

  const statusColor = isFull ? "var(--color-text-muted)" : isOpen ? "var(--color-success)" : "var(--color-rejected)";
  const statusLabel = isFull ? "Full" : isOpen ? "Open" : "Closed";

  return (
    <div style={CARD}>
      <div
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
        onClick={() => setExpanded(v => !v)}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: "var(--font-base)", fontWeight: 700, fontSize: "clamp(14px, 0.97vw, 18px)", color: "var(--color-text-primary)" }}>
              {cohort.name || "Unnamed cohort"}
            </span>
            <span style={{ fontFamily: "var(--font-base)", fontSize: "clamp(10px, 0.63vw, 12px)", fontWeight: 600, color: statusColor }}>
              {statusLabel}
            </span>
          </div>
          {meta.length > 0 && (
            <span style={{ fontFamily: "var(--font-base)", fontSize: "clamp(12px, 0.78vw, 14px)", color: "var(--color-text-secondary)" }}>
              {meta.join(" · ")}
            </span>
          )}
          <span style={{ fontFamily: "var(--font-base)", fontSize: "clamp(11px, 0.72vw, 13px)", color: "var(--color-text-muted)" }}>
            {members.length} student{members.length !== 1 ? "s" : ""}
            {cohort.group_size ? ` / ${cohort.group_size}` : ""}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            type="button"
            onClick={handleToggleOpen}
            disabled={toggling || isFull}
            title={isFull ? "Group is full" : isOpen ? "Close enrollment" : "Open enrollment"}
            style={{
              background: "none", border: "none", padding: 4, borderRadius: 6,
              cursor: toggling || isFull ? "not-allowed" : "pointer",
              color: isOpen && !isFull ? "var(--color-success)" : "var(--color-text-muted)",
              display: "flex", alignItems: "center", opacity: toggling ? 0.5 : 1,
            }}
          >
            {isOpen && !isFull ? <LockOpen size={15} /> : <Lock size={15} />}
          </button>
          <ChevronDown
            size={18}
            style={{
              color: "var(--color-text-secondary)", flexShrink: 0,
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.15s",
            }}
          />
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ height: 1, background: "var(--color-border-light)" }} />

          {loadError && (
            <p style={{ fontFamily: "var(--font-base)", fontSize: "clamp(12px, 0.78vw, 14px)", color: "var(--color-pink-dark)" }}>
              {loadError}
            </p>
          )}

          {members.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {members.map(m => (
                <MemberRow key={m.id} member={m} onRemove={handleRemove} />
              ))}
            </div>
          ) : (
            <p style={{ fontFamily: "var(--font-base)", fontSize: "clamp(12px, 0.78vw, 14px)", color: "var(--color-text-muted)" }}>
              No students yet
            </p>
          )}

          {!canAdd && (
            <p style={{ fontFamily: "var(--font-base)", fontSize: "clamp(11px, 0.72vw, 13px)", color: "var(--color-text-muted)", fontStyle: "italic" }}>
              {isFull ? "Group is full" : "Enrollment is closed"}
            </p>
          )}

          {canAdd && enrolledLoaded && (
            <AddStudentDropdown
              enrolledStudents={enrolled}
              existingIds={existingIds}
              onAdd={handleAdd}
            />
          )}

          {canAdd && !enrolledLoaded && !loadError && (
            <p style={{ fontFamily: "var(--font-base)", fontSize: "clamp(12px, 0.78vw, 14px)", color: "var(--color-text-muted)" }}>
              Loading students…
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

/** Teacher cohort manager: expand a cohort to see and manage its students. */
export function CourseManagementCohortsTab({
  course,
  slug,
  onCohortsChanged,
}: {
  course: CourseDetail;
  slug: string;
  onCohortsChanged?: (cohorts: CourseCohort[]) => void;
}) {
  const [cohorts, setCohorts] = useState<CourseCohort[]>(course.cohorts ?? []);

  function handleMembersChanged(cohortId: number, count: number) {
    setCohorts(prev => {
      const next = prev.map(c =>
        c.id === cohortId ? { ...c, members_count: count } : c,
      );
      onCohortsChanged?.(next);
      return next;
    });
  }

  if (cohorts.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "clamp(160px, 14vw, 220px)", gap: 8 }}>
        <p style={{ fontFamily: "var(--font-base)", fontSize: "clamp(14px, 0.97vw, 18px)", fontWeight: 600, color: "var(--color-text-primary)" }}>
          No cohorts yet
        </p>
        <p style={{ fontFamily: "var(--font-base)", fontSize: "clamp(12px, 0.83vw, 15px)", color: "var(--color-text-secondary)", textAlign: "center", maxWidth: 360 }}>
          Add a cohort in the Format &amp; Price tab, then come back to assign students.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {cohorts.map(cohort => (
        <CohortCard
          key={cohort.id}
          cohort={cohort}
          slug={slug}
          onMembersChanged={count => handleMembersChanged(cohort.id, count)}
        />
      ))}
    </div>
  );
}
