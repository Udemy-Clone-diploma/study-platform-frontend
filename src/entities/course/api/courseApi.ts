import { api } from "@/shared/api/base";
import { API_BASE_URL } from "@/shared/api/config/baseUrl";
import { getAccessToken } from "@/shared/api/authCookies";
import type { Category } from "../model/category";
import type { CourseDetail, CourseListItem, Paginated } from "../model/types";

const COURSES = "courses/";
const CATEGORIES = "categories/";

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
  page?: number;
  page_size?: number;
};

export async function getCategories(): Promise<Category[]> {
  const { data } = await api.get<Category[] | Paginated<Category>>(CATEGORIES);
  return Array.isArray(data) ? data : data.results;
}

export async function getCourses(filters: CourseListParams = {}): Promise<Paginated<CourseListItem>> {
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
    ...(filters.page ? { page: filters.page } : {}),
    ...(filters.page_size ? { page_size: filters.page_size } : {}),
  };
  const { data } = await api.get<Paginated<CourseListItem>>(COURSES, { params });
  return data;
}

export async function getCourseBySlug(slug: string): Promise<CourseDetail> {
  const { data } = await api.get<CourseDetail>(`${COURSES}${slug}/`);
  return data;
}

export async function getNewCourses(): Promise<CourseListItem[]> {
  const { data } = await api.get<CourseListItem[]>(`${COURSES}new-courses/`);
  return data;
}

export async function getPopularCourses(): Promise<CourseListItem[]> {
  const { data } = await api.get<CourseListItem[]>(`${COURSES}popular-courses/`);
  return data;
}

export async function getEnrolledCourses(page = 1): Promise<Paginated<CourseListItem>> {
  const { data } = await api.get<Paginated<CourseListItem>>(`${COURSES}enrolled/`, {
    params: { page, page_size: 100 },
  });
  return data;
}

export async function getTeacherCourses(page = 1): Promise<Paginated<CourseListItem>> {
  const { data } = await api.get<Paginated<CourseListItem>>(`${COURSES}my-courses/`, {
    params: { page, page_size: 100 },
  });
  return data;
}

export async function getWishlist(page = 1): Promise<Paginated<CourseListItem>> {
  const { data } = await api.get<Paginated<CourseListItem>>(`${COURSES}wishlist/`, {
    params: { page, page_size: 100 },
  });
  return data;
}

export async function createCourse(data: Record<string, unknown>): Promise<CourseDetail> {
  const { data: result } = await api.post<CourseDetail>(COURSES, data);
  return result;
}

export async function updateCourse(slug: string, data: Record<string, unknown>): Promise<CourseDetail> {
  const { data: result } = await api.patch<CourseDetail>(`${COURSES}${slug}/`, data);
  return result;
}

export async function submitCourseForReview(slug: string): Promise<void> {
  await api.patch(`${COURSES}${slug}/`, { status: "review" });
}

export async function uploadCourseImage(slug: string, imageFile: File): Promise<void> {
  const formData = new FormData();
  formData.append("image", imageFile);
  await api.patch(`${COURSES}${slug}/`, formData);
}

export async function uploadCourseIcon(slug: string, iconSrc: string, iconName: string): Promise<void> {
  try {
    const res = await fetch(iconSrc);
    if (!res.ok) return;
    const blob = await res.blob();
    await uploadCourseImage(slug, new File([blob], `${iconName}-pic.png`, { type: "image/png" }));
  } catch { /* best-effort */ }
}

export async function toggleWishlist(slug: string): Promise<{ is_wishlisted: boolean }> {
  const { data } = await api.post<{ is_wishlisted: boolean }>(`${COURSES}${slug}/wishlist/`);
  return data;
}

export async function getWishlistSlugs(): Promise<string[]> {
  const token = await getAccessToken();
  if (!token) return [];
  try {
    const res = await fetch(`${API_BASE_URL}courses/wishlist/?page_size=100`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data: Paginated<{ slug: string }> = await res.json();
    return data.results.map((c) => c.slug);
  } catch {
    return [];
  }
}
