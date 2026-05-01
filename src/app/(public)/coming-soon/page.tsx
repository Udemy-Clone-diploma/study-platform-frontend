import Link from "next/link";

export default async function ComingSoonPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { page } = await searchParams;
    const pageName = typeof page === "string" && page.trim() ? page.trim() : "This page";

    return (
        <div
            className="flex-1 flex flex-col items-center justify-center text-center"
            style={{ padding: "80px 24px" }}
        >
            <div
                style={{
                    display: "inline-block",
                    background: "var(--gradient-brand)",
                    borderRadius: 20,
                    padding: "60px 80px",
                    maxWidth: 600,
                    width: "100%",
                }}
            >
                <p
                    style={{
                        fontFamily: "var(--font-accent)",
                        fontSize: "clamp(13px, 1vw, 18px)",
                        fontWeight: 500,
                        textTransform: "uppercase",
                        color: "var(--color-text-primary)",
                        letterSpacing: "0.08em",
                        marginBottom: 16,
                    }}
                >
                    Coming soon
                </p>

                <h1
                    style={{
                        fontFamily: "var(--font-accent)",
                        fontSize: "clamp(28px, 3vw, 48px)",
                        fontWeight: 700,
                        color: "var(--color-text-primary)",
                        lineHeight: 1.15,
                        marginBottom: 20,
                    }}
                >
                    {pageName}
                </h1>

                <p
                    style={{
                        fontFamily: "var(--font-base)",
                        fontSize: "clamp(14px, 1.1vw, 20px)",
                        fontWeight: 400,
                        color: "var(--color-text-primary)",
                        opacity: 0.7,
                        marginBottom: 40,
                    }}
                >
                    Ця сторінка ще в розробці. Ми працюємо над нею!
                </p>

                <Link
                    href="/"
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "var(--font-accent)",
                        fontSize: 16,
                        fontWeight: 500,
                        textTransform: "uppercase",
                        color: "var(--color-bg)",
                        background: "var(--color-text-primary)",
                        borderRadius: 28,
                        padding: "12px 32px",
                        textDecoration: "none",
                    }}
                >
                    На головну
                </Link>
            </div>
        </div>
    );
}
