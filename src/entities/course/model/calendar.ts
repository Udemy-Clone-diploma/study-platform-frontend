import type { TeacherUnavailability } from "./schedule";

export type CalendarEventType = "individual_session" | "group_session" | "personal";

export type CalendarEventStudent = {
  name: string;
  email: string;
};

export type CalendarEvent = {
  id: string;
  type: CalendarEventType;
  date: string; // "YYYY-MM-DD"
  start_time: string; // "HH:MM"
  end_time: string;
  title?: string | null;        // personal event name
  course_title: string | null;
  course_slug: string | null;
  lesson_title?: string | null;
  lesson_url?: string | null;
  student: CalendarEventStudent | null;
  cohort_name: string | null;
  meeting_link: string | null;
  is_available: boolean | null;
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
