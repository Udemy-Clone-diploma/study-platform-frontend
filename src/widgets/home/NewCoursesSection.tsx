import type { CourseListItem } from "@/features/courses/model/types/course";
import { CourseCard } from "@/features/courses/ui/CourseCard";
import { SectionContainer } from "@/shared/ui/SectionContainer";

type Props = { courses: CourseListItem[] };

export function NewCoursesSection({ courses }: Props) {
    return (
        <section>
            <SectionContainer>
                <h2>New Courses</h2>
            </SectionContainer>
            <div style={{ display: "flex", gap: 24, overflowX: "auto", paddingLeft: "max(1rem, calc((100vw - 1480px) / 2 + 2rem))" }}>
                {courses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                ))}
            </div>
        </section>
    );
}
