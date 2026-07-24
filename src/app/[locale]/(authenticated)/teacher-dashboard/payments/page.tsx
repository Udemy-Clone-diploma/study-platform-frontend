"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar, ChevronDown, Flag, Search } from "lucide-react";
import { PageShell } from "@/shared/ui/PageShell";
import { PillSelect } from "@/shared/ui/PillSelect";
import { DatePicker } from "@/shared/ui/DatePicker";
import { DataTable } from "@/shared/ui/DataTable";
import type { DataTableColumn } from "@/shared/ui/DataTable";
import { StudentAvatar } from "@/shared/ui/StudentAvatar";
import { getTeacherOrders, downloadTeacherOrderInvoice } from "@/entities/payment";
import type {
  TeacherOrderRow,
  TeacherOrderStatus,
  TeacherOrdersCourseOption,
  TeacherOrdersCohortOption,
} from "@/entities/payment";

const ALL_COURSES = "__all__";
const ALL_GROUPS = "__all__";
const ALL_STATUSES = "__all__";
const FILTER_ICON_SIZE = {
  width: "clamp(14px, 1.11vw, 16px)",
  height: "clamp(14px, 1.11vw, 16px)",
  color: "var(--color-blue)",
};

const STATUS_OPTIONS = [
  { value: ALL_STATUSES, label: "All" },
  { value: "paid", label: "Paid" },
  { value: "unpaid", label: "Unpaid" },
  { value: "overdue", label: "Overdue" },
];

function formatShort(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y.slice(2)}`;
}

/** Pill-styled trigger (matches PillSelect) that opens a from/to DatePicker pair in one popover. */
function DateRangeFilter({
  from,
  to,
  onChangeFrom,
  onChangeTo,
}: {
  from: string;
  to: string;
  onChangeFrom: (value: string) => void;
  onChangeTo: (value: string) => void;
}) {
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

  const label = from || to ? `${from ? formatShort(from) : "…"} – ${to ? formatShort(to) : "…"}` : "Date range";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-[10px] bg-white text-(--color-text-primary) transition-opacity hover:opacity-80"
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
        <Calendar style={FILTER_ICON_SIZE} />
        <span className="min-w-0 truncate">{label}</span>
        <ChevronDown
          aria-hidden="true"
          style={{
            ...FILTER_ICON_SIZE,
            color: "var(--color-text-primary)",
            flexShrink: 0,
            transition: "transform 0.15s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 z-50 flex flex-col bg-white"
          style={{ top: "calc(100% + 6px)", gap: 12, borderRadius: 16, padding: 16, boxShadow: "var(--shadow-sort-dropdown)" }}
        >
          <div className="flex" style={{ gap: 16 }}>
            <DatePicker value={from} onChange={onChangeFrom} label="From" max={to || undefined} size="sm" />
            <DatePicker value={to} onChange={onChangeTo} label="To" min={from || undefined} size="sm" />
          </div>
          {(from || to) && (
            <button
              type="button"
              onClick={() => {
                onChangeFrom("");
                onChangeTo("");
              }}
              className="self-start text-(--color-blue) hover:underline"
              style={{ fontFamily: "var(--font-base)", fontSize: "clamp(12px, 0.83vw, 14px)" }}
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: TeacherOrderStatus }) {
  const style =
    status === "paid"
      ? { background: "var(--color-brand-lavender-soft)", color: "var(--color-blue)" }
      : status === "unpaid"
        ? { background: "var(--color-brand-yellow)", color: "var(--color-yellow-dark)" }
        : { background: "var(--color-error-surface)", color: "var(--color-rejected)" };
  const label = status === "paid" ? "Paid" : status === "unpaid" ? "Unpaid" : "Overdue";
  return (
    <span
      style={{
        ...style,
        fontFamily: "var(--font-accent)",
        fontWeight: 500,
        fontSize: "clamp(11px, 0.78vw, 15px)",
        borderRadius: 4,
        padding: "2px 10px",
        whiteSpace: "nowrap",
        display: "inline-block",
      }}
    >
      {label}
    </span>
  );
}

function ReceiptButton({ orderId }: { orderId: number }) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    if (loading) return;
    setLoading(true);
    try {
      const pdf = await downloadTeacherOrderInvoice(orderId);
      const url = window.URL.createObjectURL(pdf);
      const link = document.createElement("a");
      link.href = url;
      link.download = `receipt-${orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
    } catch {
      // Swallow -- the button just stays clickable so the teacher can retry.
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      className="inline-flex items-center gap-1 rounded-full border border-(--color-text-primary) disabled:opacity-50"
      style={{
        height: "clamp(28px, 2.22vw, 32px)",
        padding: "0 clamp(10px, 0.83vw, 12px)",
        fontFamily: "var(--font-accent)",
        fontSize: "clamp(12px, 0.78vw, 15px)",
        fontWeight: 500,
      }}
    >
      Receipt
    </button>
  );
}

