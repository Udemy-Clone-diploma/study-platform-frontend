import type { UserProfile } from "./profiles";

export type UserRole = "student" | "teacher" | "moderator" | "administrator";
export type UserStatus = "active" | "inactive";
export type UserLanguage = "en" | "uk";

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
  date_joined: string;
  profile: TProfile;
  instagram: string;
  linkedin: string;
  facebook: string;
  behance: string;
}

export type TopTeacher = {
  teacher_id: number;
  name: string;
  avatar: string | null;
  specialization: string | null;
  experience: string | null;
  rating: string;
};
