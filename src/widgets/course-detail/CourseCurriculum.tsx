import { getTranslations } from "next-intl/server";
import type { PublicCourseDetail } from "@/entities/course";
import { CourseModuleItem } from "./CourseModuleItem";

type Props = {
  course: Pick<PublicCourseDetail, "modules" | "lessons_count">;
  slug: string;
  hasPricing?: boolean;
  hideHeading?: boolean;
};

/** Curriculum section: heading (optional), summary line, accordion of modules. */
export async function CourseCurriculum({
  course,
  slug,
  hasPricing = false,
  hideHeading = false,
}: Props) {
  const sorted = [...course.modules].sort((a, b) => a.order - b.order);
  const hasModules = sorted.length > 0;
  const t = await getTranslations("CourseCurriculum");

  return (
    <section className="flex flex-col gap-3 sm:gap-6">
      {!hideHeading && (
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl text-(--color-text-primary) sm:text-4xl lg:text-5xl">
            {t("heading")}
          </h2>
          {hasModules && (
            <p className="text-sm text-(--color-text-secondary) sm:text-lg">
              {t("summary", { lessons: course.lessons_count, modules: sorted.length })}
            </p>
          )}
        </div>
      )}

      {hasModules ? (
        <div className="flex flex-col">
          {sorted.map((mod) => (
            <CourseModuleItem key={mod.id} courseModule={mod} slug={slug} hasPricing={hasPricing} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-(--color-text-secondary) sm:text-lg">{t("noCurriculum")}</p>
      )}
    </section>
  );
}
