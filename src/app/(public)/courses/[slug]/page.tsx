import { notFound } from "next/navigation";
import {
  getCourseBySlug,
  MOCK_COURSE_DETAIL_SLUG,
  mockCourseDetail,
} from "@/entities/course";
import { CourseDetailView } from "@/widgets/course-detail";

export const revalidate = 60;

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (slug === MOCK_COURSE_DETAIL_SLUG) {
    return <CourseDetailView course={mockCourseDetail} />;
  }

  const course = await getCourseBySlug(slug).catch(() => null);
  if (!course) notFound();

  return <CourseDetailView course={course} />;
}
