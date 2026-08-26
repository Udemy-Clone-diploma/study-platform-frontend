import { api } from "@/shared/api/base";
import type { AttendanceRecord, IndividualEnrollment } from "../model/attendance";

export async function getSessionDates(
  slug: string,
  cohortId: number,
  year: number,
  month: number,
): Promise<string[]> {
  const { data } = await api.get<{ dates: string[] }>(
    `/courses/${slug}/cohorts/${cohortId}/session-dates/`,
    { params: { year, month } },
  );
  return data.dates;
}

export async function getCohortAttendance(
  slug: string,
  cohortId: number,
  date: string,
): Promise<AttendanceRecord[]> {
  const { data } = await api.get<AttendanceRecord[]>(
    `/courses/${slug}/cohorts/${cohortId}/attendance/`,
    { params: { date } },
  );
  return data;
}

export async function markAttendance(
  slug: string,
  cohortId: number,
  date: string,
  enrollmentId: number,
  isPresent: boolean,
): Promise<void> {
  await api.post(`/courses/${slug}/cohorts/${cohortId}/attendance/`, {
    date,
    enrollment_id: enrollmentId,
    is_present: isPresent,
  });
}

export async function getIndividualEnrollments(slug: string): Promise<IndividualEnrollment[]> {
  const { data } = await api.get<IndividualEnrollment[]>(
    `/courses/${slug}/individual-enrollments/`,
  );
  return data;
}

export async function getEnrollmentSessionDates(
  slug: string,
  enrollmentId: number,
  year: number,
  month: number,
): Promise<string[]> {
  const { data } = await api.get<{ dates: string[] }>(
    `/courses/${slug}/enrollments/${enrollmentId}/session-dates/`,
    { params: { year, month } },
  );
  return data.dates;
}

export async function getEnrollmentAttendance(
  slug: string,
  enrollmentId: number,
  date: string,
): Promise<AttendanceRecord[]> {
  const { data } = await api.get<AttendanceRecord[]>(
    `/courses/${slug}/enrollments/${enrollmentId}/attendance/`,
    { params: { date } },
  );
  return data;
}

export async function markEnrollmentAttendance(
  slug: string,
  enrollmentId: number,
  date: string,
  isPresent: boolean,
): Promise<void> {
  await api.post(`/courses/${slug}/enrollments/${enrollmentId}/attendance/`, {
    date,
    is_present: isPresent,
  });
}
