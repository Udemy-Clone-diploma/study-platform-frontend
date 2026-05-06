import Link from "next/link";

export function CatalogButton() {
    return (
        <Link
            href="/catalog"
            className="catalog-btn"
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.625vw",
                padding: "clamp(8px, 0.52vw, 10px) clamp(18px, 1.46vw, 28px)",
                background: "var(--gradient-brand)",
                borderRadius: 28,
                fontFamily: "var(--font-accent)",
                fontWeight: 500,
                fontSize: "clamp(12px, 1.04vw, 20px)",
                lineHeight: 1.5,
                textTransform: "uppercase",
                color: "var(--color-text-primary)",
                textDecoration: "none",
                whiteSpace: "nowrap",
                transition: "opacity 0.2s, transform 0.2s",
                flexShrink: 0,
            }}
        >
            To catalog
            <span
                style={{
                    width: "clamp(18px, 1.46vw, 28px)",
                    height: "clamp(18px, 1.46vw, 28px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                }}
            >
                <svg viewBox="0 0 28 28" fill="none" width="100%" height="100%">
                    <path
                        d="M7 21L21 7M21 7H10M21 7V18"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </span>
        </Link>
    );
}
