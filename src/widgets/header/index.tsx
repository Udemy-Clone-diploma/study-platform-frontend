import Image from "next/image";
import Link from "next/link";
import { getCategories } from "@/entities/course";
import { getMe } from "@/entities/user";
import { CatalogDropdown } from "@/features/courses";
import { UserDropdown } from "@/features/auth";
import { NotificationBell } from "@/features/notifications";
import { getAccessToken } from "@/shared/api/authCookies";
import { AccentButton } from "@/shared/ui/AccentButton";
import { SearchBar } from "@/shared/ui/SearchBar";
import { MobileHeaderMenu } from "./MobileHeaderMenu";

const navLinkStyle: React.CSSProperties = {
    fontFamily: "var(--font-accent)",
    fontSize: "clamp(14px, 1.41vw, 20px)",
    fontWeight: 500,
    textTransform: "uppercase",
    color: "var(--color-text-primary)",
    lineHeight: 1.25,
};

type HeaderProps = {
    borderRadius?: React.CSSProperties["borderRadius"];
};

export async function Header({ borderRadius = "0px 0px 20px 20px" }: HeaderProps) {
    const [accessToken, categories] = await Promise.all([
        getAccessToken(),
        getCategories().catch(() => []),
    ]);

    const isLoggedIn = !!accessToken;

    const user = isLoggedIn
        ? await getMe(accessToken).catch(() => null)
        : null;

    return (
        <header
            className="fixed inset-x-0 top-0 z-50 w-full shrink-0 h-auto rounded-t-none rounded-b-[20px] lg:relative lg:z-10 lg:h-[76px] lg:rounded-[var(--header-radius)]"
            style={{
                background: "var(--gradient-brand)",
                "--header-radius": borderRadius,
            } as React.CSSProperties}
        >
            <MobileHeaderMenu isLoggedIn={isLoggedIn} categories={categories} role={user?.role ?? null} />

            <div
                className="mx-auto hidden h-full items-center lg:flex"
                style={{ maxWidth: isLoggedIn ? 1840 : 1480, gap: "9.58%", paddingInline: isLoggedIn ? "max(4px, 0.42vw)" : "max(16px, 2.22vw)" }}
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
                        <Link href="/" style={{ display: "block", width: 180, height: 60, flexShrink: 0, position: "relative" }} aria-label="Home">
                            <Image src="/logo/Nexo4u_logo3.svg" alt="Nexo4you" fill className="object-contain object-left" priority />
                        </Link>

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
                                href={user?.role === "teacher" ? "/teacher-dashboard/courses" : "/student-dashboard/courses"}
                                className="transition-opacity hover:opacity-70"
                                style={navLinkStyle}
                            >
                                My Courses
                            </Link>

                            <div className="flex items-center h-full" style={{ gap: 28 }}>
                                <NotificationBell />
                                <UserDropdown firstName={user?.first_name ?? null} role={user?.role ?? null} avatar={user?.avatar ?? null} />
                            </div>
                        </div>
                    ) : (
                        <AccentButton href="/login" size="md" style={{ height: "clamp(36px, 3.61vw, 52px)", minWidth: "unset", fontSize: "clamp(10px, 1.41vw, 20px)", padding: "0 clamp(16px, 1.94vw, 28px)" }}>Get Started</AccentButton>
                    )}
                </div>
            </div>
        </header>
    );
}
