"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, RefreshCw, Search, SlidersHorizontal } from "lucide-react";
import { AddButton } from "@/shared/ui/AddButton";

type CourseOption = { label: string; value: string };

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  courses: CourseOption[];
  course: string | null;
  onCourseChange: (value: string | null) => void;
  onRefresh: () => void;
  refreshing: boolean;
  onIssue: () => void;
};

export function CertificatesToolbar({
  search,
  onSearchChange,
  courses,
  course,
  onCourseChange,
  onRefresh,
  refreshing,
  onIssue,
}: Props) {
  const t = useTranslations("CertificatesToolbar");
  const [query, setQuery] = useState(search);
  const [prevSearch, setPrevSearch] = useState(search);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  if (search !== prevSearch) {
    setPrevSearch(search);
    setQuery(search);
  }

  useEffect(() => {
    if (query === search) return;
    const timer = setTimeout(() => onSearchChange(query), 400);
    return () => clearTimeout(timer);
  }, [query, search, onSearchChange]);

  useEffect(() => {
    if (!filterOpen) return;
    function onOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [filterOpen]);

  const courseOptions: { label: string; value: string | null }[] = [
    { label: t("allCoursesOption"), value: null },
    ...courses,
  ];
  const activeCourseLabel = courseOptions.find(
    (o) => o.value === course && o.value !== null,
  )?.label;

  return (
    <div className="flex flex-wrap items-center" style={{ gap: "clamp(12px, 1.94vw, 28px)" }}>
      <label
        className="gradient-border flex cursor-text items-center gap-2"
        style={{
          minWidth: "clamp(200px, 17vw, 330px)",
          height: "clamp(40px, 3.33vw, 48px)",
          borderRadius: 40,
          padding: "clamp(6px, 0.56vw, 8px) clamp(14px, 1.25vw, 20px)",
        }}
      >
        <Search
          aria-hidden="true"
          className="shrink-0 text-(--color-text-secondary)"
          style={{ width: "clamp(16px, 1.39vw, 20px)", height: "clamp(16px, 1.39vw, 20px)" }}
        />
        <input
          type="search"
          placeholder={t("searchPlaceholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="min-w-0 flex-1 bg-transparent outline-none"
          style={{
            fontFamily: "var(--font-base)",
            fontSize: "clamp(14px, 1.11vw, 18px)",
            color: "var(--color-text-primary)",
          }}
          aria-label={t("searchAriaLabel")}
        />
      </label>

      <div ref={filterRef} className="relative">
        <button
          type="button"
          onClick={() => setFilterOpen((open) => !open)}
          aria-expanded={filterOpen}
          className="flex cursor-pointer items-center gap-1.5 rounded-full bg-white transition hover:opacity-80"
          style={{
            height: "clamp(34px, 2.78vw, 40px)",
            padding: "clamp(6px, 0.56vw, 8px) clamp(14px, 1.11vw, 16px)",
            border: "none",
            fontFamily: "var(--font-base)",
            fontSize: "clamp(14px, 1.11vw, 18px)",
            color: "var(--color-text-primary)",
          }}
        >
          <SlidersHorizontal
            aria-hidden="true"
            style={{ width: "clamp(14px, 1.11vw, 18px)", height: "clamp(14px, 1.11vw, 18px)" }}
          />
          {activeCourseLabel ?? t("allFilter")}
        </button>

        {filterOpen && (
          <div
            className="absolute left-0 z-40 rounded-xl bg-white"
            style={{
              top: "calc(100% + 6px)",
              minWidth: 220,
              maxHeight: 320,
              overflowY: "auto",
              padding: "10px 0",
              boxShadow: "var(--shadow-sort-dropdown)",
            }}
          >
            <FilterGroup
              heading={t("courseGroupHeading")}
              options={courseOptions}
              selected={course}
              onSelect={(value) => {
                onCourseChange(value);
                setFilterOpen(false);
              }}
            />
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onRefresh}
        title={t("refreshTitle")}
        aria-label={t("refreshTitle")}
        className="flex cursor-pointer items-center justify-center rounded-full bg-white text-(--color-text-primary) transition hover:opacity-80"
        style={{
          width: "clamp(34px, 2.78vw, 40px)",
          height: "clamp(34px, 2.78vw, 40px)",
          border: "none",
        }}
      >
        <RefreshCw
          aria-hidden="true"
          className={refreshing ? "animate-spin" : undefined}
          style={{ width: "clamp(14px, 1.11vw, 18px)", height: "clamp(14px, 1.11vw, 18px)" }}
        />
      </button>

      <AddButton onClick={onIssue} style={{ marginLeft: "auto" }}>
        {t("issueCertificate")}
      </AddButton>
    </div>
  );
}

function FilterGroup<T extends string | null>({
  heading,
  options,
  selected,
  onSelect,
}: {
  heading: string;
  options: { label: string; value: T }[];
  selected: T;
  onSelect: (value: T) => void;
}) {
  return (
    <div>
      <p
        className="font-semibold text-(--color-text-secondary) uppercase"
        style={{
          fontFamily: "var(--font-base)",
          fontSize: "clamp(10px, 0.69vw, 11px)",
          letterSpacing: "0.06em",
          margin: "0 0 4px",
          padding: "0 14px",
        }}
      >
        {heading}
      </p>
      {options.map((option) => (
        <button
          key={option.label}
          type="button"
          onClick={() => onSelect(option.value)}
          className="flex w-full cursor-pointer items-center justify-between gap-2 bg-transparent text-left transition hover:bg-(--color-brand-lavender-soft)"
          style={{
            border: "none",
            padding: "7px 14px",
            fontFamily: "var(--font-base)",
            fontSize: "clamp(13px, 0.97vw, 15px)",
            color: option.value === selected ? "var(--color-blue)" : "var(--color-text-primary)",
          }}
        >
          <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
            {option.label}
          </span>
          {option.value === selected && <Check size={14} className="shrink-0" aria-hidden="true" />}
        </button>
      ))}
    </div>
  );
}
