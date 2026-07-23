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
// Class names must stay as static literals (not interpolated) so Tailwind's
// build-time content scanner can find them.
const NARROW_CLASS = "lg:grow-[580]";
const WIDE_CLASS = "lg:grow-[820]";

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
                        gap: "clamp(24px, 3.125vw, 45px)",
                        paddingTop: "7.19vw",
                        paddingBottom: "7.24vw",
                    }}
                >
                    {/* Header */}
                    <div
                        className="w-full min-[1024px]:max-[1439px]:max-w-[max(420px,36.46vw)] min-[1440px]:max-w-[max(600px,36.46vw)]"
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "clamp(12px, 1.46vw, 21px)",
                        }}
                    >
                        <div
                            style={{
                                display: "inline-flex",
                                alignSelf: "flex-start",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "3px clamp(6px, 0.52vw, 8px)",
                                background: "var(--color-badge-lavender)",
                                borderRadius: 4,
                            }}
                        >
                            <span
                                className="text-[11px] leading-[14px] md:text-[13px] md:leading-[16px] lg:text-[1.04vw] lg:leading-[1.3vw]"
                                style={{
                                    fontFamily: "var(--font-accent)",
                                    fontWeight: 500,
                                    color: "var(--color-blue)",
                                }}
                            >
                                FEEDBACK
                            </span>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "clamp(8px, 1.04vw, 15px)" }}>
                            <h2
                                className="text-[26px] leading-[32px] md:text-[34px] md:leading-[40px] lg:text-[2.5vw] lg:leading-[3.125vw]"
                                style={{
                                    fontFamily: "var(--font-base)",
                                    fontWeight: 400,
                                    color: "var(--color-text-primary)",
                                    margin: 0,
                                }}
                            >
                                Loved by 10k+ students worldwide
                            </h2>
                            <p
                                className="text-[15px] leading-[19px] md:text-[17px] md:leading-[21px] lg:text-[1.25vw] lg:leading-[1.5625vw]"
                                style={{
                                    fontFamily: "var(--font-base)",
                                    fontWeight: 400,
                                    color: "var(--color-text-secondary)",
                                    margin: 0,
                                }}
                            >
                                Real people. Real feedback. No filters. Discover why learners
                                from 50+ countries choose our platform every day.
                            </p>
                        </div>
                    </div>

                    {/* Zigzag rows of 2: narrow+wide, then wide+narrow, alternating (lg+ only).
                        Card size stays constant regardless of how much text a review
                        has (StudentReviewCard clamps text to a fixed height); only the
                        column widths alternate per row. Below lg, rows stack into a
                        single column and every card is full width. */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "clamp(16px, 1.04vw, 15px)" }}>
                        {chunkPairs(cards).map((pair, rowIndex) => {
                            const narrowFirst = rowIndex % 2 === 0;
                            return (
                                <div key={rowIndex} className="flex flex-col lg:flex-row" style={{ gap: "clamp(16px, 1.04vw, 15px)" }}>
                                    {pair.map((review, colIndex) => {
                                        const isNarrow = (colIndex === 0) === narrowFirst;
                                        const flexClass =
                                            pair.length === 1 ? "lg:grow" : isNarrow ? NARROW_CLASS : WIDE_CLASS;
                                        return (
                                            <StudentReviewCard
                                                key={review.id}
                                                review={review}
                                                className={flexClass}
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
