import type { CourseDetail } from "@/entities/course";
import { SectionContainer } from "@/shared/ui/SectionContainer";
import { CourseCurriculum } from "./CourseCurriculum";
import { CourseHero } from "./CourseHero";
import { CourseTeacher } from "./CourseTeacher";

type Props = { course: CourseDetail };

/** Top-level composition for the /courses/[slug] page. */
export function CourseDetailView({ course }: Props) {
  return (
    <SectionContainer>
      <article className="mx-auto flex max-w-[1100px] flex-col gap-20 py-16 lg:py-24">
        <CourseHero course={course} />
        <CourseTeacher teacher={course.teacher} />
        <CourseCurriculum course={course} />
      </article>
    </SectionContainer>
  );
}
