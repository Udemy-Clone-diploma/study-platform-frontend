"use client";

import { useEffect, useRef, useState } from "react";
import { Check, RefreshCw, Search, SlidersHorizontal } from "lucide-react";
import { AddButton } from "@/shared/ui/AddButton";

export type StatusFilter = "active" | "inactive" | "blocked" | "deleted" | null;

const STATUS_OPTIONS: { label: string; value: StatusFilter }[] = [
  { label: "All statuses", value: null },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Blocked", value: "blocked" },
  { label: "Deleted", value: "deleted" },
];

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  status: StatusFilter;
  onStatusChange: (value: StatusFilter) => void;
  onRefresh: () => void;
  refreshing: boolean;
  onAddUser: () => void;
};

export function UsersToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  onRefresh,
  refreshing,
  onAddUser,
}: Props) {
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

  const activeStatusLabel = STATUS_OPTIONS.find(
    (o) => o.value === status && o.value !== null,
  )?.label;

  return (
    <div
      className="flex flex-wrap items-center justify-between"
      style={{ gap: "clamp(12px, 1.11vw, 16px)" }}
    >
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
            placeholder="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-w-0 flex-1 bg-transparent outline-none"
            style={{
              fontFamily: "var(--font-base)",
              fontSize: "clamp(14px, 1.11vw, 18px)",
              color: "var(--color-text-primary)",
            }}
            aria-label="Search users"
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
            {activeStatusLabel ?? "All Filter"}
          </button>

          {filterOpen && (
            <div
              className="absolute left-0 z-40 rounded-xl bg-white"
              style={{
                top: "calc(100% + 6px)",
                minWidth: 200,
                padding: "10px 0",
                boxShadow: "var(--shadow-sort-dropdown)",
              }}
            >
              <FilterGroup
                heading="Status"
                options={STATUS_OPTIONS}
                selected={status}
                onSelect={(value) => {
                  onStatusChange(value);
                  setFilterOpen(false);
                }}
              />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onRefresh}
          title="Refresh user list"
          aria-label="Refresh user list"
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
      </div>

      <AddButton onClick={onAddUser}>Add user</AddButton>
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
          className="flex w-full cursor-pointer items-center justify-between bg-transparent text-left transition hover:bg-(--color-brand-lavender-soft)"
          style={{
            border: "none",
            padding: "7px 14px",
            fontFamily: "var(--font-base)",
            fontSize: "clamp(13px, 0.97vw, 15px)",
            color: option.value === selected ? "var(--color-blue)" : "var(--color-text-primary)",
          }}
        >
          {option.label}
          {option.value === selected && <Check size={14} aria-hidden="true" />}
        </button>
      ))}
    </div>
  );
}
