import { api } from "@/shared/api/base";
import type { CourseDetail, CourseListItem } from "@/features/courses/model/types/course";
import type { Category } from "@/features/courses/model/types/category";

const COURSES_ENDPOINT = "courses/";
const CATEGORIES_ENDPOINT = "categories/";

export type CourseListParams = {
  category?: string;
  course_type?: string;
  delivery_type?: string;
  is_on_sale?: boolean;
  language?: string;
  level?: string;
  mode?: string;
  ordering?: string;
  pricing_type?: string;
  rating_min?: string;
  search?: string;
  with_certificate?: boolean;
};

export async function getCategories(): Promise<Category[]> {
  const { data } = await api.get<Category[]>(CATEGORIES_ENDPOINT);
  return data;
}

export async function getCourses(filters: CourseListParams = {}): Promise<CourseListItem[]> {
  const params = {
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.course_type ? { course_type: filters.course_type } : {}),
    ...(filters.delivery_type ? { delivery_type: filters.delivery_type } : {}),
    ...(filters.is_on_sale !== undefined ? { is_on_sale: filters.is_on_sale } : {}),
    ...(filters.language ? { language: filters.language } : {}),
    ...(filters.level ? { level: filters.level } : {}),
    ...(filters.mode ? { mode: filters.mode } : {}),
    ...(filters.ordering ? { ordering: filters.ordering } : {}),
    ...(filters.pricing_type ? { pricing_type: filters.pricing_type } : {}),
    ...(filters.rating_min ? { rating_min: filters.rating_min } : {}),
    ...(filters.search ? { search: filters.search } : {}),
    ...(filters.with_certificate !== undefined ? { with_certificate: filters.with_certificate } : {}),
  };
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
 
