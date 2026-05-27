"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Props = {
  initialMin?: string;
  initialMax?: string;
};

/**
 * Min/Max price inputs that push to the URL on submit. Mirrors the URL-driven
 * pattern used by CourseSearch so the rest of the sidebar (which is server-rendered
 * and reads from the URL) stays in sync after submission. The `initialMin/Max`
 * props seed the inputs on first render only; the inputs become user-driven
 * after that and only reset on full unmount/remount.
 */
export function PriceRangeFilter({ initialMin = "", initialMax = "" }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [minValue, setMinValue] = useState(initialMin);
  const [maxValue, setMaxValue] = useState(initialMax);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const params = new URLSearchParams(searchParams.toString());
    const min = minValue.trim();
    const max = maxValue.trim();

    if (min) params.set("price_min", min);
    else params.delete("price_min");

    if (max) params.set("price_max", max);
    else params.delete("price_max");

    params.set("filters", "open");
    params.delete("page");

    router.push(`?${params.toString()}`, { scroll: false });
  }

  return (
    <form onSubmit={submit} className="space-y-2 ml-5">
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="0"
          step="1"
          inputMode="decimal"
          value={minValue}
          onChange={(event) => setMinValue(event.target.value)}
          placeholder="Min"
          aria-label="Minimum price"
          className="h-8 w-full rounded-[4px] border border-(--color-brand-lavender) bg-white px-2 text-[0.73rem] text-(--color-text-primary) outline-none focus:border-(--color-blue)"
        />
        <span aria-hidden="true" className="text-[0.73rem] text-(--color-text-secondary)">
          –
        </span>
        <input
          type="number"
          min="0"
          step="1"
          inputMode="decimal"
          value={maxValue}
          onChange={(event) => setMaxValue(event.target.value)}
          placeholder="Max"
          aria-label="Maximum price"
          className="h-8 w-full rounded-[4px] border border-(--color-brand-lavender) bg-white px-2 text-[0.73rem] text-(--color-text-primary) outline-none focus:border-(--color-blue)"
        />
      </div>
      <button
        type="submit"
        className="h-8 w-full rounded-[4px] bg-(--color-text-primary) text-[0.73rem] font-medium text-white transition hover:bg-black/85"
      >
        Apply
      </button>
    </form>
  );
}
