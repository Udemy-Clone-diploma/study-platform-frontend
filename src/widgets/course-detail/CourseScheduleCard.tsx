import { getTranslations } from "next-intl/server";
import { Calendar, Layers, Users } from "lucide-react";
import type { CourseCohort } from "@/entities/course";

type Props = {
  cohorts: CourseCohort[];
  modules_count: number;
  lessons_count: number;
};

/** Right-rail schedule card. Glass panel with a vertical icon list and a start-date footer. */
export async function CourseScheduleCard({ cohorts, modules_count, lessons_count }: Props) {
  const t = await getTranslations("CourseScheduleCard");
  const first = cohorts[0];

  const startDate = first?.start_date
    ? new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(
        new Date(first.start_date),
      )
    : null;

  // Compute h/week range across all cohorts
  const hours = cohorts.map(c => c.hours_per_week).filter(h => h > 0);
  const minH = hours.length ? Math.min(...hours) : 0;
  const maxH = hours.length ? Math.max(...hours) : 0;
  const hoursLabel =
    hours.length === 0
      ? null
      : minH === maxH
        ? t("hoursPerWeek", { hours: minH })
        : t("hoursPerWeekRange", { min: minH, max: maxH });

  const formatLabel = first?.group_size
    ? t("groupOf", { count: first.group_size })
    : t("group");

  return (
    <aside className="flex flex-col gap-8 rounded-xl bg-(--color-white-50) px-4 py-6 shadow-(--shadow-usp-glass) backdrop-blur-md sm:gap-10 sm:py-8">
      <h3 className="text-xl font-semibold text-(--color-text-primary) sm:text-2xl">{t("schedule")}</h3>

      <ul className="flex flex-col gap-3">
        {first && (
          <ScheduleRow icon={<Calendar />}>
            {t("monthsCount", { count: first.duration_months })}
            {hoursLabel ? ` | ${hoursLabel}` : ""}
          </ScheduleRow>
        )}
        <ScheduleRow icon={<Layers />}>
          {t("modulesLessons", { modules: modules_count, lessons: lessons_count })}
        </ScheduleRow>
        <ScheduleRow icon={<Users />}>{formatLabel}</ScheduleRow>
      </ul>

      {startDate && (
        <div className="flex flex-wrap items-baseline gap-3 text-base text-(--color-text-primary) sm:text-xl">
          <span className="font-semibold">{t("startDate")}</span>
          <span>{startDate}</span>
        </div>
      )}
    </aside>
  );
}

function ScheduleRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2 text-base text-(--color-text-primary) sm:text-xl">
      <span
        className="flex h-7 w-7 flex-shrink-0 items-center justify-center text-(--color-text-primary) sm:h-8 sm:w-8 [&>svg]:h-7 [&>svg]:w-7 sm:[&>svg]:h-8 sm:[&>svg]:w-8"
        aria-hidden="true"
      >
        {icon}
      </span>
      <span>{children}</span>
    </li>
  );
}
