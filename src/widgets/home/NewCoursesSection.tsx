"use client";

import type { CourseListItem } from "@/entities/course";
import { CourseCard } from "@/features/courses";
import { SectionContainer } from "@/shared/ui/SectionContainer";
import { useState } from "react";

type Props = { courses: CourseListItem[] };
const COURSE_CARD_WIDTH = "clamp(260px, 23vw, 360px)";

export function NewCoursesSection({ courses }: Props) {
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
                    New courses
                </h2>
            </SectionContainer>
            <div style={{ overflow: "hidden", padding: "16px 0" }}>
                <div
                    onMouseEnter={() => setPaused(true)}
                    onMouseLeave={() => setPaused(false)}
                    style={{
                        display: "flex",
                        gap: "3.65vw",
                        width: "max-content",
                        animation: "carousel-right 60s linear infinite",
                        animationPlayState: paused ? "paused" : "running",
                    }}
                >
                    {doubled.map((course, i) => (
                        <div
                            key={`${course.id}-${i}`}
                            style={{ width: COURSE_CARD_WIDTH, flex: `0 0 ${COURSE_CARD_WIDTH}` }}
                        >
                            <CourseCard course={course} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
