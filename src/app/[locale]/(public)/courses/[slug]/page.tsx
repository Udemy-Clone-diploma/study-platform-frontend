import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getCourseBySlug, getCourseReviews, getPublicCourseBySlug } from "@/entities/course";
import { getAccessToken } from "@/shared/api/authCookies";
import { CourseDetailView } from "@/widgets/course-detail";

export const dynamic = "force-dynamic";

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (process.env.NODE_ENV !== "production") {
    const { MOCK_COURSE_DETAIL_SLUG, mockPublicCourseDetail, mockCourseReviews } =
      await import("@/entities/course/mocks/courseDetail");
    if (slug === MOCK_COURSE_DETAIL_SLUG) {
      return <CourseDetailView course={mockPublicCourseDetail} reviews={mockCourseReviews} />;
    }
  }

  const [accessToken, locale] = await Promise.all([getAccessToken(), getLocale()]);
  const course = await getPublicCourseBySlug(slug, locale).catch(() => null);
  if (!course) notFound();

  /** The public payload is translated but anonymous, so it never carries enrollment state.
   *  `/courses/{slug}/` derives is_enrolled from the bearer token, and every way it can
   *  fail (no token, expired token, 403 on a course this user cannot open) means the same
   *  thing to this page, so a null result renders as "not enrolled". */
  const [reviews, enrollment] = await Promise.all([
    getCourseReviews(slug)
      .then((page) => page.results)
      .catch(() => []),
    accessToken ? getCourseBySlug(slug, accessToken).catch(() => null) : null,
  ]);

  /** "suspended" (overdue installment) still counts as an enrollment the student can see
   *  and pay to restore, so is_enrolled here means specifically "active", matching how the
   *  flag is read everywhere else in the app. */
  const accessStatus = enrollment?.enrollment_access_status ?? null;

  return (
    <CourseDetailView
      course={{
        ...course,
        is_enrolled: accessStatus === "active",
        enrollment_access_status: accessStatus,
      }}
      reviews={reviews}
    />
  );
}
