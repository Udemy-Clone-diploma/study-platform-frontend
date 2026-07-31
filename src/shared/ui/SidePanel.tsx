"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  width?: string;
  children: React.ReactNode;
};

/**
 * Sliding drawer panel from the right -- same fixed idiom as the homework and
 * notes detail drawers (fixed below the header, rounded left corners, shadow,
 * translate-x transition, Escape-to-close).
 */
export function SidePanel({
  open,
  onClose,
  title,
  width = "clamp(280px, 24vw, 400px)",
  children,
}: Props) {
  const t = useTranslations("Common");
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  return (
    <aside
      aria-hidden={!open}
      className={[
        "fixed top-[76px] right-0 bottom-0 z-40 overflow-hidden rounded-tl-[20px] rounded-bl-[20px] bg-white shadow-[0_0_30px_rgba(0,0,0,0.16)] transition-transform duration-300 ease-out",
        open ? "translate-x-0" : "translate-x-full",
      ].join(" ")}
      style={{ width: `min(${width}, calc(100vw - 24px))` }}
    >
      <div style={{
        height: "100%",
        overflowY: "auto",
        padding: "clamp(16px, 1.25vw, 24px)",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
      }}>
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
          flexShrink: 0,
        }}>
          <h2 style={{
            fontFamily: "var(--font-base)",
            fontWeight: 700,
            fontSize: "clamp(14px, 1vw, 17px)",
            color: "var(--color-text-primary)",
            margin: 0,
          }}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--color-text-secondary)",
              display: "flex",
              padding: 4,
              borderRadius: 6,
              flexShrink: 0,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, minHeight: 0 }}>
          {children}
        </div>
      </div>
    </aside>
  );
}
