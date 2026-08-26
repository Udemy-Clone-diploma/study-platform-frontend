"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Globe } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import { getRoleCourses, getRoleHome, type UserLanguage, type UserRole } from "@/entities/user";
import { logout } from "@/features/auth/actions/logout";
import { updateMe } from "@/features/auth/api/authApi";
import { useLocaleSwitcher } from "@/shared/lib/useLocaleSwitcher";
import { LanguageModal } from "@/shared/ui/LanguageModal";

const itemStyle: React.CSSProperties = {
  fontFamily: "var(--font-accent)",
  fontSize: 16,
  fontWeight: 500,
  textTransform: "uppercase",
  lineHeight: "20px",
  whiteSpace: "nowrap",
};

// The dropdown card's own left/right padding, kept as constants so the
// full-width Language row below can cancel them out (negative margin) and
// reach the card's true edges regardless of the card's width.
const DROPDOWN_PADDING_LEFT = 16;
const DROPDOWN_PADDING_RIGHT = 117;

export function UserDropdown({
  firstName,
  role,
  avatar,
}: {
  firstName: string | null;
  role: UserRole | null;
  avatar: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [languageModalOpen, setLanguageModalOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const t = useTranslations("Common");
  const { locale } = useLocaleSwitcher();

  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  async function handleLogout() {
    setOpen(false);
    await logout();
    router.push("/");
    router.refresh();
  }

  return (
    <div ref={ref} className="flex items-center h-full" style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1.5 transition-opacity hover:opacity-70"
        style={{
          fontFamily: "var(--font-accent)",
          fontSize: "clamp(14px, 1.41vw, 20px)",
          fontWeight: 500,
          color: "var(--color-text-primary)",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
        }}
      >
        {avatar ? (
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            <Image
              src={avatar}
              alt={t("user")}
              width={32}
              height={32}
              unoptimized
              style={{ width: 32, height: 32, objectFit: "cover" }}
            />
          </div>
        ) : (
          <Image
            src="/layout/user-icon.png"
            alt={t("user")}
            width={24}
            height={24}
            style={{ width: 24, height: 24 }}
          />
        )}
        {firstName ?? t("user")}
        <span
          style={{
            width: 36,
            height: 36,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "transform 0.2s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          <Image src="/icons/caret-down.png" alt="" width={16} height={8} />
        </span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 220,
            backgroundImage:
              "linear-gradient(90deg, var(--color-brand-lavender) 0%, var(--color-brand-pink) 50.96%, var(--color-brand-cream) 100%)",
            backgroundAttachment: "fixed",
            backgroundSize: "100vw 100%",
            borderRadius: 12,
            padding: `23px ${DROPDOWN_PADDING_RIGHT}px 23px ${DROPDOWN_PADDING_LEFT}px`,
            zIndex: 50,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="dropdown-link"
                style={itemStyle}
              >
                {t("profile")}
              </Link>
              <div style={{ width: "100%", height: 0, borderTop: "1px solid #FFFFFF" }} />
            </div>
            <Link
              href={getRoleHome(role)}
              onClick={() => setOpen(false)}
              className="dropdown-link"
              style={itemStyle}
            >
              {t("myOffice")}
            </Link>
            <Link
              href={getRoleCourses(role)}
              onClick={() => setOpen(false)}
              className="dropdown-link"
              style={itemStyle}
            >
              {t("myCourses")}
            </Link>

            <div style={{ width: "100%", height: 0, borderTop: "1px solid #FFFFFF" }} />
            <button
              onClick={() => {
                setOpen(false);
                setLanguageModalOpen(true);
              }}
              className="dropdown-link flex items-center justify-between"
              style={{
                ...itemStyle,
                background: "none",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                // Cancel the card's own padding so this row spans its true
                // width edge-to-edge, then re-pad symmetrically (matching
                // the left inset) — works regardless of the card's width.
                marginLeft: -DROPDOWN_PADDING_LEFT,
                marginRight: -DROPDOWN_PADDING_RIGHT,
                paddingLeft: DROPDOWN_PADDING_LEFT,
                paddingRight: DROPDOWN_PADDING_LEFT,
                gap: 12,
              }}
            >
              {t("language")}
              <span className="flex items-center" style={{ gap: 4, fontWeight: 400 }}>
                {locale}
                <Globe className="h-4 w-4 shrink-0" aria-hidden />
              </span>
            </button>

            <div style={{ width: "100%", height: 0, borderTop: "1px solid #FFFFFF" }} />
            <button
              onClick={handleLogout}
              className="dropdown-link"
              style={{
                ...itemStyle,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                textAlign: "left",
                color: "var(--color-pink-dark)",
              }}
            >
              {t("logout")}
            </button>
          </div>
        </div>
      )}

      {languageModalOpen && (
        <LanguageModal
          onClose={() => setLanguageModalOpen(false)}
          onLocaleChange={(next) => {
            updateMe({ language: next as UserLanguage }).catch(() => {});
          }}
        />
      )}
    </div>
  );
}
