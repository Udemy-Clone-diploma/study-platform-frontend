"use client";

import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const LOCALE_LABELS: Record<string, string> = {
  en: "English",
  uk: "Українська",
  fr: "Français",
  es: "Español",
  de: "Deutsch",
};

export type LocaleOption = { value: string; label: string };

export const LOCALE_OPTIONS: LocaleOption[] = routing.locales.map((locale) => ({
  value: locale,
  label: LOCALE_LABELS[locale] ?? locale.toUpperCase(),
}));

/** Shared locale-switching logic for the globe dropdown and the UserDropdown's embedded language list. */
export function useLocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  function switchTo(nextLocale: string) {
    const query = searchParams.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}`, { locale: nextLocale });
  }

  return { locale, options: LOCALE_OPTIONS, switchTo };
}
