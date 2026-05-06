import Image from "next/image";

export type CategoryCardData = {
    title: string;
    description: string;
    iconSrc: string;
    shadowColor: string;
};

type Props = { card: CategoryCardData };

export function CategoryCard({ card }: Props) {
    return (
        <div
            className="category-card-item"
            style={{
                background: "var(--color-bg)",
                boxShadow: card.shadowColor,
                borderRadius: "1.04vw",
                width: "17.71vw",
                height: "13.54vw",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                transition: "transform 0.25s ease",
                flexShrink: 0,
            }}
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "2.08vw",
                    width: "13.9vw",
                }}
            >
                <div style={{ width: "2.08vw", height: "2.08vw", position: "relative" }}>
                    <Image
                        src={card.iconSrc}
                        alt=""
                        fill
                        style={{ objectFit: "contain" }}
                    />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.625vw" }}>
                    <h3
                        style={{
                            fontFamily: "var(--font-base)",
                            fontWeight: 400,
                            fontSize: "clamp(14px, 1.04vw, 20px)",
                            lineHeight: 1.25,
                            color: "var(--color-text-primary)",
                            margin: 0,
                        }}
                    >
                        {card.title}
                    </h3>
                    <p
                        style={{
                            fontFamily: "var(--font-base)",
                            fontWeight: 400,
                            fontSize: "clamp(11px, 0.833vw, 16px)",
                            lineHeight: 1.3,
                            color: "var(--color-text-secondary)",
                            margin: 0,
                        }}
                    >
                        {card.description}
                    </p>
                </div>
            </div>
        </div>
    );
}
