import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Award,
  BookOpen,
  Clock,
  Globe2,
  GraduationCap,
  Layers,
  Signal,
  Users,
} from "lucide-react";
import { formatPrice, getCourseBySlug, type CourseDetail } from "@/entities/course";
import { EnrollButton } from "@/features/courses";
import type { ApiError } from "@/shared/api/base";

export const dynamic = "force-dynamic";

type LoadCourseResult =
  | { course: CourseDetail; error?: never; notFound?: never }
  | { course?: never; error: string; notFound?: never }
  | { course?: never; error?: never; notFound: true };

const LEVEL_LABELS: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

function labelize(value: string | null | undefined) {
  if (!value) return "Course";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function loadCourse(slug: string): Promise<LoadCourseResult> {
  try {
    return { course: await getCourseBySlug(slug) };
  } catch (error: unknown) {
    const apiError = error as Partial<ApiError>;
    if (apiError.status === 404) return { notFound: true };

    return {
      error: apiError.message || apiError.detail || "Could not load the course.",
    };
  }
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await loadCourse(slug);

  if ("notFound" in result) notFound();

  if ("error" in result) {
    return (
      <div className="bg-catalog-page flex min-h-screen items-center justify-center px-4 py-20 text-(--color-text-primary)">
        <div className="w-full max-w-xl rounded-[8px] border border-red-200 bg-white p-8 shadow-(--shadow-card)">
          <h1 className="text-2xl font-semibold">Course is unavailable</h1>
          <p className="mt-3 text-(--color-text-secondary)">{result.error}</p>
          <Link
            href="/catalog"
            className="mt-6 inline-flex rounded-full bg-(--color-text-primary) px-5 py-2.5 text-sm font-semibold text-white"
          >
            Back to catalog
          </Link>
        </div>
      </div>
    );
  }

  const course = result.course;
  const description = course.full_description || course.short_description;
  const teacherName = course.teacher.name || "Course teacher";
  const hasImage = Boolean(course.image);

  return (
    <div className="bg-catalog-page min-h-screen text-(--color-text-primary)">
      <main className="mx-auto flex w-full max-w-[1360px] flex-col px-4 pb-20 pt-24 md:px-8">
        <Link
          href="/catalog"
          className="mb-8 inline-flex w-fit items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-(--color-text-primary) shadow-[0_6px_18px_rgba(76,68,87,0.12)] transition hover:bg-(--color-bg-surface)"
        >
          Back to catalog
        </Link>

        <section className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
          <div className="flex min-w-0 flex-col">
            <div className="mb-5 flex flex-wrap gap-2">
              {course.category ? (
                <span className="rounded-full bg-(--color-brand-lavender) px-4 py-1.5 text-sm font-semibold text-(--color-blue-dark)">
                  {course.category.name}
                </span>
              ) : null}
              <span className="rounded-full bg-(--color-brand-yellow) px-4 py-1.5 text-sm font-semibold text-(--color-yellow-dark)">
                {labelize(course.course_type)}
              </span>
              <span className="rounded-full bg-(--color-brand-pink) px-4 py-1.5 text-sm font-semibold text-(--color-pink-dark)">
                {labelize(course.delivery_type)}
              </span>
            </div>

            <h1 className="max-w-4xl text-4xl font-bold leading-tight md:text-6xl">
              {course.title}
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-(--color-text-secondary)">
              {course.short_description}
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="flex items-center gap-3 rounded-[8px] bg-white px-4 py-3 shadow-[0_8px_22px_rgba(76,68,87,0.10)]">
                <Signal aria-hidden="true" className="h-5 w-5 text-(--color-blue)" />
                <div>
                  <p className="text-sm text-(--color-text-secondary)">Level</p>
                  <p className="font-semibold">
                    {LEVEL_LABELS[course.level] ?? labelize(course.level)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-[8px] bg-white px-4 py-3 shadow-[0_8px_22px_rgba(76,68,87,0.10)]">
                <Clock aria-hidden="true" className="h-5 w-5 text-(--color-blue)" />
                <div>
                  <p className="text-sm text-(--color-text-secondary)">Duration</p>
                  <p className="font-semibold">{course.duration_hours} hours</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-[8px] bg-white px-4 py-3 shadow-[0_8px_22px_rgba(76,68,87,0.10)]">
                <BookOpen aria-hidden="true" className="h-5 w-5 text-(--color-blue)" />
                <div>
                  <p className="text-sm text-(--color-text-secondary)">Lessons</p>
                  <p className="font-semibold">{course.lessons_count}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-[8px] bg-white px-4 py-3 shadow-[0_8px_22px_rgba(76,68,87,0.10)]">
                <Users aria-hidden="true" className="h-5 w-5 text-(--color-blue)" />
                <div>
                  <p className="text-sm text-(--color-text-secondary)">Students</p>
                  <p className="font-semibold">{course.students_count.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          <aside className="rounded-[8px] bg-white shadow-(--shadow-card) lg:sticky lg:top-8">
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-t-[8px] bg-(--color-brand-cream)">
              {hasImage ? (
                <Image
                  src={course.image as string}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 420px, 100vw"
                  unoptimized
                  className="object-contain p-6"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[var(--gradient-brand)]">
                  <GraduationCap aria-hidden="true" className="h-24 w-24 text-white/85" />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-6 p-6">
              <div>
                <p className="text-sm text-(--color-text-secondary)">Course price</p>
                <p className="mt-1 text-3xl font-bold">{formatPrice(course)}</p>
              </div>

              <EnrollButton courseId={course.id} />

              <dl className="grid gap-4 border-t border-black/10 pt-5 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="flex items-center gap-2 text-(--color-text-secondary)">
                    <Globe2 aria-hidden="true" className="h-4 w-4" />
                    Language
                  </dt>
                  <dd className="font-semibold">{labelize(course.language)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="flex items-center gap-2 text-(--color-text-secondary)">
                    <Layers aria-hidden="true" className="h-4 w-4" />
                    Format
                  </dt>
                  <dd className="font-semibold">{labelize(course.mode)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="flex items-center gap-2 text-(--color-text-secondary)">
                    <Award aria-hidden="true" className="h-4 w-4" />
                    Certificate
                  </dt>
                  <dd className="font-semibold">{course.with_certificate ? "Included" : "No"}</dd>
                </div>
              </dl>
            </div>
          </aside>
        </section>

        <section className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <h2 className="text-3xl font-bold">Course Description</h2>
            <p className="mt-5 whitespace-pre-line text-lg leading-8 text-(--color-text-secondary)">
              {description}
            </p>
          </div>

          <div>
            <h2 className="text-3xl font-bold">Teacher</h2>
            <div className="mt-5 flex items-center gap-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-(--color-brand-lavender)">
                {course.teacher.avatar ? (
                  <Image
                    src={course.teacher.avatar}
                    alt=""
                    fill
                    sizes="64px"
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xl font-bold text-(--color-blue-dark)">
                    {teacherName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold">{teacherName}</p>
                {course.teacher.bio ? (
                  <p className="mt-1 line-clamp-3 text-sm leading-6 text-(--color-text-secondary)">
                    {course.teacher.bio}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        {course.modules.length > 0 ? (
          <section className="mt-14">
            <h2 className="text-3xl font-bold">Program</h2>
            <div className="mt-5 grid gap-4">
              {course.modules.map((module, index) => (
                <article
                  key={module.id}
                  className="rounded-[8px] bg-white p-5 shadow-[0_8px_22px_rgba(76,68,87,0.10)]"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-xl font-semibold">
                      {index + 1}. {module.title}
                    </h3>
                    <span className="text-sm text-(--color-text-secondary)">
                      {module.lessons.length} lessons
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
