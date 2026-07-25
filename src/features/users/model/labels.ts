import type { UserLanguage, UserRole } from "@/entities/user";
import { LOCALE_OPTIONS } from "@/shared/lib/useLocaleSwitcher";

export const ROLE_LABELS: Record<UserRole, string> = {
  student: "Student",
  teacher: "Teacher",
  moderator: "Moderator",
  administrator: "Administrator",
};

export const ROLE_OPTIONS = (Object.keys(ROLE_LABELS) as UserRole[]).map((value) => ({
  value,
  label: ROLE_LABELS[value],
}));

export const LANGUAGE_LABELS: Record<UserLanguage, string> = Object.fromEntries(
  LOCALE_OPTIONS.map((o) => [o.value, o.label]),
) as Record<UserLanguage, string>;

export const LANGUAGE_OPTIONS = (Object.keys(LANGUAGE_LABELS) as UserLanguage[]).map((value) => ({
  value,
  label: LANGUAGE_LABELS[value],
}));
