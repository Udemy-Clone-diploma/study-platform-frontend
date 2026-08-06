"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { getAllNotes, type NoteListItem } from "@/entities/note";
import { GradientButton } from "@/shared/ui/GradientButton";

const PANEL_NOTES_LIMIT = 20;

type SortValue = "newest" | "oldest";

type SelectOption = {
  value: string;
  label: string;
};

// One consistent note icon/gradient regardless of course level -- a personal
// notes list shouldn't visually vary by course difficulty.
const NOTE_ICON = "/icons/curses.svg";
const NOTE_ACCENT = "from-[#fff3dc] to-[#ffe7ef]";

function firstNoteLine(text: string, untitledLabel: string): string {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean) ?? untitledLabel;
}

function formatNoteDate(value: string, locale: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
  }).format(date).replace(/\//g, ".");
}

export function StudentNotesPanel() {
  const t = useTranslations("StudentNotesPanel");
  const tCommon = useTranslations("Common");
  const SORT_OPTIONS: SelectOption[] = [
    { value: "newest", label: t("newest") },
    { value: "oldest", label: t("oldest") },
  ];
  const [notes, setNotes] = useState<NoteListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortValue>("newest");
  const [courseFilter, setCourseFilter] = useState("all");

  useEffect(() => {
    getAllNotes(1, PANEL_NOTES_LIMIT)
      .then((res) => setNotes(res.results))
      .catch(() => setNotes([]))
      .finally(() => setLoading(false));
  }, []);

  const courseOptions = useMemo<SelectOption[]>(() => {
    const courses = new Map<string, string>();
    notes.forEach((note) => courses.set(note.course_slug, note.course_title));

    return [
      { value: "all", label: tCommon("allCourses") },
      ...Array.from(courses.entries())
        .sort((a, b) => a[1].localeCompare(b[1]))
        .map(([value, label]) => ({ value, label })),
    ];
  }, [notes, tCommon]);

  const activeCourseFilter = courseOptions.some((option) => option.value === courseFilter)
    ? courseFilter
    : "all";

  const visibleNotes = useMemo(() => {
    return notes
      .filter((note) => activeCourseFilter === "all" || note.course_slug === activeCourseFilter)
      .sort((a, b) => {
        const delta = new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        return sort === "newest" ? delta : -delta;
      });
  }, [notes, activeCourseFilter, sort]);

  return (
    <div className="flex h-[460px] flex-col overflow-hidden rounded-lg bg-white p-4 shadow-[0_0_16px_rgba(0,0,0,0.14)]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="min-w-0 truncate text-base font-bold text-black">{t("myNotes")}</h2>
        <div className="flex min-w-0 items-center justify-end gap-2">
          <NotesDropdown
            ariaLabel={t("filterByCourseAriaLabel")}
            value={activeCourseFilter}
            options={courseOptions}
            onChange={setCourseFilter}
          />
          <NotesDropdown
            ariaLabel={t("sortAriaLabel")}
            value={sort}
            options={SORT_OPTIONS}
            onChange={(value) => setSort(value as SortValue)}
          />
          <GradientButton
            href="/student-dashboard/notes"
            style={{ padding: "4px 14px", fontSize: 11, gap: 4 }}
          >
            {tCommon("all")}
            <Image
              src="/icons/arrow-goto.png"
              alt=""
              width={10}
              height={10}
              style={{ width: 10, height: "auto", flexShrink: 0 }}
            />
          </GradientButton>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {loading ? (
          <p className="pt-8 text-center text-sm text-[#5e5e5e]">{t("loading")}</p>
        ) : visibleNotes.length > 0 ? (
          visibleNotes.map((note) => <NoteCard key={note.id} note={note} />)
        ) : (
          <p className="pt-8 text-center text-sm text-[#5e5e5e]">
            {t("noNotesFound")}
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
        <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-xl bg-white shadow-[0_6px_18px_rgba(0,0,0,0.16)]">
          <ul role="listbox" className="flex max-h-56 flex-col overflow-y-auto p-2">
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
        </div>
      ) : null}
    </div>
  );
}

function NoteCard({ note }: { note: NoteListItem }) {
  const t = useTranslations("StudentNotesPanel");
  const locale = useLocale();
  const lessonLabel = note.lesson_order
    ? t("lessonNumber", { number: note.lesson_order })
    : note.lesson_title || t("lesson");
  const date = formatNoteDate(note.updated_at, locale);

  return (
    <Link
      href={`/student-dashboard/notes?note=${note.id}`}
      className="mb-2 flex min-h-[80px] items-center gap-3 rounded-md border border-black/5 bg-white px-3 py-2 shadow-[0_1px_8px_rgba(0,0,0,0.12)] transition-colors hover:bg-[#fafafa] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003aff]"
    >
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-gradient-to-br ${NOTE_ACCENT}`}
      >
        <Image
          src={NOTE_ICON}
          alt=""
          width={38}
          height={38}
          className="h-9 w-9 object-contain"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-[#5e5e5e]">
          {note.course_title} <span className="px-1">|</span> {lessonLabel}
          {note.is_course_completed && <span className="px-1 text-[#5e5e5e]">· {t("completed")}</span>}
        </p>
        <p className="line-clamp-2 text-base font-medium leading-tight text-black">
          {firstNoteLine(note.content, t("untitledNote"))}
        </p>
      </div>
      {date ? <span className="whitespace-nowrap text-xs text-[#003aff]">{date}</span> : null}
    </Link>
  );
}
