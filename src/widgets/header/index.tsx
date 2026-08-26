import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCategories } from "@/entities/course";
import { getMe, type UserRole } from "@/entities/user";
import { CatalogDropdown } from "@/features/courses";
import { UserDropdown } from "@/features/auth";
import { NotificationBell } from "@/features/notifications";
import {
  getAccessToken,
  getUserRoleCookie,
  hasUsableRefreshToken,
} from "@/shared/api/authCookies";
import { AccentButton } from "@/shared/ui/AccentButton";
import { LanguageSwitcher } from "@/shared/ui/LanguageSwitcher";
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

export async function Header({
  borderRadius = "0 0 var(--mobile-header-radius) var(--mobile-header-radius)",
}: HeaderProps) {
  const locale = await getLocale();
  const [accessToken, roleCookie, hasRefreshSession, categories, t] = await Promise.all([
    getAccessToken(),
    getUserRoleCookie(),
    hasUsableRefreshToken(),
    getCategories(locale).catch(() => []),
    getTranslations("Common"),
  ]);

  const user = accessToken ? await getMe(accessToken).catch(() => null) : null;
  const role = user?.role ?? (roleCookie as UserRole | undefined) ?? null;
  const isLoggedIn = Boolean(user || (role && hasRefreshSession));

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 h-auto w-full shrink-0 rounded-t-none rounded-b-(--mobile-header-radius) lg:relative lg:z-10 lg:h-[76px] lg:rounded-[var(--header-radius)]"
      style={
        {
          background: "var(--gradient-brand)",
          "--header-radius": borderRadius,
        } as React.CSSProperties
      }
    >
      <MobileHeaderMenu isLoggedIn={isLoggedIn} categories={categories} role={role} />

      <div
        className="mx-auto hidden h-full items-center lg:flex"
        style={{
          maxWidth: isLoggedIn ? 1840 : 1480,
          gap: "9.58%",
          paddingInline: isLoggedIn ? "max(4px, 0.42vw)" : "max(16px, 2.22vw)",
        }}
      >
        <div
          className="flex items-center flex-1 min-w-0 h-full"
          style={{ gap: isLoggedIn ? "3%" : "8.49%" }}
        >
          <div className="flex items-center shrink-0 h-full" style={{ gap: isLoggedIn ? 48 : 60 }}>
            <Link
              href="/"
              style={{
                display: "block",
                width: 180,
                height: 60,
                flexShrink: 0,
                position: "relative",
              }}
              aria-label={t("home")}
            >
              <Image
                src="/logo/Nexo4u_logo3.svg"
                alt="Nexo4you"
                fill
                className="object-contain object-left"
                priority
              />
            </Link>

            <nav className="flex items-center gap-8 h-full">
              <CatalogDropdown categories={categories} />
              <Link
                href="/blog"
                className="transition-opacity hover:opacity-70"
                style={navLinkStyle}
              >
                {t("blog")}
              </Link>
            </nav>
          </div>

          <SearchBar />
        </div>

        <div className="shrink-0 h-full flex items-center" style={{ gap: 24 }}>
          {isLoggedIn ? (
            <div className="flex items-center h-full" style={{ gap: 40 }}>
              <Link
                href={
                  role === "teacher"
                    ? "/teacher-dashboard/courses"
                    : "/student-dashboard/courses"
                }
                className="transition-opacity hover:opacity-70"
                style={navLinkStyle}
              >
                {t("myCourses")}
              </Link>

              <div className="flex items-center h-full" style={{ gap: 28 }}>
                <NotificationBell />
                <UserDropdown
                  firstName={user?.first_name ?? null}
                  role={role}
                  avatar={user?.avatar ?? null}
                />
              </div>
            </div>
          ) : (
            <>
              <AccentButton
                href="/login"
                size="md"
                style={{
                  height: "clamp(36px, 3.61vw, 52px)",
                  minWidth: "unset",
                  fontSize: "clamp(10px, 1.41vw, 20px)",
                  padding: "0 clamp(16px, 1.94vw, 28px)",
                }}
              >
                {t("getStarted")}
              </AccentButton>
              <LanguageSwitcher />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
