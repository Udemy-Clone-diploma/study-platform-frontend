import type { UserLanguage, UserRole } from "@/entities/user";

export interface RegisterFormData {
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  password: string;
  password_confirm: string;
  role: UserRole;
  language: UserLanguage;
}

export interface RegisterPayload {
  email: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  password: string;
  password_confirm: string;
  role: UserRole;
  language: UserLanguage;
}

export interface RegisterResponse {
  // access: string;
  // refresh: string;
  message: string;
  status: string;
}

export type RegisterFormErrors = Partial<Record<keyof RegisterFormData, string>>;
