import type { UserRole } from "./types";

export type PublicTeacherProfile = {
  bio: string;
  experience: string;
  specialization: string;
  rating: string;
  years_experience: number | null;
  partnerships_count: number | null;
};

export type PublicStudentProfile = {
  learning_goals: string;
  education_level: string;
};

export type PublicModeratorProfile = {
  level: string;
};

type PublicUserProfileBase = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  avatar: string | null;
  date_joined: string;
  instagram: string;
  linkedin: string;
  facebook: string;
  behance: string;
  is_self: boolean;
  has_reported: boolean;
};

export type PublicUserProfile = PublicUserProfileBase &
  (
    | { role: "teacher"; profile: PublicTeacherProfile | null }
    | { role: "student"; profile: PublicStudentProfile | null }
    | { role: "moderator"; profile: PublicModeratorProfile | null }
    | { role: "administrator"; profile: null }
  );
