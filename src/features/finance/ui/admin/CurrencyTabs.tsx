"use client";

import { useTranslations } from "next-intl";
import type { Currency } from "@/entities/course";

type Props = {
  currencies: readonly Currency[];
  active: Currency | null;
  onChange: (value: Currency) => void;
};

export function CurrencyTabs({ currencies, active, onChange }: Props) {
  const t = useTranslations("CurrencyTabs");
  if (currencies.length < 2) return null;

  return (
    <div
      className="flex rounded-full bg-white"
      style={{ padding: 3, gap: 2 }}
      role="group"
      aria-label={t("ariaLabel")}
    >
      {currencies.map((currency) => (
        <button
          key={currency}
          type="button"
          onClick={() => onChange(currency)}
          aria-pressed={currency === active}
          className="cursor-pointer rounded-full border-none transition"
          style={{
            padding: "5px 16px",
            fontFamily: "var(--font-base)",
            fontSize: "clamp(12px, 0.97vw, 15px)",
            background: currency === active ? "var(--color-brand-lavender-soft)" : "transparent",
            color: currency === active ? "var(--color-blue)" : "var(--color-text-secondary)",
          }}
        >
          {currency}
        </button>
      ))}
    </div>
  );
}
