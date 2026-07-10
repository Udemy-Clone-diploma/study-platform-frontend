export type Teacher = {
  id: number;
  name: string;
  avatar: string | null;
  bio: string;
  /** Optional marketing tagline shown under the teacher's name (e.g. "Senior Product Designer"). */
  specialization?: string;
  years_experience: number | null;
  students_taught: number | null;
  partnerships_count: number | null;
};
