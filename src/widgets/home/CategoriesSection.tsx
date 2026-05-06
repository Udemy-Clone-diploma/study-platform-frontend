import Image from "next/image";
import { CategoryCard, type CategoryCardData } from "@/features/courses/ui/CategoryCard";
import { CatalogButton } from "@/shared/ui/CatalogButton";
import { SectionContainer } from "@/shared/ui/SectionContainer";

const CATEGORIES: CategoryCardData[] = [
    {
        title: "Programming Basics to Pro",
        description: "Master trending coding languages and build your own software.",
        iconSrc: "/icons/code.png",
        shadowColor: "0px 0px 22.9px var(--shadow-lavander)",
    },
    {
        title: "Design Aesthetics & UX",
        description: "Learn to create interfaces, graphics, and visual worlds.",
        iconSrc: "/icons/Pen tool.png",
        shadowColor: "0px 0px 22.9px var(--shadow-pink)",
    },
    {
        title: "Marketing Strategy",
        description: "Discover how to promote brands and attract thousands of clients.",
        iconSrc: "/icons/bar-chart.png",
        shadowColor: "0px 0px 22.9px var(--shadow-yellow)",
    },
    {
        title: "Business",
        description: "Get expertise in management, finance, and process optimization.",
        iconSrc: "/icons/pie chart.png",
        shadowColor: "0px 0px 22.9px var(--shadow-yellow-soft)",
    },
    {
        title: "Languages",
        description: "Learn foreign languages for career, travel, and communication.",
        iconSrc: "/icons/world.png",
        shadowColor: "0px 0px 22.9px var(--shadow-pink-soft)",
    },
    {
        title: "Personal development",
        description: "Boost your personal efficiency, time management, and leadership.",
        iconSrc: "/icons/star 2.png",
        shadowColor: "0px 0px 22.9px var(--shadow-lavander-soft)",
    },
];

const row1 = CATEGORIES.slice(0, 3);
const row2 = CATEGORIES.slice(3, 6);

export function CategoriesSection() {
    return (
        <section style={{ position: "relative", overflow: "hidden" }}>

            {/* left sphere */}
            <Image
                src="/backgrounds/00 3.png"
                alt=""
                width={476}
                height={402}
                aria-hidden
                style={{
                    position: "absolute",
                    left: "14vw",
                    bottom: "2.5vw",
                    width: "27.8vw",
                    height: "auto",
                    pointerEvents: "none",
                    userSelect: "none",
                    zIndex: 0,
                }}
            />

            {/* right sphere */}
            <Image
                src="/backgrounds/00 2.png"
                alt=""
                width={476}
                height={402}
                aria-hidden
                style={{
                    position: "absolute",
                    right: "16vw",
                    top: "14vw",
                    width: "24.8vw",
                    height: "auto",
                    pointerEvents: "none",
                    userSelect: "none",
                    zIndex: 0,
                }}
            />

            <SectionContainer style={{ position: "relative", zIndex: 1,  paddingBottom: "6vw" }}>

                {/* Header */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-end",
                        marginBottom: "3.5vw",
                    }}
                >
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.46vw" }}>
                        <div
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                padding: "2px 10px",
                                background: "var(--color-badge-lavender)",
                                borderRadius: 4,
                                alignSelf: "flex-start",
                            }}
                        >
                            <span
                                style={{
                                    fontFamily: "var(--font-accent)",
                                    fontWeight: 500,
                                    fontSize: "clamp(12px, 1.04vw, 20px)",
                                    lineHeight: 1.25,
                                    color: "var(--color-blue)",
                                    textTransform: "uppercase",
                                }}
                            >
                                Categories
                            </span>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "1.04vw" }}>
                            <h2
                                style={{
                                    fontFamily: "var(--font-base)",
                                    fontWeight: 400,
                                    fontSize: "clamp(28px, 2.5vw, 48px)",
                                    lineHeight: 1.25,
                                    color: "var(--color-text-primary)",
                                    margin: 0,
                                }}
                            >
                                Choose your field of growth
                            </h2>
                            <p
                                style={{
                                    fontFamily: "var(--font-base)",
                                    fontWeight: 400,
                                    fontSize: "clamp(14px, 1.25vw, 24px)",
                                    lineHeight: 1.25,
                                    color: "var(--color-text-secondary)",
                                    margin: 0,
                                    maxWidth: "36.5vw",
                                }}
                            >
                                Explore 6+ core categories designed for professional career
                                and personal success.
                            </p>
                        </div>
                    </div>

                    <CatalogButton />
                </div>

                {/* Staggered grid */}
                <div style={{ display: "flex", flexDirection: "column", gap: "2.08vw" }}>
                    <div style={{ display: "flex", gap: "1.04vw" }}>
                        {row1.map((card) => (
                            <CategoryCard key={card.title} card={card} />
                        ))}
                    </div>
                    <div style={{ display: "flex", gap: "1.04vw", justifyContent: "flex-end" }}>
                        {row2.map((card) => (
                            <CategoryCard key={card.title} card={card} />
                        ))}
                    </div>
                </div>

            </SectionContainer>
        </section>
    );
}
