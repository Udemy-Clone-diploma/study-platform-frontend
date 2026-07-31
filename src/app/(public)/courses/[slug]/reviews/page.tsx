import { notFound } from "next/navigation";
import { getCourseReviews, getPublicCourseBySlug } from "@/entities/course";
import { CourseReviewsView } from "@/widgets/course-detail";

export const revalidate = 60;

export default async function CourseReviewsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (process.env.NODE_ENV !== "production") {
    const { MOCK_COURSE_DETAIL_SLUG, mockCourseDetail, mockCourseReviews } =
      await import("@/entities/course/mocks/courseDetail");
    if (slug === MOCK_COURSE_DETAIL_SLUG) {
      return <CourseReviewsView courseTitle={mockCourseDetail.title} reviews={mockCourseReviews} />;
    }
  }

  const course = await getPublicCourseBySlug(slug).catch(() => null);
  if (!course) notFound();

  const reviews = await getCourseReviews(slug)
    .then((page) => page.results)
    .catch(() => []);

  return <CourseReviewsView courseTitle={course.title} reviews={reviews} />;
}
