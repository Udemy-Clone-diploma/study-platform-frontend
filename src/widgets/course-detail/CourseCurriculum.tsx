import type { CourseDetail } from "@/entities/course";
import { CourseModuleItem } from "./CourseModuleItem";

type Props = {
  course: Pick<CourseDetail, "modules" | "lessons_count">;
  hideHeading?: boolean;
};

/** Curriculum section: heading (optional), summary line, accordion of modules. */
export function CourseCurriculum({ course, hideHeading = false }: Props) {
  const sorted = [...course.modules].sort((a, b) => a.order - b.order);
  const hasModules = sorted.length > 0;

  return (
    <section className="flex flex-col gap-6">
      {!hideHeading && (
        <div className="flex flex-col gap-2">
          <h2 className="text-4xl text-(--color-text-primary) lg:text-5xl">Course Curriculum</h2>
          {hasModules && (
            <p className="text-lg text-(--color-text-secondary)">
              {course.lessons_count} Video Lessons across {sorted.length}{" "}
              {sorted.length === 1 ? "Module" : "Modules"}
            </p>
          )}
        </div>
      )}

      {hasModules ? (
        <div className="flex flex-col">
          {sorted.map((mod) => (
            <CourseModuleItem key={mod.id} courseModule={mod} />
          ))}
        </div>
      ) : (
        <p className="text-lg text-(--color-text-secondary)">No curriculum available yet.</p>
      )}
    </section>
  );
}
