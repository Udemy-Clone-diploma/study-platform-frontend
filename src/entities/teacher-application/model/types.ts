import type { Category } from "@/entities/course";

export type TeacherApplicationStatus = "pending" | "approved" | "cancelled";

export interface TeacherApplication {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  date_of_birth: string | null;
  phone_number: string;
  bio: string;
  experience: string;
  specialization: string;
  years_experience: number | null;
  directions: Category[];
  motivation: string;
  instagram: string;
  linkedin: string;
  behance: string;
  status: TeacherApplicationStatus;
  moderator_name: string | null;
  moderator_comment: string;
  submitted_at: string;
  decided_at: string | null;
}

export interface PaginatedTeacherApplications {
  count: number;
  next: string | null;
  previous: string | null;
  results: TeacherApplication[];
}

export interface SubmitTeacherApplicationPayload {
  first_name: string;
  last_name: string;
  email: string;
  date_of_birth: string;
  phone_number: string;
  bio: string;
  experience: string;
  specialization: string;
  years_experience: number | null;
  directions: number[];
  motivation: string;
  instagram: string;
  linkedin: string;
  behance: string;
}
