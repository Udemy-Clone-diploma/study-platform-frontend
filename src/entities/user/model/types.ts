import type { UserProfile } from "./profiles";

export type { UserProfile } from "./profiles";

export type UserRole = "student" | "teacher" | "moderator" | "administrator";
export type UserStatus = "active" | "inactive";
export type UserLanguage = "en" | "uk" | "fr" | "es" | "de";

export interface UserData<TProfile extends UserProfile = UserProfile> {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatar: string | null;
  language: UserLanguage;
  is_blocked: boolean;
  is_deleted: boolean;
  is_email_verified: boolean;
  date_joined: string;
  profile: TProfile;
  instagram: string;
  linkedin: string;
  facebook: string;
  behance: string;
}

export interface PaginatedUsers {
  count: number;
  next: string | null;
  previous: string | null;
  results: UserData[];
}

export type UserNote = {
  content: string;
};

export type TopTeacher = {
  teacher_id: number;
  name: string;
  avatar: string | null;
  specialization: string | null;
  experience: string | null;
  rating: string;
};
