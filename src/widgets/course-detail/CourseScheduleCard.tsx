import { Calendar, Layers, Users } from "lucide-react";
import type { CourseCohort } from "@/entities/course";

type Props = {
  cohort: CourseCohort;
  modules_count: number;
  lessons_count: number;
};

const DELIVERY_LABEL: Record<CourseCohort["delivery_mode"], string> = {
  group: "Group",
  individual: "Individually",
  both: "Individually",
};

/** Right-rail schedule card. Glass panel with a vertical icon list and a start-date footer. */
export function CourseScheduleCard({ cohort, modules_count, lessons_count }: Props) {
  const startDate = cohort.start_date
    ? new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(
        new Date(cohort.start_date),
      )
    : null;

  const hoursLabel =
    cohort.hours_per_week_min === cohort.hours_per_week_max
      ? `${cohort.hours_per_week_min} hours per week`
      : `${cohort.hours_per_week_min}-${cohort.hours_per_week_max} hours per week`;

  const formatLabel =
    cohort.delivery_mode === "both"
      ? `Group of ${cohort.group_size ?? 0} people | Individually`
      : cohort.group_size
        ? `Group of ${cohort.group_size} people`
        : DELIVERY_LABEL[cohort.delivery_mode];

  return (
    <aside className="flex flex-col gap-8 rounded-xl bg-(--color-white-50) px-4 py-6 shadow-(--shadow-usp-glass) backdrop-blur-md sm:gap-10 sm:py-8">
      <h3 className="text-xl font-semibold text-(--color-text-primary) sm:text-2xl">Schedule</h3>

      <ul className="flex flex-col gap-3">
        <ScheduleRow icon={<Calendar />}>
          {cohort.duration_months} {cohort.duration_months === 1 ? "Month" : "Months"} | {hoursLabel}
        </ScheduleRow>
        <ScheduleRow icon={<Layers />}>
          {modules_count} {modules_count === 1 ? "module" : "modules"} | {lessons_count}{" "}
          {lessons_count === 1 ? "lesson" : "lessons"}
        </ScheduleRow>
        <ScheduleRow icon={<Users />}>{formatLabel}</ScheduleRow>
      </ul>

      {startDate && (
        <div className="flex flex-wrap items-baseline gap-3 text-base text-(--color-text-primary) sm:text-xl">
          <span className="font-semibold">Start date:</span>
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
