import { UserProfile } from "@/features/auth/model/types/profilesTypes";

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
}
