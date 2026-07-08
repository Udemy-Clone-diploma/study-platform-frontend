export type CohortMember = {
  id: number;
  enrollment_id: number;
  student_id: number;
  student_name: string;
  student_email: string;
  student_avatar: string | null;
  joined_at: string;
  is_completed: boolean;
};

export type EnrolledStudent = {
  enrollment_id: number;
  student_id: number;
  student_name: string;
  student_email: string;
  student_avatar: string | null;
  access_granted_at: string;
  access_until: string | null;
  format_type: string | null;
  progress_percent: number;
  /** Whether the student has a CourseCompletion record for this course (teacher-defined threshold, not always 100%). */
  is_completed: boolean;
};
