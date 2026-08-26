"use client";

import type { KeyboardEvent } from "react";

export type FinanceTabKey = "stats" | "payments" | "payouts";

type Props = {
  tabs: readonly { key: FinanceTabKey; label: string }[];
  active: FinanceTabKey;
  onChange: (key: FinanceTabKey) => void;
  ariaLabel: string;
};

export function FinanceTabs({ tabs, active, onChange, ariaLabel }: Props) {
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (step === 0) return;
    event.preventDefault();
    const index = tabs.findIndex((tab) => tab.key === active);
    const next = (index + step + tabs.length) % tabs.length;
    onChange(tabs[next].key);
    event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  }

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      className="flex flex-wrap rounded-full bg-white"
      style={{ padding: 4, gap: 4 }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          id={`finance-tab-${tab.key}`}
          aria-selected={tab.key === active}
          aria-controls={`finance-panel-${tab.key}`}
          tabIndex={tab.key === active ? 0 : -1}
          onClick={() => onChange(tab.key)}
          className="cursor-pointer rounded-full border-none transition"
          style={{
            padding: "8px 20px",
            fontFamily: "var(--font-base)",
            fontSize: "clamp(13px, 1.11vw, 16px)",
            fontWeight: tab.key === active ? 600 : 400,
            background: tab.key === active ? "var(--color-brand-lavender-soft)" : "transparent",
            color: tab.key === active ? "var(--color-blue)" : "var(--color-text-secondary)",
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
