"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { getCourseBySlug, type CourseDetail, type CourseLevel } from "@/entities/course";
import {
  readLessonNotes,
  subscribeToLessonNotes,
  type StoredLessonNote,
} from "@/features/learning";

type SortValue = "newest" | "oldest";

type SelectOption = {
  value: string;
  label: string;
};

type CourseNoteMeta = {
  title: string;
  level: CourseLevel;
  lessons: Map<number, { title: string; order: number }>;
};

const SORT_OPTIONS: SelectOption[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
];

const LEVEL_ICON: Record<CourseLevel, string> = {
  beginner: "/icons/curses.svg",
  intermediate: "/icons/world.png",
  advanced: "/icons/statistics.svg",
};

const LEVEL_ACCENT: Record<CourseLevel, string> = {
  beginner: "from-[#fff3dc] to-[#ffe7ef]",
  intermediate: "from-[#e0fbf5] to-[#d8ddff]",
  advanced: "from-[#ffe7ef] to-[#dfd7ff]",
};

function humanizeSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function firstNoteLine(text: string): string {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean) ?? "Untitled note";
}

function noteTime(note: StoredLessonNote): number {
  const value = note.updatedAt ? new Date(note.updatedAt).getTime() : 0;
  return Number.isFinite(value) ? value : 0;
}

function formatNoteDate(value: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
  }).format(date).replace(/\//g, ".");
}

function buildCourseMeta(course: CourseDetail): CourseNoteMeta {
  const lessons = new Map<number, { title: string; order: number }>();

  course.modules.forEach((module) => {
    module.lessons.forEach((lesson) => {
      lessons.set(lesson.id, {
        title: lesson.title,
        order: lesson.order,
      });
    });
  });

  return {
    title: course.title,
    level: course.level,
    lessons,
  };
}

function enrichNotes(
  notes: StoredLessonNote[],
  courses: Map<string, CourseNoteMeta>,
): StoredLessonNote[] {
  return notes.map((note) => {
    const course = courses.get(note.slug);
    const lesson = course?.lessons.get(note.lessonId);

    return {
      ...note,
      courseTitle: note.courseTitle || course?.title,
      courseLevel: note.courseLevel || course?.level,
      lessonTitle: note.lessonTitle || lesson?.title,
      lessonOrder: note.lessonOrder ?? lesson?.order,
    };
  });
}

export function StudentNotesPanel() {
  const [notes, setNotes] = useState<StoredLessonNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortValue>("newest");
  const [courseFilter, setCourseFilter] = useState("all");

  useEffect(() => {
    let disposed = false;

    async function loadNotes() {
      const stored = readLessonNotes();
      if (!disposed) {
        setNotes(stored);
        setLoading(false);
      }

      const slugsToLoad = Array.from(
        new Set(
          stored
            .filter((note) => !note.courseTitle || !note.lessonTitle || note.lessonOrder == null)
            .map((note) => note.slug),
        ),
      );

      if (slugsToLoad.length === 0) return;

      const entries = await Promise.all(
        slugsToLoad.map(async (slug) => {
          const course = await getCourseBySlug(slug).catch(() => null);
          return course ? ([slug, buildCourseMeta(course)] as const) : null;
        }),
      );

      if (disposed) return;

      const courseMeta = new Map<string, CourseNoteMeta>();
      entries.forEach((entry) => {
        if (entry) courseMeta.set(entry[0], entry[1]);
      });

      if (courseMeta.size > 0) {
        setNotes((current) => enrichNotes(current, courseMeta));
      }
    }

    void loadNotes();

    const unsubscribe = subscribeToLessonNotes(() => {
      void loadNotes();
    });

    return () => {
      disposed = true;
      unsubscribe();
    };
  }, []);

  const courseOptions = useMemo<SelectOption[]>(() => {
    const courses = new Map<string, string>();
    notes.forEach((note) => {
      courses.set(note.slug, note.courseTitle || humanizeSlug(note.slug));
    });

    return [
      { value: "all", label: "All courses" },
      ...Array.from(courses.entries())
        .sort((a, b) => a[1].localeCompare(b[1]))
        .map(([value, label]) => ({ value, label })),
    ];
  }, [notes]);

  const activeCourseFilter = courseOptions.some((option) => option.value === courseFilter)
    ? courseFilter
    : "all";

  const visibleNotes = useMemo(() => {
    return notes
      .filter((note) => activeCourseFilter === "all" || note.slug === activeCourseFilter)
      .sort((a, b) => {
        const delta = noteTime(b) - noteTime(a);
        return sort === "newest" ? delta : -delta;
      });
  }, [notes, activeCourseFilter, sort]);

  return (
    <div className="flex h-[460px] flex-col overflow-hidden rounded-lg bg-white p-4 shadow-[0_0_16px_rgba(0,0,0,0.14)]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="shrink-0 text-base font-bold text-black">My Notes</h2>
        <div className="flex min-w-0 items-center justify-end gap-2">
          <NotesDropdown
            ariaLabel="Filter notes by course"
            value={activeCourseFilter}
            options={courseOptions}
            onChange={setCourseFilter}
          />
          <NotesDropdown
            ariaLabel="Sort notes"
            value={sort}
            options={SORT_OPTIONS}
            onChange={(value) => setSort(value as SortValue)}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {loading ? (
          <p className="pt-8 text-center text-sm text-[#5e5e5e]">Loading notes...</p>
        ) : visibleNotes.length > 0 ? (
          visibleNotes.map((note) => <NoteCard key={note.id} note={note} />)
        ) : (
          <p className="pt-8 text-center text-sm text-[#5e5e5e]">
            No notes found.
          </p>
        )}
      </div>
    </div>
  );
}

