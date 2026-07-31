import type { Category } from "./category";
import type { CourseCohort } from "./cohort";
import type { CourseDeliveryFormat } from "./delivery-format";
import type { EnrollmentStatus } from "./enrollment";
import type { CourseModule } from "./module";
import type { PricingPlan } from "./pricing";
import type { CourseTag } from "./tag";
import type { Teacher } from "./teacher";

export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type CourseLevel = "beginner" | "intermediate" | "advanced";
export type CourseLanguage = "english" | "ukrainian" | "spanish";
export type CourseMode = "self_learning" | "with_teacher";
export type CourseDeliveryType = "self_paced" | "scheduled" | "individual" | "group";
export type CourseType = "profession" | "qualification" | "knowledge";
export type CoursePricingType = "free" | "full_payment" | "installment";
export type CourseStatus = "draft" | "review" | "needs_revision" | "rejected" | "published" | "hidden" | "archived";

export type CourseListItem = {
  id: number;
  image: string | null;
  title: string;
  /** Optional tagline. Backend exposes it on both list and detail per PR #56. */
  subtitle: string | null;
  short_description: string;
  slug: string;
  teacher_name: string;
  category: Category | null;
  level: CourseLevel;
  language: CourseLanguage;
  mode: CourseMode;
  delivery_type: CourseDeliveryType;
  course_type: CourseType;
  /** Cheapest pricing plan's price (after discount, if any), computed by the backend. Null when the course is free. */
  price: string | null;
  /** Cheapest pricing plan's pre-discount price. Null unless is_on_sale actually lowers the price. */
  original_price: string | null;
  /** Cheapest pricing plan's currency. Null when the course is free. */
  currency: PricingPlan["currency"] | null;
  duration_hours: number;
  lessons_count: number;
  with_certificate: boolean;
  is_on_sale: boolean;
  /** 1-99. Set only when is_on_sale is true. */
  discount_percent: number | null;
  rating_avg: string;
  /** Count of reviews. Kept in sync by a backend signal on Review save/delete. */
  rating_count: number;
  students_count: number;
  status: CourseStatus;
  published_at: string | null;
  created_at: string;
  /** Present on most list endpoints. Updated whenever the course record changes (e.g. status transition). */
  updated_at?: string;
  /** Date the current student was granted access. Null for non-enrolled contexts (teacher, catalog). */
  enrolled_at: string | null;
  /** The current student's enrollment status for this course. Null when never enrolled.
   *  "suspended" means an installment payment is overdue — access is paused, not lost;
   *  paying restores it automatically. Present on enrolled-courses endpoints. */
  enrollment_access_status: EnrollmentStatus | null;
  /** Present on enrolled-courses endpoints. 0-100, integer. */
  progress_percent?: number;
  tags: CourseTag[];
  /**
   * Present only on teacher my-courses list. Null when the course has no pending edit.
   * "draft"         — edits saved but not yet submitted for moderation
   * "pending"       — submitted for moderation (editing locked)
   * "needs_revision"— moderator returned for revision
   */
  pending_edit_status: "draft" | "pending" | "needs_revision" | null;
  /** When the pending edit was submitted for moderation. Present on moderation list endpoints
   *  for published/hidden courses whose pending edit is in "pending" status. */
  pending_edit_submitted_at?: string | null;
};

type ItemStatusValue = "approved" | "rejected" | "needs_revision";
type StepAction = "approved" | "needs_revision" | "rejected" | "";

export type ModerationReview = {
  // Step 1 — Basics
  basics_field_statuses: Record<string, ItemStatusValue>;
  basics_action: StepAction;
  basics_comment: string;
  // Step 2 — Content
  content_item_statuses: Record<string, ItemStatusValue>;
  content_action: StepAction;
  content_comment: string;
  // Step 3 — Review & Publish
  final_action: StepAction;
  final_comment: string;
  updated_at: string;
};

/** Immutable snapshot record created when a course is rejected. Independent of course status. */
export type RejectedCourseRecord = {
  id: number;
  course_slug: string;
  course_title: string;
  course_image_url: string | null;
  course_category: string;
  course_level: string;
  /** For pending-edit rejections: which fields the teacher changed. Empty for initial rejections. */
  changed_fields: string[];
  basics_field_statuses: Record<string, ItemStatusValue>;
  basics_action: StepAction;
  basics_comment: string;
  content_item_statuses: Record<string, ItemStatusValue>;
  content_action: StepAction;
  content_comment: string;
  final_action: StepAction;
  final_comment: string;
  rejected_at: string;
};

/** Immutable snapshot record created when a course is approved. */
export type ApprovedCourseRecord = {
  id: number;
  course_slug: string;
  course_title: string;
  course_image_url: string | null;
  course_category: string;
  course_level: string;
  /** For pending-edit approvals: which fields the teacher changed. Empty for initial approvals. */
  changed_fields: string[];
  approved_at: string;
};

export type RejectedCourseItem = CourseListItem & {
  moderator_comment: string;
  moderation_review: ModerationReview | null;
};

export type CourseDetail = Omit<
  CourseListItem,
  "teacher_name" | "price" | "original_price" | "currency"
> & {
  /** Course-specific pull-quote. Belongs on the course, not the teacher (one teacher, many courses). */
  quote: string | null;
  full_description: string;
  /** Content hash of the course image, if any — see the moderator review diff logic
   *  for why this exists (cloning gives byte-identical images different URLs). */
  image_hash: string | null;
  /** Minimum weighted average grade (0-100) required to pass the course. */
  passing_score: number;
  /** Blurb printed on the certificate PDF. Required before with_certificate can be enabled. */
  certificate_description: string;
  teacher: Teacher;
  moderator_id: number | null;
  moderator_comment: string;
  total_duration_minutes: number;
  /** True when the current authenticated user is enrolled. False for anonymous users. */
  is_enrolled: boolean;
  /**
   * Course-wide group chat URL (Telegram, Discord, Slack, etc.). Surfaced as the
   * "Group chat" CTA inside the lesson player. Null when the course doesn't run
   * a community channel. Backend must return null for non-enrolled users.
   */
  group_chat_url: string | null;
  /** Delivery format configs, each optionally with a nested pricing plan. */
  delivery_formats: CourseDeliveryFormat[];
  /** Empty array when no cohorts are scheduled. */
  cohorts: CourseCohort[];
  modules: CourseModule[];
  created_at: string;
  updated_at: string;
  /** Present when the course is in needs_revision status. Null otherwise. */
  moderation_review: ModerationReview | null;
};
