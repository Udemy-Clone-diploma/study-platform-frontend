"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import {
  getTeacherCourses,
  getCohorts,
  getSessionDates,
  getCohortAttendance,
  markAttendance,
  getIndividualEnrollments,
  getEnrollmentSessionDates,
  getEnrollmentAttendance,
  markEnrollmentAttendance,
} from "@/entities/course";
import type {
  CourseListItem,
  CourseCohort,
  AttendanceRecord,
  IndividualEnrollment,
} from "@/entities/course";
import { DataTable } from "@/shared/ui/DataTable";
import type { DataTableColumn } from "@/shared/ui/DataTable";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name.split(" ").slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase();
}

function toIso(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function todayIso(): string {
  const t = new Date();
  return toIso(t.getFullYear(), t.getMonth() + 1, t.getDate());
}

function formatDateDisplay(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

// ── Types ─────────────────────────────────────────────────────────────────────

type Mode = "group" | "individual";

const FORMAT_OPTIONS: { value: Mode; label: string }[] = [
  { value: "group", label: "Group" },
  { value: "individual", label: "Individual" },
];

// ── PillDropdown ──────────────────────────────────────────────────────────────

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

// ── MiniCalendar ──────────────────────────────────────────────────────────────

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface MiniCalendarProps {
  selectedDate: string | null;
  sessionDates: Set<string>;
  onSelect: (iso: string) => void;
  onMonthChange: (year: number, month: number) => void;
  year: number;
  month: number;
}

function MiniCalendar({ selectedDate, sessionDates, onSelect, onMonthChange, year, month }: MiniCalendarProps) {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = todayIso();

  // 6-week grid (42 cells) — same approach as DatePicker
  const cells = Array.from({ length: 42 }, (_, i) => {
    const offset = i - firstDay;
    if (offset < 0 || offset >= daysInMonth) return null;
    return offset + 1;
  });

  function prev() {
    const d = month === 1 ? { y: year - 1, m: 12 } : { y: year, m: month - 1 };
    onMonthChange(d.y, d.m);
  }
  function next() {
    const d = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };
    onMonthChange(d.y, d.m);
  }

  const navBtn: React.CSSProperties = {
    display: "flex", alignItems: "center", justifyContent: "center",
    width: 28, height: 28, borderRadius: "50%",
    background: "none", border: "none", cursor: "pointer", color: "#111",
  };

  return (
    <div style={{ userSelect: "none" }}>
      {/* Month nav — matches DatePicker style */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <button type="button" onClick={prev} aria-label="Previous month" style={navBtn}>
          <ChevronLeft style={{ width: 14, height: 14 }} />
        </button>
        <span style={{ fontFamily: "var(--font-base)", fontWeight: 600, fontSize: "clamp(13px, 0.9vw, 15px)", color: "#111" }}>
          {MONTH_NAMES[month - 1]} {year}
        </span>
        <button type="button" onClick={next} aria-label="Next month" style={navBtn}>
          <ChevronRight style={{ width: 14, height: 14 }} />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px 0", textAlign: "center", marginBottom: 2 }}>
        {WEEKDAYS.map((d) => (
          <span key={d} style={{ fontFamily: "var(--font-base)", fontSize: "0.75rem", fontWeight: 500, color: "#666" }}>
            {d}
          </span>
        ))}
      </div>

      {/* Day grid — circular cells */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px 0", textAlign: "center" }}>
        {cells.map((day, idx) => {
          if (!day) return <div key={`e${idx}`} style={{ height: 32 }} />;
          const iso = toIso(year, month, day);
          const hasSession = sessionDates.has(iso);
          const isSelected = iso === selectedDate;
          const isClickable = hasSession && iso <= today;
          const isFuture   = hasSession && iso > today;

          const GRAD = "linear-gradient(135deg, #a7bafa, #fcc4c3, #fff4da)";

          let bg: string;
          let border: string;
          let color: string;
          let shadow: string;

          if (!hasSession) {
            bg = "none"; border = "none";
            color = "#bbb"; shadow = "none";
          } else if (isSelected) {
            bg = GRAD; border = "none";
            color = "#fff"; shadow = "0 4px 14px rgba(167,186,250,0.45)";
          } else if (isFuture) {
            // gradient border + grey fill
            bg = `linear-gradient(#efefef, #efefef) padding-box, ${GRAD} border-box`;
            border = "1.5px solid transparent";
            color = "#999"; shadow = "none";
          } else {
            // clickable (past or today) — gradient border, white fill
            bg = `linear-gradient(#fff, #fff) padding-box, ${GRAD} border-box`;
            border = "1.5px solid transparent";
            color = "var(--color-blue-dark)"; shadow = "none";
          }

          return (
            <button
              key={iso}
              type="button"
              onClick={() => { if (isClickable) onSelect(iso); }}
              style={{
                margin: "0 auto",
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 32, height: 32, borderRadius: "50%",
                fontFamily: "var(--font-base)",
                fontSize: "0.875rem",
                fontWeight: isSelected ? 700 : 400,
                cursor: isClickable ? "pointer" : "default",
                background: bg,
                border,
                color,
                boxShadow: shadow,
                opacity: hasSession ? 1 : 0.35,
                transition: "background 0.12s",
              }}
              onMouseEnter={e => {
                if (!isSelected && isClickable)
                  (e.currentTarget as HTMLButtonElement).style.background =
                    `linear-gradient(#eef0ff, #eef0ff) padding-box, ${GRAD} border-box`;
              }}
              onMouseLeave={e => {
                if (!isSelected)
                  (e.currentTarget as HTMLButtonElement).style.background = bg;
              }}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── CalendarDropdown ──────────────────────────────────────────────────────────

interface CalendarDropdownProps extends MiniCalendarProps {
  disabled?: boolean;
}

function CalendarDropdown({ disabled = false, ...calProps }: CalendarDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  function handleSelect(iso: string) {
    calProps.onSelect(iso);
    setOpen(false);
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((p) => !p)}
        className="flex items-center bg-white text-(--color-text-primary) transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
        style={{
          height: "clamp(32px, 2.78vw, 40px)",
          padding: "clamp(6px, 0.56vw, 8px) clamp(12px, 1.11vw, 16px)",
          boxShadow: "0px 0px 4px rgba(72, 70, 70, 0.16)",
          borderRadius: "clamp(16px, 1.39vw, 20px)",
          fontFamily: "var(--font-base)",
          fontSize: "clamp(13px, 1.11vw, 16px)",
          whiteSpace: "nowrap",
          gap: 8,
        }}
      >
        <Calendar
          style={{
            width: "clamp(14px, 1.11vw, 16px)",
            height: "clamp(14px, 1.11vw, 16px)",
            flexShrink: 0,
            color: "var(--color-blue)",
          }}
        />
        <span>
          {calProps.selectedDate ? formatDateDisplay(calProps.selectedDate) : "Select date"}
        </span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            zIndex: 50,
            width: "min(88vw, 300px)",
            background: "#fff",
            borderRadius: 18,
            border: "1px solid #dbe5ff",
            boxShadow: "0 16px 42px rgba(83,98,153,0.20)",
            padding: 16,
          }}
        >
          <MiniCalendar {...calProps} onSelect={handleSelect} />
        </div>
      )}
    </div>
  );
}

// ── StudentAvatar ─────────────────────────────────────────────────────────────

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

// ── AttendanceCheckbox ────────────────────────────────────────────────────────

interface AttendanceCheckboxProps {
  checked: boolean;
  disabled: boolean;
  onChange: (v: boolean) => void;
}

function AttendanceCheckbox({ checked, disabled, onChange }: AttendanceCheckboxProps) {
  return (
    <div className="flex justify-center">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className="flex items-center justify-center rounded transition-colors disabled:cursor-not-allowed disabled:opacity-40"
        style={{
          width: 20,
          height: 20,
          border: `2px solid ${checked ? "var(--color-blue)" : "var(--color-text-secondary)"}`,
          background: checked ? "var(--color-blue)" : "transparent",
          flexShrink: 0,
        }}
        aria-checked={checked}
        role="checkbox"
      >
        {checked && (
          <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
            <path
              d="M1 4L4.5 7.5L11 1"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TeacherAttendancePage() {
  const now = new Date();

  const [courses, setCourses]               = useState<CourseListItem[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [loadingCourses, setLoadingCourses] = useState(true);

  const [mode, setMode] = useState<Mode>("group");

  const [cohorts, setCohorts]               = useState<CourseCohort[]>([]);
  const [selectedCohort, setSelectedCohort] = useState<string>("");

  const [individuals, setIndividuals]               = useState<IndividualEnrollment[]>([]);
  const [selectedEnrollment, setSelectedEnrollment] = useState<string>("");

  const [calYear, setCalYear]   = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth() + 1);
  const [sessionDates, setSessionDates] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [records, setRecords]       = useState<AttendanceRecord[]>([]);
  const [attendance, setAttendance] = useState<Map<number, boolean>>(new Map());
  const [loadingRecords, setLoadingRecords] = useState(false);

  // Tracks which course+mode combo was last fetched to avoid redundant requests
  const metaFetchedFor = useRef<string>("");

  // ── Load courses ───────────────────────────────────────────────────────────
  useEffect(() => {
    getTeacherCourses()
      .then((res) => {
        setCourses(res.results);
        if (res.results.length > 0) setSelectedCourse(res.results[0].slug);
      })
      .catch(() => {})
      .finally(() => setLoadingCourses(false));
  }, []);

  // ── Load cohorts (group mode) ──────────────────────────────────────────────
  useEffect(() => {
    if (!selectedCourse || mode !== "group") return;
    const key = `${selectedCourse}:group`;
    if (metaFetchedFor.current === key) return;
    metaFetchedFor.current = key;
    getCohorts(selectedCourse)
      .then((list) => {
        setCohorts(list);
        setSelectedCohort(list.length > 0 ? String(list[0].id) : "");
      })
      .catch(() => { setCohorts([]); setSelectedCohort(""); });
  }, [selectedCourse, mode]);

  // ── Load individual enrollments ────────────────────────────────────────────
  useEffect(() => {
    if (!selectedCourse || mode !== "individual") return;
    const key = `${selectedCourse}:individual`;
    if (metaFetchedFor.current === key) return;
    metaFetchedFor.current = key;
    getIndividualEnrollments(selectedCourse)
      .then((list) => {
        setIndividuals(list);
        setSelectedEnrollment(list.length > 0 ? String(list[0].enrollment_id) : "");
      })
      .catch(() => { setIndividuals([]); setSelectedEnrollment(""); });
  }, [selectedCourse, mode]);

  // ── Load session dates ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedCourse) return;
    const canFetch =
      (mode === "group" && !!selectedCohort) ||
      (mode === "individual" && !!selectedEnrollment);
    if (!canFetch) return;

    let cancelled = false;
    const req =
      mode === "group"
        ? getSessionDates(selectedCourse, Number(selectedCohort), calYear, calMonth)
        : getEnrollmentSessionDates(selectedCourse, Number(selectedEnrollment), calYear, calMonth);

    req
      .then((dates) => {
        if (cancelled) return;
        const s = new Set(dates);
        setSessionDates(s);
        if (selectedDate && !s.has(selectedDate)) setSelectedDate(null);
      })
      .catch(() => { if (!cancelled) setSessionDates(new Set()); });
    return () => { cancelled = true; };
  }, [selectedCourse, mode, selectedCohort, selectedEnrollment, calYear, calMonth]);

  // ── Load attendance ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedCourse || !selectedDate) { setRecords([]); return; }
    const canFetch =
      (mode === "group" && !!selectedCohort) ||
      (mode === "individual" && !!selectedEnrollment);
    if (!canFetch) { setRecords([]); return; }

    let cancelled = false;
    setLoadingRecords(true);
    const req =
      mode === "group"
        ? getCohortAttendance(selectedCourse, Number(selectedCohort), selectedDate)
        : getEnrollmentAttendance(selectedCourse, Number(selectedEnrollment), selectedDate);

    req
      .then((data) => {
        if (cancelled) return;
        setRecords(data);
        setAttendance(new Map(data.map((r) => [r.enrollment_id, r.is_present])));
      })
      .catch(() => { if (!cancelled) setRecords([]); })
      .finally(() => { if (!cancelled) setLoadingRecords(false); });
    return () => { cancelled = true; };
  }, [selectedCourse, mode, selectedCohort, selectedEnrollment, selectedDate]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  function resetCalToToday() {
    const t = new Date();
    setCalYear(t.getFullYear());
    setCalMonth(t.getMonth() + 1);
  }

  const handleCourseChange = useCallback((slug: string) => {
    metaFetchedFor.current = "";
    setSelectedCourse(slug);
    setCohorts([]); setSelectedCohort("");
    setIndividuals([]); setSelectedEnrollment("");
    setSessionDates(new Set()); setSelectedDate(null); setRecords([]);
    resetCalToToday();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleModeChange = useCallback((m: string) => {
    metaFetchedFor.current = "";
    setMode(m as Mode);
    setSelectedCohort(""); setSelectedEnrollment("");
    setSessionDates(new Set()); setSelectedDate(null); setRecords([]);
    resetCalToToday();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCohortChange = useCallback((id: string) => {
    setSelectedCohort(id);
    setSessionDates(new Set()); setSelectedDate(null); setRecords([]);
    resetCalToToday();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEnrollmentChange = useCallback((id: string) => {
    setSelectedEnrollment(id);
    setSessionDates(new Set()); setSelectedDate(null); setRecords([]);
    resetCalToToday();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMonthChange = useCallback((y: number, m: number) => {
    setCalYear(y); setCalMonth(m);
  }, []);

  const handleToggleAttendance = useCallback(async (enrollmentId: number, isPresent: boolean) => {
    if (!selectedDate || !selectedCourse) return;
    setAttendance((prev) => new Map(prev).set(enrollmentId, isPresent));
    try {
      if (mode === "group") {
        await markAttendance(selectedCourse, Number(selectedCohort), selectedDate, enrollmentId, isPresent);
      } else {
        await markEnrollmentAttendance(selectedCourse, enrollmentId, selectedDate, isPresent);
      }
    } catch {
      setAttendance((prev) => new Map(prev).set(enrollmentId, !isPresent));
    }
  }, [selectedCourse, mode, selectedCohort, selectedDate]);

  // ── Dropdown options ───────────────────────────────────────────────────────
  const courseOptions = courses.map((c) => ({ value: c.slug, label: c.title }));
  const cohortOptions = cohorts.map((c, i) => ({
    value: String(c.id),
    label: c.name ?? `Group ${i + 1}`,
  }));
  const enrollmentOptions = individuals.map((e) => ({
    value: String(e.enrollment_id),
    label: e.student_name,
  }));

  const isCalDisabled =
    !selectedCourse ||
    (mode === "group" && !selectedCohort) ||
    (mode === "individual" && !selectedEnrollment);

  const hasSession = records[0]?.has_session ?? false;

  // ── Columns ────────────────────────────────────────────────────────────────
  const columns: DataTableColumn<AttendanceRecord>[] = [
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
      key: "attendance",
      label: "Attendance",
      flex: 1,
      cellAlign: "center",
      headerAlign: "center",
      render: (row) => (
        <AttendanceCheckbox
          checked={attendance.get(row.enrollment_id) ?? false}
          disabled={!hasSession || !selectedDate}
          onChange={(v) => void handleToggleAttendance(row.enrollment_id, v)}
        />
      ),
    },
    {
      key: "monthly",
      label: "Attendance (month)",
      flex: 1.5,
      cellAlign: "center",
      headerAlign: "center",
      render: (row) => (
        <span>{row.monthly_attendance_percent > 0 ? `${row.monthly_attendance_percent}%` : "—"}</span>
      ),
    },
    {
      key: "total",
      label: "Attendance (total)",
      flex: 1.5,
      cellAlign: "center",
      headerAlign: "center",
      render: (row) => (
        <span>{row.total_attendance_percent > 0 ? `${row.total_attendance_percent}%` : "—"}</span>
      ),
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
  ];

  const emptyMessage = !selectedDate
    ? "Select a session date."
    : loadingRecords
      ? "Loading…"
      : mode === "group"
        ? "No students in this group."
        : "No session for this student on the selected date.";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <main
      className="flex flex-col bg-my-courses"
      style={{
        height: "calc(100vh - 76px)",
        overflow: "hidden",
        paddingLeft: "clamp(40px, calc(-110px + 10.42vw), 90px)",
        paddingRight: "clamp(40px, calc(-110px + 10.42vw), 90px)",
        paddingBlock: "clamp(16px, 2.22vw, 32px)",
      }}
    >
      <div
        style={{
          maxWidth: "1648px",
          margin: "0 auto",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* Top bar */}
        <div
          className="flex flex-wrap items-center justify-between gap-4 shrink-0"
          style={{ marginBottom: "clamp(16px, 1.67vw, 24px)" }}
        >
          {/* Left: title + selectors */}
          <div className="flex flex-wrap items-center" style={{ gap: "clamp(12px, 1.67vw, 24px)" }}>
            <h1
              className="font-semibold text-(--color-text-primary)"
              style={{
                fontFamily: "var(--font-base)",
                fontSize: "clamp(18px, 1.67vw, 24px)",
                whiteSpace: "nowrap",
              }}
            >
              Attendance
            </h1>
            {courseOptions.length > 0 && (
              <PillDropdown
                value={selectedCourse}
                options={courseOptions}
                onChange={handleCourseChange}
                disabled={loadingCourses}
              />
            )}
            <PillDropdown
              value={mode}
              options={FORMAT_OPTIONS}
              onChange={handleModeChange}
            />
            {mode === "group" && cohortOptions.length > 0 && (
              <PillDropdown
                value={selectedCohort}
                options={cohortOptions}
                onChange={handleCohortChange}
              />
            )}
            {mode === "individual" && enrollmentOptions.length > 0 && (
              <PillDropdown
                value={selectedEnrollment}
                options={enrollmentOptions}
                onChange={handleEnrollmentChange}
              />
            )}
          </div>

          {/* Right: date picker dropdown */}
          <CalendarDropdown
            selectedDate={selectedDate}
            sessionDates={sessionDates}
            onSelect={setSelectedDate}
            onMonthChange={handleMonthChange}
            year={calYear}
            month={calMonth}
            disabled={isCalDisabled}
          />
        </div>

        {/* Table — full width, internally scrollable */}
        <DataTable<AttendanceRecord>
          columns={columns}
          rows={records}
          getRowKey={(row) => row.enrollment_id}
          emptyMessage={emptyMessage}
          scrollable
        />
      </div>
    </main>
  );
}
