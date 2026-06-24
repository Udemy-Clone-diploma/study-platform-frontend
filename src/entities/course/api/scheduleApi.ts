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
