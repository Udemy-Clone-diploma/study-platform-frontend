import { notFound } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { getCourseBySlug } from "@/entities/course";
import type { CourseDetail } from "@/entities/course";
import type { ApiError } from "@/shared/api/base";
import { getAccessToken } from "@/shared/api/authCookies";
import { CourseOverviewView, CourseProgressView } from "@/widgets/lesson-player";

/**
 * Lesson player home for an enrolled student. `?tab=progress` selects the
 * Progress tab, otherwise the Course overview; both share this route's auth gate.
 */
export default async function LearnEntryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { slug } = await params;
  const { tab } = await searchParams;
  const isProgress = tab === "progress";

  if (process.env.NODE_ENV !== "production") {
    const { MOCK_COURSE_DETAIL_SLUG, mockCourseDetail, mockCourseProgress } =
      await import("@/entities/course/mocks/courseDetail");
    if (slug === MOCK_COURSE_DETAIL_SLUG) {
      return isProgress ? (
        <CourseProgressView course={mockCourseDetail} initialProgress={mockCourseProgress} isMock />
      ) : (
        <CourseOverviewView course={mockCourseDetail} initialProgress={mockCourseProgress} isMock />
      );
    }
  }

  const accessToken = await getAccessToken();
  let course: CourseDetail;
  try {
    course = await getCourseBySlug(slug, accessToken);
  } catch (err) {
    // Only a real 404 means "not found"; let other errors reach the error boundary.
    if ((err as Partial<ApiError>).status === 404) notFound();
    throw err;
  }

  if (!course.is_enrolled) {
    redirect({ href: `/courses/${slug}`, locale: await getLocale() });
  }

  return isProgress ? (
    <CourseProgressView course={course} />
  ) : (
    <CourseOverviewView course={course} />
  );
}
