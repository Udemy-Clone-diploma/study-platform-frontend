"use client";

import { useId } from "react";
import Link from "next/link";
import { Astroid, ChevronDown } from "lucide-react";
import type { CourseModule } from "@/entities/course";
import { byOrder } from "@/entities/course";

type Props = {
  courseModule: CourseModule;
  slug: string;
  isOpen: boolean;
  onToggle: () => void;
  /** Lesson IDs the student has already completed; drives the filled-star marker. */
  completedLessonIds?: number[];
};

/** Parent-controlled module accordion; lessons link into the player, completed ones get a filled astroid. */
export function LearnCurriculumModule({
  courseModule,
  slug,
  isOpen,
  onToggle,
  completedLessonIds = [],
}: Props) {
  const panelId = useId();
  const headerId = useId();
  const completed = new Set(completedLessonIds);

  return (
    <div className="flex w-full flex-col border-b border-(--color-text-primary) last:border-b-0">
      <button
        type="button"
        id={headerId}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={onToggle}
        className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-lg px-2 py-5 text-left transition-colors hover:bg-(--color-brand-lavender)/15 sm:py-6"
      >
        <span className="inline-flex flex-shrink-0 items-center justify-center rounded-[20px] bg-(--color-brand-lavender-soft) px-3 py-0.5 font-(family-name:--font-base) text-base font-semibold text-(--color-blue) sm:text-xl">
          Module {courseModule.order}
        </span>
        <span className="flex-1 font-(family-name:--font-base) text-base font-semibold text-(--color-text-primary) sm:text-xl">
          {courseModule.title}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`h-6 w-6 flex-shrink-0 text-(--color-text-primary) transition-transform duration-300 sm:h-8 sm:w-8 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <div
        id={panelId}
        role="region"
        aria-labelledby={headerId}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <ul className="flex w-full flex-col gap-1 pb-5 pl-[91px] sm:pb-6">
            {byOrder(courseModule.lessons).map((lesson) => {
              const isDone = completed.has(lesson.id);
              return (
                <li key={lesson.id}>
                  <Link
                    href={`/learn/${slug}/${lesson.id}`}
                    className="group flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md px-1 py-1 text-base text-(--color-text-primary) transition-colors hover:bg-(--color-brand-lavender)/15 sm:text-lg lg:text-xl"
                  >
                    <Astroid
                      aria-hidden="true"
                      className="h-3.5 w-3.5 flex-shrink-0 text-(--color-text-primary)"
                      fill="currentColor"
                      opacity={isDone ? 1 : 0.85}
                    />
                    <span className="min-w-0">
                      Lesson {lesson.order}: {lesson.title}.
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
