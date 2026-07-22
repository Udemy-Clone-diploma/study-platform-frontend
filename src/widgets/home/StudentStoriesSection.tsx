"use client";

import { SectionContainer } from "@/shared/ui/SectionContainer";
import { useDragScroll } from "@/shared/lib/useDragScroll";
import { StudentStoryCard } from "@/features/users";
import type { ArticleListItem } from "@/entities/blog";

type Props = { articles: ArticleListItem[] };

export function StudentStoriesSection({ articles }: Props) {
    const { scrollRef, onPointerDown, onPointerMove, onPointerUp } = useDragScroll<HTMLDivElement>();

    if (articles.length === 0) return null;

    return (
        <section>
            {/* Header */}
            <SectionContainer>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "1.46vw",
                        maxWidth: "36.46vw",
                        paddingTop: "7.19vw",
                        paddingBottom: "3.125vw",
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
                            STUDENT STORIES
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
                            Stories of growth and new beginnings
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
                            Real people. Real journeys. Discover how students from around
                            the world transformed their skills into real careers.
                        </p>
                    </div>
                </div>
            </SectionContainer>

            {/* Drag-scroll cards — starts at left padding, overflows right */}
            <div
                ref={scrollRef}
                className="drag-scroll"
                style={{
                    paddingLeft: "13vw",
                    paddingBottom: "7.19vw",
                    overflowX: "scroll",
                    cursor: "grab",
                }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
            >
                <div style={{ display: "flex", gap: "1.04vw", width: "max-content", paddingRight: "13vw" }}>
                    {articles.map((article) => (
                        <StudentStoryCard key={article.id} article={article} />
                    ))}
                </div>
            </div>
        </section>
    );
}
