import { api } from "@/shared/api/base";
import type { CourseDetail, CourseListItem } from "@/features/courses/model/types/course";
import type { Category } from "@/features/courses/model/types/category";

const COURSES_ENDPOINT = "courses/";
const CATEGORIES_ENDPOINT = "categories/";

export async function getCategories(): Promise<Category[]> {
  const { data } = await api.get<Category[]>(CATEGORIES_ENDPOINT);
  return data;
}

export async function getCourses(categorySlug?: string, ordering?: string): Promise<CourseListItem[]> {
  const params: Record<string, string> = {};
  if (categorySlug) params.category = categorySlug;
  if (ordering) params.ordering = ordering;
  const { data } = await api.get<CourseListItem[]>(COURSES_ENDPOINT, { params });
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
 
