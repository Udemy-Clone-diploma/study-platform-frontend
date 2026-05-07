import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { getCategories, getCourses, type Category } from "@/entities/course";
import {
  buildCatalogHref,
  type CatalogFilterState,
  type CatalogSearchParams,
  parseCatalogState,
  resetCatalogFiltersHref,
} from "@/features/courses/model/catalogFilters";
import { CatalogFiltersSidebar } from "@/features/courses/ui/CatalogFiltersSidebar";
import { CatalogPagination } from "@/features/courses/ui/CatalogPagination";
import { CategoryFilter } from "@/features/courses/ui/CategoryFilter";
import { CourseCard } from "@/features/courses/ui/CourseCard";
import { CourseSearch } from "@/features/courses/ui/CourseSearch";
import { SortDropdown } from "@/features/courses/ui/SortDropdown";
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
      ordering: state.sort,
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

  return (
    <main className="min-h-screen bg-[linear-gradient(110deg,#f1edff_0%,#fff7e9_100%)] px-6 pb-12 pt-9 text-[#111111]">
      <div className="mx-auto w-full max-w-[1420px]">
        <div className="mb-20 flex flex-col gap-20">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Suspense>
              <CourseSearch initialQuery={state.search} />
            </Suspense>

            {categories.length > 0 ? (
              <Suspense>
                <CategoryFilter categories={categories} currentSlug={state.category} />
              </Suspense>
            ) : null}
          </div>

          <div className="flex h-10 items-center justify-between   bg-transparent px-3">
            <Link
              href={buildCatalogHref(state, { filtersOpen: !state.filtersOpen })}
              className={`inline-flex h-10 items-center gap-2 rounded-full px-5 font-[family-name:var(--font-mulish)] text-[1rem] font-normal transition ${
                state.filtersOpen
                  ? "bg-[#09070a] text-white shadow-[0_10px_24px_rgba(0,0,0,0.12)]"
                  : "bg-white text-[#121212] hover:bg-[#fff4da]"
              }`}
            >
              <Image
                src="/icons/filter.png"
                alt=""
                width={16}
                height={16}
                className={`h-4 w-4 shrink-0 ${state.filtersOpen ? "invert" : ""}`}
              />
              All Filter
            </Link>

            <Suspense>
              <SortDropdown currentSort={state.sort} />
            </Suspense>
          </div>
        </div>

        <div className={`grid gap-5 ${state.filtersOpen ? "lg:grid-cols-[460px_1fr]" : ""}`}>
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
              <>
                <div className="flex flex-wrap gap-6">
                  {courses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>

                <Suspense>
                  <CatalogPagination currentPage={currentPage} totalPages={totalPages} />
                </Suspense>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
