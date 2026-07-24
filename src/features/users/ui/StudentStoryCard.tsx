import Image from "next/image";
import Link from "next/link";
import type { ArticleListItem } from "@/entities/blog";

type Props = { article: ArticleListItem };

export function StudentStoryCard({ article }: Props) {
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
            {article.cover_image ? (
                <Image
                    src={article.cover_image}
                    alt={article.title}
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
                href={`/blog/${article.slug}`}
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
            <Link
                href={`/blog/${article.slug}`}
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
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                    }}
                >
                    {article.title}
                </span>
                <span
                    style={{
                        fontFamily: "var(--font-base)",
                        fontWeight: 400,
                        fontSize: "0.73vw",
                        lineHeight: "0.9375vw",
                        color: "var(--color-text-primary)",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                    }}
                >
                    {article.subtitle}
                </span>
            </Link>
        </div>
    );
}
