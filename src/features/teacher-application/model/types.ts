export interface TeacherApplicationFormData {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  phoneNumber: string;
  bio: string;
  experience: string;
  specialization: string;
  yearsExperience: string;
  directions: number[];
  motivation: string;
  instagram: string;
  linkedin: string;
  behance: string;
}

export type TeacherApplicationFormErrors = Partial<
  Record<keyof TeacherApplicationFormData, string>
>;
