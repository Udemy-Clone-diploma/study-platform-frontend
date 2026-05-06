"use client";

import { useRef } from "react";
import { SectionContainer } from "@/shared/ui/SectionContainer";
import { StudentStoryCard, type StudentStory } from "@/features/users/ui/StudentStoryCard";

const MOCK_STORIES: StudentStory[] = [
    {
        id: 1,
        name: "Olivia Novak",
        bio: "She left the medical field to start from scratch in design — and found a career that truly inspires her.",
        image: null,
    },
    {
        id: 2,
        name: "Emma Carter",
        bio: "From marketing assistant to UX/UI designer — a journey of turning routine work into creative problem-solving.",
        image: null,
    },
    {
        id: 3,
        name: "Daniel Schmidt",
        bio: "After years in finance, he chose a creative path — and found a new career in 3D design.",
        image: null,
    },
    {
        id: 4,
        name: "Aisha Khan",
        bio: "She turned her passion for organization into a career in project management.",
        image: null,
    },
    {
        id: 5,
        name: "John Cho",
        bio: "No prior tech background, but decided to learn coding — and built his first app within months.",
        image: null,
    },
    {
        id: 6,
        name: "Taras Chub",
        bio: "From uncertainty to confidence — how learning data analytics opened new career opportunities.",
        image: null,
    },
];

export function StudentStoriesSection() {
    const scrollRef = useRef<HTMLDivElement>(null);
    const isDown = useRef(false);
    const isDragging = useRef(false);
    const startX = useRef(0);
    const scrollLeft = useRef(0);

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        const el = scrollRef.current;
        if (!el) return;
        isDown.current = true;
        isDragging.current = false;
        startX.current = e.pageX;
        scrollLeft.current = el.scrollLeft;
    };

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDown.current || !scrollRef.current) return;
        const dx = e.pageX - startX.current;
        if (!isDragging.current && Math.abs(dx) < 5) return;
        if (!isDragging.current) {
            isDragging.current = true;
            scrollRef.current.setPointerCapture(e.pointerId);
            scrollRef.current.style.cursor = "grabbing";
        }
        scrollRef.current.scrollLeft = scrollLeft.current - dx;
    };

    const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        isDown.current = false;
        isDragging.current = false;
        if (scrollRef.current) {
            scrollRef.current.style.cursor = "grab";
            if (scrollRef.current.hasPointerCapture(e.pointerId))
                scrollRef.current.releasePointerCapture(e.pointerId);
        }
    };

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
                    {MOCK_STORIES.map((story) => (
                        <StudentStoryCard key={story.id} story={story} />
                    ))}
                </div>
            </div>
        </section>
    );
}
