"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { getMaterials } from "@/entities/materials";
import type { MaterialDocument, MaterialLessonCard } from "@/entities/materials";
import { getEnrolledCourses } from "@/entities/course";
import type { CourseListItem } from "@/entities/course";
import type { ApiError } from "@/shared/api/base";
import { formatDate } from "@/shared/lib/time";
import { PageShell } from "@/shared/ui/PageShell";
import { PillSelect } from "@/shared/ui/PillSelect";
import { SidePanel } from "@/shared/ui/SidePanel";
import { MaterialPreviewModal } from "@/shared/ui/MaterialPreviewModal";

const ALL_COURSES = "__all__";

function monthKey(value: string): string {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { month: "long" }).format(new Date(value));
}

function formatShortDate(value: string, locale: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return formatDate(date, locale, { day: "2-digit", month: "2-digit" }).replace(/\//g, ".");
}

/** Student's library of lesson-attached materials, grouped by month, with a detail drawer + preview modal. */
export default function MaterialsPage() {
  const t = useTranslations("StudentMaterialsPage");
  const tCommon = useTranslations("Common");
  const tSidebar = useTranslations("AppSidebar");
  const locale = useLocale();
  const [cards, setCards] = useState<MaterialLessonCard[]>([]);
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState(ALL_COURSES);
  const [selected, setSelected] = useState<MaterialLessonCard | null>(null);
  const [previewMaterial, setPreviewMaterial] = useState<MaterialDocument | null>(null);

  useEffect(() => {
    Promise.all([getMaterials(), getEnrolledCourses()])
      .then(([materials, enrolled]) => {
        setCards(materials);
        setCourses(enrolled.results);
      })
      .catch((err: Partial<ApiError>) => setError(err.message ?? t("errorLoad")))
      .finally(() => setLoading(false));
  }, [t]);

  const courseOptions = useMemo(() => {
    // All active/completed enrollments, not just the ones with materials
    // uploaded so far -- so a course with nothing yet is still selectable
    // (and clearly shows "No materials found" instead of just being absent).
    const byCourse = new Map<string, string>();
    courses.forEach((course) => byCourse.set(course.slug, course.title));
    cards.forEach((card) => byCourse.set(card.course_slug, card.course_title));
    return [
      { value: ALL_COURSES, label: tCommon("allCourses") },
      ...Array.from(byCourse.entries())
        .sort((a, b) => a[1].localeCompare(b[1]))
        .map(([value, label]) => ({ value, label })),
    ];
  }, [courses, cards, tCommon]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return cards.filter((card) => {
      if (courseFilter !== ALL_COURSES && card.course_slug !== courseFilter) return false;
      if (
        query &&
        !card.lesson_title.toLowerCase().includes(query) &&
        !card.course_title.toLowerCase().includes(query)
      ) return false;
      return true;
    });
  }, [cards, courseFilter, search]);

  const grouped = useMemo(() => {
    const sorted = [...filtered].sort(
      (a, b) => new Date(b.lesson_date).getTime() - new Date(a.lesson_date).getTime(),
    );
    const groups = new Map<string, { key: string; label: string; items: MaterialLessonCard[] }>();
    sorted.forEach((card) => {
      const key = monthKey(card.lesson_date);
      const group = groups.get(key);
      if (group) group.items.push(card);
      else groups.set(key, { key, label: monthLabel(card.lesson_date, locale), items: [card] });
    });
    return Array.from(groups.values());
  }, [filtered, locale]);

  return (
    <PageShell className="bg-wishlist" style={{ display: "flex", flexDirection: "column" }}>
      <div className="mb-6 mr-4 flex flex-wrap items-center gap-4" style={{ flexShrink: 0 }}>
        <PillSelect value={courseFilter} options={courseOptions} onChange={setCourseFilter} />
        <label
          className="flex cursor-text items-center gap-2 bg-white"
          style={{
            minWidth: "clamp(180px, 18vw, 320px)",
            maxWidth: 470,
            height: "clamp(32px, 2.78vw, 40px)",
            border: "1px solid var(--color-brand-lavender)",
            borderRadius: 40,
            padding: "clamp(6px, 0.56vw, 8px) clamp(12px, 1.11vw, 16px)",
          }}
        >
          <Search
            style={{
              width: "clamp(14px, 1.39vw, 20px)",
              height: "clamp(14px, 1.39vw, 20px)",
              color: "var(--color-brand-lavender)",
              flexShrink: 0,
            }}
          />
          <input
            type="search"
            placeholder={tCommon("search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-0 flex-1 bg-transparent outline-none"
            style={{
              fontFamily: "var(--font-base)",
              fontSize: "clamp(13px, 1.11vw, 20px)",
              color: "var(--color-text-primary)",
            }}
          />
        </label>
      </div>

      {loading ? (
        <p className="text-center text-lg text-(--color-text-secondary)">{tCommon("loading")}</p>
      ) : error ? (
        <p className="text-center text-lg text-red-500">{error}</p>
      ) : grouped.length === 0 ? (
        <p className="text-center text-lg text-(--color-text-secondary)">{t("noMaterialsFound")}</p>
      ) : (
        <div className="flex flex-col" style={{ gap: "clamp(28px, 2.5vw, 44px)" }}>
          {grouped.map((group) => (
            <section key={group.key}>
              <h2
                className="font-normal text-(--color-text-primary)"
                style={{ fontSize: "clamp(16px, 1.67vw, 24px)", marginBottom: "clamp(8px, 1.11vw, 16px)" }}
              >
                {group.label}
              </h2>
              <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))" }}>
                {group.items.map((card) => (
                  <MaterialCard key={card.lesson_id} card={card} onClick={() => setSelected(card)} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <SidePanel
        open={selected != null}
        onClose={() => setSelected(null)}
        title={selected?.module_title ?? tSidebar("materials")}
      >
        {selected && (
          <div className="flex h-full flex-col gap-6 font-(family-name:--font-base) text-(--color-text-primary)">
            <div className="flex items-center gap-5 text-[14px] leading-[18px] text-(--color-text-secondary)">
              <span>{formatShortDate(selected.lesson_date, locale)}</span>
              <span className="truncate">{selected.course_title}</span>
            </div>

            <div>
              <p className="font-(family-name:--font-accent) text-[28px] leading-[35px] font-normal">
                {t("moduleLabel", { order: selected.module_order })}
              </p>
              <p className="mt-1 font-(family-name:--font-accent) text-[16px] leading-5">
                {selected.lesson_title}
              </p>
            </div>

            <div className="h-px bg-(--color-brand-lavender)" />

            <div>
              <p className="mb-5 text-[13px] leading-4 font-semibold">{tSidebar("materials")}</p>
              {selected.materials.length === 0 ? (
                <p className="text-[12px] text-(--color-text-secondary)">{t("noMaterialsAttached")}</p>
              ) : (
                <div className="flex flex-col gap-5">
                  {selected.materials.map((material) => (
                    <button
                      key={material.id}
                      type="button"
                      onClick={() => setPreviewMaterial(material)}
                      className="-mx-1 flex items-center gap-4 rounded-md px-1 py-0.5 text-left transition hover:bg-[#FAFAFA]"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[linear-gradient(135deg,#FCC4C3_0%,#A7BAFA_100%)]">
                        <Image src="/icons/book.svg" alt="" width={22} height={22} className="h-5 w-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] leading-4 font-medium">
                          {material.title}
                        </span>
                        <span className="mt-0.5 block text-[10px] leading-3 text-(--color-text-secondary)">{t("materialLabel")}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </SidePanel>

      {previewMaterial && (
        <MaterialPreviewModal
          key={previewMaterial.id}
          title={previewMaterial.title}
          url={previewMaterial.url}
          onClose={() => setPreviewMaterial(null)}
        />
      )}
    </PageShell>
  );
}

function MaterialCard({ card, onClick }: { card: MaterialLessonCard; onClick: () => void }) {
  const t = useTranslations("StudentMaterialsPage");
  const locale = useLocale();
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative text-left transition-transform hover:-translate-y-0.5"
      style={{ height: "clamp(160px, 14.3vw, 220px)" }}
    >
      {/* Gradient block — wider, shifted right, sits behind the glass panel */}
      <div
        className="absolute flex flex-col justify-center gap-2 overflow-hidden"
        style={{
          left: "28.84%",
          right: 0,
          top: 0,
          bottom: 0,
          padding:
            "clamp(14px, 1.25vw, 24px) clamp(20px, 2.08vw, 40px) clamp(14px, 1.25vw, 24px) clamp(40px, 3.54vw, 68px)",
          background: "var(--gradient-brand)",
          borderRadius: "clamp(12px, 1.04vw, 20px)",
        }}
      >
        <span
          className="font-(family-name:--font-base) text-(--color-text-primary)"
          style={{ fontSize: "clamp(13px, 1.04vw, 20px)" }}
        >
          {card.course_title}
        </span>
        <span
          className="line-clamp-3 font-(family-name:--font-base) text-(--color-text-primary)"
          style={{ fontSize: "clamp(11px, 0.83vw, 16px)" }}
        >
          {t("lessonLabel", { title: card.lesson_title })}
        </span>
      </div>

      {/* Glass panel — narrower, on top, overlapping the gradient block's left edge */}
      <div
        className="absolute flex flex-col items-center justify-center gap-2 text-center"
        style={{
          left: 0,
          width: "38.82%",
          top: 0,
          bottom: 0,
          padding: "clamp(14px, 1.25vw, 24px)",
          background: "var(--gradient-lavender)",
          boxShadow: "inset 0 2px 4px #fff, 0 4px 14px rgba(0,0,0,0.08)",
          borderRadius: "clamp(12px, 1.04vw, 20px)",
        }}
      >
        <span
          className="font-(family-name:--font-accent) text-(--color-text-primary)"
          style={{ fontSize: "clamp(18px, 1.67vw, 32px)" }}
        >
          {t("moduleLabel", { order: card.module_order })}
        </span>
        <span
          className="font-(family-name:--font-accent) text-(--color-text-primary)"
          style={{ fontSize: "clamp(11px, 0.83vw, 16px)" }}
        >
          {card.module_title}
        </span>
        <span
          className="font-(family-name:--font-base) font-medium text-(--color-blue)"
          style={{ fontSize: "clamp(11px, 0.83vw, 16px)" }}
        >
          {formatShortDate(card.lesson_date, locale)}
        </span>
      </div>
    </button>
  );
}
