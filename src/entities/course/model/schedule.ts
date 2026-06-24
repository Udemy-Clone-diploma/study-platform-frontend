export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const DAY_LABELS: Record<DayOfWeek, string> = {
  0: "Monday",
  1: "Tuesday",
  2: "Wednesday",
  3: "Thursday",
  4: "Friday",
  5: "Saturday",
  6: "Sunday",
};

// ── ScheduleSlot (individual format) ─────────────────────────────────────────

export type ScheduleSlotBookedStudent = {
  student_profile_id: number;
  full_name: string;
  email: string;
};

export type ScheduleSlot = {
  id: number;
  day_of_week: DayOfWeek;
  start_time: string; // "HH:MM:SS"
  end_time: string;
  is_available: boolean;
  booked_by_student: ScheduleSlotBookedStudent | null;
  is_rescheduled: boolean;
  original_day_of_week: DayOfWeek | null;
  original_start_time: string | null;
  original_end_time: string | null;
  created_at: string;
  updated_at: string;
};

export type ScheduleSlotPayload = {
  day_of_week: DayOfWeek;
  start_time: string; // "HH:MM"
  end_time: string;
};

export type ScheduleSlotReschedulePayload = {
  day_of_week?: DayOfWeek;
  start_time?: string;
  end_time?: string;
};

// ── CohortSchedule (group format) ─────────────────────────────────────────────

export type CohortSchedule = {
  id: number;
  day_of_week: DayOfWeek;
  day_of_week_display: string;
  start_time: string;
  end_time: string;
  created_at: string;
};

export type CohortSchedulePayload = {
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
};

// ── TeacherUnavailability ─────────────────────────────────────────────────────

export type RecurrenceType = "weekly" | "one_time" | "date_range";

export type TeacherUnavailability = {
  id: number;
  recurrence_type: RecurrenceType;
  recurrence_type_display: string;
  day_of_week: DayOfWeek;
  day_of_week_display: string;
  date: string | null;    // "YYYY-MM-DD" — start date for one_time/date_range
  date_to: string | null; // "YYYY-MM-DD" — end date for date_range
  start_time: string;
  end_time: string;
  reason: string;
  created_at: string;
};

export type TeacherUnavailabilityPayload = {
  recurrence_type: RecurrenceType;
  day_of_week?: DayOfWeek; // required for weekly
  date?: string | null;    // required for one_time and date_range (start)
  date_to?: string | null; // required for date_range (end)
  start_time: string;
  end_time: string;
  reason?: string;
};
