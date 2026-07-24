import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { CategoryCard, type CategoryCardData } from "@/features/courses";
import { GradientButton } from "@/shared/ui/GradientButton";
import { SectionContainer } from "@/shared/ui/SectionContainer";

const CATEGORY_META = [
    { key: "programming", iconSrc: "/icons/code.png", shadowColor: "0px 0px 22.9px var(--shadow-lavander)" },
    { key: "design", iconSrc: "/icons/Pen tool.png", shadowColor: "0px 0px 22.9px var(--shadow-pink)" },
    { key: "marketing", iconSrc: "/icons/bar-chart.png", shadowColor: "0px 0px 22.9px var(--shadow-yellow)" },
    { key: "business", iconSrc: "/icons/pie chart.png", shadowColor: "0px 0px 22.9px var(--shadow-yellow-soft)" },
    { key: "languages", iconSrc: "/icons/world.png", shadowColor: "0px 0px 22.9px var(--shadow-pink-soft)" },
    { key: "personalDevelopment", iconSrc: "/icons/star 2.png", shadowColor: "0px 0px 22.9px var(--shadow-lavander-soft)" },
] as const;

export async function CategoriesSection() {
    const t = await getTranslations("HomeCategories");

    const CATEGORIES: CategoryCardData[] = CATEGORY_META.map((meta) => ({
        title: t(`cards.${meta.key}.title`),
        description: t(`cards.${meta.key}.description`),
        iconSrc: meta.iconSrc,
        shadowColor: meta.shadowColor,
    }));

    const row1 = CATEGORIES.slice(0, 3);
    const row2 = CATEGORIES.slice(3, 6);

    const toCatalogButton = (
        <GradientButton href="/catalog">
            {t("toCatalog")}
            <Image
                src="/icons/arrow-goto.png"
                alt=""
                width={14}
                height={14}
                style={{
                    width: "clamp(8px, 1.04vw, 14px)",
                    height: "auto",
                    flexShrink: 0,
                }}
            />
        </GradientButton>
    );

    return (
        <section style={{ position: "relative", overflow: "hidden" }}>

            {/* left sphere */}
            <Image
                src="/backgrounds/00 3.svg"
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
                src="/backgrounds/00 2.svg"
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
                    className="flex flex-col items-start lg:flex-row lg:items-end lg:justify-between"
                    style={{
                        gap: "24px",
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
                                {t("badge")}
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
                                {t("heading")}
                            </h2>
                            <p
                                className="max-w-full lg:max-w-[36.5vw]"
                                style={{
                                    fontFamily: "var(--font-base)",
                                    fontWeight: 400,
                                    fontSize: "clamp(14px, 1.25vw, 24px)",
                                    lineHeight: 1.25,
                                    color: "var(--color-text-secondary)",
                                    margin: 0,
                                }}
                            >
                                {t("description")}
                            </p>
                        </div>
                    </div>

                    <div className="hidden lg:block">{toCatalogButton}</div>
                </div>

                {/* Staggered grid */}
                <div style={{ display: "flex", flexDirection: "column", gap: "clamp(16px, 2.08vw, 30px)" }}>
                    <div className="flex flex-wrap justify-center lg:flex-nowrap lg:justify-start" style={{ gap: "clamp(16px, 1.04vw, 15px)" }}>
                        {row1.map((card) => (
                            <CategoryCard key={card.title} card={card} />
                        ))}
                    </div>
                    <div className="flex flex-wrap justify-center lg:flex-nowrap lg:justify-end" style={{ gap: "clamp(16px, 1.04vw, 15px)" }}>
                        {row2.map((card) => (
                            <CategoryCard key={card.title} card={card} />
                        ))}
                    </div>
                </div>

                {/* Mobile/tablet: "To catalog" CTA repeated below the card grid */}
                <div className="mt-6 flex justify-center lg:hidden">{toCatalogButton}</div>

            </SectionContainer>
        </section>
    );
}
