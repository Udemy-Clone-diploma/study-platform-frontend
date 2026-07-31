import { notFound } from "next/navigation";
import { getCourseReviews, getEnrolledCourses, getPublicCourseBySlug } from "@/entities/course";
import { getAccessToken } from "@/shared/api/authCookies";
import { CourseDetailView } from "@/widgets/course-detail";

export const dynamic = "force-dynamic";

async function isCurrentUserEnrolledInCourse(slug: string, accessToken: string): Promise<boolean> {
  let page = 1;

  while (true) {
    const enrolled = await getEnrolledCourses(page, accessToken);

    if (enrolled.results.some((course) => course.slug === slug)) {
      return true;
    }

    if (!enrolled.next) {
      return false;
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

  const accessToken = await getAccessToken();
  const course = await getPublicCourseBySlug(slug).catch(() => null);
  if (!course) notFound();

  const reviews = await getCourseReviews(slug)
    .then((page) => page.results)
    .catch(() => []);

  const isEnrolled = accessToken
    ? await isCurrentUserEnrolledInCourse(slug, accessToken).catch(() => false)
    : false;

  return <CourseDetailView course={{ ...course, is_enrolled: isEnrolled }} reviews={reviews} />;
}
