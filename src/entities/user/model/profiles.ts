export interface StudentProfile {
  date_of_birth: string | null;
  learning_goals: string;
  education_level?: string;
}

export interface TeacherProfile {
  id: number;
  bio: string;
  experience: string;
  specialization: string;
  rating: string;
  years_experience: number | null;
  partnerships_count: number | null;
  signature: string | null;
}

export interface ModeratorProfile {
  level: string;
}

export type UserProfile = StudentProfile | TeacherProfile | ModeratorProfile | null;
