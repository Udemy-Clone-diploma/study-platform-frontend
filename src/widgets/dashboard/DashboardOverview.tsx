import Image from "next/image";
import type { ReactNode } from "react";
import { MyCoursesDashboardWidget } from "./MyCoursesDashboardWidget";

type DashboardRole = "student" | "teacher";

type DashboardListItem = {
  course: string;
  meta: string;
  title: string;
  icon: string;
  accent: string;
  date?: string;
  badge?: string;
  author?: string;
};

type ProgressItem = {
  title: string;
  icon: string;
  accent: string;
  value: number;
};

const studentTasks: DashboardListItem[] = [
  {
    course: "UX/UI Design",
    meta: "Task",
    title: "Landing",
    icon: "/icons/world.png",
    accent: "from-[#fff0df] to-[#ffeab2]",
    date: "20.04",
    badge: "5+",
  },
  {
    course: "Marketing",
    meta: "Test",
    title: "Research",
    icon: "/icons/statistics.svg",
    accent: "from-[#dbe4ff] to-[#a7bafa]",
    date: "23.04",
    badge: "4+",
  },
  {
    course: "Business analytics",
    meta: "Task",
    title: "Risk analysis",
    icon: "/icons/curses.svg",
    accent: "from-[#fff0df] to-[#ffeab2]",
    date: "30.04",
    badge: "5+",
  },
  {
    course: "UX research",
    meta: "Workshop",
    title: "Persona notes",
    icon: "/icons/diary.svg",
    accent: "from-[#e7f7ff] to-[#d7ddff]",
    date: "02.05",
  },
];

const studentNotes: DashboardListItem[] = [
  {
    course: "UX/UI Design",
    meta: "Lesson 4",
    title: "Landing",
    icon: "/icons/world.png",
    accent: "from-[#fff3dc] to-[#ffe7ef]",
    date: "20.04",
  },
  {
    course: "Marketing",
    meta: "Lesson 3",
    title: "Research",
    icon: "/icons/statistics.svg",
    accent: "from-[#ffe7ef] to-[#dfd7ff]",
    date: "19.04",
  },
  {
    course: "Business analytics",
    meta: "Lesson 1",
    title: "Risk analysis",
    icon: "/icons/curses.svg",
    accent: "from-[#e0fbf5] to-[#d8ddff]",
    date: "17.04",
  },
  {
    course: "Marketing",
    meta: "Lesson 2",
    title: "Competitor Analysis",
    icon: "/icons/pie chart.png",
    accent: "from-[#ffe7ef] to-[#dfd7ff]",
    date: "15.04",
  },
  {
    course: "UX/UI Design",
    meta: "Lesson 4",
    title: "Design critique",
    icon: "/icons/world.png",
    accent: "from-[#fff3dc] to-[#ffe7ef]",
    date: "12.04",
  },
];

const teacherChecks: DashboardListItem[] = [
  {
    course: "UX/UI Design Principles Compact",
    meta: "Task",
    title: "Landing",
    icon: "/icons/world.png",
    accent: "from-[#fff3dc] to-[#ffe7ef]",
    author: "Aisha Khan",
  },
  {
    course: "Marketing",
    meta: "Test",
    title: "Research",
    icon: "/icons/statistics.svg",
    accent: "from-[#ffe7ef] to-[#dfd7ff]",
    badge: "5+",
  },
  {
    course: "Business analytics",
    meta: "Task",
    title: "Risk analysis",
    icon: "/icons/curses.svg",
    accent: "from-[#e0fbf5] to-[#d8ddff]",
    author: "Aisha Khan",
  },
  {
    course: "UX research",
    meta: "Review",
    title: "Interview map",
    icon: "/icons/diary.svg",
    accent: "from-[#edf1ff] to-[#fff3dc]",
    author: "Maksym Dovzhenko",
  },
];

