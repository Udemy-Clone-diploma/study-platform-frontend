import type { CourseDetail } from "@/entities/course";
import { CourseModuleItem } from "./CourseModuleItem";

type Props = { course: Pick<CourseDetail, "modules" | "lessons_count"> };

/** Curriculum section: heading, summary line, accordion of modules. Renders empty state when there are no modules. */
export function CourseCurriculum({ course }: Props) {
  const sorted = [...course.modules].sort((a, b) => a.order - b.order);
  const hasModules = sorted.length > 0;

  return (
    <section className="flex flex-col gap-7">
      <div className="flex flex-col gap-2">
        <h2 className="text-4xl text-(--color-text-primary) lg:text-5xl">Course Curriculum</h2>
        {hasModules && (
          <p className="text-xl text-(--color-text-secondary)">
            {sorted.length} {sorted.length === 1 ? "module" : "modules"} · {course.lessons_count}{" "}
            {course.lessons_count === 1 ? "lesson" : "lessons"}
          </p>
        )}
      </div>

      {hasModules ? (
        <div className="flex flex-col gap-5">
          {sorted.map((mod) => (
            <CourseModuleItem key={mod.id} courseModule={mod} />
          ))}
        </div>
      ) : (
        <p className="text-lg text-(--color-text-secondary)">Програму ще не сформовано.</p>
      )}
    </section>
  );
}
