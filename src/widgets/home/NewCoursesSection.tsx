"use client";

import { useTranslations } from "next-intl";
import type { PublicCourseListItem } from "@/entities/course";
import { SectionContainer } from "@/shared/ui/SectionContainer";
import { CourseCarousel } from "./CourseCarousel";

type Props = { courses: PublicCourseListItem[]; wishlistedSlugs: string[] };

export function NewCoursesSection({ courses, wishlistedSlugs }: Props) {
  const t = useTranslations("HomeNewCourses");

  return (
    <section>
      <SectionContainer>
        <h2
          className="text-[24px] md:text-[30px] lg:text-[2.5vw]"
          style={{
            fontFamily: "var(--font-base)",
            fontWeight: 400,
            lineHeight: 1.25,
            textAlign: "center",
            margin: "3%",
            color: "var(--color-text-primary)",
          }}
        >
          {t("heading")}
        </h2>
      </SectionContainer>
      <CourseCarousel courses={courses} wishlistedSlugs={wishlistedSlugs} direction="right" />
    </section>
  );
}
