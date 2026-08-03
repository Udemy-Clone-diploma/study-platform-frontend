import Image from "next/image";
import { getTranslations } from "next-intl/server";
import type { Teacher } from "@/entities/course";
import { SectionBadge } from "./SectionBadge";

type Props = { teacher: Teacher; quote: string | null };

/** Teacher section: name, badge, bio, inline stats and pull-quote on the left, portrait on the right. */
export async function CourseTeacher({ teacher, quote }: Props) {
  const t = await getTranslations("CourseTeacher");
  const stats = (
    [
      { value: teacher.years_experience, label: t("yearsExperience") },
      { value: teacher.students_taught, label: t("students") },
      { value: teacher.partnerships_count, label: t("partnerships") },
    ] as const
  ).filter((s) => s.value != null) as { value: number; label: string }[];

  return (
    <div className="grid grid-cols-1 gap-5 sm:gap-10 lg:grid-cols-[minmax(0,1fr)_460px] lg:grid-rows-[auto_auto] lg:items-center lg:gap-5">
      <div className="flex flex-col gap-3 sm:gap-6 lg:col-start-1 lg:row-start-1">
        <div className="flex flex-col gap-2 sm:gap-3">
          <h2 className="text-2xl leading-tight text-(--color-text-primary) sm:text-4xl lg:text-5xl">
            {teacher.name}
          </h2>
          {teacher.specialization && (
            <p className="text-sm text-(--color-text-secondary) sm:text-xl">
              {teacher.specialization}
            </p>
          )}
          <SectionBadge>{t("teacherBadge")}</SectionBadge>
        </div>
        <p className="text-[13px] leading-[1.25] text-(--color-text-primary) sm:text-xl sm:leading-normal lg:text-2xl">
          {teacher.bio}
        </p>
      </div>

      <div className="relative mx-auto aspect-[460/652] w-full max-w-[460px] overflow-hidden rounded-[14px] bg-(--color-placeholder) sm:rounded-[20px] lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:mx-0">
        {teacher.avatar ? (
          <Image
            src={teacher.avatar}
            alt={teacher.name}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 460px, 90vw"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center font-(family-name:--font-accent) text-6xl text-(--color-text-primary)/40"
            aria-hidden="true"
          >
            {teacher.name.charAt(0)}
          </div>
        )}
      </div>

      {(stats.length > 0 || quote) && (
        <div className="flex flex-col gap-5 sm:gap-12 lg:col-start-1 lg:row-start-2 lg:gap-[60px]">
          {stats.length > 0 && (
            <ul className="grid grid-cols-3 gap-3 sm:flex sm:flex-wrap sm:gap-x-12 sm:gap-y-6 lg:gap-x-20">
              {stats.map((stat) => (
                <li key={stat.label} className="flex flex-col gap-1">
                  <span className="text-2xl leading-none text-(--color-text-primary) sm:text-5xl sm:leading-normal">
                    {stat.value}+
                  </span>
                  <span className="text-[10px] leading-[1.15] text-(--color-text-primary) sm:text-xl sm:leading-normal lg:text-2xl">
                    {stat.label}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {quote && (
            <blockquote className="rounded-[14px] bg-(--color-white-20) px-3 py-3 shadow-(--shadow-usp-glass) sm:rounded-[20px] sm:px-6 sm:py-4">
              <p className="text-center text-[10px] leading-[1.2] text-(--color-text-primary) sm:text-base sm:leading-normal">
                &#x201C;{quote}&#x201D;
              </p>
            </blockquote>
          )}
        </div>
      )}
    </div>
  );
}
