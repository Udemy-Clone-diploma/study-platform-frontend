import { SectionContainer } from "@/shared/ui/SectionContainer";
import { StudentReviewCard, type StudentReview } from "@/features/users";
import type { TopReview } from "@/entities/course";

type Props = { reviews: TopReview[] };

function toStudentReview(review: TopReview): StudentReview {
    return {
        id: review.id,
        text: review.text,
        authorName: review.student.name,
        authorRole: `Studied ${review.course.title}`,
        authorAvatar: review.student.avatar,
    };
}

function chunkPairs<T>(items: T[]): T[][] {
    const pairs: T[][] = [];
    for (let i = 0; i < items.length; i += 2) pairs.push(items.slice(i, i + 2));
    return pairs;
}

// Narrow/wide flex ratio for a two-card row, alternating per row so the layout
// zigzags (row 0: narrow+wide, row 1: wide+narrow, ...) instead of a plain grid.
const NARROW = 580;
const WIDE = 820;

export function StudentReviewsSection({ reviews }: Props) {
    if (reviews.length === 0) return null;
    const cards = reviews.map(toStudentReview);

    return (
        <section style={{ background: "var(--gradient-feedback)" }}>
            <SectionContainer>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "3.125vw",
                        paddingTop: "7.19vw",
                        paddingBottom: "7.24vw",
                    }}
                >
                    {/* Header */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "1.46vw",
                            maxWidth: "36.46vw",
                        }}
                    >
                        <div
                            style={{
                                display: "inline-flex",
                                alignSelf: "flex-start",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "0 0.52vw",
                                background: "var(--color-badge-lavender)",
                                borderRadius: 4,
                            }}
                        >
                            <span
                                style={{
                                    fontFamily: "var(--font-accent)",
                                    fontWeight: 500,
                                    fontSize: "1.04vw",
                                    lineHeight: "1.3vw",
                                    color: "var(--color-blue)",
                                }}
                            >
                                FEEDBACK
                            </span>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "1.04vw" }}>
                            <h2
                                style={{
                                    fontFamily: "var(--font-base)",
                                    fontWeight: 400,
                                    fontSize: "2.5vw",
                                    lineHeight: "3.125vw",
                                    color: "var(--color-text-primary)",
                                    margin: 0,
                                }}
                            >
                                Loved by 10k+ students worldwide
                            </h2>
                            <p
                                style={{
                                    fontFamily: "var(--font-base)",
                                    fontWeight: 400,
                                    fontSize: "1.25vw",
                                    lineHeight: "1.5625vw",
                                    color: "var(--color-text-secondary)",
                                    margin: 0,
                                }}
                            >
                                Real people. Real feedback. No filters. Discover why learners
                                from 50+ countries choose our platform every day.
                            </p>
                        </div>
                    </div>

                    {/* Zigzag rows of 2: narrow+wide, then wide+narrow, alternating.
                        Card size stays constant regardless of how much text a review
                        has (StudentReviewCard clamps text to a fixed height); only the
                        column widths alternate per row. */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.04vw" }}>
                        {chunkPairs(cards).map((pair, rowIndex) => {
                            const narrowFirst = rowIndex % 2 === 0;
                            return (
                                <div key={rowIndex} style={{ display: "flex", gap: "1.04vw" }}>
                                    {pair.map((review, colIndex) => {
                                        const flex =
                                            pair.length === 1
                                                ? 1
                                                : (colIndex === 0) === narrowFirst
                                                    ? NARROW
                                                    : WIDE;
                                        return (
                                            <StudentReviewCard
                                                key={review.id}
                                                review={review}
                                                style={{ flex }}
                                            />
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </SectionContainer>
        </section>
    );
}