const progressItems: ProgressItem[] = [
  {
    title: "UX/UI Design Principles...",
    icon: "/icons/world.png",
    accent: "from-[#fff3dc] to-[#ffe7ef]",
    value: 32,
  },
  {
    title: "Marketing",
    icon: "/icons/statistics.svg",
    accent: "from-[#ffe7ef] to-[#dfd7ff]",
    value: 53,
  },
  {
    title: "Business analytics",
    icon: "/icons/curses.svg",
    accent: "from-[#e0fbf5] to-[#d8ddff]",
    value: 18,
  },
  {
    title: "Product discovery",
    icon: "/icons/diary.svg",
    accent: "from-[#edf1ff] to-[#fff3dc]",
    value: 64,
  },
  {
    title: "UX/UI Design Principles...",
    icon: "/icons/world.png",
    accent: "from-[#fff3dc] to-[#ffe7ef]",
    value: 32,
  },
];

const calendarWeeks = [
  ["30", "31", "1", "2", "3", "4", "5"],
  ["6", "7", "8", "9", "10", "11", "12"],
  ["13", "14", "15", "16", "17", "18", "19"],
  ["20", "21", "22", "23", "24", "25", "26"],
  ["27", "28", "29", "30", "1", "2", "3"],
];

export function DashboardOverview({ role }: { role: DashboardRole }) {
  if (role === "teacher") {
    return <TeacherDashboard />;
  }

  return <StudentDashboard />;
}

function StudentDashboard() {
  return (
    <section className="min-h-[calc(100vh-76px)] bg-white">
      <div
        className="grid min-h-[calc(100vh-76px)]"
        style={{ gridTemplateColumns: "1fr clamp(200px, 17.19vw, 330px)" }}
      >
        <div
          className="grid"
          style={{
            gridTemplateColumns: "clamp(400px, 42.71vw, 820px) clamp(280px, 24.48vw, 470px)",
            gap: "clamp(12px, 1.25vw, 24px)",
            paddingInline: "clamp(16px, 2.08vw, 40px)",
            paddingBlock: "clamp(16px, 1.67vw, 32px)",
          }}
        >
          <div className="flex min-w-0 flex-col" style={{ gap: "clamp(12px, 1.04vw, 20px)" }}>
            <MyCoursesDashboardWidget role="student" />
            <GrowthCard score="4.9" />
            <TodoPanel title="To Do" secondaryLabel="Overdue" items={studentTasks.slice(0, 3)} />
          </div>

          <div className="flex min-w-0 flex-col" style={{ gap: "clamp(12px, 1.04vw, 20px)" }}>
            <CompactTaskPanel items={studentTasks} />
            <NotesPanel items={studentNotes} />
          </div>
        </div>

        <ScheduleRail />
      </div>
    </section>
  );
}

function TeacherDashboard() {
  return (
    <section className="min-h-[calc(100vh-76px)] bg-white">
      <div
        className="grid min-h-[calc(100vh-76px)]"
        style={{ gridTemplateColumns: "1fr clamp(200px, 17.19vw, 330px)" }}
      >
        <div
          className="grid"
          style={{
            gridTemplateColumns: "clamp(400px, 42.71vw, 820px) clamp(280px, 24.48vw, 470px)",
            gap: "clamp(12px, 1.25vw, 24px)",
            paddingInline: "clamp(16px, 2.08vw, 40px)",
            paddingBlock: "clamp(16px, 1.67vw, 32px)",
          }}
        >
          <div className="flex min-w-0 flex-col" style={{ gap: "clamp(12px, 1.04vw, 20px)" }}>
            <MyCoursesDashboardWidget role="teacher" />
            <GrowthCard score="4.0" />
            <TodoPanel title="Check" secondaryLabel="Verified" items={teacherChecks} teacher />
          </div>

          <div
            className="flex min-w-0 flex-col"
            style={{
              gap: "clamp(12px, 1.04vw, 20px)",
              paddingTop: "clamp(32px, 2.97vw, 57px)",
            }}
          >
            <StudentTotalCard />
            <CourseProgressPanel items={progressItems} />
          </div>
        </div>

        <ScheduleRail />
      </div>
    </section>
  );
}

