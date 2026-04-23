import Link from "next/link";
import { getCourses } from "@/features/courses/api/coursesApi";
import type {
  CourseLanguage,
  CourseLevel,
  CourseListItem,
  CourseMode,
  CoursePricingType,
} from "@/features/courses/model/types/course";
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

async function loadCourses() {
  try {
    return {
      courses: await getCourses(),
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

export default async function CatalogPage() {
  const { courses, error } = await loadCourses();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold">Catalog</h1>
            <p className="text-sm text-slate-600">All courses available from the API.</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Home
            </Link>
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1/"}courses/`}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              target="_blank"
              rel="noreferrer"
            >
              Courses API
            </a>
          </div>
        </header>

        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-950">
              {courses.length} course{courses.length === 1 ? "" : "s"}
            </h2>
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800 shadow-sm">
              <h3 className="text-xl font-semibold">Courses are unavailable</h3>
              <p className="mt-2 text-sm">{error}</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <h3 className="text-xl font-semibold text-slate-950">No courses yet</h3>
              <p className="mt-2 text-slate-600">The catalog will show courses here once they are created.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
    </main>
  );
}
