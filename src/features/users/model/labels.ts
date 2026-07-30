import type { UserLanguage, UserRole } from "@/entities/user";
import { LOCALE_OPTIONS } from "@/shared/lib/useLocaleSwitcher";

/** Pass `useTranslations("PublicProfile.roles")` as `t` — that namespace is the single source of truth for role display names. */
export function getRoleLabels(t: (key: string) => string): Record<UserRole, string> {
  return {
    student: t("student"),
    teacher: t("teacher"),
    moderator: t("moderator"),
    administrator: t("administrator"),
  };
}

export function getRoleOptions(t: (key: string) => string) {
  const labels = getRoleLabels(t);
  return (Object.keys(labels) as UserRole[]).map((value) => ({
    value,
    label: labels[value],
  }));
}

export const LANGUAGE_LABELS: Record<UserLanguage, string> = Object.fromEntries(
  LOCALE_OPTIONS.map((o) => [o.value, o.label]),
) as Record<UserLanguage, string>;

export const LANGUAGE_OPTIONS = (Object.keys(LANGUAGE_LABELS) as UserLanguage[]).map((value) => ({
  value,
  label: LANGUAGE_LABELS[value],
}));