function GrowthCard({ score }: { score: string }) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-base font-bold text-black">Growth</h2>
        <div className="flex gap-5 text-[10px] text-black">
          <span>Course v</span>
          <span>Yearly v</span>
        </div>
      </div>

      <div className="mb-2 rounded bg-[#edf1ff] px-2 py-1.5 text-xs font-bold text-[#003aff]">
        Average score: {score}
      </div>

      <div className="relative h-[116px]">
        <svg className="h-full w-full" viewBox="0 0 640 130" role="img" aria-label="Growth chart">
          <defs>
            <linearGradient id="growthFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#a7bafa" stopOpacity="0.7" />
              <stop offset="52%" stopColor="#fcc4c3" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#fff4da" stopOpacity="0.45" />
            </linearGradient>
          </defs>
          {[18, 42, 66, 90, 114].map((y) => (
            <line key={y} x1="36" x2="628" y1={y} y2={y} stroke="#e3e7f8" strokeWidth="1" />
          ))}
          <line x1="36" x2="628" y1="114" y2="114" stroke="#a7bafa" strokeDasharray="2 2" />
          <path
            d="M36 92 L120 84 L220 50 L340 34 L420 92 L520 72 L628 40 L628 114 L36 114 Z"
            fill="url(#growthFill)"
          />
          <path
            d="M36 92 L120 84 L220 50 L340 34 L420 92 L520 72 L628 40"
            fill="none"
            stroke="#a7bafa"
            strokeWidth="2"
          />
          {[5, 4, 3, 2, 1].map((value, index) => (
            <text key={value} x="8" y={22 + index * 24} fill="#5e5e5e" fontSize="11">
              {value}
            </text>
          ))}
          {["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6"].map((label, index) => (
            <text key={label} x={36 + index * 116} y="128" fill="#5e5e5e" fontSize="10">
              {label}
            </text>
          ))}
        </svg>
      </div>
    </Card>
  );
}

function CompactTaskPanel({ items }: { items: DashboardListItem[] }) {
  return (
    <Card className="max-h-[300px] overflow-hidden p-4">
      <ScrollableList>
        {items.map((item) => (
          <ListRow key={`${item.title}-${item.date}`} item={item} compact />
        ))}
      </ScrollableList>
    </Card>
  );
}

function NotesPanel({ items }: { items: DashboardListItem[] }) {
  return (
    <Card className="max-h-[300px] overflow-hidden p-4">
      <h2 className="mb-2 text-base font-bold text-black">My Notes</h2>
      <ScrollableList>
        {items.map((item) => (
          <ListRow key={`${item.title}-${item.date}`} item={item} compact />
        ))}
      </ScrollableList>
    </Card>
  );
}

function TodoPanel({
  title,
  secondaryLabel,
  items,
  teacher = false,
}: {
  title: string;
  secondaryLabel: string;
  items: DashboardListItem[];
  teacher?: boolean;
}) {
  return (
    <Card className="max-h-[230px] overflow-hidden p-3">
      <div className="mb-2 flex items-center gap-3">
        <span className="rounded-full bg-[linear-gradient(90deg,#a7bafa_0%,#fcc4c3_60%,#fff4da_100%)] px-4 py-1 text-sm text-black">
          {title}
        </span>
        <span className="rounded-full border border-black px-4 py-0.5 text-sm text-black">
          {secondaryLabel}
        </span>
      </div>
      <ScrollableList>
        {items.map((item) => (
          <ListRow key={`${item.title}-${item.author ?? item.badge}`} item={item} teacher={teacher} />
        ))}
      </ScrollableList>
    </Card>
  );
}

function StudentTotalCard() {
  return (
    <Card className="min-h-[100px] border border-[#fcc4c3] p-6">
      <div className="flex h-full items-center justify-between gap-4">
        <div>
          <p className="text-base text-black">Total Students</p>
          <p className="mt-4 text-2xl font-bold text-black">134</p>
        </div>
        <Image src="/icons/people.svg" alt="" width={40} height={40} className="h-10 w-10" />
      </div>
    </Card>
  );
}

