import { Suspense } from "react";
import Link from "next/link";
import { getCategories, getCourses } from "@/features/courses/api/coursesApi";
import {
  buildCatalogHref,
  type CatalogFilterState,
  type CatalogSearchParams,
  parseCatalogState,
  resetCatalogFiltersHref,
} from "@/features/courses/model/catalogFilters";
import type { Category } from "@/features/courses/model/types/category";
import type {
  CourseLanguage,
  CourseLevel,
  CourseListItem,
  CourseMode,
  CoursePricingType,
} from "@/features/courses/model/types/course";
import { CatalogFiltersSidebar } from "@/features/courses/ui/CatalogFiltersSidebar";
import { SortDropdown } from "@/features/courses/ui/SortDropdown";
import type { ApiError } from "@/shared/api/base";

export const dynamic = "force-dynamic";

const LEVEL_LABELS: Record<CourseLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const LANGUAGE_LABELS: Record<CourseLanguage, string> = {
  english: "English",
  ukrainian: "Ukrainian",
  spanish: "Spanish",
};

const MODE_LABELS: Record<CourseMode, string> = {
  self_learning: "Self learning",
  with_teacher: "With teacher",
};

const PRICING_LABELS: Record<CoursePricingType, string> = {
  free: "Free",
  full_payment: "Full payment",
  installment: "Installment",
};

function formatPrice(course: CourseListItem) {
  if (course.pricing_type === "free" || Number(course.price) === 0) {
    return "Free";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(course.price));
}

function formatRating(course: CourseListItem) {
  return Number(course.rating_avg).toFixed(1);
}

function formatPublishedDate(value: string | null) {
  if (!value) {
    return "Coming soon";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

async function loadCourses(state: CatalogFilterState) {
  try {
    return {
      courses: await getCourses({
        category: state.category,
        course_type: state.course_type,
        delivery_type: state.delivery_type,
        is_on_sale: state.is_on_sale,
        language: state.language,
        level: state.level,
        mode: state.mode,
        ordering: state.sort,
        pricing_type: state.pricing_type,
        rating_min: state.rating_min,
        search: state.search,
        with_certificate: state.with_certificate,
      }),
      error: "",
    };
  } catch (error: unknown) {
    const apiError = error as Partial<ApiError>;

    return {
      courses: [],
      error: apiError.message || apiError.detail || "Could not load courses.",
    };
  }
}

async function loadCategories(): Promise<Category[]> {
  try {
    return await getCategories();
  } catch {
    return [];
  }
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  const state = parseCatalogState(await searchParams);
  const [{ courses, error }, categories] = await Promise.all([loadCourses(state), loadCategories()]);

  return (
    <main className="min-h-screen bg-[linear-gradient(110deg,#f1edff_0%,#fff7e9_100%)] px-6 py-8 text-[#111111]">
      <div className="mx-auto w-full max-w-[1160px]">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link
            href={buildCatalogHref(state, { filtersOpen: !state.filtersOpen })}
            className={`inline-flex h-8 items-center gap-1 rounded-full px-4 text-[0.78rem] font-medium transition ${
              state.filtersOpen ? "bg-black text-white" : "bg-white text-black shadow-sm"
            }`}
          >
            <span className="text-[0.82rem]">{"\u2261"}</span>
            All Filter
          </Link>

          <Suspense>
            <SortDropdown currentSort={state.sort} />
          </Suspense>
        </div>

        <div className={`grid gap-5 ${state.filtersOpen ? "lg:grid-cols-[320px_1fr]" : ""}`}>
          {state.filtersOpen ? <CatalogFiltersSidebar categories={categories} state={state} /> : null}

          <section>
            {error ? (
              <div className="rounded-[8px] border border-red-200 bg-red-50 p-6 text-red-800 shadow-sm">
                <h3 className="text-xl font-semibold">Courses are unavailable</h3>
                <p className="mt-2 text-sm">{error}</p>
              </div>
            ) : courses.length === 0 ? (
              <div className="rounded-[8px] bg-white p-10 text-center shadow-[0_8px_22px_rgba(76,68,87,0.12)]">
                <h3 className="text-xl font-semibold">No courses found</h3>
                <p className="mt-2 text-[#59545d]">Try another set of filters.</p>
                <Link
                  href={resetCatalogFiltersHref(state)}
                  className="mt-6 inline-flex rounded-full bg-black px-6 py-2 text-sm font-medium text-white"
                >
                  Reset filters
                </Link>
              </div>
            ) : (
              <div className={`grid gap-4 md:grid-cols-2 ${state.filtersOpen ? "" : "xl:grid-cols-3"}`}>
                {courses.map((course) => (
                  <article
                    key={course.id}
                    className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>{course.category?.name ?? "General"}</span>
                      <span>{LEVEL_LABELS[course.level]}</span>
                      <span>|</span>
                      <span>{LANGUAGE_LABELS[course.language]}</span>
                    </div>

                    <div className="mt-4 flex flex-1 flex-col">
                      <div className="space-y-3">
                        <h3 className="text-xl font-semibold text-slate-950">{course.title}</h3>
                        <p className="line-clamp-3 text-sm leading-6 text-slate-600">
                          {course.short_description}
                        </p>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">
                          {MODE_LABELS[course.mode]}
                        </span>
                        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">
                          {PRICING_LABELS[course.pricing_type]}
                        </span>
                        {course.with_certificate ? (
                          <span className="rounded-md bg-emerald-100 px-2 py-1 text-xs text-emerald-800">
                            Certificate
                          </span>
                        ) : null}
                      </div>

                      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm text-slate-700">
                        <div>
                          <dt className="text-slate-500">Teacher</dt>
                          <dd className="mt-1 font-semibold text-slate-950">{course.teacher_name}</dd>
                        </div>
                        <div>
                          <dt className="text-slate-500">Published</dt>
                          <dd className="mt-1 font-semibold text-slate-950">
                            {formatPublishedDate(course.published_at)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-slate-500">Duration</dt>
                          <dd className="mt-1 font-semibold text-slate-950">
                            {course.duration_hours}h | {course.lessons_count} lessons
                          </dd>
                        </div>
                        <div>
                          <dt className="text-slate-500">Rating</dt>
                          <dd className="mt-1 font-semibold text-slate-950">
                            {formatRating(course)} | {course.students_count.toLocaleString("en-US")} students
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <div className="mt-5 flex items-end justify-between gap-4 border-t border-slate-200 pt-4">
                      <div>
                        <p className="text-sm text-slate-500">Price</p>
                        <p className="text-2xl font-semibold text-slate-950">{formatPrice(course)}</p>
                      </div>
                      <a
                        href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1/"}courses/${course.id}/`}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Course API
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
