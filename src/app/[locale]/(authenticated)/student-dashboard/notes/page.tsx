"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { X } from "lucide-react";
import { getAllNotes } from "@/entities/note";
import type { NoteListItem } from "@/entities/note";
import type { ApiError } from "@/shared/api/base";
import { formatDate } from "@/shared/lib/time";
import { PageShell } from "@/shared/ui/PageShell";
import { PillSelect } from "@/shared/ui/PillSelect";
import { Pagination } from "@/shared/ui/Pagination";

type Translator = (key: string, values?: Record<string, string | number>) => string;

const PAGE_SIZE = 12;
const ALL_COURSES = "__all__";

type SortValue = "newest" | "oldest";

// One consistent note icon/gradient regardless of course level -- a personal
// notes list shouldn't visually vary by course difficulty.
const NOTE_ICON = "/icons/curses.svg";
const NOTE_ACCENT = "from-[#fff3dc] to-[#ffe7ef]";

function firstLine(text: string, t: Translator): string {
  return text.split(/\r?\n/).map((line) => line.trim()).find(Boolean) ?? t("untitledNote");
}

function formatNoteDate(value: string, locale: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return formatDate(date, locale, { day: "2-digit", month: "2-digit", year: "numeric" }).replace(
    /\//g,
    ".",
  );
}

/** Full list of the student's lesson notes across every course, with a detail drawer. */
export default function StudentNotesPage() {
  return (
    <Suspense>
      <StudentNotesPageContent />
    </Suspense>
  );
}