function CourseProgressPanel({ items }: { items: ProgressItem[] }) {
  return (
    <Card className="max-h-[472px] overflow-hidden p-4">
      <h2 className="mb-3 text-base font-bold text-black">Course progress</h2>
      <ScrollableList>
        {items.map((item) => (
          <div
            key={`${item.title}-${item.value}`}
            className="mb-2 flex min-h-[64px] items-center gap-3 rounded-md border border-black/5 bg-white px-3 shadow-[0_1px_8px_rgba(0,0,0,0.12)]"
          >
            <IconTile accent={item.accent} icon={item.icon} size="sm" />
            <span className="min-w-0 flex-1 truncate text-xs text-[#5e5e5e]">{item.title}</span>
            <ProgressRing value={item.value} />
          </div>
        ))}
      </ScrollableList>
    </Card>
  );
}

function ScheduleRail() {
  return (
    <aside className="bg-[linear-gradient(180deg,#fff4da_0%,#fcc4c3_45%,#a7bafa_100%)] px-4 py-8">
      <CalendarCard />
      <div className="mt-4">
        <h2 className="mb-3 text-base font-bold text-black">Today&apos;s schedule</h2>
        <div className="flex flex-col gap-2">
          {[1, 2].map((item) => (
            <div key={item} className="rounded-md bg-white/70 px-3 py-3">
              <p className="text-sm font-semibold text-black">Course</p>
              <p className="mt-2 text-xs text-black">Lesson&nbsp;&nbsp;|&nbsp;&nbsp;16:30</p>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

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
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day, index) => (
          <span key={`${day}-${index}`}>{day}</span>
        ))}
        {calendarWeeks.flat().map((day, index) => {
          const muted = index < 2 || index > 32;
          const active = day === "18";
          const outlined = day === "21" || (day === "30" && index > 28);

          return (
            <span
              key={`${day}-${index}`}
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

function ListRow({
  item,
  compact = false,
  teacher = false,
}: {
  item: DashboardListItem;
  compact?: boolean;
  teacher?: boolean;
}) {
  return (
    <div
      className={[
        "mb-2 flex items-center gap-3 rounded-md border border-black/5 bg-white px-3 shadow-[0_1px_8px_rgba(0,0,0,0.12)]",
        compact ? "min-h-[58px]" : "min-h-[56px]",
      ].join(" ")}
    >
      <IconTile accent={item.accent} icon={item.icon} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] text-[#5e5e5e]">
          {item.course} <span className="px-1">|</span> {item.meta}
        </p>
        <p className="truncate text-sm font-medium text-black">{item.title}</p>
      </div>
      {item.badge ? (
        <span className="rounded-md bg-[#fff4da] px-3 py-2 text-base font-medium text-[#8a6201]">
          {item.badge}
        </span>
      ) : null}
      {item.author ? (
        <span className="whitespace-nowrap text-xs text-black">
          From: <span className="text-[#003aff]">{item.author}</span>
        </span>
      ) : null}
      {item.date && !teacher ? <span className="whitespace-nowrap text-xs text-[#003aff]">{item.date}</span> : null}
    </div>
  );
}

function ProgressRing({ value }: { value: number }) {
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
      style={{
        background: `conic-gradient(#003aff ${value * 3.6}deg, #d9d9d9 0deg)`,
      }}
    >
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[8px] font-bold text-[#5e5e5e]">
        {value}%
      </div>
    </div>
  );
}

function IconTile({
  accent,
  icon,
  size = "md",
}: {
  accent: string;
  icon: string;
  size?: "sm" | "md";
}) {
  return (
    <div
      className={[
        "flex shrink-0 items-center justify-center rounded-md bg-gradient-to-br",
        accent,
        size === "sm" ? "h-10 w-10" : "h-12 w-12",
      ].join(" ")}
    >
      <Image
        src={icon}
        alt=""
        width={size === "sm" ? 32 : 40}
        height={size === "sm" ? 32 : 40}
        className={size === "sm" ? "h-8 w-8 object-contain" : "h-10 w-10 object-contain"}
      />
    </div>
  );
}

function ScrollableList({ children }: { children: ReactNode }) {
  return <div className="max-h-full overflow-y-auto pr-1">{children}</div>;
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg bg-white shadow-[0_0_16px_rgba(0,0,0,0.14)] ${className}`}>
      {children}
    </div>
  );
}
