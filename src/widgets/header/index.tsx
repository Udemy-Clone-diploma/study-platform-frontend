import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { getCategories } from "@/features/courses/api/coursesApi";
import { getMe } from "@/features/auth/api/authApi";
import { CatalogDropdown } from "@/features/courses/ui/CatalogDropdown";
import { UserDropdown } from "@/features/auth/ui/UserDropdown";
import { AccentButton } from "@/shared/ui/AccentButton";
import { SearchBar } from "@/shared/ui/SearchBar";

const navLinkStyle: React.CSSProperties = {
    fontFamily: "var(--font-accent)",
    fontSize: "clamp(14px, 1.41vw, 20px)",
    fontWeight: 500,
    textTransform: "uppercase",
    color: "var(--color-text-primary)",
    lineHeight: 1.25,
};

export async function Header() {
    const [jar, categories] = await Promise.all([
        cookies(),
        getCategories().catch(() => []),
    ]);

    const accessToken = jar.get("access_token")?.value;
    const isLoggedIn = !!accessToken;

    const firstName = isLoggedIn
        ? await getMe(accessToken).then((u) => u.first_name).catch(() => null)
        : null;

    return (
        <header
            className="w-full shrink-0"
            style={{
                background: "var(--gradient-brand)",
                height: "76px",
                borderRadius: "0px 0px 20px 20px",
            }}
        >
            <div
                className="mx-auto h-full flex items-center px-4 md:px-6 xl:px-8"
                style={{ maxWidth: isLoggedIn ? 1840 : 1480, gap: "9.58%" }}
            >
                {/* Left */}
                <div
                    className="flex items-center flex-1 min-w-0 h-full"
                    style={{ gap: isLoggedIn ? "3%" : "8.49%" }}
                >
                    <div
                        className="flex items-center shrink-0 h-full"
                        style={{ gap: isLoggedIn ? 48 : 60 }}
                    >
                        <Link href="/" style={{ display: "block", width: 180, height: 60, background: "var(--color-placeholder)", flexShrink: 0 }} aria-label="Home" />

                        <nav className="flex items-center gap-8 h-full">
                            <CatalogDropdown categories={categories} />
                            <Link
                                href="/coming-soon?page=Blog"
                                className="transition-opacity hover:opacity-70"
                                style={navLinkStyle}
                            >
                                Blog
                            </Link>
                        </nav>
                    </div>

                    <SearchBar />
                </div>

                {/* Right */}
                <div className="shrink-0 h-full flex items-center">
                    {isLoggedIn ? (
                        <div className="flex items-center h-full" style={{ gap: 40 }}>
                            <Link
                                href="/coming-soon?page=My+Courses"
                                className="transition-opacity hover:opacity-70"
                                style={navLinkStyle}
                            >
                                My Courses
                            </Link>

                            <div className="flex items-center h-full" style={{ gap: 28 }}>
                                <button
                                    aria-label="Notifications"
                                    className="flex items-center justify-center transition-opacity hover:opacity-70"
                                    style={{ width: 40, height: 40 }}
                                >
                                    <Image src="/layout/notifications-icon.png" alt="Notifications" width={24} height={24} />
                                </button>
                                <UserDropdown firstName={firstName} />
                            </div>
                        </div>
                    ) : (
                        <AccentButton href="/login" size="md">Get Started</AccentButton>
                    )}
                </div>
            </div>
        </header>
    );
}
