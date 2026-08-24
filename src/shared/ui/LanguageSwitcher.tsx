"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Globe } from "lucide-react";
import { LanguageModal } from "@/shared/ui/LanguageModal";

/** Globe icon button that opens the "Choose a language" modal. */
export function LanguageSwitcher({ iconClassName = "h-6 w-6" }: { iconClassName?: string }) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("LanguageSwitcher");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("selectLanguage")}
        aria-haspopup="dialog"
        className="flex items-center justify-center transition-opacity hover:opacity-70"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          color: "var(--color-text-primary)",
        }}
      >
        <Globe className={iconClassName} aria-hidden />
      </button>

      {open && <LanguageModal onClose={() => setOpen(false)} />}
    </>
  );
}
