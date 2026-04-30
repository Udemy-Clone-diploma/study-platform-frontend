import Link from "next/link";


import { getNewCourses, getPopularCourses, getCategories } from "@/features/courses/api/coursesApi";
import { CourseCard } from "@/features/courses/ui/CourseCard";
import type { ApiError } from "@/shared/api/base";

export const dynamic = "force-dynamic";

async function loadHomePageData() {
  try {
    const [newCourses, popularCourses, categories] = await Promise.all([
      getNewCourses(),
      getPopularCourses(),
      getCategories(),
    ]);

    return {
      newCourses,
      popularCourses,
      categories,
      error: "",
    };
  } catch (error: unknown) {
    const apiError = error as Partial<ApiError>;

    return {
      newCourses: [],
      popularCourses: [],
      categories: [],
      error: apiError.message || apiError.detail || "Could not load homepage data.",
    };
  }
}

export default async function Home() {
  const { newCourses, popularCourses, categories, error } = await loadHomePageData();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold text-slate-950">Study platform</h1>
            <p className="max-w-2xl text-base text-slate-600">
              Quick access to the catalog, auth pages and dashboard. Discover new courses, browse
              the most popular topics, and explore category cards below.
            </p>
          </div>

          <nav className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/catalog"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Catalog
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Register
            </Link>
            <Link
              href="/dashboard"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Dashboard
            </Link>
          </nav>
        </header>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800 shadow-sm">
            <h2 className="text-xl font-semibold">Courses are unavailable</h2>
            <p className="mt-2 text-sm">{error}</p>
          </div>
        ) : newCourses.length === 0 &&
          popularCourses.length === 0 &&
          categories.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">No courses yet</h2>
            <p className="mt-2 text-slate-600">
              The homepage will show new, popular courses and categories once they are available.
            </p>
          </div>
        ) : (
          <>
            {newCourses.length > 0 && (
              <section className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-950">New courses</h2>
                    <p className="text-sm text-slate-600">
                      Latest additions from the catalog, shown as swipeable cards.
                    </p>
                  </div>
                  <p className="text-sm text-slate-500">Sorted by published date.</p>
                </div>

                <div className="flex gap-4 overflow-x-auto overflow-y-hidden pb-2 snap-x snap-mandatory">
                  {newCourses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
              </section>
            )}

            {popularCourses.length > 0 && (
              <section className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-950">Popular courses</h2>
                    <p className="text-sm text-slate-600">
                      Top-rated and most enrolled courses from the platform.
                    </p>
                  </div>
                  <p className="text-sm text-slate-500">Sorted by student count and rating.</p>
                </div>

                <div className="flex gap-4 overflow-x-auto overflow-y-hidden pb-2 snap-x snap-mandatory">
                  {popularCourses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
              </section>
            )}

            {categories.length > 0 && (
              <section className="space-y-4 pb-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-950">Categories</h2>
                    <p className="text-sm text-slate-600">Browse courses by category and topic.</p>
                  </div>
                  <p className="text-sm text-slate-500">
                    Cards are based on available course categories.
                  </p>
                </div>

                <div className="flex gap-4 overflow-x-auto overflow-y-hidden pb-2 snap-x snap-mandatory">
                  {categories.map((category) => (
                    <article
                      key={category.id}
                      className="min-w-[456px] max-w-[456px] flex-none snap-center rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <span className="text-xs uppercase tracking-[0.15em] text-slate-500">
                        Category
                      </span>
                      <h3 className="mt-3 text-xl font-semibold text-slate-950">{category.name}</h3>
                      <p className="mt-3 text-sm leading-6 text-slate-600 line-clamp-4">
                        {category.description || "Popular courses in this topic."}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}



