import type { UserData, UserProfile } from "./types";
import type { PublicUserProfile } from "./publicProfile";
import type { ModeratedUserReport } from "./userReport";

export type AdminProfileUser = Omit<UserData, "profile"> & {
  profile: UserProfile;
};

export type AttendancePoint = {
  label: string;
  value: number;
  present: number;
  total: number;
};

export type CourseAttendance = {
  present: number;
  total: number;
  percent: number;
  points: AttendancePoint[];
};

export type AdminProfileCourse = {
  id: number;
  title: string;
  slug: string;
  image: string | null;
  status: string;
  category: string | null;
  teacher: string;
  students_count: number;
  created_at: string;
  enrollment?: {
    id: number;
    order_id: number | null;
    access_status: string;
    access_granted_at: string;
    access_until: string | null;
    progress_percent: number;
    attendance: CourseAttendance;
  };
};

export type ReportStatRow = {
  key: string;
  label: string;
  count: number;
};

export type ReportStats = {
  total: number;
  by_status: ReportStatRow[];
  by_reason: ReportStatRow[];
  reports: ModeratedUserReport[];
};

export type ProcessedMessageReport = {
  id: number;
  action: string;
  action_label: string;
  processed_at: string;
  note: string;
  target_user: AdminProfileUserSummary | null;
  processed_by: AdminProfileUserSummary | null;
  report: {
    id: number;
    reason: string;
    reason_label: string;
    message: string;
    message_created_at: string;
    reporter: AdminProfileUserSummary | null;
  };
};

export type ProcessedUserReport = {
  id: number;
  action: string;
  processed_at: string;
  note: string;
  processed_by: AdminProfileUserSummary | null;
  report: {
    id: number;
    reason: string;
    reason_label: string;
    status: string;
    resolution: string;
    reported_user: AdminProfileUserSummary | null;
    reporter: AdminProfileUserSummary | null;
  };
};

export type CourseModerationRecord = {
  id: number;
  course_slug: string;
  course_title: string;
  course_image_url: string | null;
  course_category: string;
  course_level: string;
  approved_at?: string;
  rejected_at?: string;
};

export type AdminProfileUserSummary = {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
};

export type PlatformStats = {
  users: {
    total: number;
    active: number;
    by_role: Array<{ role: string; count: number }>;
  };
  courses: {
    total: number;
    by_status: Array<{ status: string; count: number }>;
  };
  categories: {
    total: number;
    with_courses: number;
  };
};

export type AdminProfileDetails = {
  student?: {
    courses: AdminProfileCourse[];
  };
  teacher?: {
    courses: AdminProfileCourse[];
    total_students: number;
  };
  moderator?: {
    approved_courses: CourseModerationRecord[];
    rejected_courses: CourseModerationRecord[];
    message_reports: ProcessedMessageReport[];
    user_reports: ProcessedUserReport[];
  };
  administrator?: {
    approved_courses: CourseModerationRecord[];
    rejected_courses: CourseModerationRecord[];
    message_reports: ProcessedMessageReport[];
    user_reports: ProcessedUserReport[];
    platform_stats?: PlatformStats;
  };
};

export type AdminUserProfile = {
  user: AdminProfileUser;
  details: AdminProfileDetails;
  report_stats?: {
    submitted: ReportStats;
    received: ReportStats;
  };
};

/** Staff profile requests return a public profile when a moderator opens an administrator. */
export type StaffUserProfile = AdminUserProfile | PublicUserProfile;
