import { notFound } from "next/navigation";
import { LessonPlayerView } from "@/widgets/lesson-player";

/**
 * Lesson viewer route. Server responsibility: validate the lesson id and,
 * in dev, hand off the mock payloads when the slug matches the dev course.
 * In production the client component fetches everything itself; all calls
 * are enrollment-gated so they need the JWT cookie that's only in scope on
 * the client.
 */
export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; lessonId: string }>;
}) {
  const { slug, lessonId } = await params;
  const id = Number(lessonId);
  if (!Number.isFinite(id) || id <= 0) notFound();

  if (process.env.NODE_ENV !== "production") {
    const { MOCK_COURSE_DETAIL_SLUG, mockCourseDetail, mockCourseProgress, mockLessonDetails } =
      await import("@/entities/course/mocks/courseDetail");
    if (slug === MOCK_COURSE_DETAIL_SLUG) {
      const mockLesson = mockLessonDetails[id];
      if (!mockLesson) notFound();
      return (
        <LessonPlayerView
          slug={slug}
          lessonId={id}
          initialCourse={mockCourseDetail}
          initialLesson={mockLesson}
          initialProgress={mockCourseProgress}
          isMock
        />
      );
    }
  }

  return <LessonPlayerView slug={slug} lessonId={id} />;
}
