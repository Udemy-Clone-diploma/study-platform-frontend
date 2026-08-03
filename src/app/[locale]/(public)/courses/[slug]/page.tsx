import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import {
  getCourseReviews,
  getEnrolledCourses,
  getPublicCourseBySlug,
  type EnrollmentStatus,
} from "@/entities/course";
import { getAccessToken } from "@/shared/api/authCookies";
import { CourseDetailView } from "@/widgets/course-detail";

export const dynamic = "force-dynamic";

/** "suspended" (overdue installment) still shows up in getEnrolledCourses (it stays
 *  visible so the student can see why and pay to restore it -- see
 *  Enrollment.with_visible_access on the backend), so isEnrolled here means
 *  specifically "active", matching is_enrolled everywhere else in the app. */
async function findCurrentUserEnrollment(
  slug: string,
  accessToken: string,
): Promise<{ isEnrolled: boolean; accessStatus: EnrollmentStatus | null }> {
  let page = 1;

  while (true) {
    const enrolled = await getEnrolledCourses(page, accessToken);
    const match = enrolled.results.find((course) => course.slug === slug);

    if (match) {
      return {
        isEnrolled: match.enrollment_access_status === "active",
        accessStatus: match.enrollment_access_status,
      };
    }

    if (!enrolled.next) {
      return { isEnrolled: false, accessStatus: null };
    }

    page += 1;
  }
}

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

  const reviews = await getCourseReviews(slug)
    .then((page) => page.results)
    .catch(() => []);

  const { isEnrolled, accessStatus } = accessToken
    ? await findCurrentUserEnrollment(slug, accessToken).catch(() => ({
        isEnrolled: false,
        accessStatus: null,
      }))
    : { isEnrolled: false, accessStatus: null };

  return (
    <CourseDetailView
      course={{ ...course, is_enrolled: isEnrolled, enrollment_access_status: accessStatus }}
      reviews={reviews}
    />
  );
}
