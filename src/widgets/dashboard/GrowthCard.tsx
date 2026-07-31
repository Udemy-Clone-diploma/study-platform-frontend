"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { getGrowth } from "@/entities/homework";
import type { GrowthPeriod, GrowthPoint } from "@/entities/homework";
import { getEnrollmentGrowth } from "@/entities/course";
import { formatDate } from "@/shared/lib/time";
import { Card } from "./DashboardOverview";

/** Locale-aware x-axis label for a growth point, replacing the backend's English "Week N" / "Jan" text. */
function pointLabel(point: GrowthPoint, locale: string): string {
  if (point.period === "yearly") {
    return formatDate(point.date, locale, { month: "short" });
  }
  return formatDate(point.date, locale, { day: "numeric", month: "short" });
}

const CHART_X0 = 36;
const CHART_X1 = 628;
const CHART_Y_TOP = 18;
const CHART_Y_BASE = 114;

type Metric = "score" | "enrollments";

/** Unified shape both growth endpoints (average score / enrollment count) normalize into. */
type NormalizedGrowth = {
  summaryLabel: string;
  summaryValue: number;
  points: GrowthPoint[];
  courses: { slug: string; title: string }[];
  scaleMin: number;
  scaleMax: number;
};

function yFor(value: number, min: number, max: number): number {
  return CHART_Y_BASE - ((value - min) / (max - min || 1)) * (CHART_Y_BASE - CHART_Y_TOP);
}

function xFor(index: number, count: number): number {
  if (count <= 1) return CHART_X0;
  return CHART_X0 + (index * (CHART_X1 - CHART_X0)) / (count - 1);
}

export type Option = { value: string; label: string };

/** Compact text-and-chevron dropdown shared by stat/growth widgets — lighter
 *  weight than the full pill `PillSelect`, meant to sit inside a card header. */
