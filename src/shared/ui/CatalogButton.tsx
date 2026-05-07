import Link from "next/link";
import Image from "next/image";

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
            <Image
                src="/icons/arrow-goto.png"
                alt=""
                width={14}
                height={14}
                style={{ width: "clamp(8px, 1.04vw, 14px)", height: "auto", flexShrink: 0 }}
            />
        </Link>
    );
}
