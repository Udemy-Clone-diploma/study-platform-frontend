import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SlidersHorizontal } from "lucide-react";
import {
  getCategories,
  getPublicCourses,
  type Category,
  type CourseLanguage,
  type CourseLevel,
  type CourseType,
  type DeliveryFormatType,
} from "@/entities/course";
import { getWishlistSlugs } from "@/entities/course";
import {
  buildCatalogHref,
  CatalogFiltersSidebar,
  CatalogPagination,
  CategoryFilter,
  CourseCard,
  CourseSearch,
  parseCatalogState,
  resetCatalogFiltersHref,
  SortDropdown,
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

/**
 * URL filter values arrive as user-controlled comma-separated strings. The
 * backend ignores unknown values, so we trust the cast at this boundary
 * instead of validating every entry against the union members.
 */
function splitFilter<T extends string>(value: string | undefined): Array<T> | undefined {
  if (!value) return undefined;
  const parts = value.split(",").filter(Boolean) as Array<T>;
  return parts.length ? parts : undefined;
}

async function loadCourses(
  state: CatalogFilterState,
  page: number,
  ordering: string | undefined,
  fallbackErrorMessage: string,
  locale: string,
) {
  try {
    const data = await getPublicCourses({
      category: state.category,
      course_type: splitFilter<CourseType>(state.course_type),
      is_on_sale: state.is_on_sale,
      language: splitFilter<CourseLanguage>(state.language),
      level: splitFilter<CourseLevel>(state.level),
      ordering,
      format_type: splitFilter<DeliveryFormatType>(state.format_type),
      price_min: state.price_min ? Number(state.price_min) : undefined,
      price_max: state.price_max ? Number(state.price_max) : undefined,
      rating_min: state.rating_min,
      search: state.search,
      with_certificate: state.with_certificate,
      page,
      page_size: PAGE_SIZE,
      lang: locale,
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
      error: apiError.message || apiError.detail || fallbackErrorMessage,
    };
  }
}

async function loadCategories(): Promise<Category[]> {
  try {
    const locale = await getLocale();
    return await getCategories(locale);
  } catch {
    return [];
  }
}

/**
 * Everything that depends on the filtered/paginated course list: sidebar,
 * card grid, and pagination. Kept in its own Suspense boundary so changing a
 * filter only re-suspends this slice of the page instead of the whole route
 * (which would otherwise fall back to the route's generic loading.tsx).
 */
async function CatalogResults({
  categories,
  state,
  page,
  ordering,
}: {
  categories: Category[];
  state: CatalogFilterState;
  page: number;
  ordering: string | undefined;
}) {
  const t = await getTranslations("Catalog");
  const locale = await getLocale();

  const [{ courses, count, error }, wishlistedSlugs] = await Promise.all([
    loadCourses(state, page, ordering, t("errorLoadCourses"), locale),
    getWishlistSlugs().catch(() => []),
  ]);
  const wishlistSet = new Set(wishlistedSlugs);

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const showPagination = !error && courses.length > 0;

  return (
    <>
      <div className={`relative grid gap-5 ${state.filtersOpen ? "lg:grid-cols-[460px_1fr]" : ""}`}>
        {state.filtersOpen ? <CatalogFiltersSidebar categories={categories} state={state} /> : null}

        <section>
          {error ? (
            <div className="rounded-[8px] border border-red-200 bg-red-50 p-6 text-red-800 shadow-sm">
              <h3 className="text-xl font-semibold">{t("coursesUnavailable")}</h3>
              <p className="mt-2 text-sm">{error}</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="rounded-[8px] bg-white p-10 text-center shadow-[0_8px_22px_rgba(76,68,87,0.12)]">
              <h3 className="text-xl font-semibold">{t("noCoursesFound")}</h3>
              <p className="mt-2 text-(--color-text-secondary)">{t("tryAnotherFilters")}</p>
              <Link
                href={resetCatalogFiltersHref(state)}
                scroll={false}
                className="mt-6 inline-flex rounded-full bg-(--color-text-primary) px-6 py-2 text-sm font-medium text-white"
              >
                {t("resetFilters")}
              </Link>
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-4">
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  isWishlisted={wishlistSet.has(course.slug)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {showPagination ? (
        <div className="mt-auto pt-10">
          <CatalogPagination currentPage={page} totalPages={totalPages} />
        </div>
      ) : null}
    </>
  );
}

function CatalogResultsSkeleton() {
  return (
    <div className="flex flex-wrap justify-center gap-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="h-[360px] w-[300px] animate-pulse rounded-[8px] bg-(--color-bg-surface)"
        />
      ))}
    </div>
  );
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  const params = await searchParams;
  const state = parseCatalogState(params);
  const currentPage = parsePage(params);
  const ordering = firstParam(params.sort);
  const t = await getTranslations("Catalog");
  const categories = await loadCategories();

  return (
    <div className="bg-catalog-page flex min-h-screen w-full flex-col text-(--color-text-primary)">
      <div className="mx-auto flex w-full max-w-[1480px] flex-1 flex-col px-4 pt-12 pb-25 lg:pt-50 lg:px-8">
        <CatalogHero />

        <div className="mt-15 flex w-full flex-col items-stretch gap-6 lg:flex-row lg:items-center">
          <Suspense>
            <CourseSearch initialQuery={state.search} />
          </Suspense>

          <Suspense>
            <CategoryFilter categories={categories} currentSlug={state.category} />
          </Suspense>
        </div>

        {/* Figma spec: 150px gap from search row to filter bar (desktop only; tighter below lg). */}
        <div className="mt-10 flex flex-1 flex-col gap-6 lg:mt-37.5 lg:gap-14">
          <div className="flex items-center justify-between gap-4">
            <Link
              href={buildCatalogHref(state, { filtersOpen: !state.filtersOpen })}
              scroll={false}
              className={`flex h-10 min-w-[132px] items-center justify-center gap-2 rounded-full px-4 text-xl font-medium transition-colors ${
                state.filtersOpen
                  ? "bg-(--color-text-primary) text-white"
                  : "bg-(--color-bg) text-(--color-text-primary) hover:bg-(--color-bg-surface)"
              }`}
            >
              <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
              <span>{t("allFilters")}</span>
            </Link>

            <Suspense>
              <SortDropdown currentSort={ordering} />
            </Suspense>
          </div>

          <Suspense fallback={<CatalogResultsSkeleton />}>
            <CatalogResults
              categories={categories}
              state={state}
              page={currentPage}
              ordering={ordering}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
