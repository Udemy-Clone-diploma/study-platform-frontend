"use client";

import type { CourseListItem } from "@/features/courses/model/types/course";
import { CourseCard } from "@/features/courses/ui/CourseCard";
import { SectionContainer } from "@/shared/ui/SectionContainer";
import { useState } from "react";

type Props = { courses: CourseListItem[] };

export function PopularCoursesSection({ courses }: Props) {
    const doubled = [...courses, ...courses];
    const [paused, setPaused] = useState(false);

    return (
        <section>
            <SectionContainer>
                <h2 style={{
                    fontFamily: "var(--font-base)",
                    fontWeight: 400,
                    fontSize: "2.5vw",
                    lineHeight: 1.25,
                    textAlign: "center",
                    margin: "3%",
                    color: "var(--color-text-primary)",
                }}>
                    Popular courses
                </h2>
            </SectionContainer>
            <div style={{ overflow: "hidden", padding:  "16px 0", marginBottom: "3%" }}>
                <div
                    onMouseEnter={() => setPaused(true)}
                    onMouseLeave={() => setPaused(false)}
                    style={{
                        display: "flex",
                        gap: "3.65vw",
                        width: "max-content",
                        animation: "carousel-right 60s linear infinite",
                        animationDirection: "reverse",
                        animationPlayState: paused ? "paused" : "running",
                    }}
                >
                    {doubled.map((course, i) => (
                        <CourseCard key={`${course.id}-${i}`} course={course} />
                    ))}
                </div>
            </div>
        </section>
    );
}
