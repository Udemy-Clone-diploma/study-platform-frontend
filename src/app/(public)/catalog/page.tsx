import { Suspense } from "react";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { getCategories, getCourses, type Category } from "@/entities/course";
import {
  buildCatalogHref,
  CatalogFiltersSidebar,
  CatalogPagination,
  CategoryFilter,
  CourseCard,
  CourseSearch,
  DEFAULT_SORT,
  SortDropdown,
  parseCatalogState,
  resetCatalogFiltersHref,
  type CatalogFilterState,
  type CatalogSearchParams,
} from "@/features/courses";
import { CatalogHero } from "@/widgets/catalog/CatalogHero";
import type { ApiError } from "@/shared/api/base";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parsePage(params: CatalogSearchParams): number {
  const parsed = Number.parseInt(firstParam(params.page) ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

async function loadCourses(state: CatalogFilterState, page: number) {
  try {
    const data = await getCourses({
      category: state.category,
      course_type: state.course_type,
      delivery_type: state.delivery_type,
      is_on_sale: state.is_on_sale,
      language: state.language,
      level: state.level,
      mode: state.mode,
      ordering: state.sort ?? DEFAULT_SORT,
      pricing_type: state.pricing_type,
      rating_min: state.rating_min,
      search: state.search,
      with_certificate: state.with_certificate,
      page,
      page_size: PAGE_SIZE,
    });

    return {
      courses: data.results,
      count: data.count,
      error: "",
    };
  } catch (error: unknown) {
    const apiError = error as Partial<ApiError>;

    return {
      courses: [],
      count: 0,
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
  const params = await searchParams;
  const state = parseCatalogState(params);
  const currentPage = parsePage(params);

  const [{ courses, count, error }, categories] = await Promise.all([
    loadCourses(state, currentPage),
    loadCategories(),
  ]);

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const showPagination = !error && courses.length > 0;

  return (
    <div className="bg-catalog-page flex min-h-screen w-full flex-col text-(--color-text-primary)">
      <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-4 pb-25 pt-50 md:px-8">
        <CatalogHero />

        <div className="mt-15 flex w-full flex-col items-stretch gap-6 lg:flex-row lg:items-center">
          <Suspense>
            <CourseSearch initialQuery={state.search} />
          </Suspense>

          <Suspense>
            <CategoryFilter categories={categories} currentSlug={state.category} />
          </Suspense>
        </div>

        {/* Figma spec: 150px gap from search row to filter bar. Alt if it feels too disconnected: mt-24 (96px). */}
        <div className="mt-37.5 flex flex-col gap-14">
          <div className="flex items-center justify-between gap-4">
            <Link
              href={buildCatalogHref(state, { filtersOpen: !state.filtersOpen })}
              className={`flex h-10 min-w-[132px] items-center justify-center gap-2 rounded-full px-4 text-xl font-medium transition-colors ${
                state.filtersOpen
                  ? "bg-(--color-text-primary) text-white"
                  : "bg-(--color-bg) text-(--color-text-primary) hover:bg-(--color-bg-surface)"
              }`}
            >
              <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
              <span>All Filters</span>
            </Link>

            <Suspense>
              <SortDropdown currentSort={state.sort} />
            </Suspense>
          </div>

          <div className={`grid gap-5 ${state.filtersOpen ? "lg:grid-cols-[460px_1fr]" : ""}`}>
            {state.filtersOpen ? (
              <CatalogFiltersSidebar categories={categories} state={state} />
            ) : null}

            <section>
              {error ? (
                <div className="rounded-[8px] border border-red-200 bg-red-50 p-6 text-red-800 shadow-sm">
                  <h3 className="text-xl font-semibold">Courses are unavailable</h3>
                  <p className="mt-2 text-sm">{error}</p>
                </div>
              ) : courses.length === 0 ? (
                <div className="rounded-[8px] bg-white p-10 text-center shadow-[0_8px_22px_rgba(76,68,87,0.12)]">
                  <h3 className="text-xl font-semibold">No courses found</h3>
                  <p className="mt-2 text-(--color-text-secondary)">Try another set of filters.</p>
                  <Link
                    href={resetCatalogFiltersHref(state)}
                    className="mt-6 inline-flex rounded-full bg-(--color-text-primary) px-6 py-2 text-sm font-medium text-white"
                  >
                    Reset filters
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {courses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>

        {showPagination ? (
          <Suspense>
            <div className="mt-auto pt-10">
              <CatalogPagination currentPage={currentPage} totalPages={totalPages} />
            </div>
          </Suspense>
        ) : null}
      </div>
    </div>
  );
}
