"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { Astroid, ChevronDown } from "lucide-react";
import type { PublicCourseModule } from "@/entities/course";
import { PRICING_ANCHOR_ID } from "./pricingAnchor";

type Props = { courseModule: PublicCourseModule; slug: string; hasPricing: boolean };

/** Accordion row for a course module. Module pill + title on the left, chevron on the right; expands to a list of lessons. */
export function CourseModuleItem({ courseModule, slug, hasPricing }: Props) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const headerId = useId();

  const scrollToPricing = () =>
    document
      .getElementById(PRICING_ANCHOR_ID)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="flex flex-col gap-4 border-b border-(--color-text-primary) py-5 last:border-b-0 sm:gap-5 sm:py-6">
      <button
        type="button"
        id={headerId}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 text-left"
      >
        <span className="inline-flex flex-shrink-0 items-center justify-center rounded-[20px] bg-(--color-brand-lavender-soft) px-3 py-0.5 text-base font-semibold text-(--color-blue) sm:text-xl">
          Module {courseModule.order}
        </span>
        <span className="flex-1 text-base font-semibold text-(--color-text-primary) sm:text-xl">
          {courseModule.title}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`h-6 w-6 flex-shrink-0 text-(--color-text-primary) transition-transform sm:h-8 sm:w-8 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul
          id={panelId}
          role="region"
          aria-labelledby={headerId}
          className="flex w-full max-w-[849px] flex-col gap-1 lg:ml-auto"
        >
          {courseModule.lessons.map((lesson) => {
            const label = (
              <>
                <Astroid
                  aria-hidden="true"
                  className="h-3.5 w-3.5 flex-shrink-0 text-current"
                  fill="currentColor"
                />
                <span className="min-w-0 flex-1">
                  Lesson {lesson.order}: {lesson.title}.
                </span>
                {lesson.is_preview && (
                  <span className="flex-shrink-0 rounded-full bg-(--color-catalog-highlight) px-3 py-0.5 font-(family-name:--font-accent) text-xs uppercase text-(--color-blue) sm:text-sm">
                    Free preview
                  </span>
                )}
                {lesson.is_mandatory && (
                  <span className="flex-shrink-0 rounded-full bg-(--color-brand-yellow) px-3 py-0.5 font-(family-name:--font-accent) text-xs uppercase text-(--color-text-primary) sm:text-sm">
                    Mandatory
                  </span>
                )}
              </>
            );
            const row =
              "flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-3 py-2 text-base sm:text-lg lg:text-xl";
            const interactive = `w-full text-left transition-colors hover:bg-(--color-catalog-highlight) ${row}`;

            return (
              <li key={lesson.id} className="text-(--color-text-primary)">
                {lesson.is_preview ? (
                  <Link href={`/learn/${slug}/${lesson.id}`} className={interactive}>
                    {label}
                  </Link>
                ) : hasPricing ? (
                  <button type="button" onClick={scrollToPricing} className={interactive}>
                    {label}
                  </button>
                ) : (
                  <div className={row}>{label}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
