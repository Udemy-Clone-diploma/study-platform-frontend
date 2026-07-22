"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export type PillSelectOption = { value: string; label: string };

type PillSelectProps = {
  value: string;
  options: PillSelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  /** Optional leading icon rendered before the label (e.g. a filter-type icon). */
  icon?: ReactNode;
};

/**
 * Rounded pill dropdown shared by the course/type/group filter rows on
 * Students, Attendance, Gradebook and Homework — keeps that look identical
 * everywhere instead of each page re-implementing its own variant.
 */
export function PillSelect({
  value,
  options,
  onChange,
  disabled = false,
  placeholder,
  ariaLabel,
  className = "",
  icon,
}: PillSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => !disabled && setOpen((p) => !p)}
        className="flex items-center gap-[10px] bg-white text-(--color-text-primary) transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
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
        {icon}
        <span className="min-w-0 truncate">{selected?.label ?? placeholder ?? options[0]?.label}</span>
        <ChevronDown
          aria-hidden="true"
          style={{
            width: "clamp(14px, 1.11vw, 16px)",
            height: "clamp(14px, 1.11vw, 16px)",
            flexShrink: 0,
            transition: "transform 0.15s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 z-50 overflow-hidden bg-white"
          style={{
            top: "calc(100% + 6px)",
            minWidth: "clamp(160px, 14vw, 260px)",
            borderRadius: 16,
            boxShadow: "var(--shadow-sort-dropdown)",
          }}
        >
          <ul
            role="listbox"
            aria-label={ariaLabel}
            className="overflow-y-auto"
            style={{ padding: "4px 0", listStyle: "none", margin: 0, maxHeight: 240 }}
          >
            {options.map((option) => (
              <li key={option.value} role="option" aria-selected={option.value === value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className="w-full text-left transition-colors hover:text-(--color-blue)"
                  style={{
                    display: "block",
                    padding: "clamp(6px, 0.56vw, 8px) clamp(12px, 1.11vw, 16px)",
                    fontFamily: "var(--font-base)",
                    fontSize: "clamp(13px, 1.11vw, 18px)",
                    color: option.value === value ? "var(--color-blue)" : "var(--color-text-primary)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
