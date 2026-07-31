"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { ComponentProps, CSSProperties, ReactNode } from "react";
import {
  HomeworkQueuePanel,
  HomeworkReviewPanel,
  StudentHomeworkProvider,
} from "./StudentHomeworkDashboardPanels";
import { GrowthCard } from "./GrowthCard";
import { MyCoursesDashboardWidget } from "./MyCoursesDashboardWidget";
import { ScheduleRail } from "./ScheduleRail";
import { StudentNotesPanel } from "./StudentNotesPanel";
import { TeacherHomeworkCheckPanel } from "./TeacherHomeworkCheckPanel";
import { TeacherStudentsPanel } from "./TeacherStudentsPanel";
import { PAGE_PADDING_TOP, SIDEBAR_GAP } from "@/shared/ui/PageShell";

type DashboardRole = "student" | "teacher";

export type DashboardListItem = {
  id: string | number;
  course: string;
  meta: string;
  title: string;
  icon: string;
  accent: string;
  date?: string;
  badge?: string;
  author?: string;
  href?: ComponentProps<typeof Link>["href"];
};

const scheduleRailStyle = {
  marginRight: "clamp(16px, calc(-11.43px + 2.68vw), 40px)",
  "--schedule-height": "calc(100vh - 76px - clamp(16px, 2.22vw, 32px))",
} as CSSProperties;

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
            <GrowthCard metric="enrollments" />
            <TeacherHomeworkCheckPanel />
          </div>

          <div
            className="flex min-w-0 flex-col"
            style={{
              gap: "clamp(12px, 1.04vw, 20px)",
              paddingTop: "calc(clamp(36px, 2.71vw, 52px) + clamp(12px, 1.04vw, 20px))",
            }}
          >
            <TeacherStudentsPanel />
          </div>
        </div>

        <div style={scheduleRailStyle}>
          <ScheduleRail />
        </div>
      </div>
    </section>
  );
}

export function TodoPanel({
  title,
  secondaryLabel,
  activeTab,
  onTabChange,
  items,
  loading = false,
  emptyLabel,
  teacher = false,
}: {
  title: string;
  secondaryLabel: string;
  activeTab: "primary" | "secondary";
  onTabChange: (tab: "primary" | "secondary") => void;
  items: DashboardListItem[];
  loading?: boolean;
  emptyLabel?: string;
  teacher?: boolean;
}) {
  const t = useTranslations("DashboardOverview");

  return (
    <Card className="flex h-[230px] flex-col overflow-hidden p-3">
      <div className="mb-2 flex shrink-0 items-center gap-3">
        <button
          type="button"
          onClick={() => onTabChange("primary")}
          className={
            activeTab === "primary"
              ? "rounded-full bg-[linear-gradient(90deg,#a7bafa_0%,#fcc4c3_60%,#fff4da_100%)] px-4 py-1 text-sm text-black"
              : "rounded-full border border-black/10 px-4 py-1 text-sm text-black transition-colors hover:bg-black/5"
          }
        >
          {title}
        </button>
        <button
          type="button"
          onClick={() => onTabChange("secondary")}
          className={
            activeTab === "secondary"
              ? "rounded-full bg-[linear-gradient(90deg,#a7bafa_0%,#fcc4c3_60%,#fff4da_100%)] px-4 py-0.5 text-sm text-black"
              : "rounded-full border border-black px-4 py-0.5 text-sm text-black transition-colors hover:bg-black/5"
          }
        >
          {secondaryLabel}
        </button>
      </div>
      {loading ? (
        <p className="pt-6 text-center text-xs text-[#5e5e5e]">{t("loading")}</p>
      ) : items.length === 0 ? (
        <p className="pt-6 text-center text-xs text-[#5e5e5e]">
          {emptyLabel ?? t("nothingHereYet")}
        </p>
      ) : (
        <ScrollableList>
          {items.map((item) => (
            <ListRow key={item.id} item={item} teacher={teacher} />
          ))}
        </ScrollableList>
      )}
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
  const t = useTranslations("DashboardOverview");
  const className = [
    "mb-2 flex items-center gap-3 rounded-md border border-black/5 bg-white px-3 shadow-[0_1px_8px_rgba(0,0,0,0.12)]",
    compact ? "min-h-[58px]" : "min-h-[56px]",
    item.href ? "transition hover:bg-black/[0.02]" : "",
  ].join(" ");

  const content = (
    <>
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
          {t("from")} <span className="text-[#003aff]">{item.author}</span>
        </span>
      ) : null}
      {item.date && !teacher ? (
        <span className="whitespace-nowrap text-xs text-[#003aff]">{item.date}</span>
      ) : null}
    </>
  );

  return item.href ? (
    <Link href={item.href} className={className}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}

export function ProgressRing({ value }: { value: number }) {
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

export function ScrollableList({ children }: { children: ReactNode }) {
  return <div className="min-h-0 flex-1 overflow-y-auto pr-1">{children}</div>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg bg-white shadow-[0_0_16px_rgba(0,0,0,0.14)] ${className}`}>
      {children}
    </div>
  );
}
