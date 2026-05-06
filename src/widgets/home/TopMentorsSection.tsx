"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SectionContainer } from "@/shared/ui/SectionContainer";
import { MentorCard } from "@/features/users/ui/MentorCard";
import type { Mentor } from "@/features/users/ui/MentorCard";
import type { TopTeacher } from "@/features/users/model/types/teacher";

type Props = { teachers: TopTeacher[] };

const AUTO_ADVANCE_MS = 5000;
const TRANSITION_MS = 500;

function toMentor(t: TopTeacher): Mentor {
    return {
        id: t.teacher_id,
        name: t.name,
        role: t.specialization ?? "",
        bio: t.experience ?? "",
        image: t.avatar,
    };
}

export function TopMentorsSection({ teachers }: Props) {
    const [current, setCurrent] = useState(0);
    const [prevIndex, setPrevIndex] = useState<number | null>(null);
    const router = useRouter();

    const mentors = teachers.map(toMentor);
    const total = mentors.length;

    useEffect(() => {
        if (prevIndex === null) return;
        const id = setTimeout(() => setPrevIndex(null), TRANSITION_MS);
        return () => clearTimeout(id);
    }, [prevIndex]);

    useEffect(() => {
        if (total < 2) return;
        const id = setTimeout(() => {
            setCurrent((c) => {
                const next = (c + 1) % total;
                setPrevIndex(c);
                return next;
            });
        }, AUTO_ADVANCE_MS);
        return () => clearTimeout(id);
    }, [current, total]);

    if (total === 0) return null;

    const goTo = (next: number) => {
        setCurrent((c) => {
            if (next === c) return c;
            setPrevIndex(c);
            return next;
        });
    };

    const prev = () => goTo((current - 1 + total) % total);
    const next = () => goTo((current + 1) % total);

    return (
        <section>
            <SectionContainer>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "flex-start",
                        gap: "5vw",
                        paddingTop: "6.25vw",
                        paddingBottom: "6.25vw",
                    }}
                >
                    {/* Left column */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "4.17vw",
                            flex: 1,
                            paddingTop: "4.17vw",
                        }}
                    >
                        {/* EXPERTISE badge + heading + description */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "1.46vw", maxWidth: "36.46vw" }}>
                            <div
                                style={{
                                    display: "inline-flex",
                                    alignSelf: "flex-start",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    padding: "0 0.52vw",
                                    gap: "0.52vw",
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
                                    EXPERTISE
                                </span>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "1.04vw" }}>
                                <h2
                                    style={{
                                        fontFamily: "var(--font-base)",
                                        fontWeight: 400,
                                        fontSize: "2.5vw",
                                        lineHeight: 1.25,
                                        color: "var(--color-text-primary)",
                                        margin: 0,
                                    }}
                                >
                                    Learn from the best
                                </h2>
                                <p
                                    style={{
                                        fontFamily: "var(--font-base)",
                                        fontWeight: 400,
                                        fontSize: "1.25vw",
                                        lineHeight: 1.25,
                                        color: "var(--color-text-secondary)",
                                        margin: 0,
                                    }}
                                >
                                    Our mentors are industry professionals ready to guide you
                                    from beginner to pro with hands-on experience.
                                </p>
                            </div>
                        </div>

                        {/* Feature columns: Experience / Support / Practice */}
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "row",
                                alignItems: "flex-start",
                                gap: "1.67vw",
                            }}
                        >
                            {[
                                { title: "Experience", body: "5+ years in real-world projects." },
                                { title: "Support", body: "Direct chat access and homework feedback." },
                                { title: "Practice", body: "Only trending cases and tools." },
                            ].map(({ title, body }) => (
                                <div
                                    key={title}
                                    style={{ display: "flex", flexDirection: "column", gap: "0.42vw" }}
                                >
                                    <span
                                        style={{
                                            fontFamily: "var(--font-base)",
                                            fontWeight: 600,
                                            fontSize: "1.04vw",
                                            lineHeight: 1.25,
                                            color: "var(--color-text-primary)",
                                        }}
                                    >
                                        {title}
                                    </span>
                                    <span
                                        style={{
                                            fontFamily: "var(--font-base)",
                                            fontWeight: 400,
                                            fontSize: "0.83vw",
                                            lineHeight: 1.25,
                                            color: "var(--color-text-primary)",
                                        }}
                                    >
                                        {body}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right column */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.04vw", flexShrink: 0 }}>

                    {/* Crossfade wrapper — photo card only */}
                    <div style={{ position: "relative", width: "23.96vw", height: "27.08vw" }}>

                        {/* Outgoing card — fades out on top */}
                        {prevIndex !== null && (
                            <div
                                key={`out-${prevIndex}`}
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: "100%",
                                    zIndex: 1,
                                    pointerEvents: "none",
                                    animation: `mentor-card-out ${TRANSITION_MS}ms ease forwards`,
                                }}
                            >
                                <MentorCard
                                    mentor={mentors[prevIndex]}
                                    current={prevIndex}
                                    total={total}
                                    onPrev={() => {}}
                                    onNext={() => {}}
                                    onInfoClick={() => {}}
                                />
                            </div>
                        )}

                        {/* Incoming card  */}
                        <div
                            key={`in-${current}`}
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                zIndex: 0,
                                animation: `mentor-card-in ${TRANSITION_MS}ms ease`,
                            }}
                        >
                            <MentorCard
                                mentor={mentors[current]}
                                current={current}
                                total={total}
                                onPrev={prev}
                                onNext={next}
                                onInfoClick={() => router.push("/coming-soon")}
                            />
                        </div>
                    </div>

                        {/* MENTORS OF THE YEAR badge — static, outside crossfade */}
                        <div
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "0 0.52vw",
                                height: "1.5625vw",
                                background: "var(--color-badge-lavender)",
                            }}
                        >
                            <span
                                style={{
                                    fontFamily: "var(--font-base)",
                                    fontWeight: 400,
                                    fontSize: "1.25vw",
                                    lineHeight: 1.25,
                                    textTransform: "uppercase",
                                    color: "var(--color-blue)",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                Mentors of the Year
                            </span>
                        </div>
                    </div>
                </div>
            </SectionContainer>
        </section>
    );
}
