import Image from "next/image";
import type { Teacher } from "@/entities/course";

type Props = { teacher: Teacher };

/** Instructor block: avatar, name, "Instructor" badge, bio. */
export function CourseTeacher({ teacher }: Props) {
  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-3xl text-(--color-text-primary) lg:text-4xl">Instructor</h2>
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <div className="flex-shrink-0">
          {teacher.avatar ? (
            <Image
              src={teacher.avatar}
              alt={teacher.name}
              width={128}
              height={128}
              className="h-32 w-32 rounded-full object-cover"
            />
          ) : (
            <div
              className="flex h-32 w-32 items-center justify-center rounded-full bg-(--color-placeholder) font-(family-name:--font-source-code-pro) text-3xl text-(--color-text-primary)"
              aria-hidden="true"
            >
              {teacher.name.charAt(0)}
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-3xl text-(--color-text-primary)">{teacher.name}</h3>
            <span className="rounded-md bg-(--color-badge-lavender) px-2.5 py-0.5 font-(family-name:--font-source-code-pro) text-sm uppercase text-(--color-blue-dark)">
              Instructor
            </span>
          </div>
          <p className="text-lg text-(--color-text-secondary)">{teacher.bio}</p>
        </div>
      </div>
    </section>
  );
}
