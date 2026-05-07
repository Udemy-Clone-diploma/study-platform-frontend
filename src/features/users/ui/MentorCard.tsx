"use client";

import Image from "next/image";

export type Mentor = {
    id: number;
    name: string;
    role: string;
    bio: string;
    image: string | null;
};

type Props = {
    mentor: Mentor;
    current: number;
    total: number;
    onPrev: () => void;
    onNext: () => void;
    onInfoClick: () => void;
};

export function MentorCard({ mentor, current, total, onPrev, onNext, onInfoClick }: Props) {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "1.04vw",
                width: "23.96vw",
                flexShrink: 0,
            }}
        >
            {/* Photo card */}
            <div
                style={{
                    position: "relative",
                    width: "23.96vw",
                    height: "27.08vw",
                    borderRadius: "1.25vw",
                    overflow: "hidden",
                    flexShrink: 0,
                }}
            >
                {/* Background photo */}
                {mentor.image ? (
                    <Image
                        src={mentor.image}
                        alt={mentor.name}
                        fill
                        unoptimized
                        style={{ objectFit: "cover", objectPosition: "center top", zIndex: 0 }}
                    />
                ) : (
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            background: "var(--gradient-blob)",
                            zIndex: 0,
                        }}
                    />
                )}

                {/* Role badge*/}
                {mentor.role && (
                    <div
                        style={{
                            position: "absolute",
                            top: "1.04vw",
                            right: "1.04vw",
                            zIndex: 2,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "0.1vw 0.42vw",
                            background: "var(--color-white-60)",
                            borderRadius: "0.885vw",
                        }}
                    >
                        <span
                            style={{
                                fontFamily: "var(--font-accent)",
                                fontWeight: 500,
                                fontSize: "0.78vw",
                                lineHeight: "0.99vw",
                                color: "var(--color-blue)",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {mentor.role}
                        </span>
                    </div>
                )}

                {/* Click zones */}
                <div
                    style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        width: "50%",
                        bottom: "8.125vw",
                        zIndex: 1,
                        cursor: "pointer",
                    }}
                    onClick={onPrev}
                />
                <div
                    style={{
                        position: "absolute",
                        right: 0,
                        top: 0,
                        width: "50%",
                        bottom: "8.125vw",
                        zIndex: 1,
                        cursor: "pointer",
                    }}
                    onClick={onNext}
                />

                {/* Bottom section: progress bar + gradient info panel */}
                <div
                    style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: "8.125vw",
                        zIndex: 2,
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    {/* Progress bar */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            padding: "0.26vw 1.04vw",
                            height: "0.83vw",
                            flexShrink: 0,
                        }}
                    >
                        <div
                            style={{
                                width: "100%",
                                height: "0.3125vw",
                                background: "var(--color-white-20)",
                                borderRadius: "0.2vw",
                                display: "flex",
                                gap: "0.15vw",
                                overflow: "hidden",
                            }}
                        >
                            {Array.from({ length: total }).map((_, i) => (
                                <div
                                    key={i}
                                    style={{
                                        flex: 1,
                                        height: "100%",
                                        background: i === current ? "var(--color-bg)" : "var(--color-white-20)",
                                        borderRadius: "0.2vw",
                                        transition: "background 0.4s ease",
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Gradient info panel — click navigates to teacher page */}
                    <div
                        onClick={onInfoClick}
                        style={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            padding: "1.51vw 1.04vw 1.5625vw",
                            gap: "0.52vw",
                            background: "var(--gradient-brand)",
                            cursor: "pointer",
                        }}
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
                            {mentor.name}
                        </span>
                        <span
                            style={{
                                fontFamily: "var(--font-base)",
                                fontWeight: 400,
                                fontSize: "0.73vw",
                                lineHeight: 1.28,
                                color: "var(--color-text-primary)",
                            }}
                        >
                            {mentor.bio}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
