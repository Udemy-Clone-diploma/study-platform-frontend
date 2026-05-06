import Image from "next/image";
import Link from "next/link";

export type StudentStory = {
    id: number;
    name: string;
    bio: string;
    image: string | null;
};

type Props = { story: StudentStory };

export function StudentStoryCard({ story }: Props) {
    return (
        <div
            style={{
                position: "relative",
                width: "23.96vw",
                height: "27.08vw",
                borderRadius: "1.25vw",
                overflow: "hidden",
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
            }}
        >
            {/* Background image*/}
            {story.image ? (
                <Image
                    src={story.image}
                    alt={story.name}
                    fill
                    unoptimized
                    style={{ objectFit: "cover", objectPosition: "center top", zIndex: 0 }}
                />
            ) : (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: "var(--shadow-lavander)",
                        zIndex: 0,
                    }}
                />
            )}

            {/* Arrow button — top right */}
            <Link
                href="/coming-soon"
                style={{
                    position: "relative",
                    zIndex: 2,
                    alignSelf: "flex-end",
                    padding: "1.04vw",
                    display: "block",
                }}
            >
                <div
                    style={{
                        width: "2.08vw",
                        height: "2.08vw",
                        borderRadius: "50%",
                        background: "var(--color-bg)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Image
                        src="/icons/arrow-goto.png"
                        alt=""
                        width={18}
                        height={18}
                        style={{ width: "0.8vw", height: "auto" }}
                    />
                </div>
            </Link>

            {/* Bottom info panel */}
            <div
                style={{
                    position: "relative",
                    zIndex: 2,
                    background: "var(--gradient-brand)",
                    padding: "1.51vw 1.04vw 1.5625vw",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.52vw",
                }}
            >
                <span
                    style={{
                        fontFamily: "var(--font-base)",
                        fontWeight: 600,
                        fontSize: "1.04vw",
                        lineHeight: "1.3vw",
                        color: "var(--color-text-primary)",
                    }}
                >
                    {story.name}
                </span>
                <span
                    style={{
                        fontFamily: "var(--font-base)",
                        fontWeight: 400,
                        fontSize: "0.73vw",
                        lineHeight: "0.9375vw",
                        color: "var(--color-text-primary)",
                    }}
                >
                    {story.bio}
                </span>
            </div>
        </div>
    );
}