function NotesDropdown({
  ariaLabel,
  value,
  options,
  onChange,
}: {
  ariaLabel: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  return (
    <div ref={ref} className="relative min-w-0">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex h-8 max-w-[126px] items-center gap-1 rounded-full border border-black/10 bg-[#fafafa] px-3 text-[11px] font-medium text-black shadow-[0_1px_6px_rgba(0,0,0,0.08)] transition-colors hover:border-[#003aff]/40"
      >
        <span className="truncate">{active?.label}</span>
        <ChevronDown
          aria-hidden="true"
          className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <ul
          role="listbox"
          className="absolute right-0 z-20 mt-2 flex max-h-56 w-48 flex-col overflow-y-auto rounded-xl bg-white p-2 shadow-[0_6px_18px_rgba(0,0,0,0.16)]"
        >
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <li key={option.value} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`w-full rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                    selected
                      ? "bg-[#edf1ff] text-[#003aff]"
                      : "text-black hover:bg-[#fafafa]"
                  }`}
                >
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function NoteCard({ note }: { note: StoredLessonNote }) {
  const level = note.courseLevel ?? "beginner";
  const courseTitle = note.courseTitle || humanizeSlug(note.slug);
  const lessonLabel = note.lessonOrder
    ? `Lesson ${note.lessonOrder}`
    : note.lessonTitle
      ? "Lesson"
      : `Lesson ${note.lessonId}`;
  const date = formatNoteDate(note.updatedAt);

  return (
    <Link
      href={`/learn/${note.slug}/${note.lessonId}`}
      className="mb-2 flex min-h-[80px] items-center gap-3 rounded-md border border-black/5 bg-white px-3 py-2 shadow-[0_1px_8px_rgba(0,0,0,0.12)] transition-colors hover:bg-[#fafafa] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003aff]"
    >
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-gradient-to-br ${LEVEL_ACCENT[level]}`}
      >
        <Image
          src={LEVEL_ICON[level]}
          alt=""
          width={38}
          height={38}
          className="h-9 w-9 object-contain"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] text-[#5e5e5e]">
          {courseTitle} <span className="px-1">|</span> {lessonLabel}
        </p>
        <p className="line-clamp-2 text-sm font-medium leading-tight text-black">
          {firstNoteLine(note.text)}
        </p>
      </div>
      {date ? <span className="whitespace-nowrap text-xs text-[#003aff]">{date}</span> : null}
    </Link>
  );
}
