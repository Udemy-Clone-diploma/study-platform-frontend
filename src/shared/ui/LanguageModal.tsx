"use client";

import { useTranslations } from "next-intl";
import { ModalShell } from "@/shared/ui/ModalShell";
import { useLocaleSwitcher } from "@/shared/lib/useLocaleSwitcher";

type Props = {
  onClose: () => void;
};

/** "Choose a language" modal — grid of locales, current one shown in a bordered box. */
export function LanguageModal({ onClose }: Props) {
  const { locale, options, switchTo } = useLocaleSwitcher();
  const t = useTranslations("LanguageSwitcher");

  return (
    <ModalShell
      onClose={onClose}
      title={t("chooseLanguage")}
      width="clamp(300px, 34vw, 520px)"
      padding="clamp(20px, 2.08vw, 30px) clamp(20px, 2.08vw, 32px)"
      shadow="var(--shadow-modal)"
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: "clamp(10px, 1.11vw, 16px)",
        }}
      >
        {options.map((option) => {
          const isSelected = option.value === locale;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                switchTo(option.value);
                onClose();
              }}
              aria-current={isSelected}
              className={isSelected ? "" : "dropdown-link"}
              style={{
                fontFamily: "var(--font-base)",
                fontSize: "clamp(13px, 0.97vw, 16px)",
                fontWeight: 400,
                textAlign: "left",
                cursor: "pointer",
                padding: "clamp(8px, 0.83vw, 12px)",
                borderRadius: 8,
                border: isSelected ? "1px solid var(--color-text-primary)" : "1px solid transparent",
                background: "none",
                color: "var(--color-text-primary)",
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </ModalShell>
  );
}