export function Dropdown({
  value,
  options,
  onChange,
  disabled = false,
}: {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  return (
    <div ref={ref} className="relative min-w-0">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className={`flex h-6 max-w-[140px] items-center gap-1 rounded-full px-2 text-[10px] font-medium transition-colors ${
          disabled ? "cursor-not-allowed text-black/30" : "text-black hover:text-[#003aff]"
        }`}
      >
        <span className="truncate">{active?.label}</span>
        <ChevronDown
          aria-hidden="true"
          className={`h-3 w-3 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && !disabled && (
        <div className="absolute right-0 z-20 mt-1 w-48 overflow-hidden rounded-xl bg-white shadow-[0_6px_18px_rgba(0,0,0,0.16)]">
          <ul role="listbox" className="flex max-h-56 flex-col overflow-y-auto p-2">
            {options.map((option) => {
              const selected = option.value === value;
              return (
                <li key={option.value} role="option" aria-selected={selected}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className={`w-full rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                      selected ? "bg-[#edf1ff] text-[#003aff]" : "text-black hover:bg-[#fafafa]"
                    }`}
                  >
                    {option.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Real-data "Growth" widget: for students, average reviewed-homework score over
 * time; for teachers (`metric="enrollments"`), new-student-enrollment count over
 * time. Filterable by course and period.
 */
export function GrowthCard({
  metric = "score",
  cardClassName = "p-5",
  chartHeightClassName = "h-[116px]",
  studentId,
  initialPeriod = "weekly",
  defaultToFirstCourse = false,
}: {
  metric?: Metric;
  /** Overrides the card's default padding (`p-5`) — e.g. drop the horizontal padding for an edge-to-edge chart. */
  cardClassName?: string;
  /** Overrides the chart area's default height (`h-[116px]`). */
  chartHeightClassName?: string;
  /** Related student whose score growth a teacher is allowed to inspect. */
  studentId?: number;
  /** Initial period without changing the student's existing weekly default. */
  initialPeriod?: GrowthPeriod;
  /** Selects the first available course once options load. */
  defaultToFirstCourse?: boolean;
}) {
  const t = useTranslations("GrowthCard");
  const locale = useLocale();
  const [period, setPeriod] = useState<GrowthPeriod>(initialPeriod);
  const [courseSlug, setCourseSlug] = useState<string>("");
  const [data, setData] = useState<NormalizedGrowth | null>(null);

  useEffect(() => {
    let cancelled = false;
    const request: Promise<NormalizedGrowth> =
      metric === "enrollments"
        ? getEnrollmentGrowth({ course: courseSlug || undefined, period }).then((res) => ({
            summaryLabel: t("newStudents"),
            summaryValue: res.total,
            points: res.points,
            courses: res.courses,
            scaleMin: 0,
            scaleMax: Math.max(1, ...res.points.map((p) => p.value)),
          }))
        : getGrowth({ course: courseSlug || undefined, period, studentId }).then((res) => ({
            summaryLabel: t("averageScore"),
            summaryValue: res.average,
            points: res.points,
            courses: res.courses,
            scaleMin: 1,
            scaleMax: 5,
          }));

    request
      .then((res) => {
        if (!cancelled) {
          setData(res);
          if (defaultToFirstCourse && !courseSlug && res.courses[0]) {
            setCourseSlug(res.courses[0].slug);
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setData({
            summaryLabel: metric === "enrollments" ? t("newStudents") : t("averageScore"),
            summaryValue: 0,
            points: [],
            courses: [],
            scaleMin: metric === "enrollments" ? 0 : 1,
            scaleMax: metric === "enrollments" ? 1 : 5,
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [period, courseSlug, metric, studentId, defaultToFirstCourse, t]);

  const courseOptions: Option[] = [
    { value: "", label: t("allCourses") },
    ...(data?.courses.map((c) => ({ value: c.slug, label: c.title })) ?? []),
  ];
  const periodOptions: Option[] = [
    { value: "weekly", label: t("weekly") },
    { value: "yearly", label: t("yearly") },
  ];

  const points = data?.points ?? [];
  const scaleMin = data?.scaleMin ?? (metric === "enrollments" ? 0 : 1);
  const scaleMax = data?.scaleMax ?? (metric === "enrollments" ? 1 : 5);
  const isIntegerScale = Number.isInteger(scaleMin) && Number.isInteger(scaleMax);
  const lineD = points
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"}${xFor(i, points.length)} ${yFor(p.value, scaleMin, scaleMax)}`,
    )
    .join(" ");
  const areaD =
    points.length > 0
      ? `${lineD} L${xFor(points.length - 1, points.length)} ${CHART_Y_BASE} L${xFor(0, points.length)} ${CHART_Y_BASE} Z`
      : "";
  const labelFontSize = points.length > 6 ? 8 : 10;
  const summaryLabel =
    data?.summaryLabel ?? (metric === "enrollments" ? t("newStudents") : t("averageScore"));
  const yAxisSteps = [4, 3, 2, 1, 0].map((step) => {
    const value = scaleMin + ((scaleMax - scaleMin) * step) / 4;
    return isIntegerScale ? Math.round(value) : Number(value.toFixed(1));
  });

  return (
    <Card className={cardClassName}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-base font-bold text-black">{t("heading")}</h2>
        <div className="flex items-center gap-3">
          <Dropdown value={courseSlug} options={courseOptions} onChange={setCourseSlug} />
          <Dropdown
            value={period}
            options={periodOptions}
            onChange={(v) => setPeriod(v as GrowthPeriod)}
          />
        </div>
      </div>

      <div className="mb-2 rounded bg-[#edf1ff] px-2 py-1.5 text-xs font-bold text-[#003aff]">
        {summaryLabel}: {data ? data.summaryValue : "—"}
      </div>

      <div className={`relative ${chartHeightClassName}`}>
        {data && points.length > 0 && (
          <svg
            className="h-full w-full"
            viewBox="0 0 640 130"
            preserveAspectRatio="none"
            role="img"
            aria-label={t("chartAriaLabel")}
          >
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
            <path d={areaD} fill="url(#growthFill)" />
            <path d={lineD} fill="none" stroke="#a7bafa" strokeWidth="2" />
            {yAxisSteps.map((value, index) => (
              <text key={index} x="8" y={22 + index * 24} fill="#5e5e5e" fontSize="11">
                {value}
              </text>
            ))}
            {points.map((p, index) => (
              <text
                key={`${p.date}-${index}`}
                x={xFor(index, points.length)}
                y="128"
                textAnchor={index === 0 ? "start" : index === points.length - 1 ? "end" : "middle"}
                fill="#5e5e5e"
                fontSize={labelFontSize}
              >
                {pointLabel(p, locale)}
              </text>
            ))}
          </svg>
        )}
      </div>
    </Card>
  );
}
