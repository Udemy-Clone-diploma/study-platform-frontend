import { notFound } from "next/navigation";
import { getCourseBySlug, getCourseReviews } from "@/entities/course";
import { CourseDetailView } from "@/widgets/course-detail";

export const revalidate = 60;

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (process.env.NODE_ENV !== "production") {
    const { MOCK_COURSE_DETAIL_SLUG, mockCourseDetail, mockCourseReviews } = await import(
      "@/entities/course/mocks/courseDetail"
    );
    if (slug === MOCK_COURSE_DETAIL_SLUG) {
      return <CourseDetailView course={mockCourseDetail} reviews={mockCourseReviews} />;
    }
  }

  const course = await getCourseBySlug(slug).catch(() => null);
  if (!course) notFound();

  const reviews = await getCourseReviews(slug)
    .then((page) => page.results)
    .catch(() => []);

  return <CourseDetailView course={course} reviews={reviews} />;
}
