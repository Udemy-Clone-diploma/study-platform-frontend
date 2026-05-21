"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

type CollapsibleFilterSectionProps = {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
};

/** Catalog sidebar section with an expand/collapse header. */
export function CollapsibleFilterSection({
  title,
  children,
  defaultOpen = true,
}: CollapsibleFilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="space-y-3">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between text-left"
        aria-expanded={isOpen}
      >
        <h2 className="text-[0.76rem] font-medium text-(--color-text-primary)">{title}</h2>
        <ChevronDown
          aria-hidden="true"
          className={`h-5 w-5 text-(--color-text-primary) transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen ? <div className="space-y-2">{children}</div> : null}
    </section>
  );
}
