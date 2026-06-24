import { api } from "@/shared/api/base";
import type { CalendarResponse, CalendarEvent, CalendarEventPayload } from "../model/calendar";

/** Fetch calendar events and unavailability for the week containing the given date. */
export async function getCalendarEvents(weekStart?: string): Promise<CalendarResponse> {
  const params = weekStart ? { week_start: weekStart } : {};
  const { data } = await api.get<CalendarResponse>("/calendar/", { params });
  return data;
}

/** Create a new calendar event (personal, group session, or individual session). */
export async function createCalendarEvent(payload: CalendarEventPayload): Promise<CalendarEvent> {
  const { data } = await api.post<CalendarEvent>("/calendar/events/", payload);
  return data;
}
