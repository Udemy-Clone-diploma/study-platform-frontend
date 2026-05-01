type Props = {
    title: string;
    description: string;
};

export function UspCard({ title, description }: Props) {
    return (
        <div
            style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                padding: "0.885vw 1.51vw 0 1.35vw",
                gap: "0.469vw",
                minHeight: "11.46vw",
                background: "rgba(255, 255, 255, 0.2)",
                boxShadow: "var(--shadow-usp-glass), 0 0 0 1px rgba(255, 255, 255, 1)",
                borderRadius: "1.04vw",
                boxSizing: "border-box",
            }}
        >
            <h3
                style={{
                    fontFamily: "var(--font-base)",
                    fontWeight: 400,
                    fontSize: "1.875vw",
                    lineHeight: 1.25,
                    color: "var(--color-text-primary)",
                    margin: 0,
                }}
            >
                {title}
            </h3>
            <p
                style={{
                    fontFamily: "var(--font-base)",
                    fontWeight: 400,
                    fontSize: "0.833vw",
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
