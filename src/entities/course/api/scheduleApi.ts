import { api } from "@/shared/api/base";
import type {
  CohortSchedule,
  CohortSchedulePayload,
  ScheduleSlot,
  ScheduleSlotPayload,
  ScheduleSlotReschedulePayload,
  TeacherUnavailability,
  TeacherUnavailabilityPayload,
} from "../model/schedule";
import type { EnrolledStudent } from "../model/cohortGroup";

// ── Individual delivery format schedule slots ─────────────────────────────────

export async function getScheduleSlots(
  slug: string,
  formatId: number,
): Promise<ScheduleSlot[]> {
  const res = await api.get<ScheduleSlot[]>(
    `/courses/${slug}/delivery-formats/${formatId}/schedule-slots/`,
  );
  return res.data;
}

export async function createScheduleSlot(
  slug: string,
  formatId: number,
  payload: ScheduleSlotPayload,
): Promise<ScheduleSlot> {
  const res = await api.post<ScheduleSlot>(
    `/courses/${slug}/delivery-formats/${formatId}/schedule-slots/`,
    payload,
  );
  return res.data;
}

export async function rescheduleSlot(
  slug: string,
  formatId: number,
  slotId: number,
  payload: ScheduleSlotReschedulePayload,
): Promise<ScheduleSlot> {
  const res = await api.patch<ScheduleSlot>(
    `/courses/${slug}/delivery-formats/${formatId}/schedule-slots/${slotId}/`,
    payload,
  );
  return res.data;
}

export async function deleteScheduleSlot(
  slug: string,
  formatId: number,
  slotId: number,
): Promise<void> {
  await api.delete(
    `/courses/${slug}/delivery-formats/${formatId}/schedule-slots/${slotId}/`,
  );
}

export async function assignScheduleSlot(
  slug: string,
  formatId: number,
  slotId: number,
  enrollmentId: number | null,
): Promise<ScheduleSlot> {
  const res = await api.post<ScheduleSlot>(
    `/courses/${slug}/delivery-formats/${formatId}/schedule-slots/${slotId}/assign/`,
    { enrollment_id: enrollmentId },
  );
  return res.data;
}


export async function updateEnrollmentPeriod(
  slug: string,
  formatId: number,
  enrollmentId: number,
  payload: { access_granted_at?: string; access_until?: string | null },
): Promise<EnrolledStudent> {
  const res = await api.patch<EnrolledStudent>(
    `/courses/${slug}/delivery-formats/${formatId}/enrollments/${enrollmentId}/period/`,
    payload,
  );
  return res.data;
}

// ── Cohort schedule entries ────────────────────────────────────────────────────

export async function getCohortSchedules(
  slug: string,
  cohortId: number,
): Promise<CohortSchedule[]> {
  const res = await api.get<CohortSchedule[]>(
    `/courses/${slug}/cohorts/${cohortId}/schedules/`,
  );
  return res.data;
}

export async function createCohortSchedule(
  slug: string,
  cohortId: number,
  payload: CohortSchedulePayload,
): Promise<CohortSchedule> {
  const res = await api.post<CohortSchedule>(
    `/courses/${slug}/cohorts/${cohortId}/schedules/`,
    payload,
  );
  return res.data;
}

export async function updateCohortSchedule(
  slug: string,
  cohortId: number,
  scheduleId: number,
  payload: Partial<CohortSchedulePayload>,
): Promise<CohortSchedule> {
  const res = await api.patch<CohortSchedule>(
    `/courses/${slug}/cohorts/${cohortId}/schedules/${scheduleId}/`,
    payload,
  );
  return res.data;
}

export async function deleteCohortSchedule(
  slug: string,
  cohortId: number,
  scheduleId: number,
): Promise<void> {
  await api.delete(
    `/courses/${slug}/cohorts/${cohortId}/schedules/${scheduleId}/`,
  );
}

export type ScheduleConflictPersonalEvent = {
  id: number;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  is_owner: boolean;
  invitation_id: number | null;
};

export type ScheduleConflicts = {
  group: Array<{ id: number; course_title: string; cohort_name: string | null; start_time: string; end_time: string }>;
  individual: Array<{ id: number; course_title: string; start_time: string; end_time: string }>;
  personal: Array<{ id: number; reason: string; start_time: string; end_time: string }>;
  personal_events: ScheduleConflictPersonalEvent[];
};

export type SlotPersonalConflict = {
  id: number;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  is_owner: boolean;
  invitation_id: number | null;
};

export async function checkSlotPersonalConflicts(
  slug: string,
  formatId: number,
  slotId: number,
): Promise<SlotPersonalConflict[]> {
  const res = await api.get<SlotPersonalConflict[]>(
    `/courses/${slug}/delivery-formats/${formatId}/schedule-slots/${slotId}/personal-conflicts/`,
  );
  return res.data;
}

export async function checkCohortScheduleConflicts(
  slug: string,
  cohortId: number,
  params: { day_of_week: number; start_time: string; end_time: string; schedule_id?: number },
): Promise<ScheduleConflicts> {
  const res = await api.get<ScheduleConflicts>(
    `/courses/${slug}/cohorts/${cohortId}/schedules/conflicts/`,
    { params },
  );
  return res.data;
}

export async function checkSlotRescheduleConflicts(
  slug: string,
  formatId: number,
  params: { day_of_week: number; start_time: string; end_time: string; slot_id?: number },
): Promise<ScheduleConflicts> {
  const res = await api.get<ScheduleConflicts>(
    `/courses/${slug}/delivery-formats/${formatId}/schedule-slots/reschedule-conflicts/`,
    { params },
  );
  return res.data;
}

// ── Teacher unavailability ────────────────────────────────────────────────────

export async function getTeacherUnavailabilities(): Promise<TeacherUnavailability[]> {
  const res = await api.get<TeacherUnavailability[]>("/teacher/unavailability/");
  return res.data;
}

export async function createTeacherUnavailability(
  payload: TeacherUnavailabilityPayload,
): Promise<TeacherUnavailability> {
  const res = await api.post<TeacherUnavailability>("/teacher/unavailability/", payload);
  return res.data;
}

export async function updateTeacherUnavailability(
  id: number,
  payload: Partial<TeacherUnavailabilityPayload>,
): Promise<TeacherUnavailability> {
  const res = await api.patch<TeacherUnavailability>(`/teacher/unavailability/${id}/`, payload);
  return res.data;
}

export async function deleteTeacherUnavailability(id: number): Promise<void> {
  await api.delete(`/teacher/unavailability/${id}/`);
}
