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
};
