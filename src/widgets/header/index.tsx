import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { getCategories } from "@/features/courses/api/coursesApi";
import { getMe } from "@/features/auth/api/authApi";
import { CatalogDropdown } from "@/features/courses/ui/CatalogDropdown";
import { UserDropdown } from "@/features/auth/ui/UserDropdown";
import { GetStartedButton } from "@/shared/ui/GetStartedButton";
import { SearchBar } from "@/shared/ui/SearchBar";

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
                className="max-w-[1420px] mx-auto h-full flex items-center px-4 md:px-6 xl:px-8"
                style={{ gap: "9.58%" }}
            >
                {/* Left */}
                <div className="flex items-center flex-1 min-w-0 h-full" style={{ gap: "8.49%" }}>

                    <div className="flex items-center shrink-0 h-full" style={{ gap: 60 }}>
                        <div style={{ width: 180, height: 60, background: "var(--color-placeholder)" }} />

                        <nav className="flex items-center gap-8 h-full">
                            <CatalogDropdown categories={categories} />
                            <Link
                                href="/coming-soon?page=Blog"
                                className="transition-opacity hover:opacity-70"
                                style={{
                                    fontFamily: "var(--font-accent)",
                                    fontSize: "clamp(14px, 1.41vw, 20px)",
                                    fontWeight: 500,
                                    textTransform: "uppercase",
                                    color: "var(--color-text-primary)",
                                    lineHeight: 1.25,
                                }}
                            >
                                Blog
                            </Link>
                        </nav>
                    </div>

                    <SearchBar />
                </div>

                {/* Right */}
                <div className="shrink-0 h-full">
                    {isLoggedIn ? (
                        <div className="flex items-center gap-6 h-full">
                            <Link
                                href="/coming-soon?page=My+Courses"
                                className="transition-opacity hover:opacity-70"
                                style={{
                                    fontFamily: "var(--font-accent)",
                                    fontSize: "clamp(14px, 1.41vw, 20px)",
                                    fontWeight: 500,
                                    textTransform: "uppercase",
                                    color: "var(--color-text-primary)",
                                }}
                            >
                                My Courses
                            </Link>
                            <button
                                aria-label="Notifications"
                                className="w-9 h-9 flex items-center justify-center transition-opacity hover:opacity-70"
                            >
                                <Image src="/layout/notifications-icon.png" alt="Notifications" width={24} height={24} />
                            </button>
                            <UserDropdown firstName={firstName} />
                        </div>
                    ) : (
                        <GetStartedButton />
                    )}
                </div>
            </div>
        </header>
    );
}
