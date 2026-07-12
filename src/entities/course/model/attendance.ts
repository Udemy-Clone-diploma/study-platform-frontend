export type AttendanceRecord = {
  enrollment_id: number;
  student_id: number;
  student_name: string;
  student_email: string;
  student_avatar: string | null;
  is_present: boolean;
  has_session: boolean;
  progress_percent: number;
  monthly_attendance_percent: number;
  total_attendance_percent: number;
};

export type IndividualEnrollment = {
  enrollment_id: number;
  student_id: number;
  student_name: string;
  student_email: string;
  student_avatar: string | null;
};
