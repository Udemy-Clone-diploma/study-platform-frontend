"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { getCategories, type Category } from "@/entities/course";

interface DirectionsPickerProps {
  value: number[];
  onChange: (value: number[]) => void;
}

/** Multi-select of course categories ("directions") the applicant wants to teach. Moderator-review-only, not saved to the profile. */
export function DirectionsPicker({ value, onChange }: DirectionsPickerProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const t = useTranslations("TeacherApplication");
  const locale = useLocale();

  useEffect(() => {
    let cancelled = false;
    getCategories(locale)
      .then((data) => {
        if (!cancelled) setCategories(data);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  function toggle(id: number) {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  }

  return (
    <div className="space-y-2 text-left">
      <span className="block text-[1.1rem] font-medium tracking-[0.01em] text-[#1a171b]">
        {t("directionsLabel")}
      </span>
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const selected = value.includes(category.id);
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => toggle(category.id)}
              aria-pressed={selected}
              className={`rounded-full border px-4 py-1.5 text-sm transition ${
                selected
                  ? "border-black bg-black text-white"
                  : "border-black/25 text-[#1a171b] hover:border-black/50"
              }`}
            >
              {category.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
