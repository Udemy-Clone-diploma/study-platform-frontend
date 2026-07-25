"use client";

import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import { Check, ChevronDown } from "lucide-react";
import type { CourseModule } from "@/entities/course";
import { byOrder } from "@/entities/course";

type Props = {
  slug: string;
  courseTitle: string;
  modules: CourseModule[];
  currentModule: CourseModule | null;
  currentLessonId: number;
  lessonOrder: number;
  lessonTitle: string;
  /** Completed lesson ids; drives the popover's per-lesson ticks and overall bar. */
  completedLessonIds: number[];
};

/**
 * White pill breadcrumb for the lesson player: a clickable course link plus a
 * single Module / Lesson trigger. Clicking it toggles one curriculum popover
 * (every module and lesson, current one highlighted, completion shown); hovering
 * the trigger restyles the whole Module + Lesson label so it reads as clickable.
 */
export function LessonBreadcrumb({
  slug,
  courseTitle,
  modules,
  currentModule,
  currentLessonId,
  lessonOrder,
  lessonTitle,
  completedLessonIds,
}: Props) {
  const sortedModules = byOrder(modules);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click, focus leaving the popover, or Escape.
  useEffect(() => {
    if (!open) return;
    const outside = (e: Event) =>
      containerRef.current && !containerRef.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", outside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("focusin", outside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = () => setOpen((o) => !o);

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex w-full items-center gap-1.5 rounded-[20px] bg-white px-6 py-3 font-(family-name:--font-base) text-lg font-semibold text-(--color-text-primary) shadow-[0_0_11.45px_var(--shadow-pink)]"
    >
      <Link
        href={`/learn/${slug}`}
        className="group inline-flex max-w-[38%] shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 transition-colors hover:bg-(--color-brand-lavender)/20"
      >
        <span className="shrink-0 text-(--color-text-secondary) transition-colors group-hover:text-(--color-blue)">
          Course:
        </span>
        <span className="truncate transition-colors group-hover:text-(--color-blue)">
          {courseTitle}
        </span>
      </Link>

      <Slash />

      <div ref={containerRef} className="relative flex min-w-0 flex-1 items-center">
        <button
          type="button"
          aria-haspopup="true"
          aria-expanded={open}
          onClick={toggle}
          className="group/bc flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-left transition-colors hover:bg-(--color-brand-lavender)/20"
        >
          <Segment
            label={currentModule ? `Module ${currentModule.order}` : "Module"}
            value={currentModule?.title ?? courseTitle}
          />
          <Slash />
          <Segment label={`Lesson ${lessonOrder}`} value={lessonTitle} />
          <ChevronDown
            aria-hidden="true"
            className={`h-5 w-5 shrink-0 text-(--color-text-secondary) transition-[transform,color] group-hover/bc:text-(--color-blue) ${open ? "rotate-180" : ""}`}
          />
        </button>
        <CurriculumPopover
          open={open}
          slug={slug}
          modules={sortedModules}
          currentLessonId={currentLessonId}
          completedLessonIds={completedLessonIds}
          onNavigate={() => setOpen(false)}
        />
      </div>
    </nav>
  );
}

/** "/" divider between breadcrumb segments. */
function Slash() {
  return (
    <span aria-hidden="true" className="shrink-0 text-(--color-text-secondary)">
      /
    </span>
  );
}

/** A labeled Module/Lesson segment; recolors with the shared trigger on hover. */
function Segment({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <span className="shrink-0 text-(--color-text-secondary) transition-colors group-hover/bc:text-(--color-blue)">
        {label}:
      </span>
      <span className="truncate transition-colors group-hover/bc:text-(--color-blue)">
        {value}
      </span>
    </span>
  );
}

/** Click-toggled popover listing the whole curriculum; shows completion and highlights the current lesson. */
function CurriculumPopover({
  open,
  slug,
  modules,
  currentLessonId,
  completedLessonIds,
  onNavigate,
}: {
  open: boolean;
  slug: string;
  modules: CourseModule[];
  currentLessonId: number;
  completedLessonIds: number[];
  onNavigate: () => void;
}) {
  const completed = new Set(completedLessonIds);
  const allLessons = modules.flatMap((m) => m.lessons);
  const total = allLessons.length;
  const done = allLessons.filter((l) => completed.has(l.id)).length;
  const percent = total ? Math.round((done * 100) / total) : 0;

  return (
    <div
      className={`absolute left-0 top-full z-30 w-[min(780px,80vw)] pt-3 transition-opacity duration-150 ${
        open ? "visible opacity-100" : "invisible opacity-0"
      }`}
    >
      <div className="max-h-[60vh] overflow-y-auto rounded-2xl bg-white p-4 shadow-[0_12px_32px_rgba(18,18,18,0.16)]">
        <header className="mb-3 flex flex-col gap-1.5 border-b border-(--color-border-light) px-2 pb-3">
          <div className="flex items-center justify-between font-(family-name:--font-base) text-sm font-medium text-(--color-text-secondary)">
            <span>Course progress</span>
            <span>
              {done} / {total} lessons · {percent}%
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-(--color-brand-lavender-soft)">
            <div
              className="h-full rounded-full bg-(--color-blue) transition-[width]"
              style={{ width: `${percent}%` }}
            />
          </div>
        </header>
        <ul className="flex flex-col gap-4">
          {modules.map((mod) => (
            <li key={mod.id} className="flex flex-col gap-1">
              <p className="px-2 font-(family-name:--font-base) text-sm font-semibold uppercase tracking-wide text-(--color-text-secondary)">
                Module {mod.order}: {mod.title}
              </p>
              <ul className="flex flex-col">
                {byOrder(mod.lessons).map((lsn) => {
                  const isCurrent = lsn.id === currentLessonId;
                  const isDone = completed.has(lsn.id);
                  return (
                    <li key={lsn.id}>
                      <Link
                        href={`/learn/${slug}/${lsn.id}`}
                        aria-current={isCurrent ? "page" : undefined}
                        onClick={onNavigate}
                        className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 text-base font-medium transition-colors ${
                          isCurrent
                            ? "bg-(--color-brand-lavender-soft) text-(--color-blue)"
                            : "text-(--color-text-primary) hover:bg-(--color-brand-lavender)/15"
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                            isDone
                              ? "border-(--color-blue) bg-(--color-blue) text-white"
                              : "border-(--color-text-secondary) bg-white text-transparent"
                          }`}
                        >
                          <Check className="h-2.5 w-2.5" strokeWidth={3} />
                        </span>
                        <span className="min-w-0 truncate">
                          Lesson {lsn.order}: {lsn.title}
                        </span>
                        {lsn.is_mandatory && (
                          <span className="ml-auto flex-shrink-0 rounded-full bg-(--color-brand-yellow) px-2 py-0.5 font-(family-name:--font-accent) text-[10px] uppercase text-(--color-text-primary)">
                            Mandatory
                          </span>
                        )}
                        {isDone && <span className="sr-only">Completed</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
