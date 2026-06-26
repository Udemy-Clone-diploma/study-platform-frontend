import { api } from "@/shared/api/base";
import type { CalendarResponse } from "../model/calendar";

/** Fetch calendar events and unavailability for the week containing the given date. */
export async function getCalendarEvents(weekStart?: string): Promise<CalendarResponse> {
  const params = weekStart ? { week_start: weekStart } : {};
  const { data } = await api.get<CalendarResponse>("/calendar/", { params });
  return data;
}

export type UpdateCalendarEventPayload =
  | { action: "cancel" }
  | { action: "restore" }
  | {
      action: "reschedule";
      new_date: string;
      new_start_time: string;
      new_end_time: string;
      meeting_link?: string | null;
    }
  | { action: "update_link"; meeting_link: string | null }
  | { action: "update_lesson"; lesson_id: number | null };

/** Update a session (cancel / reschedule / update_link / update_lesson). */
export async function updateCalendarEvent(
  eventId: string,
  payload: UpdateCalendarEventPayload,
): Promise<{ status: string; replacement_session_id?: number }> {
  const { data } = await api.patch(`/calendar/events/${eventId}/`, payload);
  return data;
}

// ── Personal events ────────────────────────────────────────────────────────────

export type PersonalEventPayload = {
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  meeting_link?: string | null;
};

export async function createPersonalEvent(payload: PersonalEventPayload): Promise<{ id: string }> {
  const { data } = await api.post("/calendar/events/personal/", payload);
  return data;
}

export async function updatePersonalEvent(pk: number, payload: Partial<PersonalEventPayload>): Promise<void> {
  await api.patch(`/calendar/events/personal/${pk}/`, payload);
}

export async function deletePersonalEvent(pk: number): Promise<void> {
  await api.delete(`/calendar/events/personal/${pk}/`);
}

export type PersonalEventConflictItem = {
  id: number;
  title: string;
  start_time: string;
  end_time: string;
  is_invite?: boolean;
  invitation_id?: number;
};

export type PersonalEventConflicts = {
  sessions: Array<{ id: number | string; title: string; type: "group" | "individual" | "extra"; start_time: string; end_time: string }>;
  personal_events: PersonalEventConflictItem[];
};

export async function checkPersonalEventConflicts(params: {
  date: string;
  start_time: string;
  end_time: string;
  exclude_id?: number;
  include_free_slots?: boolean;
}): Promise<PersonalEventConflicts> {
  const { data } = await api.get<PersonalEventConflicts>("/calendar/events/personal/conflicts/", { params });
  return data;
}

/** Invite a user by email to a personal event. */
export async function inviteToEvent(pk: number, email: string): Promise<{ invitation_id: number }> {
  const { data } = await api.post(`/calendar/events/personal/${pk}/invite/`, { email });
  return data;
}

/** List invitations for a personal event (organizer only). */
export async function getEventInvitations(pk: number): Promise<EventInvitationStatus[]> {
  const { data } = await api.get(`/calendar/events/personal/${pk}/invitations/`);
  return data;
}

// ── Participants (owner + invitee view) ───────────────────────────────────────

export type EventParticipant = {
  name: string;
  email?: string;
  avatar?: string | null;
  status: "pending" | "accepted" | "declined";
  responded_at?: string | null;
};

export type EventParticipantsResponse = {
  my_invite: {
    status: "pending" | "accepted" | "declined";
    invited_at: string;
    responded_at: string | null;
  } | null;
  participants: EventParticipant[];
};

/** Participant list accessible to both the event owner and any invitee. */
export async function getEventParticipants(pk: number): Promise<EventParticipantsResponse> {
  const { data } = await api.get(`/calendar/events/personal/${pk}/participants/`);
  return data;
}

// ── Invitations ────────────────────────────────────────────────────────────────

export type EventInvitationStatus = {
  id: number;
  email: string;
  name: string;
  avatar: string | null;
  status: "pending" | "accepted" | "declined";
  responded_at: string | null;
};

export type IncomingInvitation = {
  id: number;
  status: "pending" | "declined";
  event: {
    id: string;
    title: string;
    date: string;
    start_time: string;
    end_time: string;
    meeting_link: string | null;
    organizer: string;
  };
};

export async function getIncomingInvitations(): Promise<IncomingInvitation[]> {
  const { data } = await api.get("/calendar/invitations/");
  return data;
}

export async function respondToInvitation(pk: number, action: "accept" | "decline"): Promise<void> {
  await api.patch(`/calendar/invitations/${pk}/`, { action });
}

// ── Extra sessions (teacher) ──────────────────────────────────────────────────

export type ExtraSessionPayload = {
  date: string;
  start_time: string;
  end_time: string;
  course_id: number;
  audience?: "group" | "individual";
  cohort_id?: number;
  student_email?: string;
  lesson_id?: number | null;
  meeting_link?: string | null;
};

export async function createExtraSession(payload: ExtraSessionPayload): Promise<{ id: string }> {
  const { data } = await api.post("/calendar/events/extra/", payload);
  return data;
}

// ── User search ────────────────────────────────────────────────────────────────

export type UserSearchResult = {
  email: string;
  name: string;
  role: string;
  avatar: string | null;
};

export async function searchUsers(email: string): Promise<UserSearchResult[]> {
  const { data } = await api.get("/users/search/", { params: { email } });
  return data;
}
