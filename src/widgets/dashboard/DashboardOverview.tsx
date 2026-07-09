import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import {
  HomeworkQueuePanel,
  HomeworkReviewPanel,
  StudentHomeworkProvider,
} from "./StudentHomeworkDashboardPanels";
import { GrowthCard } from "./GrowthCard";
import { MyCoursesDashboardWidget } from "./MyCoursesDashboardWidget";
import { ScheduleRail } from "./ScheduleRail";
import { StudentNotesPanel } from "./StudentNotesPanel";
import { PAGE_PADDING_TOP, SIDEBAR_GAP } from "@/shared/ui/PageShell";

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

const scheduleRailStyle = {
  marginRight: "clamp(16px, calc(-11.43px + 2.68vw), 40px)",
  "--schedule-height": "calc(100vh - 76px - clamp(16px, 2.22vw, 32px))",
} as CSSProperties;

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

export function DashboardOverview({ role }: { role: DashboardRole }) {
  if (role === "teacher") {
    return <TeacherDashboard />;
  }

  return <StudentDashboard />;
}

function StudentDashboard() {
  return (
    <section className="min-h-[calc(100vh-76px)] bg-white">
      <StudentHomeworkProvider>
        <div
          className="grid min-h-[calc(100vh-76px)]"
          style={{
            gridTemplateColumns: "1fr clamp(240px, calc(100.53px + 13.62vw), 362px)",
            gap: SIDEBAR_GAP,
            paddingTop: PAGE_PADDING_TOP,
            paddingLeft: SIDEBAR_GAP,
          }}
        >
          <div
            className="grid"
            style={{
              gridTemplateColumns:
                "clamp(390px, calc(-101.4px + 47.99vw), 820px) clamp(225px, calc(-55.04px + 27.34vw), 470px)",
              gap: "clamp(12px, calc(-1.71px + 1.34vw), 24px)",
            }}
          >
            <div className="flex min-w-0 flex-col" style={{ gap: "clamp(12px, 1.04vw, 20px)" }}>
              <MyCoursesDashboardWidget role="student" />
              <GrowthCard />
              <HomeworkQueuePanel />
            </div>

            <div className="flex min-w-0 flex-col" style={{ gap: "clamp(12px, 1.04vw, 20px)" }}>
              <HomeworkReviewPanel />
              <StudentNotesPanel />
            </div>
          </div>

          <div style={scheduleRailStyle}>
            <ScheduleRail />
          </div>
        </div>
      </StudentHomeworkProvider>
    </section>
  );
}

function TeacherDashboard() {
  return (
    <section className="min-h-[calc(100vh-76px)] bg-white">
      <div
        className="grid min-h-[calc(100vh-76px)]"
        style={{
          gridTemplateColumns: "1fr clamp(240px, calc(100.53px + 13.62vw), 362px)",
          gap: SIDEBAR_GAP,
          paddingTop: PAGE_PADDING_TOP,
          paddingLeft: SIDEBAR_GAP,
        }}
      >
        <div
          className="grid"
          style={{
            gridTemplateColumns:
              "clamp(390px, calc(-101.4px + 47.99vw), 820px) clamp(225px, calc(-55.04px + 27.34vw), 470px)",
            gap: "clamp(12px, calc(-1.71px + 1.34vw), 24px)",
          }}
        >
          <div className="flex min-w-0 flex-col" style={{ gap: "clamp(12px, 1.04vw, 20px)" }}>
            <MyCoursesDashboardWidget role="teacher" />
            <GrowthCard />
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

        <div style={scheduleRailStyle}>
          <ScheduleRail />
        </div>
      </div>
    </section>
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
          <ListRow
            key={`${item.title}-${item.author ?? item.badge}`}
            item={item}
            teacher={teacher}
          />
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
        {items.map((item, i) => (
          <div
            key={`${item.title}-${item.value}-${i}`}
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
      {item.date && !teacher ? (
        <span className="whitespace-nowrap text-xs text-[#003aff]">{item.date}</span>
      ) : null}
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

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg bg-white shadow-[0_0_16px_rgba(0,0,0,0.14)] ${className}`}>
      {children}
    </div>
  );
}
