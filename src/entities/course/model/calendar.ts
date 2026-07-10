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
  date: string;       // "YYYY-MM-DD"
  start_time: string; // "HH:MM"
  end_time: string;
  title?: string | null;          // personal event title
  owner_name?: string | null;     // personal event creator
  course_title: string | null;
  course_slug: string | null;
  lesson_title?: string | null;
  lesson_url?: string | null;
  student: CalendarEventStudent | null;
  cohort_name: string | null;
  meeting_link: string | null;
  is_available: boolean | null;
  // Personal event fields
  is_owner?: boolean | null;
  invite_status?: "pending" | "accepted" | "declined" | null;
  // Session status fields
  event_status?: CalendarEventStatus | null;
  rescheduled_to_date?: string | null;
  rescheduled_from_date?: string | null;
};

export type CalendarResponse = {
  week_start: string; // "YYYY-MM-DD" (Monday)
  events: CalendarEvent[];
  unavailability: TeacherUnavailability[];
};

// ── Create event payload ──────────────────────────────────────────────────────

type CalendarEventBase = {
  date: string;       // "YYYY-MM-DD"
  start_time: string; // "HH:MM"
  end_time: string;
};

export type CalendarEventPayload =
  | (CalendarEventBase & { type: "personal"; title: string; notes?: string })
  | (CalendarEventBase & {
      type: "group_session";
      course_slug: string;
      cohort_id: number;
      lesson_id?: number | null;
      meeting_link?: string | null;
    })
  | (CalendarEventBase & {
      type: "individual_session";
      course_slug: string;
      student_id: number;
      lesson_id?: number | null;
      meeting_link?: string | null;
    });
