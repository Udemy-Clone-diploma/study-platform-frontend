import { api } from "@/shared/api/base";
import { API_BASE_URL } from "@/shared/api/config/baseUrl";
import { getAccessToken } from "@/shared/api/authCookies";
import type { Category } from "../model/category";
import type { CourseCohort } from "../model/cohort";
import type { CohortMember, EnrolledStudent } from "../model/cohortGroup";
import type { CourseLesson } from "../model/module";
import type { DeliveryFormatType } from "../model/delivery-format";
import type { PricingPlan } from "../model/pricing";
import type { CourseReview } from "../model/review";
import type { CourseCompletion } from "../model/completion";
import type { Enrollment } from "../model/enrollment";
import type {
  ApprovedCourseRecord,
  CourseDeliveryType,
  CourseDetail,
  CourseLanguage,
  CourseLevel,
  CourseListItem,
  CourseMode,
  CourseStatus,
  CourseType,
  Paginated,
  RejectedCourseItem,
  RejectedCourseRecord,
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
  format_type?: Array<DeliveryFormatType>;
  price_min?: number;
  price_max?: number;
  rating_min?: string;
  search?: string;
  status?: CourseStatus | CourseStatus[];
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
    ...(filters.format_type?.length ? { format_type: filters.format_type.join(",") } : {}),
    ...(filters.price_min !== undefined ? { price_min: filters.price_min } : {}),
    ...(filters.price_max !== undefined ? { price_max: filters.price_max } : {}),
    ...(filters.rating_min ? { rating_min: filters.rating_min } : {}),
    ...(filters.search ? { search: filters.search } : {}),
    ...(filters.status !== undefined
      ? { status: Array.isArray(filters.status) ? filters.status.join(",") : filters.status }
      : {}),
    ...(filters.with_certificate !== undefined ? { with_certificate: filters.with_certificate } : {}),
    ...(filters.page ? { page: filters.page } : {}),
    ...(filters.page_size ? { page_size: filters.page_size } : {}),
  };
  const { data } = await api.get<Paginated<CourseListItem>>(COURSES, { params });
  return data;
}

/**
 * Public course detail. Pass `accessToken` from a Server Action when the call
 * runs on the server (e.g. an authenticated route) so the backend can return
 * the enrolled-user view (`is_enrolled: true`). On the client the request
 * interceptor reads the token from `document.cookie` automatically.
 */
