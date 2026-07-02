import type { ReactNode } from "react";
import { SIDEBAR_GAP } from "@/shared/ui/PageShell";

// ── Placeholder data ──────────────────────────────────────────────────────────

const statCards = [
  { label: "Total Content Reviewed", value: "32", trend: "12.5% vs last week" },
  { label: "Harmful Content Blocked", value: "32", trend: "8.3% vs last week" },
  { label: "Pending Reviews", value: "32", trend: "5.2% vs last week" },
  { label: "Appeal Success Rate", value: "32", trend: "3.1% vs last week" },
  { label: "Avg. Review Time", value: "32", trend: "15.8% vs last week" },
];

const trendRows = [
  { date: "Feb 1", total: "1 890", blocked: 58, flagged: 24, approved: 78 },
  { date: "Feb 2", total: "1 956", blocked: 52, flagged: 30, approved: 84 },
  { date: "Feb 3", total: "1 934", blocked: 46, flagged: 20, approved: 88 },
  { date: "Feb 4", total: "2 040", blocked: 62, flagged: 34, approved: 72 },
];

const categoryRows = [
  { name: "Spam", count: 350, percent: 18 },
  { name: "Security", count: 140, percent: 7 },
  { name: "Reports", count: 420, percent: 22 },
  { name: "Course Review", count: 820, percent: 43 },
  { name: "Content Quality", count: 180, percent: 10 },
];

const calendarWeeks = [
  ["30", "31", "1", "2", "3", "4", "5"],
  ["6", "7", "8", "9", "10", "11", "12"],
  ["13", "14", "15", "16", "17", "18", "19"],
  ["20", "21", "22", "23", "24", "25", "26"],
  ["27", "28", "29", "30", "1", "2", "3"],
];

// ── Component ─────────────────────────────────────────────────────────────────

/** Moderator / administrator dashboard with content moderation metrics (stub). */
export function ModeratorDashboard() {
  return (
    <section className="min-h-[calc(100vh-76px)] bg-white">
      <div
        className="grid min-h-[calc(100vh-76px)]"
        style={{ gridTemplateColumns: "1fr clamp(200px, 17.19vw, 330px)" }}
      >
        {/* ── Main content ── */}
        <div
          style={{
            paddingInline: SIDEBAR_GAP,
            paddingBlock: "clamp(16px, 1.67vw, 32px)",
            display: "flex",
            flexDirection: "column",
            gap: "clamp(12px, 1.25vw, 24px)",
          }}
        >
          {/* Page header */}
          <div>
            <h1 className="text-2xl font-semibold text-black">Dashboard</h1>
            <p className="mt-1 text-base text-[#5e5e5e]">
              Overview of content moderation activity and key metrics
            </p>
          </div>

          {/* Stat cards — 3 per row, then 2 */}
          <div
            className="grid"
            style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: "clamp(10px, 1.04vw, 20px)" }}
          >
            {statCards.slice(0, 3).map((c) => (
              <StatCard key={c.label} {...c} />
            ))}
          </div>
          <div
            className="grid"
            style={{ gridTemplateColumns: "repeat(2, 1fr)", gap: "clamp(10px, 1.04vw, 20px)" }}
          >
            {statCards.slice(3).map((c) => (
              <StatCard key={c.label} {...c} />
            ))}
          </div>

          {/* Charts */}
          <div
            className="grid flex-1"
            style={{ gridTemplateColumns: "1fr 1fr", gap: "clamp(10px, 1.04vw, 20px)" }}
          >
            <ModerationTrendsCard />
            <ContentByCategoryCard />
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <ScheduleRail />
      </div>
    </section>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, trend }: { label: string; value: string; trend: string }) {
  return (
    <Card className="p-5">
      <p className="text-base text-black">{label}</p>
      <div className="my-3 rounded-lg bg-[linear-gradient(90deg,rgba(167,186,250,0.32)_0%,rgba(167,186,250,0)_100%)] px-3 py-2">
        <span className="text-[28px] font-medium leading-[35px] text-[#003aff]">{value}</span>
      </div>
      <p className="text-base text-[#5e5e5e]">{trend}</p>
    </Card>
  );
}

// ── Moderation Trends ─────────────────────────────────────────────────────────

