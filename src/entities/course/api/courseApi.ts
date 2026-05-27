import { api } from "@/shared/api/base";
import { API_BASE_URL } from "@/shared/api/config/baseUrl";
import { getAccessToken } from "@/shared/api/authCookies";
import type { Category } from "../model/category";
import type { CourseCohort } from "../model/cohort";
import type { LessonDetail } from "../model/module";
import type { PricingPlan } from "../model/pricing";
import type { CourseReview } from "../model/review";
import type {
  CourseDeliveryType,
  CourseDetail,
  CourseLanguage,
  CourseLevel,
  CourseListItem,
  CourseMode,
  CourseType,
  Paginated,
} from "../model/types";

const COURSES = "courses/";
const CATEGORIES = "categories/";

/**
 * Backend accepts these enum-like filters as comma-separated values
 * (e.g. `?delivery_type=self_paced,group`). Caller passes arrays; the API
 * function joins. Single-value filters (`category`, `rating_min`) stay
 * stringly-typed because the backend matches them exactly.
 */
export type CourseListParams = {
  category?: string;
  course_type?: Array<CourseType>;
  delivery_type?: Array<CourseDeliveryType>;
  is_on_sale?: boolean;
  language?: Array<CourseLanguage>;
  level?: Array<CourseLevel>;
  mode?: Array<CourseMode>;
  ordering?: string;
  plan_kind?: Array<PricingPlan["kind"]>;
  price_min?: number;
  price_max?: number;
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
    ...(filters.course_type?.length ? { course_type: filters.course_type.join(",") } : {}),
    ...(filters.delivery_type?.length ? { delivery_type: filters.delivery_type.join(",") } : {}),
    ...(filters.is_on_sale !== undefined ? { is_on_sale: filters.is_on_sale } : {}),
    ...(filters.language?.length ? { language: filters.language.join(",") } : {}),
    ...(filters.level?.length ? { level: filters.level.join(",") } : {}),
    ...(filters.mode?.length ? { mode: filters.mode.join(",") } : {}),
    ...(filters.ordering ? { ordering: filters.ordering } : {}),
    ...(filters.plan_kind?.length ? { plan_kind: filters.plan_kind.join(",") } : {}),
    ...(filters.price_min !== undefined ? { price_min: filters.price_min } : {}),
    ...(filters.price_max !== undefined ? { price_max: filters.price_max } : {}),
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

/**
 * Full lesson payload. Preview lessons are public; locked lessons require an
 * active enrollment, ownership of the course, or moderator/admin role.
 * Backend returns 403 if the user is not allowed and 404 if the lesson is
 * missing or in a different course's slug.
 */
export async function getLesson(slug: string, lessonId: number): Promise<LessonDetail> {
  const { data } = await api.get<LessonDetail>(
    `${COURSES}${slug}/lessons/${lessonId}/`,
  );
  return data;
}

/** Paginated public reviews for a course, newest first. */
export async function getCourseReviews(
  slug: string,
  page = 1,
): Promise<Paginated<CourseReview>> {
  const { data } = await api.get<Paginated<CourseReview>>(
    `${COURSES}${slug}/reviews/`,
    { params: { page } },
  );
  return data;
}

export type PricingPlanInput = Omit<PricingPlan, "id">;

/**
 * Create a pricing plan on a course. Course-owner or admin only.
 * Backend constraints: at most one plan per `kind` (duplicate → 409),
 * installment fields must both be set or both null,
 * `installment_count * installment_amount >= price` when installments are used.
 */
export async function createPricingPlan(
  slug: string,
  body: PricingPlanInput,
): Promise<PricingPlan> {
  const { data } = await api.post<PricingPlan>(
    `${COURSES}${slug}/pricing-plans/`,
    body,
  );
  return data;
}

export async function updatePricingPlan(
  slug: string,
  id: number,
  body: Partial<PricingPlanInput>,
): Promise<PricingPlan> {
  const { data } = await api.patch<PricingPlan>(
    `${COURSES}${slug}/pricing-plans/${id}/`,
    body,
  );
  return data;
}

export async function deletePricingPlan(slug: string, id: number): Promise<void> {
  await api.delete(`${COURSES}${slug}/pricing-plans/${id}/`);
}

export type CohortInput = Omit<CourseCohort, "id">;

/**
 * Create a cohort on a course. Course-owner or admin only.
 * `hours_per_week_max` must be >= `hours_per_week_min`.
 */
export async function createCohort(slug: string, body: CohortInput): Promise<CourseCohort> {
  const { data } = await api.post<CourseCohort>(`${COURSES}${slug}/cohorts/`, body);
  return data;
}

export async function updateCohort(
  slug: string,
  id: number,
  body: Partial<CohortInput>,
): Promise<CourseCohort> {
  const { data } = await api.patch<CourseCohort>(
    `${COURSES}${slug}/cohorts/${id}/`,
    body,
  );
  return data;
}

export async function deleteCohort(slug: string, id: number): Promise<void> {
  await api.delete(`${COURSES}${slug}/cohorts/${id}/`);
}

export type ReviewSubmission = {
  rating: number;
  text: string;
};

/**
 * Post a review for a course. Backend requires the authenticated user to be a
 * student with active enrollment.
 * Throws a normalized ApiError on failure: 401 (anonymous), 403 (not enrolled),
 * 409 (already reviewed).
 */
export async function submitCourseReview(
  slug: string,
  body: ReviewSubmission,
): Promise<CourseReview> {
  const { data } = await api.post<CourseReview>(
    `${COURSES}${slug}/reviews/`,
    body,
  );
  return data;
}

export type EnrollResult = { status: "enrolled" };

/**
 * Enroll the authenticated user in a course.
 * Throws a normalized ApiError on failure: status 401 (not authenticated),
 * 402 (payment required for paid courses), 409 (already enrolled).
 */
export async function enrollInCourse(slug: string): Promise<EnrollResult> {
  const { data } = await api.post<EnrollResult>(`${COURSES}${slug}/enroll/`);
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

/**
 * Server-component path. Bypasses the axios `api` instance because its request
 * interceptor reads the access token from `document.cookie`, which doesn't
 * exist on the server. Pulls the token via the cookies() Server Action instead.
 */
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
