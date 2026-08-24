import type { TeacherUnavailability } from "./schedule";

export type CalendarEventType =
  | "individual_session"
  | "group_session"
  | "personal"
  | "personal_shared"
  | "extra_session";

export type CalendarEventStudent = {
  name: string;
  email: string;
};

export type CalendarEventStatus = "cancelled" | "rescheduled";

export type CalendarEvent = {
  id: string;
  type: CalendarEventType;
  date: string; // "YYYY-MM-DD"
  start_time: string; // "HH:MM"
  end_time: string;
  title?: string | null;
  owner_name?: string | null;
  course_title: string | null;
  course_slug: string | null;
  lesson_title?: string | null;
  lesson_url?: string | null;
  student: CalendarEventStudent | null;
  cohort_name: string | null;
  meeting_link: string | null;
  is_available: boolean | null;
  is_owner?: boolean | null;
  invite_status?: "pending" | "accepted" | "declined" | null;
  event_status?: CalendarEventStatus | null;
  rescheduled_to_date?: string | null;
  rescheduled_from_date?: string | null;
};

export type CalendarDeadline = {
  date: string; // "YYYY-MM-DD"
  assignment_id: number;
  title: string;
  course_title: string;
  course_slug: string;
};

export type CalendarResponse = {
  week_start: string; // "YYYY-MM-DD" (Monday)
  events: CalendarEvent[];
  unavailability: TeacherUnavailability[];
  deadlines: CalendarDeadline[];
};
