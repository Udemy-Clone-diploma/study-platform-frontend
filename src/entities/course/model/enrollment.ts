export type EnrollmentStatus = "active" | "pending" | "expired" | "revoked" | "suspended";

export type Enrollment = {
  id: number;
  student_profile_id: number;
  student_email: string;
  course_id: number;
  course_title: string;
  course_slug: string;
  order_id: number | null;
  access_status: EnrollmentStatus;
  access_granted_at: string;
  access_until: string | null;
  has_active_access: boolean;
};