function StudentNotesPageContent() {
  const t = useTranslations("StudentNotesPage");
  const tCommon = useTranslations("Common");
  const searchParams = useSearchParams();
  const [notes, setNotes] = useState<NoteListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [courseFilter, setCourseFilter] = useState(ALL_COURSES);
  const [sort, setSort] = useState<SortValue>("newest");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<NoteListItem | null>(null);
  const [appliedDeepLink, setAppliedDeepLink] = useState(false);

  useEffect(() => {
    getAllNotes(1, 100)
      .then((res) => setNotes(res.results))
      .catch((err: Partial<ApiError>) => setError(err.message ?? t("errorLoad")))
      .finally(() => setLoading(false));
  }, [t]);

  // Deep link from the dashboard panel (?note=<id>): once notes finish loading, open that
  // note's drawer. Adjusted during render (not an effect) per React's "storing information
  // from previous renders" pattern, since it only needs to run once per notes-load transition.
  if (!appliedDeepLink && !loading) {
    setAppliedDeepLink(true);
    const noteId = Number(searchParams.get("note"));
    const match = noteId ? notes.find((note) => note.id === noteId) : undefined;
    if (match) setSelected(match);
  }

  const courseOptions = useMemo(() => {
    const byCourse = new Map<string, string>();
    notes.forEach((note) => byCourse.set(note.course_slug, note.course_title));
    return [
      { value: ALL_COURSES, label: tCommon("allCourses") },
      ...Array.from(byCourse.entries())
        .sort((a, b) => a[1].localeCompare(b[1]))
        .map(([value, label]) => ({ value, label })),
    ];
  }, [notes, tCommon]);

  const sortOptions = [
    { value: "newest", label: t("sortNewest") },
    { value: "oldest", label: t("sortOldest") },
  ];

  const filtered = useMemo(() => {
    return notes
      .filter((note) => courseFilter === ALL_COURSES || note.course_slug === courseFilter)
      .sort((a, b) => {
        const delta = new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        return sort === "newest" ? delta : -delta;
      });
  }, [notes, courseFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleCourseChange(next: string) {
    setCourseFilter(next);
    setPage(1);
  }

  function handleSortChange(next: string) {
    setSort(next as SortValue);
    setPage(1);
  }

  function handlePageChange(next: number) {
    setPage(Math.min(Math.max(next, 1), totalPages));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <PageShell className="bg-wishlist" style={{ display: "flex", flexDirection: "column" }}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3" style={{ flexShrink: 0 }}>
        <h1
          className="font-normal text-(--color-text-primary)"
          style={{ fontSize: "clamp(20px, 2.22vw, 32px)" }}
        >
          {t("title")}
        </h1>
        <div className="flex items-center gap-3">
          <PillSelect value={courseFilter} options={courseOptions} onChange={handleCourseChange} />
          <PillSelect value={sort} options={sortOptions} onChange={handleSortChange} />
        </div>
      </div>

      <div style={{ flex: 1 }}>
        {loading ? (
          <p className="text-center text-lg text-(--color-text-secondary)">{tCommon("loading")}</p>
        ) : error ? (
          <p className="text-center text-lg text-red-500">{error}</p>
        ) : pageItems.length === 0 ? (
          <p className="text-center text-lg text-(--color-text-secondary)">{t("noNotesFound")}</p>
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
            {pageItems.map((note) => (
              <NoteGridCard key={note.id} note={note} onClick={() => setSelected(note)} />
            ))}
          </div>
        )}
      </div>

      {!loading && !error && totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", paddingTop: "clamp(16px, 2.22vw, 32px)", flexShrink: 0 }}>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
        </div>
      )}

      <NoteDrawer note={selected} onClose={() => setSelected(null)} />
    </PageShell>
  );
}

function NoteGridCard({ note, onClick }: { note: NoteListItem; onClick: () => void }) {
  const t = useTranslations("StudentNotesPage");
  const locale = useLocale();
  const date = formatNoteDate(note.updated_at, locale);

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[92px] items-start gap-3 rounded-md border border-black/5 bg-white p-3 text-left shadow-[0_1px_8px_rgba(0,0,0,0.12)] transition-colors hover:bg-[#fafafa] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003aff]"
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
        <p className="truncate text-[11px] text-[#5e5e5e]">
          {note.course_title} <span className="px-1">|</span>{" "}
          {t("lessonNumberLabel", { number: note.lesson_order ?? "—" })}
          {note.is_course_completed && <span className="pl-1">{t("completedSuffix")}</span>}
        </p>
        <p className="line-clamp-2 text-sm font-medium leading-tight text-black">
          {firstLine(note.content, t)}
        </p>
        {date && <p className="mt-1 text-xs text-[#003aff]">{date}</p>}
      </div>
    </button>
  );
}

/** Detail drawer for a single note — same fixed right-side idiom as the homework drawer (student-dashboard/homework). */
function NoteDrawer({ note, onClose }: { note: NoteListItem | null; onClose: () => void }) {
  const t = useTranslations("StudentNotesPage");
  const locale = useLocale();
  const open = Boolean(note);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  const canOpenLesson = !!note && !note.is_course_completed && note.lesson_id != null;

  return (
    <aside
      aria-hidden={!open}
      className={[
        "fixed top-[76px] right-0 bottom-0 z-40 w-[min(490px,calc(100vw-24px))] overflow-hidden rounded-tl-[20px] rounded-bl-[20px] bg-white shadow-[0_0_30px_rgba(0,0,0,0.16)] transition-transform duration-300 ease-out",
        open ? "translate-x-0" : "translate-x-full",
      ].join(" ")}
    >
      {note ? (
        <div className="flex h-full flex-col overflow-y-auto px-[36px] py-8 font-(family-name:--font-base) text-[#121212]">
          <button
            type="button"
            aria-label={t("closeNoteDetails")}
            onClick={onClose}
            className="mb-9 flex h-8 w-8 items-center justify-center rounded-full text-black transition hover:bg-[#F4F4F4]"
          >
            <X size={18} aria-hidden="true" />
          </button>

          <div className="flex items-center gap-5 text-[14px] leading-[18px] text-[#5E5E5E]">
            <span>{formatNoteDate(note.updated_at, locale)}</span>
            <span className="truncate">{note.course_title}</span>
          </div>

          <div className="mt-7">
            <h2 className="font-(family-name:--font-accent) text-[24px] leading-[30px] font-normal tracking-normal">
              {note.module_title}
            </h2>
            <p className="mt-1 font-(family-name:--font-accent) text-[16px] leading-5 tracking-normal">
              {t("lessonWithTitleLabel", { number: note.lesson_order ?? "—", title: note.lesson_title })}
            </p>
          </div>

          <div className="mt-7 h-px bg-[#A7BAFA]" />

          <p className="mt-6 whitespace-pre-wrap text-[14px] leading-[20px] text-[#303030]">
            {note.content}
          </p>

          <div className="mt-auto flex justify-center pt-8">
            {canOpenLesson ? (
              <Link
                href={`/learn/${note.course_slug}/${note.lesson_id}`}
                className="inline-flex h-[38px] min-w-[144px] items-center justify-center rounded-full bg-black px-8 font-(family-name:--font-accent) text-[13px] leading-none font-semibold uppercase text-white transition hover:bg-[#252525]"
              >
                {t("openLesson")}
              </Link>
            ) : (
              <p className="text-[13px] text-[#5E5E5E]">{t("courseCompleted")}</p>
            )}
          </div>
        </div>
      ) : null}
    </aside>
  );
}
