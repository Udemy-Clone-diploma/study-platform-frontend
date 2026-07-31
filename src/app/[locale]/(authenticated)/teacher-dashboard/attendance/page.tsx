"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { PageShell } from "@/shared/ui/PageShell";
import { PillSelect } from "@/shared/ui/PillSelect";
import { DatePicker, todayISO } from "@/shared/ui/DatePicker";
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
  getDeliveryFormats,
} from "@/entities/course";
import type {
  CourseListItem,
  CourseCohort,
  AttendanceRecord,
  IndividualEnrollment,
  CourseDeliveryFormat,
} from "@/entities/course";
import { DataTable } from "@/shared/ui/DataTable";
import type { DataTableColumn } from "@/shared/ui/DataTable";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name.split(" ").slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase();
}

// ── Types ─────────────────────────────────────────────────────────────────────

type Mode = "group" | "individual";


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
  const t = useTranslations("TeacherAttendancePage");
  const tCommon = useTranslations("Common");
  const tSchedule = useTranslations("ScheduleRail");
  const tStudentsPanel = useTranslations("TeacherStudentsPanel");
  const FORMAT_OPTIONS: { value: Mode; label: string }[] = [
    { value: "group", label: tSchedule("groupSession") },
    { value: "individual", label: tSchedule("individualSession") },
  ];
  const now = new Date();

  const [courses, setCourses]               = useState<CourseListItem[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [loadingCourses, setLoadingCourses] = useState(true);

  const [mode, setMode] = useState<Mode>("group");

  const [formats, setFormats]           = useState<CourseDeliveryFormat[]>([]);
  const [loadingFormats, setLoadingFormats] = useState(false);

  const [cohorts, setCohorts]               = useState<CourseCohort[]>([]);
  const [selectedCohort, setSelectedCohort] = useState<string>("");

  const [individuals, setIndividuals]               = useState<IndividualEnrollment[]>([]);
  const [selectedEnrollment, setSelectedEnrollment] = useState<string>("");

  const [calYear, setCalYear]   = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth() + 1);
  const [calendarResetKey, setCalendarResetKey] = useState(0);
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

  // ── Load delivery formats (independent of mode, used to know which types exist) ──
  useEffect(() => {
    if (!selectedCourse) {
      setFormats([]);
      return;
    }
    let cancelled = false;
    setLoadingFormats(true);
    getDeliveryFormats(selectedCourse)
      .then((list) => {
        if (cancelled) return;
        setFormats(list);
        const hasGroup = list.some((format) => format.format_type === "group");
        const hasIndividual = list.some((format) => format.format_type === "individual");
        setMode((current) => {
          if (current === "group" && hasGroup) return current;
          if (current === "individual" && hasIndividual) return current;
          return hasGroup ? "group" : "individual";
        });
      })
      .catch(() => { if (!cancelled) setFormats([]); })
      .finally(() => { if (!cancelled) setLoadingFormats(false); });
    return () => { cancelled = true; };
  }, [selectedCourse]);

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
    setCalendarResetKey((k) => k + 1);
  }

  const handleCourseChange = useCallback((slug: string) => {
    metaFetchedFor.current = "";
    setSelectedCourse(slug);
    setFormats([]);
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

  const handleCalendarViewChange = useCallback((y: number, m: number) => {
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
    label: c.name ?? tStudentsPanel("groupFallback", { number: i + 1 }),
  }));
  const enrollmentOptions = individuals.map((e) => ({
    value: String(e.enrollment_id),
    label: e.student_name,
  }));

  const hasGroupFormat = formats.some((format) => format.format_type === "group");
  const hasIndividualFormat = formats.some((format) => format.format_type === "individual");
  const modeOptions = FORMAT_OPTIONS.filter((option) =>
    option.value === "group" ? hasGroupFormat : hasIndividualFormat,
  );

  const isCalDisabled =
    !selectedCourse ||
    (mode === "group" && !selectedCohort) ||
    (mode === "individual" && !selectedEnrollment);

  const hasSession = records[0]?.has_session ?? false;

  // ── Columns ────────────────────────────────────────────────────────────────
  const columns: DataTableColumn<AttendanceRecord>[] = [
    {
      key: "student",
      label: t("columnStudent"),
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
      label: t("columnAttendance"),
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
      label: t("columnAttendanceMonth"),
      flex: 1.5,
      cellAlign: "center",
      headerAlign: "center",
      render: (row) => (
        <span>{row.monthly_attendance_percent > 0 ? `${row.monthly_attendance_percent}%` : "—"}</span>
      ),
    },
    {
      key: "total",
      label: t("columnAttendanceTotal"),
      flex: 1.5,
      cellAlign: "center",
      headerAlign: "center",
      render: (row) => (
        <span>{row.total_attendance_percent > 0 ? `${row.total_attendance_percent}%` : "—"}</span>
      ),
    },
    {
      key: "performance",
      label: t("columnPerformance"),
      flex: 1.5,
      cellAlign: "center",
      headerAlign: "center",
      render: (row) => (
        <span>{row.progress_percent > 0 ? `${row.progress_percent}%` : "—"}</span>
      ),
    },
  ];

  const emptyMessage = !selectedDate
    ? t("selectSessionDate")
    : loadingRecords
      ? tCommon("loading")
      : mode === "group"
        ? t("noStudentsInGroup")
        : t("noSessionForStudent");

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <PageShell className="bg-my-courses" fixedHeight>
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
              {t("heading")}
            </h1>
            {courseOptions.length > 0 && (
              <PillSelect
                value={selectedCourse}
                options={courseOptions}
                onChange={handleCourseChange}
                disabled={loadingCourses}
              />
            )}
            <PillSelect
              value={mode}
              options={modeOptions}
              onChange={handleModeChange}
              disabled={loadingFormats || modeOptions.length === 0}
              placeholder={t("typePlaceholder")}
            />
            {mode === "group" && cohortOptions.length > 0 && (
              <PillSelect
                value={selectedCohort}
                options={cohortOptions}
                onChange={handleCohortChange}
              />
            )}
            {mode === "individual" && enrollmentOptions.length > 0 && (
              <PillSelect
                value={selectedEnrollment}
                options={enrollmentOptions}
                onChange={handleEnrollmentChange}
              />
            )}
          </div>

          {/* Right: date picker dropdown */}
          <div style={{ width: "min(88vw, 220px)" }}>
            <DatePicker
              key={calendarResetKey}
              size="sm"
              value={selectedDate ?? ""}
              onChange={setSelectedDate}
              onViewChange={handleCalendarViewChange}
              selectableDates={sessionDates}
              max={todayISO()}
              disabled={isCalDisabled}
              placeholder={t("selectDatePlaceholder")}
            />
          </div>
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
    </PageShell>
  );
}
