"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export type SelectOption = {
  value: string;
  label: string;
};

type Props = {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Shows "Loading…" and disables the trigger. */
  disabled?: boolean;
};

/** Form select field matching the app's drawer/panel input style. */
export function SelectField({
  options,
  value,
  onChange,
  placeholder = "Select…",
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(p => !p)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          background: "transparent",
          border: "none",
          borderBottom: "1px solid var(--color-border-light)",
          padding: "6px 0",
          fontFamily: "var(--font-base)",
          fontSize: "clamp(13px, 0.85vw, 15px)",
          color: selected ? "var(--color-text-primary)" : "var(--color-text-secondary)",
          cursor: disabled ? "default" : "pointer",
          textAlign: "left",
          gap: 6,
        }}
      >
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {disabled ? "Loading…" : (selected?.label ?? placeholder)}
        </span>
        <ChevronDown
          size={14}
          style={{
            flexShrink: 0,
            transition: "transform 0.15s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            color: "var(--color-text-secondary)",
          }}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "var(--color-bg)",
            borderRadius: 10,
            boxShadow: "var(--shadow-sort-dropdown)",
            zIndex: 50,
            maxHeight: 220,
            overflowY: "auto",
            padding: "4px 0",
            listStyle: "none",
            margin: 0,
          }}
        >
          {options.map(opt => (
            <li key={opt.value} role="option" aria-selected={opt.value === value}>
              <button
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 14px",
                  fontFamily: "var(--font-base)",
                  fontSize: "clamp(12px, 0.82vw, 14px)",
                  color: opt.value === value ? "var(--color-blue)" : "var(--color-text-primary)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  transition: "color 0.12s",
                }}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
