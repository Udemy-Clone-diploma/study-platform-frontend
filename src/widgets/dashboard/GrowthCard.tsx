"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { getGrowth } from "@/entities/homework";
import type { GrowthData, GrowthPeriod } from "@/entities/homework";
import { Card } from "./DashboardOverview";

const CHART_X0 = 36;
const CHART_X1 = 628;
const CHART_Y_TOP = 18;
const CHART_Y_BASE = 114;

function yFor(value: number): number {
  return CHART_Y_BASE - ((value - 1) / 4) * (CHART_Y_BASE - CHART_Y_TOP);
}

function xFor(index: number, count: number): number {
  if (count <= 1) return CHART_X0;
  return CHART_X0 + (index * (CHART_X1 - CHART_X0)) / (count - 1);
}

type Option = { value: string; label: string };

function Dropdown({ value, options, onChange }: {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
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
        onClick={() => setOpen((current) => !current)}
        className="flex h-6 max-w-[140px] items-center gap-1 rounded-full px-2 text-[10px] font-medium text-black transition-colors hover:text-[#003aff]"
      >
        <span className="truncate">{active?.label}</span>
        <ChevronDown
          aria-hidden="true"
          className={`h-3 w-3 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-20 mt-1 flex max-h-56 w-48 flex-col overflow-y-auto rounded-xl bg-white p-2 shadow-[0_6px_18px_rgba(0,0,0,0.16)]"
        >
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
      )}
    </div>
  );
}

/** Real-data "Growth" widget: average reviewed-homework score over time, filterable by course and period. */
export function GrowthCard() {
  const [period, setPeriod] = useState<GrowthPeriod>("weekly");
  const [courseSlug, setCourseSlug] = useState<string>("");
  const [data, setData] = useState<GrowthData | null>(null);

  useEffect(() => {
    let cancelled = false;
    getGrowth({ course: courseSlug || undefined, period })
      .then((res) => { if (!cancelled) setData(res); })
      .catch(() => { if (!cancelled) setData({ average: 0, points: [], courses: [] }); });
    return () => { cancelled = true; };
  }, [period, courseSlug]);

  const courseOptions: Option[] = [
    { value: "", label: "All courses" },
    ...(data?.courses.map((c) => ({ value: c.slug, label: c.title })) ?? []),
  ];
  const periodOptions: Option[] = [
    { value: "weekly", label: "Weekly" },
    { value: "yearly", label: "Yearly" },
  ];

  const points = data?.points ?? [];
  const lineD = points.map((p, i) => `${i === 0 ? "M" : "L"}${xFor(i, points.length)} ${yFor(p.value)}`).join(" ");
  const areaD = points.length > 0
    ? `${lineD} L${xFor(points.length - 1, points.length)} ${CHART_Y_BASE} L${xFor(0, points.length)} ${CHART_Y_BASE} Z`
    : "";
  const labelFontSize = points.length > 6 ? 8 : 10;

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-base font-bold text-black">Growth</h2>
        <div className="flex items-center gap-3">
          <Dropdown value={courseSlug} options={courseOptions} onChange={setCourseSlug} />
          <Dropdown value={period} options={periodOptions} onChange={(v) => setPeriod(v as GrowthPeriod)} />
        </div>
      </div>

      <div className="mb-2 rounded bg-[#edf1ff] px-2 py-1.5 text-xs font-bold text-[#003aff]">
        Average score: {data ? data.average : "—"}
      </div>

      <div className="relative h-[116px]">
        {data && points.length > 0 && (
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
            <path d={areaD} fill="url(#growthFill)" />
            <path d={lineD} fill="none" stroke="#a7bafa" strokeWidth="2" />
            {[5, 4, 3, 2, 1].map((value, index) => (
              <text key={value} x="8" y={22 + index * 24} fill="#5e5e5e" fontSize="11">
                {value}
              </text>
            ))}
            {points.map((p, index) => (
              <text
                key={`${p.label}-${index}`}
                x={xFor(index, points.length)}
                y="128"
                textAnchor="middle"
                fill="#5e5e5e"
                fontSize={labelFontSize}
              >
                {p.label}
              </text>
            ))}
          </svg>
        )}
      </div>
    </Card>
  );
}