function ModerationTrendsCard() {
  return (
    <Card className="p-5">
      <h2 className="mb-4 text-base text-black">Moderation Trends (7 Days)</h2>
      <div className="flex flex-col gap-5">
        {trendRows.map((row) => (
          <div key={row.date} className="flex items-center gap-3">
            <span className="w-10 shrink-0 text-xs text-[#5e5e5e]">{row.date}</span>
            <div className="flex flex-1 flex-col gap-1">
              <div className="h-1 rounded-full bg-red-400" style={{ width: `${row.blocked}%` }} />
              <div className="h-1 rounded-full bg-yellow-400" style={{ width: `${row.flagged}%` }} />
              <div className="h-1 rounded-full bg-green-500" style={{ width: `${row.approved}%` }} />
            </div>
            <span className="w-12 shrink-0 text-right text-xs text-black">{row.total}</span>
          </div>
        ))}
      </div>
      <div className="mt-5 flex gap-5">
        {(
          [
            ["bg-red-400", "Blocked"],
            ["bg-yellow-400", "Flagged"],
            ["bg-green-500", "Approved"],
          ] as const
        ).map(([color, label]) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${color}`} />
            <span className="text-xs text-[#5e5e5e]">{label}</span>
          </span>
        ))}
      </div>
    </Card>
  );
}

// ── Content by Category ───────────────────────────────────────────────────────

function ContentByCategoryCard() {
  return (
    <Card className="p-5">
      <h2 className="mb-4 text-base text-black">Content by Category</h2>
      <div className="flex flex-col gap-4">
        {categoryRows.map((item) => (
          <div key={item.name} className="flex items-center gap-3">
            <span className="w-28 shrink-0 text-xs text-black">{item.name}</span>
            <div className="flex-1 overflow-hidden rounded-full bg-[#d9d9d9]/30">
              <div
                className="h-1 rounded-full bg-[#003aff]"
                style={{ width: `${item.percent}%` }}
              />
            </div>
            <span className="w-10 shrink-0 text-right text-xs text-[#5e5e5e]">{item.count}</span>
            <span className="w-9 shrink-0 text-right text-xs text-[#5e5e5e]">{item.percent}%</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── Schedule rail ─────────────────────────────────────────────────────────────

function ScheduleRail() {
  return (
    <aside className="bg-[linear-gradient(15.68deg,#a7bafa_6.48%,#fcc4c3_50.84%,#fff4da_93.52%)] px-4 py-8">
      <CalendarCard />
      <div className="mt-4">
        <h2 className="mb-3 text-base font-bold text-black">Today&apos;s schedule</h2>
        <div className="flex flex-col gap-2">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-xl bg-white/60 px-3 py-3">
              <p className="text-sm font-semibold text-black">Course</p>
              <p className="mt-2 text-xs text-black">Lesson&nbsp;&nbsp;|&nbsp;&nbsp;16:30</p>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

// ── Calendar ──────────────────────────────────────────────────────────────────

function CalendarCard() {
  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between text-black">
        <button aria-label="Previous month" className="text-lg leading-none">
          {"<"}
        </button>
        <h2 className="text-xs font-semibold">April 2026</h2>
        <button aria-label="Next month" className="text-lg leading-none">
          {">"}
        </button>
      </div>
      <div className="grid grid-cols-7 gap-y-3 text-center text-[11px] text-[#5e5e5e]">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d, i) => (
          <span key={`h-${d}-${i}`}>{d}</span>
        ))}
        {calendarWeeks.flat().map((day, idx) => {
          const muted = idx < 2 || idx > 32;
          const active = day === "18";
          const outlined = day === "21" || (day === "30" && idx > 28);
          return (
            <span
              key={`d-${day}-${idx}`}
              className={[
                "mx-auto flex h-7 w-7 items-center justify-center rounded-full",
                muted ? "text-black/15" : "text-black",
                active ? "bg-[#fcc4c3] text-white" : "",
                outlined ? "border border-[#fcc4c3]" : "",
              ].join(" ")}
            >
              {day}
            </span>
          );
        })}
      </div>
    </Card>
  );
}

// ── Shared card wrapper ───────────────────────────────────────────────────────

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg bg-white shadow-[0_0_17px_rgba(0,0,0,0.16)] ${className}`}>
      {children}
    </div>
  );
}
