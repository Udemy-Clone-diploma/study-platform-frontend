"use client";

import { useId, useState } from "react";
import { Astroid, ChevronDown } from "lucide-react";
import type { CourseModule } from "@/entities/course";

type Props = { courseModule: CourseModule };

/** Accordion row for a course module. Module pill + title on the left, chevron on the right; expands to a list of lessons. */
export function CourseModuleItem({ courseModule }: Props) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const headerId = useId();

  return (
    <div className="flex flex-col gap-5 border-b border-(--color-text-primary) py-6 last:border-b-0">
      <button
        type="button"
        id={headerId}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 text-left"
      >
        <span className="inline-flex flex-shrink-0 items-center justify-center rounded-[20px] bg-(--color-brand-lavender-soft) px-3 py-0.5 text-xl font-semibold text-(--color-blue)">
          Module {courseModule.order}
        </span>
        <span className="flex-1 text-xl font-semibold text-(--color-text-primary)">
          {courseModule.title}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`h-8 w-8 flex-shrink-0 text-(--color-text-primary) transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul
          id={panelId}
          role="region"
          aria-labelledby={headerId}
          className="ml-auto flex w-full max-w-[849px] flex-col gap-1"
        >
          {courseModule.lessons.map((lesson) => (
            <li
              key={lesson.id}
              className="flex items-center gap-3 text-xl text-(--color-text-primary)"
            >
              <Astroid
                aria-hidden="true"
                className="h-3.5 w-3.5 flex-shrink-0 text-(--color-text-primary)"
                fill="currentColor"
              />
              <span className="flex-1">
                Lesson {lesson.order}: {lesson.title}.
              </span>
              {lesson.is_preview && (
                <span className="flex-shrink-0 rounded-full bg-(--color-catalog-highlight) px-3 py-0.5 font-(family-name:--font-accent) text-sm uppercase text-(--color-blue)">
                  Free preview
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
