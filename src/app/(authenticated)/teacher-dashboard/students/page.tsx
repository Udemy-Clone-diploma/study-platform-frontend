"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Award, Search } from "lucide-react";
import { PageShell } from "@/shared/ui/PageShell";
import { PillSelect } from "@/shared/ui/PillSelect";
import {
  getTeacherCourses,
  getCourseEnrolledStudents,
  getCohorts,
  getDeliveryFormats,
  completeStudentEnrollment,
} from "@/entities/course";
import type {
  CourseListItem,
  EnrolledStudent,
  CourseCohort,
  CourseDeliveryFormat,
} from "@/entities/course";
import { DataTable } from "@/shared/ui/DataTable";
import type { DataTableColumn } from "@/shared/ui/DataTable";
import { CompletionBadge } from "@/features/courses/ui/CourseManagementStudentsBlock";
import { CourseConfirmModal } from "@/features/courses/ui/CourseConfirmModal";
import type { ApiError } from "@/shared/api/base";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatEntryDate(iso: string): string {
  const d = new Date(iso);
  return [
    String(d.getDate()).padStart(2, "0"),
    String(d.getMonth() + 1).padStart(2, "0"),
    d.getFullYear(),
  ].join(".");
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

function cohortLabel(cohort: CourseCohort, index: number): string {
  return cohort.name ?? `Group ${index + 1}`;
}

const FORMAT_LABELS: Record<string, string> = {
  self_paced:  "Self-paced",
  scheduled:   "Scheduled",
  individual:  "Individual",
  group:       "Group",
};

// ── Local sub-components ──────────────────────────────────────────────────────

function StudentAvatar({ name, avatar }: { name: string; avatar?: string | null }) {
  const size = "clamp(32px, 2.78vw, 40px)";
  if (avatar) return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={avatar} alt={name} className="shrink-0 rounded-full" style={{ width: size, height: size, objectFit: "cover" }} />
  );
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{ width: size, height: size, background: "var(--gradient-brand)" }}
    >
      <span style={{ fontFamily: "var(--font-accent)", fontWeight: 700, fontSize: "clamp(9px, 0.69vw, 11px)", color: "var(--color-text-primary)", lineHeight: 1 }}>
        {getInitials(name)}
      </span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const ALL_COURSES = "__all__";
const ALL_FORMATS = "__all__";
const ALL_GROUPS  = "__all__";
const ALL_STATUSES = "__all__";

const STATUS_OPTIONS = [
  { value: ALL_STATUSES, label: "All" },
  { value: "active",     label: "Studying" },
  { value: "completed",  label: "Completed" },
];

