"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { CourseModule } from "@/entities/course";
import { formatLessonDuration } from "@/entities/course";

type Props = { courseModule: CourseModule };

/** Accordion row for a course module. Collapsed by default; click or Enter/Space toggles. */
export function CourseModuleItem({ courseModule }: Props) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const headerId = useId();

  return (
    <div className="flex flex-col gap-3 border-b border-(--color-text-primary)/20 pb-5">
      <button
        type="button"
        id={headerId}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between gap-3 text-left"
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-(--color-catalog-highlight) px-3 py-0.5 text-base font-semibold text-(--color-blue-dark)">
            Module {courseModule.order}
          </span>
          <span className="text-xl font-semibold text-(--color-text-primary)">
            {courseModule.title}
          </span>
        </div>
        <ChevronDown
          aria-hidden="true"
          className={`h-6 w-6 flex-shrink-0 text-(--color-text-primary) transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {courseModule.description && (
        <p className="text-base text-(--color-text-secondary)">{courseModule.description}</p>
      )}

      {open && (
        <ul
          id={panelId}
          role="region"
          aria-labelledby={headerId}
          className="mt-2 flex flex-col gap-2 pl-2"
        >
          {courseModule.lessons.map((lesson) => {
            const duration = formatLessonDuration(lesson.duration_minutes);
            return (
              <li
                key={lesson.id}
                className="flex flex-wrap items-center justify-between gap-2 text-lg text-(--color-text-primary)"
              >
                <span>
                  <span className="text-(--color-text-secondary)">Lesson {lesson.order}:</span>{" "}
                  {lesson.title}
                </span>
                {duration && (
                  <span className="font-(family-name:--font-source-code-pro) text-sm uppercase text-(--color-text-secondary)">
                    {duration}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
