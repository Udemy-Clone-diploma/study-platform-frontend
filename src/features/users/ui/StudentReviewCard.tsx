"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";
import { Flag } from "lucide-react";
import { ReportReviewModal } from "@/shared/ui/ReportReviewModal";
import { reportReview } from "@/entities/course";

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
    const [reporting, setReporting] = useState(false);

    return (
        <div
            style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                height: "11.46vw",
                padding: "1.46vw 1.25vw 1.67vw",
                background: "var(--color-bg)",
                boxShadow: "var(--shadow-testimonial)",
                borderRadius: "1.04vw",
                ...style,
            }}
        >
            <button
                type="button"
                onClick={() => setReporting(true)}
                aria-label="Report review"
                title="Report review"
                style={{
                    position: "absolute",
                    top: "0.83vw",
                    right: "0.83vw",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "1.67vw",
                    height: "1.67vw",
                    minWidth: 22,
                    minHeight: 22,
                    border: "none",
                    background: "transparent",
                    color: "var(--color-text-secondary)",
                    cursor: "pointer",
                }}
            >
                <Flag size={14} />
            </button>

            {/* Quote: clamped to 4 lines so a long review can't grow the card. */}
            <p
                style={{
                    fontFamily: "var(--font-base)",
                    fontWeight: 500,
                    fontSize: "1.04vw",
                    lineHeight: "1.3vw",
                    color: "var(--color-text-secondary)",
                    margin: 0,
                    display: "-webkit-box",
                    WebkitBoxOrient: "vertical",
                    WebkitLineClamp: 4,
                    overflow: "hidden",
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

            {reporting && (
                <ReportReviewModal
                    onClose={() => setReporting(false)}
                    onSubmit={(reason) => reportReview(review.id, reason)}
                />
            )}
        </div>
    );
}
