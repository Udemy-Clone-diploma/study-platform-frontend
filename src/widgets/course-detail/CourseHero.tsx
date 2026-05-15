import type { CourseDetail } from "@/entities/course";
import { formatPrice } from "@/entities/course";
import { Stars } from "@/features/courses/ui/Stars";
import { CourseDescription } from "./CourseDescription";
import { CourseHeroCTA } from "./CourseHeroCTA";

type Props = { course: CourseDetail };

const LEVEL_LABEL: Record<CourseDetail["level"], string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const LANGUAGE_LABEL: Record<CourseDetail["language"], string> = {
  english: "English",
  ukrainian: "Ukrainian",
  spanish: "Spanish",
};

const MODE_LABEL: Record<CourseDetail["mode"], string> = {
  with_teacher: "With a teacher",
  self_learning: "Self-paced",
};

/** Top hero block: level, title, description, rating, meta pills, price + CTA. */
export function CourseHero({ course }: Props) {
  const studentsLabel = new Intl.NumberFormat("en-US").format(course.students_count);
  const ratingValue = Number(course.rating_avg).toFixed(1);

  return (
    <section className="flex flex-col gap-10">
      <div className="flex flex-col gap-5">
        {course.category && (
          <div className="text-sm font-(family-name:--font-source-code-pro) uppercase tracking-wide text-(--color-text-secondary)">
            {course.category.name}
          </div>
        )}
        <span className="inline-flex w-fit items-center rounded-md bg-(--color-brand-lavender) px-3 py-0.5 font-(family-name:--font-source-code-pro) text-sm uppercase text-(--color-blue-dark)">
          {LEVEL_LABEL[course.level]}
        </span>
        <h1 className="text-5xl leading-tight text-(--color-text-primary) lg:text-6xl xl:text-7xl">
          {course.title}
        </h1>
        <CourseDescription html={course.full_description} />
      </div>

      <div className="flex flex-wrap items-center gap-3 text-base text-(--color-text-primary)">
        <Stars rating={course.rating_avg} />
        <span>
          <strong className="font-semibold">{ratingValue}</strong>{" "}
          <span className="text-(--color-text-secondary)">
            ({studentsLabel} students enrolled)
          </span>
        </span>
      </div>

      <ul className="flex flex-wrap items-center gap-3">
        <MetaPill>Language: {LANGUAGE_LABEL[course.language]}</MetaPill>
        <MetaPill>{MODE_LABEL[course.mode]}</MetaPill>
        <MetaPill>{course.duration_hours}h total</MetaPill>
        <MetaPill>{course.lessons_count} lessons</MetaPill>
        {course.with_certificate && <MetaPill>Certificate included</MetaPill>}
      </ul>

      {course.tags.length > 0 && (
        <ul className="flex flex-wrap items-center gap-2">
          {course.tags.map((tag) => (
            <li
              key={tag.id}
              className="rounded-md bg-(--color-badge-lavender) px-2.5 py-0.5 font-(family-name:--font-source-code-pro) text-xs uppercase text-(--color-blue-dark)"
            >
              {tag.name}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-6">
        <div className="font-(family-name:--font-source-code-pro) text-3xl font-bold text-(--color-text-primary)">
          {formatPrice(course)}
        </div>
        <CourseHeroCTA slug={course.slug} />
      </div>
    </section>
  );
}

function MetaPill({ children }: { children: React.ReactNode }) {
  return (
    <li className="rounded-full border border-(--color-brand-pink) bg-(--color-bg-surface) px-3 py-1 text-base text-(--color-text-primary)">
      {children}
    </li>
  );
}
