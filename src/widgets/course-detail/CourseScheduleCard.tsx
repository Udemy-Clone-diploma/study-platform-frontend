import { Calendar, Layers, Users } from "lucide-react";
import type { PublicCourseCohort } from "@/entities/course";

type Props = {
  cohorts: PublicCourseCohort[];
  modules_count: number;
  lessons_count: number;
};

/** Right-rail schedule card. Glass panel with a vertical icon list and a start-date footer. */
export function CourseScheduleCard({ cohorts, modules_count, lessons_count }: Props) {
  const first = cohorts[0];

  const startDate = first?.start_date
    ? new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(
        new Date(first.start_date),
      )
    : null;

  // Compute h/week range across all cohorts
  const hours = cohorts.map((c) => c.hours_per_week).filter((h) => h > 0);
  const minH = hours.length ? Math.min(...hours) : 0;
  const maxH = hours.length ? Math.max(...hours) : 0;
  const hoursLabel =
    hours.length === 0
      ? null
      : minH === maxH
        ? `${minH} hours per week`
        : `${minH}–${maxH} hours per week`;

  const formatLabel = first?.group_size ? `Group of ${first.group_size} people` : "Group";

  return (
    <aside className="flex flex-col gap-8 rounded-xl bg-(--color-white-50) px-4 py-6 shadow-(--shadow-usp-glass) backdrop-blur-md sm:gap-10 sm:py-8">
      <h3 className="text-xl font-semibold text-(--color-text-primary) sm:text-2xl">Schedule</h3>

      <ul className="flex flex-col gap-3">
        {first && (
          <ScheduleRow icon={<Calendar />}>
            {first.duration_months} {first.duration_months === 1 ? "Month" : "Months"}
            {hoursLabel ? ` | ${hoursLabel}` : ""}
          </ScheduleRow>
        )}
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