export default function TeacherPaymentsPage() {
  const [courses, setCourses] = useState<TeacherOrdersCourseOption[]>([]);
  const [cohorts, setCohorts] = useState<TeacherOrdersCohortOption[]>([]);
  const [rows, setRows] = useState<TeacherOrderRow[]>([]);
  const [selectedCourse, setSelectedCourse] = useState(ALL_COURSES);
  const [selectedGroup, setSelectedGroup] = useState(ALL_GROUPS);
  const [selectedStatus, setSelectedStatus] = useState(ALL_STATUSES);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getTeacherOrders({
      course: selectedCourse !== ALL_COURSES ? selectedCourse : undefined,
      cohort: selectedGroup !== ALL_GROUPS ? Number(selectedGroup) : undefined,
      status: selectedStatus !== ALL_STATUSES ? (selectedStatus as TeacherOrderStatus) : undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      search: search || undefined,
    })
      .then((res) => {
        if (cancelled) return;
        setRows(res.results);
        setCourses(res.courses);
        setCohorts(res.cohorts);
      })
      .catch(() => { if (!cancelled) setRows([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedCourse, selectedGroup, selectedStatus, dateFrom, dateTo, search]);

  function handleCourseChange(slug: string) {
    // Groups are course-scoped, so reset synchronously with the course change.
    setSelectedGroup(ALL_GROUPS);
    setSelectedCourse(slug);
  }

  const courseOptions = [
    { value: ALL_COURSES, label: "All courses" },
    ...courses.map((c) => ({ value: c.slug, label: c.title })),
  ];
  const groupOptions = [
    { value: ALL_GROUPS, label: "All groups" },
    ...cohorts.map((c) => ({ value: String(c.id), label: c.name })),
  ];

  const columns: DataTableColumn<TeacherOrderRow>[] = [
    {
      key: "student",
      label: "Student",
      flex: 3,
      render: (row) => (
        <div className="flex items-center" style={{ gap: "clamp(8px, 0.83vw, 12px)" }}>
          <StudentAvatar name={row.student_name} avatar={row.student_avatar} />
          <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{row.student_name}</span>
        </div>
      ),
    },
    {
      key: "group",
      label: "Group",
      flex: 1,
      cellAlign: "center",
      headerAlign: "center",
      render: (row) => <span>{row.cohort_name ?? "—"}</span>,
    },
    {
      key: "plan",
      label: "Payment Plan",
      flex: 1.5,
      cellAlign: "center",
      headerAlign: "center",
      render: (row) => <span>{row.payment_plan}</span>,
    },
    {
      key: "status",
      label: "Status",
      flex: 1,
      cellAlign: "center",
      headerAlign: "center",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "amount",
      label: "Amount",
      flex: 1,
      cellAlign: "center",
      headerAlign: "center",
      render: (row) => <span>{row.amount} {row.currency}</span>,
    },
    {
      key: "date",
      label: "Date",
      flex: 1,
      cellAlign: "center",
      headerAlign: "center",
      render: (row) => <span>{new Date(row.date).toLocaleDateString("en-GB")}</span>,
    },
    {
      key: "due_date",
      label: "Due date",
      flex: 1,
      cellAlign: "center",
      headerAlign: "center",
      render: (row) => <span>{row.due_date ? new Date(row.due_date).toLocaleDateString("en-GB") : "—"}</span>,
    },
    {
      key: "receipt",
      label: "Receipt",
      flex: 1,
      cellAlign: "center",
      headerAlign: "center",
      render: (row) => (row.has_receipt ? <ReceiptButton orderId={row.order_id} /> : null),
    },
  ];

  const emptyMessage = loading ? "Loading payments…" : "No payments found.";

  return (
    <PageShell className="bg-my-courses" fixedHeight>
      <div style={{ maxWidth: "1648px", margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
        {/* Title + filters */}
        <div
          className="flex flex-wrap items-center"
          style={{ gap: "clamp(12px, 1.67vw, 24px)", marginBottom: "clamp(12px, 1.11vw, 16px)" }}
        >
          <h1
            className="font-semibold text-(--color-text-primary)"
            style={{
              fontFamily: "var(--font-base)",
              fontSize: "clamp(18px, 1.67vw, 24px)",
              whiteSpace: "nowrap",
            }}
          >
            Payments overview
          </h1>

          <PillSelect value={selectedCourse} options={courseOptions} onChange={handleCourseChange} />

          <PillSelect
            value={selectedGroup}
            options={groupOptions}
            onChange={setSelectedGroup}
            disabled={selectedCourse === ALL_COURSES}
          />

          <DateRangeFilter from={dateFrom} to={dateTo} onChangeFrom={setDateFrom} onChangeTo={setDateTo} />

          <PillSelect
            value={selectedStatus}
            options={STATUS_OPTIONS}
            onChange={setSelectedStatus}
            icon={<Flag style={FILTER_ICON_SIZE} />}
          />
        </div>

        {/* Search */}
        <label
          className="gradient-border flex cursor-text items-center gap-2 shrink-0"
          style={{
            width: "100%",
            height: "clamp(32px, 2.78vw, 40px)",
            borderRadius: 40,
            padding: "clamp(6px, 0.56vw, 8px) clamp(12px, 1.11vw, 16px)",
            marginBottom: "clamp(16px, 1.67vw, 24px)",
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

        {/* Table */}
        <DataTable<TeacherOrderRow>
          columns={columns}
          rows={rows}
          getRowKey={(row) => `${row.order_id}-${row.course_slug}`}
          emptyMessage={emptyMessage}
          scrollable
        />
      </div>
    </PageShell>
  );
}
