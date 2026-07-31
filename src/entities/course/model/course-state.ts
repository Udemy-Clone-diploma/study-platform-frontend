import type { CourseListItem, CourseStatus } from "./types";

export type CourseStateTone = "neutral" | "info" | "attention" | "danger" | "success";

export type CourseStateActor = "teacher" | "moderator" | "nobody";

export type CourseStateKey =
  | "draft"
  | "review"
  | "needs_revision"
  | "rejected"
  | "published"
  | "hidden"
  | "archived"
  | "pending_edit"
  | "edit_draft"
  | "edit_review"
  | "edit_needs_revision";

export type CourseState = {
  key: CourseStateKey;
  label: string;
  description: string;
  tone: CourseStateTone;
  waitingOn: CourseStateActor;
};

export const COURSE_STATE_TONE_COLOR: Record<CourseStateTone, string> = {
  neutral: "var(--color-text-secondary)",
  info: "var(--color-blue)",
  attention: "var(--color-warning)",
  danger: "var(--color-rejected)",
  success: "var(--color-success)",
};

const LIFECYCLE_STATES: Record<CourseStateKey, CourseState> = {
  draft: {
    key: "draft",
    label: "Draft",
    description: "Not submitted yet. The teacher is still working on it.",
    tone: "neutral",
    waitingOn: "teacher",
  },
  review: {
    key: "review",
    label: "Under moderation",
    description: "Submitted by the teacher and waiting for a moderator to review it.",
    tone: "info",
    waitingOn: "moderator",
  },
  needs_revision: {
    key: "needs_revision",
    label: "Returned for revision",
    description:
      "A moderator reviewed it and sent it back to the teacher with changes to make. Waiting on the teacher.",
    tone: "attention",
    waitingOn: "teacher",
  },
  rejected: {
    key: "rejected",
    label: "Rejected",
    description: "A moderator rejected this course. The decision is final and recorded.",
    tone: "danger",
    waitingOn: "nobody",
  },
  published: {
    key: "published",
    label: "Published",
    description: "Live in the catalog and open for enrolment.",
    tone: "success",
    waitingOn: "nobody",
  },
  hidden: {
    key: "hidden",
    label: "Hidden",
    description: "Not listed in the catalog. Already-enrolled students keep their access.",
    tone: "neutral",
    waitingOn: "nobody",
  },
  archived: {
    key: "archived",
    label: "Archived",
    description: "Closed. Enrolled students no longer have access to the content.",
    tone: "neutral",
    waitingOn: "nobody",
  },
  pending_edit: {
    key: "pending_edit",
    label: "Pending edit",
    description: "Hidden shadow copy holding a teacher's edits to a published course.",
    tone: "neutral",
    waitingOn: "teacher",
  },
  edit_draft: {
    key: "edit_draft",
    label: "Published · edit in progress",
    description:
      "The live course is unchanged. The teacher has saved edits that have not been submitted for moderation yet.",
    tone: "info",
    waitingOn: "teacher",
  },
  edit_review: {
    key: "edit_review",
    label: "Published · edit under moderation",
    description:
      "The live course is unchanged. The teacher's edits are waiting for a moderator to review them.",
    tone: "info",
    waitingOn: "moderator",
  },
  edit_needs_revision: {
    key: "edit_needs_revision",
    label: "Published · edit returned",
    description:
      "The live course is unchanged. A moderator returned the teacher's edits with changes to make.",
    tone: "attention",
    waitingOn: "teacher",
  },
};

type CourseStateInput = {
  status: CourseStatus;
  pending_edit_status?: CourseListItem["pending_edit_status"];
};

const EDIT_STATE_KEY = {
  draft: "edit_draft",
  pending: "edit_review",
  needs_revision: "edit_needs_revision",
} as const;

/**
 * Single source of truth for what a course's status means to a reader.
 * Resolves both axes — the course lifecycle and the pending-edit track of a
 * live course — into one labelled, explained state.
 */
export function deriveCourseState(course: CourseStateInput): CourseState {
  const { status, pending_edit_status } = course;

  if ((status === "published" || status === "hidden") && pending_edit_status) {
    return LIFECYCLE_STATES[EDIT_STATE_KEY[pending_edit_status]];
  }

  return LIFECYCLE_STATES[status as CourseStateKey] ?? LIFECYCLE_STATES.draft;
}

/** Colour token for a resolved state, matching its tone. */
export function courseStateColor(state: CourseState): string {
  return COURSE_STATE_TONE_COLOR[state.tone];
}
