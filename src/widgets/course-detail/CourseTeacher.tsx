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
    <div className="grid grid-cols-1 gap-8 sm:gap-10 lg:grid-cols-[minmax(0,1fr)_460px] lg:grid-rows-[auto_auto] lg:items-center lg:gap-5">
      <div className="flex flex-col gap-4 sm:gap-6 lg:col-start-1 lg:row-start-1">
        <div className="flex flex-col gap-3">
          <h2 className="text-3xl text-(--color-text-primary) sm:text-4xl lg:text-5xl">
            {teacher.name}
          </h2>
          {teacher.specialization && (
            <p className="text-lg text-(--color-text-secondary) sm:text-xl">
              {teacher.specialization}
            </p>
          )}
          <SectionBadge>{t("teacherBadge")}</SectionBadge>
        </div>
        <p className="text-lg text-(--color-text-primary) sm:text-xl lg:text-2xl">{teacher.bio}</p>
      </div>

      <div className="relative mx-auto aspect-[460/652] w-full max-w-[460px] overflow-hidden rounded-[20px] bg-(--color-placeholder) lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:mx-0">
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
        <div className="flex flex-col gap-10 sm:gap-12 lg:col-start-1 lg:row-start-2 lg:gap-[60px]">
          {stats.length > 0 && (
            <ul className="flex flex-wrap gap-x-8 gap-y-4 sm:gap-x-12 sm:gap-y-6 lg:gap-x-20">
              {stats.map((stat) => (
                <li key={stat.label} className="flex flex-col gap-1">
                  <span className="text-4xl text-(--color-text-primary) sm:text-5xl">
                    {stat.value}+
                  </span>
                  <span className="text-base text-(--color-text-primary) sm:text-xl lg:text-2xl">
                    {stat.label}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {quote && (
            <blockquote className="rounded-[20px] bg-(--color-white-20) px-6 py-4 shadow-(--shadow-usp-glass)">
              <p className="text-center text-base text-(--color-text-primary)">
                &#x201C;{quote}&#x201D;
              </p>
            </blockquote>
          )}
        </div>
      )}
    </div>
  );
}
