type Props = {
    title: string;
    description: string;
};

export function UspCard({ title, description }: Props) {
    return (
        <div
            className="w-full lg:flex-1"
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                padding: "clamp(14px, 0.885vw, 20px) clamp(18px, 1.51vw, 22px) 0 clamp(16px, 1.35vw, 20px)",
                gap: "clamp(6px, 0.469vw, 7px)",
                minHeight: "clamp(120px, 11.46vw, 165px)",
                background: "rgba(255, 255, 255, 0.2)",
                boxShadow: "var(--shadow-usp-glass), 0 0 0 1px rgba(255, 255, 255, 1)",
                borderRadius: "1.04vw",
                boxSizing: "border-box",
            }}
        >
            <h3
                className="text-[22px] md:text-[26px] lg:text-[1.875vw]"
                style={{
                    fontFamily: "var(--font-base)",
                    fontWeight: 400,
                    lineHeight: 1.25,
                    color: "var(--color-text-primary)",
                    margin: 0,
                }}
            >
                {title}
            </h3>
            <p
                className="text-[14px] md:text-[15px] lg:text-[0.833vw]"
                style={{
                    fontFamily: "var(--font-base)",
                    fontWeight: 400,
                    lineHeight: 1.25,
                    color: "var(--color-text-primary)",
                    margin: 0,
                }}
            >
                {description}
            </p>
        </div>
    );
}
