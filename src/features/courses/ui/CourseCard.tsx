import Link from "next/link";
import type { CourseListItem } from "@/features/courses/model/types/course";
import { formatPrice } from "@/features/courses/lib/formatPrice";
import { Stars } from "./Stars";
import { WishlistButton } from "./WishlistButton";

const LEVEL = {
    beginner: {
        gradient: "var(--gradient-card-yellow)",
        badgeBg: "var(--color-brand-yellow)",
        badgeText: "var(--color-yellow-dark)",
        label: "Beginner",
    },
    intermediate: {
        gradient: "var(--gradient-card-blue)",
        badgeBg: "var(--color-brand-lavender)",
        badgeText: "var(--color-blue-dark)",
        label: "Intermediate",
    },
    advanced: {
        gradient: "var(--gradient-card-pink)",
        badgeBg: "var(--color-brand-pink)",
        badgeText: "var(--color-pink-dark)",
        label: "Advanced",
    },
} as const;


type Props = { course: CourseListItem };

export function CourseCard({ course }: Props) {
    const theme = LEVEL[course.level] ?? LEVEL.beginner;

    return (
        <Link href={`/courses/${course.id}`} style={{ textDecoration: "none", flexShrink: 0 }}>
        <article
            className="course-card"
            style={{
                "--card-bg": theme.gradient,
                "--card-border-color": theme.badgeBg,
                width: "23.75vw",
                height: "18.85vw",
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                borderRadius: 20,
                padding: "1.25vw",
                boxSizing: "border-box",
            } as React.CSSProperties}
        >
            {/* Top row: price + heart */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexShrink: 0,
                }}
            >
                <span
                    style={{
                        fontFamily: "var(--font-base)",
                        fontWeight: 500,
                        fontSize: "1.25vw",
                        lineHeight: 1.25,
                        color: "var(--color-text-primary)",
                    }}
                >
                    {formatPrice(course)}
                </span>

                <WishlistButton />
            </div>

            {/* Image placeholder — grows to fill middle space */}
            <div style={{ flex: 1 }} />

            {/* Bottom block */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.208vw",
                    flexShrink: 0,
                }}
            >
                {/* Title */}
                <h3
                    style={{
                        fontFamily: "var(--font-base)",
                        fontWeight: 700,
                        fontSize: "1.25vw",
                        lineHeight: 1.25,
                        textTransform: "uppercase",
                        color: "var(--color-text-primary)",
                        margin: 0,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                    }}
                >
                    {course.title}
                </h3>

                {/* Level badge + teacher name */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.417vw" }}>
                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "1px 8px",
                            background: theme.badgeBg,
                            borderRadius: 6,
                            flexShrink: 0,
                        }}
                    >
                        <span
                            style={{
                                fontFamily: "var(--font-accent)",
                                fontWeight: 400,
                                fontSize: "0.677vw",
                                lineHeight: "18px",
                                textTransform: "uppercase",
                                color: theme.badgeText,
                                whiteSpace: "nowrap",
                            }}
                        >
                            {course.teacher_name}
                        </span>
                    </div>
                </div>

                {/* Stats: students + stars */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: "0.208vw",
                    }}
                >
                    <span
                        style={{
                            fontFamily: "var(--font-base)",
                            fontWeight: 400,
                            fontSize: "0.833vw",
                            lineHeight: 1.25,
                            color: "var(--color-text-primary)",
                        }}
                    >
                        {course.students_count.toLocaleString()} students
                    </span>

                    <Stars rating={course.rating_avg} />
                </div>
            </div>
        </article>
        </Link>
    );
}
