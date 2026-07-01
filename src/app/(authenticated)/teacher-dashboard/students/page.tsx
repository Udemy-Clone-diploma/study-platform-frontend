"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { ChevronDown, Search } from "lucide-react";
import {
  getTeacherCourses,
  getCourseEnrolledStudents,
  getCohorts,
  getDeliveryFormats,
} from "@/entities/course";
import type {
  CourseListItem,
  EnrolledStudent,
  CourseCohort,
  CourseDeliveryFormat,
} from "@/entities/course";
import { DataTable } from "@/shared/ui/DataTable";
import type { DataTableColumn } from "@/shared/ui/DataTable";

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

function StudentAvatar({ name }: { name: string }) {
  const size = "clamp(32px, 2.78vw, 40px)";
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{ width: size, height: size, background: "var(--color-badge-lavender)" }}
    >
      <span
        style={{
          fontFamily: "var(--font-base)",
          fontSize: "clamp(9px, 0.69vw, 10px)",
          fontWeight: 700,
          color: "var(--color-blue-dark)",
          lineHeight: 1,
        }}
      >
        {getInitials(name)}
      </span>
    </div>
  );
}

interface PillDropdownProps {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  disabled?: boolean;
}

function PillDropdown({ value, options, onChange, disabled = false }: PillDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((p) => !p)}
        className="flex items-center gap-[10px] bg-white text-(--color-text-primary) transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
        style={{
          height: "clamp(32px, 2.78vw, 40px)",
          padding: "clamp(6px, 0.56vw, 8px) clamp(12px, 1.11vw, 16px)",
          boxShadow: "0px 0px 4px rgba(72, 70, 70, 0.16)",
          borderRadius: "clamp(16px, 1.39vw, 20px)",
          fontFamily: "var(--font-base)",
          fontSize: "clamp(13px, 1.11vw, 20px)",
          whiteSpace: "nowrap",
        }}
      >
        <span>{selected?.label ?? options[0]?.label}</span>
        <ChevronDown
          style={{
            width: "clamp(14px, 1.11vw, 16px)",
            height: "clamp(14px, 1.11vw, 16px)",
            flexShrink: 0,
            transition: "transform 0.15s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 z-50 overflow-y-auto bg-white"
          style={{
            top: "calc(100% + 6px)",
            minWidth: "clamp(160px, 14vw, 260px)",
            borderRadius: 12,
            boxShadow: "var(--shadow-sort-dropdown)",
            padding: "4px 0",
            listStyle: "none",
            margin: 0,
            maxHeight: 240,
          }}
        >
          {options.map((opt) => (
            <li key={opt.value} role="option" aria-selected={opt.value === value}>
              <button
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className="w-full text-left transition-colors hover:text-(--color-blue)"
                style={{
                  display: "block",
                  padding: "clamp(6px, 0.56vw, 8px) clamp(12px, 1.11vw, 16px)",
                  fontFamily: "var(--font-base)",
                  fontSize: "clamp(13px, 1.11vw, 18px)",
                  color: opt.value === value ? "var(--color-blue)" : "var(--color-text-primary)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const ALL_COURSES = "__all__";
const ALL_FORMATS = "__all__";
const ALL_GROUPS  = "__all__";

export default function TeacherStudentsPage() {
  const [courses, setCourses]               = useState<CourseListItem[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>(ALL_COURSES);
  const [formats, setFormats]               = useState<CourseDeliveryFormat[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<string>(ALL_FORMATS);
  const [students, setStudents]             = useState<EnrolledStudent[]>([]);
  const [cohorts, setCohorts]               = useState<CourseCohort[]>([]);
  const [selectedGroup, setSelectedGroup]   = useState<string>(ALL_GROUPS);
  const [search, setSearch]                 = useState("");
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);

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

    const loadStudents = getCourseEnrolledStudents(selectedCourse, formatId)
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
  }, [selectedCourse, selectedFormat]);

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
          <StudentAvatar name={row.student_name} />
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
      key: "performance",
      label: "Performance",
      flex: 1.5,
      cellAlign: "center",
      headerAlign: "center",
      render: () => <span className="text-(--color-text-secondary)">—</span>,
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
    <main
      className="flex flex-col bg-my-courses"
      style={{
        height: "calc(100vh - 76px)",
        overflow: "hidden",
        paddingInline: "clamp(16px, 2.78vw, 40px)",
        paddingBlock: "clamp(16px, 2.22vw, 32px)",
      }}
    >
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
            <PillDropdown
              value={selectedCourse}
              options={courseOptions}
              onChange={handleCourseChange}
              disabled={loadingCourses}
            />

            {/* Delivery format — shown only when a specific course is selected */}
            {selectedCourse !== ALL_COURSES && (
              <PillDropdown
                value={selectedFormat}
                options={formatOptions}
                onChange={handleFormatChange}
                disabled={formats.length === 0}
              />
            )}

            {/* Group — shown only when the group delivery format is active */}
            {isGroupFormat && (
              <PillDropdown
                value={selectedGroup}
                options={groupOptions}
                onChange={setSelectedGroup}
                disabled={loadingStudents || cohorts.length === 0}
              />
            )}
          </div>

          {/* Right: search */}
          <label
            className="flex cursor-text items-center gap-2 bg-white"
            style={{
              minWidth: "clamp(180px, 18vw, 320px)",
              maxWidth: 470,
              height: "clamp(36px, 3.61vw, 52px)",
              border: "1px solid var(--color-brand-lavender)",
              borderRadius: 40,
              padding: "clamp(6px, 0.69vw, 10px) clamp(12px, 1.39vw, 20px)",
            }}
          >
            <Search
              style={{
                width: "clamp(16px, 1.67vw, 24px)",
                height: "clamp(16px, 1.67vw, 24px)",
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

        {/* Table */}
        <DataTable<EnrolledStudent>
          columns={columns}
          rows={filtered}
          getRowKey={(row) => row.enrollment_id}
          emptyMessage={emptyMessage}
          scrollable
        />
      </div>
    </main>
  );
}