export async function getCourseBySlug(slug: string, accessToken?: string): Promise<CourseDetail> {
  const { data } = await api.get<CourseDetail>(`${COURSES}${slug}/`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });
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
export async function getLesson(slug: string, lessonId: number): Promise<CourseLesson> {
  const { data } = await api.get<CourseLesson>(
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

export type CohortInput = Omit<CourseCohort, "id" | "members_count" | "members">;

export async function getCohorts(slug: string): Promise<CourseCohort[]> {
  const { data } = await api.get<CourseCohort[] | Paginated<CourseCohort>>(`${COURSES}${slug}/cohorts/`);
  return Array.isArray(data) ? data : data.results;
}

/** Create a cohort on a course. Course-owner or admin only. */
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

export async function addCohortMember(
  slug: string,
  cohortId: number,
  enrollmentId: number,
): Promise<CohortMember> {
  const { data } = await api.post<CohortMember>(
    `${COURSES}${slug}/cohorts/${cohortId}/members/`,
    { enrollment_id: enrollmentId },
  );
  return data;
}

export async function removeCohortMember(
  slug: string,
  cohortId: number,
  memberId: number,
): Promise<void> {
  await api.delete(`${COURSES}${slug}/cohorts/${cohortId}/members/${memberId}/`);
}

export async function getCourseEnrolledStudents(
  slug: string,
  formatId?: number,
): Promise<EnrolledStudent[]> {
  const params = formatId ? `?format_id=${formatId}` : "";
  const { data } = await api.get<EnrolledStudent[]>(`${COURSES}${slug}/enrolled-students/${params}`);
  return data;
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

/**
 * Enroll the authenticated student in a course that has a zero-price plan.
 * The backend validates the price again and rejects paid courses.
 */
export async function enrollInFreeCourse(slug: string): Promise<Enrollment> {
  const { data } = await api.post<Enrollment>(`${COURSES}${slug}/enroll-free/`);
  return data;
}

export async function getEnrolledCourses(
  page = 1,
  accessToken?: string,
): Promise<Paginated<CourseListItem>> {
  const { data } = await api.get<Paginated<CourseListItem>>(`${COURSES}enrolled/`, {
    params: { page, page_size: 100 },
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });
  return data;
}

export async function getStudentCompletions(params?: {
  page?: number;
  page_size?: number;
  with_certificate?: boolean;
}): Promise<Paginated<CourseCompletion>> {
  const { data } = await api.get<Paginated<CourseCompletion>>(`${COURSES}completions/`, { params });
  return data;
}

export async function getTeacherCourses(page = 1): Promise<Paginated<CourseListItem>> {
  const { data } = await api.get<Paginated<CourseListItem>>(`${COURSES}my-courses/`, {
    params: { page, page_size: 100 },
  });
  return data;
}

/** All courses with status=review (awaiting moderation). */
export async function getModerationCourses(
  status: CourseStatus | CourseStatus[] = "review",
  page = 1,
): Promise<Paginated<CourseListItem>> {
  return getCourses({ status, page, page_size: 100 });
}

/** Courses in review status with no moderator assigned yet, oldest-first. */
export async function getUnassignedModerationCourses(page = 1): Promise<Paginated<CourseListItem>> {
  const { data } = await api.get<Paginated<CourseListItem>>(`${COURSES}moderation/unassigned/`, {
    params: { page, page_size: 100 },
  });
  return data;
}

/** Courses assigned to the currently authenticated moderator, oldest-first. */
export async function getMyModerationCourses(page = 1): Promise<Paginated<CourseListItem>> {
  const { data } = await api.get<Paginated<CourseListItem>>(`${COURSES}moderation/my/`, {
    params: { page, page_size: 100 },
  });
  return data;
}

/** Rejected courses moderated by the current moderator (includes moderation_review). */
export async function getMyRejectedModerationCourses(page = 1): Promise<Paginated<RejectedCourseItem>> {
  const { data } = await api.get<Paginated<RejectedCourseItem>>(`${COURSES}moderation/rejected/`, {
    params: { page, page_size: 100 },
  });
  return data;
}

/** Approve a course (moderator only). */
export async function approveCourse(slug: string): Promise<void> {
  await api.post(`${COURSES}${slug}/approve/`);
}

/** Save moderator review progress without changing course status. */
export async function saveReviewDraft(
  slug: string,
  basicsFieldStatuses: Record<string, string> = {},
  basicsAction = "",
  basicsComment = "",
  contentItemStatuses: Record<string, string> = {},
  contentAction = "",
  contentComment = "",
  finalAction = "",
  finalComment = "",
): Promise<void> {
  await api.post(`${COURSES}${slug}/save-review-draft/`, {
    basics_field_statuses: basicsFieldStatuses,
    basics_action: basicsAction,
    basics_comment: basicsComment,
    content_item_statuses: contentItemStatuses,
    content_action: contentAction,
    content_comment: contentComment,
    final_action: finalAction,
    final_comment: finalComment,
  });
}

/** Reject a course (moderator only). Sends per-step statuses, actions, and comments. */
export async function rejectCourse(
  slug: string,
  basicsFieldStatuses: Record<string, string> = {},
  basicsAction = "",
  basicsComment = "",
  contentItemStatuses: Record<string, string> = {},
  contentAction = "",
  contentComment = "",
  finalAction = "",
  finalComment = "",
): Promise<void> {
  await api.post(`${COURSES}${slug}/reject/`, {
    basics_field_statuses: basicsFieldStatuses,
    basics_action: basicsAction,
    basics_comment: basicsComment,
    content_item_statuses: contentItemStatuses,
    content_action: contentAction,
    content_comment: contentComment,
    final_action: finalAction,
    final_comment: finalComment,
  });
}

/** Assign the current moderator to a course. Backend endpoint: courses/:slug/assign-moderator/ */
export async function assignModeratorSelf(slug: string): Promise<void> {
  await api.post(`${COURSES}${slug}/assign-moderator/`);
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

export async function downloadCertificatePreview(slug: string): Promise<Blob> {
  const { data } = await api.get<Blob>(`${COURSES}${slug}/certificate-preview/`, {
    responseType: "blob",
  });
  return data;
}

export async function submitCourseForReview(slug: string): Promise<void> {
  await api.patch(`${COURSES}${slug}/`, { status: "review" });
}

export async function deleteCourse(slug: string): Promise<void> {
  await api.delete(`${COURSES}${slug}/`);
}

export async function archiveCourse(slug: string): Promise<void> {
  await api.patch(`${COURSES}${slug}/`, { status: "archived" });
}

/** Move course back to draft (from review or needs_revision). */
export async function withdrawCourseFromReview(slug: string): Promise<void> {
  await api.patch(`${COURSES}${slug}/`, { status: "draft" });
}

/** Get teacher's rejected courses (includes moderation_review + moderator_comment). */
export async function getRejectedCourses(page = 1): Promise<Paginated<RejectedCourseItem>> {
  const { data } = await api.get<Paginated<RejectedCourseItem>>(`${COURSES}rejected/`, {
    params: { page, page_size: 100 },
  });
  return data;
}

/** Restore a rejected course to draft so the teacher can edit and resubmit. */
export async function restoreCourseFromRejected(slug: string): Promise<CourseDetail> {
  const { data } = await api.post<CourseDetail>(`${COURSES}${slug}/restore-from-rejected/`);
  return data;
}

/** Deep-copy a rejected course into a new DRAFT. The original rejected course stays unchanged. */
export async function copyCourseToDraft(slug: string): Promise<CourseDetail> {
  const { data } = await api.post<CourseDetail>(`${COURSES}${slug}/copy-to-draft/`);
  return data;
}

/** Teacher's rejection history — immutable snapshot records, independent of course status. */
export async function getTeacherRejectionRecords(page = 1): Promise<Paginated<RejectedCourseRecord>> {
  const { data } = await api.get<Paginated<RejectedCourseRecord>>(`${COURSES}my-rejection-records/`, {
    params: { page, page_size: 100 },
  });
  return data;
}

/** Moderator's rejection history snapshot records. */
export async function getModeratorRejectionRecords(page = 1): Promise<Paginated<RejectedCourseRecord>> {
  const { data } = await api.get<Paginated<RejectedCourseRecord>>(`${COURSES}moderation/rejection-records/`, {
    params: { page, page_size: 100 },
  });
  return data;
}

/** Moderator's approval history snapshot records. */
export async function getModeratorApprovalRecords(page = 1): Promise<Paginated<ApprovedCourseRecord>> {
  const { data } = await api.get<Paginated<ApprovedCourseRecord>>(`${COURSES}moderation/approval-records/`, {
    params: { page, page_size: 100 },
  });
  return data;
}

/** Move archived course back to draft. */
export async function unarchiveCourse(slug: string): Promise<void> {
  await api.patch(`${COURSES}${slug}/`, { status: "draft" });
}

/** Set status to "hidden": removed from catalog, enrolled students keep access. */
export async function hideCourse(slug: string): Promise<void> {
  await api.patch(`${COURSES}${slug}/`, { status: "hidden" });
}

/** Re-publish a hidden course (open for new enrollments). */
export async function openCourse(slug: string): Promise<void> {
  await api.patch(`${COURSES}${slug}/`, { status: "published" });
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
    const extension = iconSrc.split(".").pop() || "png";
    await uploadCourseImage(slug, new File([blob], `${iconName}-pic.${extension}`, { type: blob.type }));
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
