"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { PublicCourseListItem } from "@/entities/course";
import { CourseCard } from "@/features/courses";
import { SectionContainer } from "@/shared/ui/SectionContainer";

type Props = { courses: PublicCourseListItem[]; wishlistedSlugs: string[] };

export function PopularCoursesSection({ courses, wishlistedSlugs }: Props) {
  const wishlistSet = new Set(wishlistedSlugs);
  const doubled = [...courses, ...courses];
  const [paused, setPaused] = useState(false);
  const t = useTranslations("HomePopularCourses");

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
      <div style={{ overflow: "hidden", padding: "16px 0", marginBottom: "clamp(62px, 8vw, 150px)" }}>
        <div
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          style={{
            display: "flex",
            gap: "3.65vw",
            width: "max-content",
            minHeight: "clamp(300px, calc(284.95px + 4.01vw), 362px)",
            animation: "carousel-right 60s linear infinite",
            animationDirection: "reverse",
            animationPlayState: paused ? "paused" : "running",
          }}
        >
          {doubled.map((course, index) => (
            <CourseCard
              key={`${course.id}-${index}`}
              course={course}
              isWishlisted={wishlistSet.has(course.slug)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
