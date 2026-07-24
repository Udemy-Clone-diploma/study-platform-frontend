"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import { ChevronDown, Globe, Menu, Search, X } from "lucide-react";
import type { Category } from "@/entities/course";
import { getRoleCourses, getRoleHome, type UserRole } from "@/entities/user";
import { logout } from "@/features/auth/actions/logout";
import { NotificationBell } from "@/features/notifications";
import { AccentButton } from "@/shared/ui/AccentButton";
import { LanguageSwitcher } from "@/shared/ui/LanguageSwitcher";
import { LanguageModal } from "@/shared/ui/LanguageModal";
import { SearchBar } from "@/shared/ui/SearchBar";
import { useLocaleSwitcher } from "@/shared/lib/useLocaleSwitcher";

type Props = {
  isLoggedIn: boolean;
  categories: Category[];
  role: UserRole | null;
};

const topLevelStyle: React.CSSProperties = {
  fontFamily: "var(--font-accent)",
  fontSize: 32,
  fontWeight: 500,
  textTransform: "uppercase",
  lineHeight: "40px",
  color: "var(--color-text-primary)",
};

const subItemStyle: React.CSSProperties = {
  fontFamily: "var(--font-accent)",
  fontSize: 20,
  fontWeight: 500,
  textTransform: "uppercase",
  lineHeight: "25px",
};

export function MobileHeaderMenu({ isLoggedIn, categories, role }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [languageModalOpen, setLanguageModalOpen] = useState(false);
  const router = useRouter();
  const t = useTranslations("Common");
  const tHeader = useTranslations("Header");
  const { locale } = useLocaleSwitcher();

  function closeAll() {
    setMenuOpen(false);
    setCatalogOpen(false);
    setProfileOpen(false);
  }

  function toggleMenu() {
    setMenuOpen((prev) => !prev);
    setSearchOpen(false);
  }

  function toggleSearch() {
    setSearchOpen((prev) => !prev);
    setMenuOpen(false);
  }

  async function handleLogout() {
    closeAll();
    await logout();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="lg:hidden">
      <div className="flex h-16 items-center justify-between px-4">
        <button
          type="button"
          aria-label={menuOpen ? tHeader("closeMenu") : tHeader("openMenu")}
          aria-expanded={menuOpen}
          onClick={toggleMenu}
          className="flex h-10 w-10 shrink-0 items-center justify-center transition-opacity hover:opacity-70"
        >
          {menuOpen ? (
            <X className="h-10 w-10 text-(--color-text-primary)" aria-hidden />
          ) : (
            <Menu className="h-10 w-10 text-(--color-text-primary)" aria-hidden />
          )}
        </button>

        <Link href="/" className="relative h-10 w-[120px] shrink-0" aria-label={t("home")}>
          <Image
            src="/logo/Nexo4u_logo3.svg"
            alt="Nexo4you"
            fill
            className="object-contain"
            priority
          />
        </Link>

        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            aria-label={searchOpen ? tHeader("closeSearch") : t("search")}
            aria-expanded={searchOpen}
            onClick={toggleSearch}
            className="flex h-10 w-10 items-center justify-center transition-opacity hover:opacity-70"
          >
            <Search className="h-10 w-10 text-(--color-text-primary)" aria-hidden />
          </button>
          {isLoggedIn && <NotificationBell iconSize={40} />}
        </div>
      </div>

      <div className="max-h-[calc(100dvh-4rem)] overflow-y-auto">
        <CollapseRows open={searchOpen}>
          <div className="px-4 pb-4">
            <SearchBar />
          </div>
        </CollapseRows>

        <CollapseRows open={menuOpen}>
          <div className="flex flex-col items-center gap-6 px-4 pb-8 pt-2 text-center">
            {!isLoggedIn && (
              <AccentButton
                href="/login"
                size="sm"
                style={{
                  width: 160,
                  height: 40,
                  minWidth: "unset",
                  fontSize: 16,
                  letterSpacing: "normal",
                  padding: 0,
                  whiteSpace: "nowrap",
                }}
              >
                {t("getStarted")}
              </AccentButton>
            )}

            {isLoggedIn && (
              <AccordionSection
                label={t("profile")}
                open={profileOpen}
                onToggle={() => setProfileOpen((v) => !v)}
              >
                <Link
                  href="/profile"
                  onClick={closeAll}
                  className="dropdown-link"
                  style={subItemStyle}
                >
                  {t("myProfile")}
                </Link>
                <Link
                  href={getRoleHome(role)}
                  onClick={closeAll}
                  className="dropdown-link"
                  style={subItemStyle}
                >
                  {t("myOffice")}
                </Link>
                <Link
                  href={getRoleCourses(role)}
                  onClick={closeAll}
                  className="dropdown-link"
                  style={subItemStyle}
                >
                  {t("myCourses")}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="dropdown-link"
                  style={{
                    ...subItemStyle,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    color: "var(--color-pink-dark)",
                  }}
                >
                  {t("logout")}
                </button>

                <div className="h-px w-full bg-white" />
                <button
                  type="button"
                  onClick={() => {
                    closeAll();
                    setLanguageModalOpen(true);
                  }}
                  className="dropdown-link flex items-center justify-center"
                  style={{
                    ...subItemStyle,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    gap: 8,
                  }}
                >
                  {t("language")}
                  <span className="flex items-center" style={{ gap: 4, fontWeight: 400, textTransform: "none" }}>
                    {locale}
                    <Globe className="h-4 w-4 shrink-0" aria-hidden />
                  </span>
                </button>
              </AccordionSection>
            )}

            <AccordionSection
              label={t("catalog")}
              open={catalogOpen}
              onToggle={() => setCatalogOpen((v) => !v)}
            >
              <Link
                href="/catalog"
                onClick={closeAll}
                className="dropdown-link"
                style={subItemStyle}
              >
                {t("allCourses")}
              </Link>
              <div className="h-px w-full bg-white" />
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/catalog?category=${cat.slug}`}
                  onClick={closeAll}
                  className="dropdown-link"
                  style={subItemStyle}
                >
                  {cat.name}
                </Link>
              ))}
            </AccordionSection>

            <Link
              href="/blog"
              onClick={closeAll}
              className="transition-opacity hover:opacity-70"
              style={topLevelStyle}
            >
              {t("blog")}
            </Link>

            {!isLoggedIn && <LanguageSwitcher />}
          </div>
        </CollapseRows>
      </div>

      {languageModalOpen && <LanguageModal onClose={() => setLanguageModalOpen(false)} />}
    </div>
  );
}

function CollapseRows({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <div
      className={`grid transition-[grid-template-rows] duration-300 ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

function AccordionSection({
  label,
  open,
  onToggle,
  children,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex items-center justify-center gap-2 transition-opacity hover:opacity-70"
        style={{
          ...topLevelStyle,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
        }}
      >
        {label}
        <ChevronDown
          aria-hidden="true"
          className={`h-7 w-7 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      <CollapseRows open={open}>
        <div className="flex w-full flex-col items-center gap-4">{children}</div>
      </CollapseRows>
    </div>
  );
}
