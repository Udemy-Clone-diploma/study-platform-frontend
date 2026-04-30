import Link from "next/link";

export function GetStartedButton() {
    return (
        <Link
            href="/login"
            className="flex items-center justify-center hover:opacity-80 transition-opacity"
            style={{
                fontFamily: "var(--font-accent)",
                fontSize: "clamp(14px, 1.41vw, 20px)",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "-0.011em",
                color: "var(--color-bg)",
                background: "var(--color-text-primary)",
                borderRadius: 28,
                width: 200,
                height: 52,
                padding: "10px 28px",
            }}
        >
            Get Started
        </Link>
    );
}