export default function TeacherStudentsPage() {
  const [courses, setCourses]               = useState<CourseListItem[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>(ALL_COURSES);
  const [formats, setFormats]               = useState<CourseDeliveryFormat[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<string>(ALL_FORMATS);
  const [students, setStudents]             = useState<EnrolledStudent[]>([]);
  const [cohorts, setCohorts]               = useState<CourseCohort[]>([]);
  const [selectedGroup, setSelectedGroup]   = useState<string>(ALL_GROUPS);
  const [selectedStatus, setSelectedStatus] = useState<string>(ALL_STATUSES);
  const [search, setSearch]                 = useState("");
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [confirmingId, setConfirmingId]     = useState<number | null>(null);
  const [completing, setCompleting]         = useState(false);
  const [completeError, setCompleteError]   = useState<string | null>(null);

  // Tracks the last course for which formats + cohorts were fetched, to avoid
  // re-fetching them when only the format selection changes.
  const metaFetchedFor = useRef<string>("");

  // Load teacher's courses once on mount
  useEffect(() => {
    getTeacherCourses()
      .then((res) => {
        setCourses(res.results);
        if (res.results.length > 0) setSelectedCourse(res.results[0].slug);
      })
      .catch(() => {})
      .finally(() => setLoadingCourses(false));
  }, []);

  // Fetch students (and, on first load of a course, also formats + cohorts).
  // Resets are done in the course-change handler so all state is in sync before
  // this effect fires — no nested setState / double-trigger issues.
  useEffect(() => {
    if (!selectedCourse || selectedCourse === ALL_COURSES) {
      setStudents([]);
      setFormats([]);
      setCohorts([]);
      metaFetchedFor.current = "";
      return;
    }

    let cancelled = false;
    setLoadingStudents(true);

    const formatId = selectedFormat !== ALL_FORMATS ? Number(selectedFormat) : undefined;
    const status = selectedStatus !== ALL_STATUSES ? (selectedStatus as "active" | "completed") : undefined;

    const loadStudents = getCourseEnrolledStudents(selectedCourse, formatId, status)
      .then(enrolled  => { if (!cancelled) setStudents(enrolled); })
      .catch(()       => { if (!cancelled) setStudents([]); })
      .finally(()     => { if (!cancelled) setLoadingStudents(false); });

    // Only fetch formats + cohorts the first time we see this course slug.
    if (metaFetchedFor.current !== selectedCourse) {
      metaFetchedFor.current = selectedCourse;
      getDeliveryFormats(selectedCourse)
        .then(fmts  => { if (!cancelled) setFormats(fmts); })
        .catch(()   => { if (!cancelled) setFormats([]); });
      getCohorts(selectedCourse)
        .then(grps  => { if (!cancelled) setCohorts(grps); })
        .catch(()   => { if (!cancelled) setCohorts([]); });
    }

    void loadStudents;
    return () => { cancelled = true; };
  }, [selectedCourse, selectedFormat, selectedStatus]);

  // Which delivery format type is currently active (null when "All formats")
  const selectedFormatType =
    formats.find((f) => String(f.id) === selectedFormat)?.format_type ?? null;
  const isGroupFormat = selectedFormatType === "group";

  // enrollment_id → cohort label
  const enrollmentToGroup = useMemo<Map<number, string>>(() => {
    const map = new Map<number, string>();
    cohorts.forEach((c, idx) => {
      const label = cohortLabel(c, idx);
      (c.members ?? []).forEach((m) => map.set(m.enrollment_id, label));
    });
    return map;
  }, [cohorts]);

  // Cohort member ids for the selected group (only active in group format)
  const groupMemberIds = useMemo<Set<number> | null>(() => {
    if (!isGroupFormat || selectedGroup === ALL_GROUPS) return null;
    const cohort = cohorts.find((c) => String(c.id) === selectedGroup);
    if (!cohort) return null;
    return new Set((cohort.members ?? []).map((m) => m.enrollment_id));
  }, [cohorts, selectedGroup, isGroupFormat]);

  // ── Options ──────────────────────────────────────────────────────────────────

  const courseOptions = [
    { value: ALL_COURSES, label: "All courses" },
    ...courses.map((c) => ({ value: c.slug, label: c.title })),
  ];

  const formatOptions = [
    { value: ALL_FORMATS, label: "All formats" },
    ...formats.map((f) => ({
      value: String(f.id),
      label: FORMAT_LABELS[f.format_type] ?? f.format_type,
    })),
  ];

  const groupOptions = [
    { value: ALL_GROUPS, label: "All groups" },
    ...cohorts.map((c, idx) => ({ value: String(c.id), label: cohortLabel(c, idx) })),
  ];

  // ── Handlers ─────────────────────────────────────────────────────────────────

  function handleCourseChange(slug: string) {
    // Reset child selections synchronously so the effect fires with clean state
    setSelectedGroup(ALL_GROUPS);
    setSelectedFormat(ALL_FORMATS);
    metaFetchedFor.current = ""; // Force re-fetch of formats + cohorts for new course
    setSelectedCourse(slug);
  }

  function handleFormatChange(fmtId: string) {
    setSelectedGroup(ALL_GROUPS);
    setSelectedFormat(fmtId);
  }

  async function handleComplete(enrollmentId: number) {
    setCompleting(true);
    setCompleteError(null);
    try {
      await completeStudentEnrollment(selectedCourse, enrollmentId);
      setStudents((prev) =>
        prev.map((s) => (s.enrollment_id === enrollmentId ? { ...s, is_completed: true } : s)),
      );
      setConfirmingId(null);
    } catch (err) {
      setCompleteError((err as ApiError).message ?? "Failed to mark as completed.");
    } finally {
      setCompleting(false);
    }
  }

  // ── Derived ──────────────────────────────────────────────────────────────────

  const filtered = students.filter((s) => {
    if (groupMemberIds && !groupMemberIds.has(s.enrollment_id)) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !s.student_name.toLowerCase().includes(q) &&
        !s.student_email.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  const columns: DataTableColumn<EnrolledStudent>[] = [
    {
      key: "student",
      label: "Student",
      flex: 3,
      render: (row) => (
        <div className="flex items-center" style={{ gap: "clamp(8px, 0.83vw, 12px)" }}>
          <StudentAvatar name={row.student_name} avatar={row.student_avatar} />
          <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
            {row.student_name}
          </span>
        </div>
      ),
    },
    {
      key: "group",
      label: "Group",
      flex: 1.5,
      cellAlign: "center",
      headerAlign: "center",
      render: (row) => (
        <span>
          {enrollmentToGroup.get(row.enrollment_id)
            ?? (row.format_type ? (FORMAT_LABELS[row.format_type] ?? row.format_type) : "—")}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      flex: 1.4,
      cellAlign: "center",
      headerAlign: "center",
      render: (row) => <CompletionBadge completed={row.is_completed} />,
    },
    {
      key: "complete_action",
      label: "",
      flex: 0.6,
      cellAlign: "center",
      headerAlign: "center",
      render: (row) =>
        !row.is_completed && (row.format_type === "individual" || row.format_type === "group") ? (
          <button
            type="button"
            onClick={() => { setCompleteError(null); setConfirmingId(row.enrollment_id); }}
            title="Mark as completed"
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: 4, display: "inline-flex", alignItems: "center",
              color: "var(--color-text-secondary)",
            }}
          >
            <Award size={14} />
          </button>
        ) : null,
    },
    {
      key: "performance",
      label: "Performance",
      flex: 1.5,
      cellAlign: "center",
      headerAlign: "center",
      render: (row) => (
        <span>{row.progress_percent > 0 ? `${row.progress_percent}%` : "—"}</span>
      ),
    },
    {
      key: "entry_date",
      label: "Entry Date",
      flex: 1.5,
      cellAlign: "center",
      headerAlign: "center",
      render: (row) => <span>{formatEntryDate(row.access_granted_at)}</span>,
    },
    {
      key: "email",
      label: "Gmail",
      flex: 2,
      cellAlign: "center",
      headerAlign: "center",
      render: (row) => (
        <span className="overflow-hidden text-ellipsis whitespace-nowrap">
          {row.student_email}
        </span>
      ),
    },
  ];

  const emptyMessage =
    selectedCourse === ALL_COURSES
      ? "Select a course to view its students."
      : loadingStudents
        ? "Loading students…"
        : "No students enrolled in this course.";

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <PageShell className="bg-my-courses" fixedHeight>
      <div style={{ maxWidth: "1648px", margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
        {/* Top bar */}
        <div
          className="flex flex-wrap items-center justify-between gap-4 shrink-0"
          style={{ marginBottom: "clamp(16px, 1.67vw, 24px)" }}
        >
          {/* Left: title + dropdowns */}
          <div className="flex flex-wrap items-center" style={{ gap: "clamp(12px, 1.67vw, 24px)" }}>
            <h1
              className="font-semibold text-(--color-text-primary)"
              style={{
                fontFamily: "var(--font-base)",
                fontSize: "clamp(18px, 1.67vw, 24px)",
                whiteSpace: "nowrap",
              }}
            >
              Students
            </h1>

            {/* Course */}
            <PillSelect
              value={selectedCourse}
              options={courseOptions}
              onChange={handleCourseChange}
              disabled={loadingCourses}
            />

            {/* Delivery format — shown only when a specific course is selected */}
            {selectedCourse !== ALL_COURSES && (
              <PillSelect
                value={selectedFormat}
                options={formatOptions}
                onChange={handleFormatChange}
                disabled={formats.length === 0}
              />
            )}

            {/* Group — shown only when the group delivery format is active */}
            {isGroupFormat && (
              <PillSelect
                value={selectedGroup}
                options={groupOptions}
                onChange={setSelectedGroup}
                disabled={loadingStudents || cohorts.length === 0}
              />
            )}

            {/* Status — shown only when a specific course is selected */}
            {selectedCourse !== ALL_COURSES && (
              <PillSelect
                value={selectedStatus}
                options={STATUS_OPTIONS}
                onChange={setSelectedStatus}
              />
            )}
          </div>

          {/* Right: search */}
          <label
            className="flex cursor-text items-center gap-2 bg-white"
            style={{
              minWidth: "clamp(180px, 18vw, 320px)",
              maxWidth: 470,
              height: "clamp(32px, 2.78vw, 40px)",
              border: "1px solid var(--color-brand-lavender)",
              borderRadius: 40,
              padding: "clamp(6px, 0.56vw, 8px) clamp(12px, 1.11vw, 16px)",
            }}
          >
            <Search
              style={{
                width: "clamp(14px, 1.39vw, 20px)",
                height: "clamp(14px, 1.39vw, 20px)",
                color: "var(--color-brand-lavender)",
                flexShrink: 0,
              }}
            />
            <input
              type="search"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="min-w-0 flex-1 bg-transparent outline-none"
              style={{
                fontFamily: "var(--font-base)",
                fontSize: "clamp(13px, 1.11vw, 20px)",
                color: "var(--color-text-primary)",
              }}
            />
          </label>
        </div>

        {completeError && (
          <p
            style={{
              fontFamily: "var(--font-base)", fontSize: "clamp(12px, 0.83vw, 14px)",
              color: "var(--color-danger)", margin: "0 0 8px",
            }}
          >
            {completeError}
          </p>
        )}

        {/* Table */}
        <DataTable<EnrolledStudent>
          columns={columns}
          rows={filtered}
          getRowKey={(row) => row.enrollment_id}
          emptyMessage={emptyMessage}
          scrollable
        />
      </div>

      {confirmingId !== null && (
        <CourseConfirmModal
          title="Mark as completed"
          description={`Mark ${
            students.find((s) => s.enrollment_id === confirmingId)?.student_name ?? "this student"
          } as completed?`}
          confirmLabel="Complete"
          loading={completing}
          onConfirm={() => handleComplete(confirmingId)}
          onCancel={() => setConfirmingId(null)}
        />
      )}
    </PageShell>
  );
}
