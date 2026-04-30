import Link from "next/link";

export function ContinueLearningButton() {
    return (
        <Link
            href="/coming-soon?page=Continue+Learning"
            className="inline-flex items-center justify-center hover:opacity-80 transition-opacity"
            style={{
                fontFamily: "var(--font-accent)",
                fontSize: "clamp(14px, 1.41vw, 20px)",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "-0.011em",
                whiteSpace: "nowrap",
                color: "var(--color-bg)",
                background: "var(--color-text-primary)",
                borderRadius: 28,
                width: 300,
                height: 52,
                padding: "10px 32px",
            }}
        >
            Continue Learning
        </Link>
    );
}
