"use client";

import { LOCALE_OPTIONS } from "@/shared/lib/useLocaleSwitcher";

type Props = {
  active: string;
  onChange: (locale: string) => void;
  /** Locales with a non-empty value get a filled dot so admins can see what's translated at a glance. */
  filled?: Record<string, boolean>;
  requiredLocale?: string;
};

/** Tab strip for switching between per-locale fields in an admin edit form (e.g. category name/description). */
export function LocaleTabs({ active, onChange, filled, requiredLocale = "en" }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5" role="tablist">
      {LOCALE_OPTIONS.map((option) => {
        const isActive = option.value === active;
        const isFilled = filled?.[option.value];
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.value)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase transition ${
              isActive
                ? "border-black bg-black text-white"
                : "border-gray-300 text-gray-500 hover:border-black/50"
            }`}
          >
            {option.value}
            {option.value === requiredLocale ? (
              <span className={isActive ? "text-white" : "text-red-500"}>*</span>
            ) : (
              <span
                aria-hidden="true"
                className={`h-1.5 w-1.5 rounded-full ${
                  isFilled ? (isActive ? "bg-white" : "bg-black") : "bg-gray-300"
                }`}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
