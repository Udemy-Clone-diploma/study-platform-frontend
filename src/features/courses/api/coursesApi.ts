import { api } from "@/shared/api/base";
import type { CourseDetail, CourseListItem, CourseCategory } from "@/features/courses/model/types/course";

const COURSES_ENDPOINT = "courses/";

export async function getCourses(): Promise<CourseListItem[]> {
  const { data } = await api.get<CourseListItem[]>(COURSES_ENDPOINT);
  return data;
}

export async function getCourseById(courseId: number | string): Promise<CourseDetail> {
  const { data } = await api.get<CourseDetail>(`${COURSES_ENDPOINT}${courseId}/`);
  return data;
}

export async function getNewCourses(): Promise<CourseListItem[]> {
  const { data } = await api.get<CourseListItem[]>(`${COURSES_ENDPOINT}new-courses/`);
  return data;
}

export async function getPopularCourses(): Promise<CourseListItem[]> {
  const { data } = await api.get<CourseListItem[]>(`${COURSES_ENDPOINT}popular-courses/`);
  return data;
}

export async function getCategories(): Promise<CourseCategory[]> {
  const { data } = await api.get<CourseCategory[]>(`${COURSES_ENDPOINT}categories/`);
  return data;
}
