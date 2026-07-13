import type { UserLanguage, UserRole } from "@/entities/user";

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

export const LANGUAGE_LABELS: Record<UserLanguage, string> = {
  en: "English",
  uk: "Ukrainian",
};

export const LANGUAGE_OPTIONS = (Object.keys(LANGUAGE_LABELS) as UserLanguage[]).map((value) => ({
  value,
  label: LANGUAGE_LABELS[value],
}));
