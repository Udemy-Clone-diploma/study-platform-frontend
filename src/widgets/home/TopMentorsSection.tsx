"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SectionContainer } from "@/shared/ui/SectionContainer";
import { MentorCard, type Mentor } from "@/features/users";
import type { TopTeacher } from "@/entities/user";

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
                    className="flex flex-col lg:flex-row lg:items-start"
                    style={{
                        gap: "clamp(24px, 5vw, 72px)",
                        paddingTop: "6.25vw",
                        paddingBottom: "6.25vw",
                    }}
                >
                    {/* Left column */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "clamp(24px, 4.17vw, 60px)",
                            flex: 1,
                        }}
                    >
                        {/* EXPERTISE badge + heading + description */}
                        <div className="w-full min-[1024px]:max-[1439px]:max-w-[max(420px,36.46vw)] min-[1440px]:max-w-[max(600px,36.46vw)]" style={{ display: "flex", flexDirection: "column", gap: "clamp(12px, 1.46vw, 21px)" }}>
                            <div
                                style={{
                                    display: "inline-flex",
                                    alignSelf: "flex-start",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    padding: "3px clamp(6px, 0.52vw, 8px)",
                                    gap: "0.52vw",
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
                                    EXPERTISE
                                </span>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "clamp(8px, 1.04vw, 15px)" }}>
                                <h2
                                    className="text-[28px] md:text-[36px] lg:text-[2.5vw]"
                                    style={{
                                        fontFamily: "var(--font-base)",
                                        fontWeight: 400,
                                        lineHeight: 1.25,
                                        color: "var(--color-text-primary)",
                                        margin: 0,
                                    }}
                                >
                                    Learn from the best
                                </h2>
                                <p
                                    className="text-[15px] md:text-[17px] lg:text-[1.25vw]"
                                    style={{
                                        fontFamily: "var(--font-base)",
                                        fontWeight: 400,
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
                            className="flex flex-col items-center sm:flex-row sm:flex-wrap sm:items-start lg:items-start"
                            style={{
                                gap: "clamp(16px, 1.67vw, 24px)",
                            }}
                        >
                            {[
                                { title: "Experience", body: "5+ years in real-world projects." },
                                { title: "Support", body: "Direct chat access and homework feedback." },
                                { title: "Practice", body: "Only trending cases and tools." },
                            ].map(({ title, body }) => (
                                <div
                                    key={title}
                                    className="items-center text-center sm:items-start sm:text-left"
                                    style={{ display: "flex", flexDirection: "column", gap: "0.42vw" }}
                                >
                                    <span
                                        className="text-[15px] md:text-[16px] lg:text-[1.04vw]"
                                        style={{
                                            fontFamily: "var(--font-base)",
                                            fontWeight: 600,
                                            lineHeight: 1.25,
                                            color: "var(--color-text-primary)",
                                        }}
                                    >
                                        {title}
                                    </span>
                                    <span
                                        className="text-[13px] md:text-[14px] lg:text-[0.83vw]"
                                        style={{
                                            fontFamily: "var(--font-base)",
                                            fontWeight: 400,
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
                    <div style={{ position: "relative", width: "clamp(280px, 23.96vw, 345px)", height: "clamp(316px, 27.08vw, 390px)" }}>

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
                                padding: "4px clamp(6px, 0.52vw, 8px)",
                                background: "var(--color-badge-lavender)",
                            }}
                        >
                            <span
                                className="text-[13px] md:text-[15px] lg:text-[1.25vw]"
                                style={{
                                    fontFamily: "var(--font-base)",
                                    fontWeight: 400,
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
