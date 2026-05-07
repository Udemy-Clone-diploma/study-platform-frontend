import Image from "next/image";
import type { CSSProperties } from "react";

export type StudentReview = {
    id: number;
    text: string;
    authorName: string;
    authorRole: string;
    authorAvatar: string | null;
};

type Props = {
    review: StudentReview;
    style?: CSSProperties;
};

export function StudentReviewCard({ review, style }: Props) {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "1.46vw 1.25vw 1.67vw",
                background: "var(--color-bg)",
                boxShadow: "var(--shadow-testimonial)",
                borderRadius: "1.04vw",
                minHeight: "15.1vw",
                ...style,
            }}
        >
            {/* Quote */}
            <p
                style={{
                    fontFamily: "var(--font-base)",
                    fontWeight: 500,
                    fontSize: "1.04vw",
                    lineHeight: "1.3vw",
                    color: "var(--color-text-secondary)",
                    margin: 0,
                }}
            >
                {review.text}
            </p>

            {/* Author */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: "0.625vw",
                }}
            >
                <div
                    style={{
                        position: "relative",
                        width: "2.71vw",
                        height: "2.71vw",
                        borderRadius: "50%",
                        overflow: "hidden",
                        flexShrink: 0,
                        background: "var(--gradient-blob)",
                    }}
                >
                    {review.authorAvatar && (
                        <Image
                            src={review.authorAvatar}
                            alt={review.authorName}
                            fill
                            unoptimized
                            style={{ objectFit: "cover" }}
                        />
                    )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.21vw" }}>
                    <span
                        style={{
                            fontFamily: "var(--font-base)",
                            fontWeight: 600,
                            fontSize: "0.83vw",
                            lineHeight: "1.04vw",
                            color: "var(--color-text-primary)",
                        }}
                    >
                        {review.authorName}
                    </span>
                    <span
                        style={{
                            fontFamily: "var(--font-base)",
                            fontWeight: 400,
                            fontSize: "0.83vw",
                            lineHeight: "1.04vw",
                            color: "var(--color-text-secondary)",
                        }}
                    >
                        {review.authorRole}
                    </span>
                </div>
            </div>
        </div>
    );
}
