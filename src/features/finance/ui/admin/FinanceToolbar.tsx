"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  CalendarDays,
  Check,
  ChevronDown,
  RefreshCw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { DatePicker } from "@/shared/ui/DatePicker";
import { formatDate } from "@/shared/lib/time";
import type { PaymentMethod, PaymentStatus } from "@/entities/payment";
import { getPaymentStatusOptions } from "./PaymentStatusBadge";

const CONTROL_HEIGHT = "clamp(34px, 2.78vw, 40px)";
const ICON_SIZE = { width: "clamp(14px, 1.11vw, 18px)", height: "clamp(14px, 1.11vw, 18px)" };

export type RefundFilter = "true" | "false" | null;

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  status: PaymentStatus | null;
  onStatusChange: (value: PaymentStatus | null) => void;
  method: PaymentMethod | null;
  onMethodChange: (value: PaymentMethod | null) => void;
  refunds: RefundFilter;
  onRefundsChange: (value: RefundFilter) => void;
  from: string;
  to: string;
  onDateChange: (updates: { from?: string; to?: string }) => void;
  onRefresh: () => void;
  refreshing: boolean;
};

export function FinanceToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  method,
  onMethodChange,
  refunds,
  onRefundsChange,
  from,
  to,
  onDateChange,
  onRefresh,
  refreshing,
}: Props) {
  const t = useTranslations("FinanceToolbar");
  const tCommon = useTranslations("Common");
  const tStatus = useTranslations("PaymentStatusBadge");
  const locale = useLocale();

  const STATUS_OPTIONS: { label: string; value: PaymentStatus | null }[] = [
    { label: t("allStatuses"), value: null },
    ...getPaymentStatusOptions(tStatus),
  ];

  const METHOD_OPTIONS: { label: string; value: PaymentMethod | null }[] = [
    { label: t("allMethods"), value: null },
    { label: t("methodStripe"), value: "stripe" },
    { label: t("methodLiqPay"), value: "liqpay" },
    { label: t("methodManual"), value: "manual" },
  ];

  const REFUND_OPTIONS: { label: string; value: RefundFilter }[] = [
    { label: t("any"), value: null },
    { label: t("refundHasRefund"), value: "true" },
    { label: t("refundNoRefund"), value: "false" },
  ];

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
  const activeMethodLabel = METHOD_OPTIONS.find(
    (o) => o.value === method && o.value !== null,
  )?.label;
  const activeRefundLabel = REFUND_OPTIONS.find(
    (o) => o.value === refunds && o.value !== null,
  )?.label;
  const filterLabel = [activeStatusLabel, activeMethodLabel, activeRefundLabel]
    .filter(Boolean)
    .join(", ");

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
          placeholder={tCommon("search")}
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
            height: CONTROL_HEIGHT,
            padding: "clamp(6px, 0.56vw, 8px) clamp(14px, 1.11vw, 16px)",
            border: "none",
            fontFamily: "var(--font-base)",
            fontSize: "clamp(14px, 1.11vw, 18px)",
            color: "var(--color-text-primary)",
          }}
        >
          <SlidersHorizontal aria-hidden="true" style={ICON_SIZE} />
          {filterLabel || t("allFilter")}
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
              heading={t("statusGroupHeading")}
              options={STATUS_OPTIONS}
              selected={status}
              onSelect={(value) => {
                onStatusChange(value);
                setFilterOpen(false);
              }}
            />
            <div
              className="bg-(--color-border-light)"
              style={{ height: 1, margin: "8px 0" }}
              aria-hidden="true"
            />
            <FilterGroup
              heading={t("methodGroupHeading")}
              options={METHOD_OPTIONS}
              selected={method}
              onSelect={(value) => {
                onMethodChange(value);
                setFilterOpen(false);
              }}
            />
            <div
              className="bg-(--color-border-light)"
              style={{ height: 1, margin: "8px 0" }}
              aria-hidden="true"
            />
            <FilterGroup
              heading={t("refundsGroupHeading")}
              options={REFUND_OPTIONS}
              selected={refunds}
              onSelect={(value) => {
                onRefundsChange(value);
                setFilterOpen(false);
              }}
            />
          </div>
        )}
      </div>

      <DateRangeFilter from={from} to={to} onDateChange={onDateChange} locale={locale} />

      <RefreshButton onRefresh={onRefresh} refreshing={refreshing} />
    </div>
  );
}

export function RefreshButton({
  onRefresh,
  refreshing,
}: {
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const t = useTranslations("FinanceToolbar");

  return (
    <button
      type="button"
      onClick={onRefresh}
      title={t("refreshTitle")}
      aria-label={t("refreshTitle")}
      className="flex cursor-pointer items-center justify-center rounded-full bg-white text-(--color-text-primary) transition hover:opacity-80"
      style={{ width: CONTROL_HEIGHT, height: CONTROL_HEIGHT, border: "none" }}
    >
      <RefreshCw
        aria-hidden="true"
        className={refreshing ? "animate-spin" : undefined}
        style={ICON_SIZE}
      />
    </button>
  );
}

export function DateRangeFilter({
  from,
  to,
  onDateChange,
  locale,
}: {
  from: string;
  to: string;
  onDateChange: (updates: { from?: string; to?: string }) => void;
  locale: string;
}) {
  const t = useTranslations("FinanceToolbar");
  const tTeacherPayments = useTranslations("TeacherPaymentsPage");
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

  const formatShort = (iso: string) =>
    formatDate(iso, locale, { day: "2-digit", month: "2-digit", year: "2-digit" });

  const label =
    from || to
      ? `${from ? formatShort(from) : t("any")} ${t("dateRangeJoiner")} ${to ? formatShort(to) : t("any")}`
      : t("anyDate");

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="flex cursor-pointer items-center gap-1.5 rounded-full bg-white transition hover:opacity-80"
        style={{
          height: CONTROL_HEIGHT,
          padding: "clamp(6px, 0.56vw, 8px) clamp(14px, 1.11vw, 16px)",
          border: "none",
          fontFamily: "var(--font-base)",
          fontSize: "clamp(14px, 1.11vw, 18px)",
          color: "var(--color-text-primary)",
          whiteSpace: "nowrap",
        }}
      >
        <CalendarDays aria-hidden="true" style={ICON_SIZE} />
        {label}
        <ChevronDown
          aria-hidden="true"
          style={{ ...ICON_SIZE, transition: "transform 0.15s" }}
          className={open ? "rotate-180" : undefined}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 z-40 flex flex-col rounded-xl bg-white"
          style={{
            top: "calc(100% + 6px)",
            gap: 12,
            padding: 16,
            boxShadow: "var(--shadow-sort-dropdown)",
          }}
        >
          <div className="flex" style={{ gap: 16 }}>
            <DatePicker
              value={from}
              onChange={(value) => onDateChange({ from: value })}
              label={tTeacherPayments("fromLabel")}
              max={to || undefined}
              size="sm"
            />
            <DatePicker
              value={to}
              onChange={(value) => onDateChange({ to: value })}
              label={tTeacherPayments("toLabel")}
              min={from || undefined}
              size="sm"
            />
          </div>
          {(from || to) && (
            <button
              type="button"
              onClick={() => onDateChange({ from: "", to: "" })}
              className="cursor-pointer self-start border-none bg-transparent p-0 text-(--color-blue) hover:underline"
              style={{ fontFamily: "var(--font-base)", fontSize: "clamp(12px, 0.83vw, 14px)" }}
            >
              {tTeacherPayments("clear")}
            </button>
          )}
        </div>
      )}
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
