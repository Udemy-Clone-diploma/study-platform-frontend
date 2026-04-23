import { api } from "@/shared/api/base";
import type { CourseDetail, CourseListItem } from "@/features/courses/model/types/course";

const COURSES_ENDPOINT = "courses/";

export async function getCourses(): Promise<CourseListItem[]> {
  const { data } = await api.get<CourseListItem[]>(COURSES_ENDPOINT);
  return data;
}

export async function getCourseById(courseId: number | string): Promise<CourseDetail> {
  const { data } = await api.get<CourseDetail>(`${COURSES_ENDPOINT}${courseId}/`);
  return data;
}
