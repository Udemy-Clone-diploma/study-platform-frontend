export type CohortMember = {
  id: number;
  enrollment_id: number;
  student_id: number;
  student_name: string;
  student_email: string;
  joined_at: string;
};

export type EnrolledStudent = {
  enrollment_id: number;
  student_id: number;
  student_name: string;
  student_email: string;
  access_granted_at: string;
  access_until: string | null;
  format_type: string | null;
  progress_percent: number;
};
