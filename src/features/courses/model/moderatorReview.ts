import type { CSSProperties } from "react";
import type { CourseDetail, CourseModule } from "@/entities/course";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export type ModeratorAction = "approved" | "needs_revision" | "rejected" | null;
export type ItemStatus = "approved" | "rejected" | "needs_revision" | null;
export type ItemStatuses = Record<string, ItemStatus>;

export const ITEM_CYCLE: ItemStatus[] = [null, "approved", "needs_revision", "rejected"];

export const BASICS_FIELD_KEYS = [
  "field-title",
  "field-short-description",
  "field-full-description",
  "field-icon",
  "field-category",
  "field-level",
];

type Translator = (key: string, values?: Record<string, string | number>) => string;

/** Build the SUBMIT_LABEL map from a `ModerationNavButtons` translator. */
export function getSubmitLabels(t: Translator): Record<NonNullable<ModeratorAction>, string> {
  return {
    approved:       t("submitApproved"),
    needs_revision: t("submitNeedsRevision"),
    rejected:       t("submitRejected"),
  };
}

/** Build the CONTENT_ACTIONS list from a `CourseBasicsForm` translator (shares its status labels). */
export function getContentActions(
  t: Translator,
): { key: NonNullable<ItemStatus>; label: string; color: string }[] {
  return [
    { key: "approved",       label: t("statusApproved"),      color: "var(--color-success)" },
    { key: "rejected",       label: t("statusRejected"),       color: "var(--color-rejected)" },
    { key: "needs_revision", label: t("statusNeedsRevision"), color: "var(--color-warning)" },
  ];
}

export type StepProps = {
  course: CourseDetail | null;
  /** The hidden draft course being edited, when reviewing a pending edit on a published course. */
  draftCourse: CourseDetail | null;
  lockedKeys: Set<string>;
  moduleList: CourseModule[];
  action: ModeratorAction;
  comment: string;
  finalComment: string;
  submitting: boolean;
  error: string;
  step: 0 | 1 | 2;
  itemStatuses: ItemStatuses;
  hasAnyFlagged: boolean;
  allApproved: boolean;
  contentNote: string;
  basicsAction: ItemStatus;
  contentAction: ItemStatus;
  onActionChange: (a: ModeratorAction) => void;
  onCommentChange: (v: string) => void;
  onFinalCommentChange: (v: string) => void;
  onItemStatusToggle: (key: string) => void;
  onContentNoteChange: (v: string) => void;
  onBasicsActionChange: (s: ItemStatus) => void;
  onContentActionChange: (s: ItemStatus) => void;
  onNext: () => void;
  onBack: () => void;
  onSubmit: () => void;
  router: AppRouterInstance;
  courseSlug: string;
};

/** Auto-compute section action from a list of item statuses.
 *  Priority: needs_revision > rejected > approved. Returns null if nothing rated yet. */
export function computeSectionAction(statuses: (ItemStatus | null)[]): ItemStatus | null {
  const rated = statuses.filter((s): s is NonNullable<ItemStatus> => s !== null);
  if (rated.length === 0) return null;
  if (rated.some((s) => s === "needs_revision")) return "needs_revision";
  if (rated.some((s) => s === "rejected"))       return "rejected";
  return "approved";
}

/** Auto-compute the final moderator action from the two section actions.
 *  approved+approved=approved | rejected+rejected=rejected | anything else=needs_revision. */
export function computeFinalAction(basics: ItemStatus | null, content: ItemStatus | null): ModeratorAction {
  if (basics === null || content === null) return null;
  if (basics === "approved" && content === "approved") return "approved";
  if (basics === "rejected" && content === "rejected") return "rejected";
  return "needs_revision";
}

export const bodyFont = "var(--font-base)";
export const monoFont = "var(--font-accent)";

export const labelSt: CSSProperties = {
  display: "block",
  fontFamily: bodyFont,
  fontWeight: 700,
  fontSize: "clamp(14px, 1.04vw, 20px)",
  color: "var(--color-text-primary)",
  marginBottom: "clamp(8px, 0.63vw, 12px)",
};

export const valueSt: CSSProperties = {
  width: "100%",
  borderRadius: 12,
  border: "none",
  padding: "clamp(12px, 0.83vw, 16px)",
  fontSize: "clamp(14px, 1.04vw, 20px)",
  fontFamily: bodyFont,
  color: "var(--color-text-primary)",
  background: "var(--color-input-bg)",
};

export const valueWithBadgeSt: CSSProperties = {
  ...valueSt,
  paddingRight: "clamp(56px, 4.5vw, 72px)",
};

export const metaSt: CSSProperties = {
  fontFamily: bodyFont,
  fontWeight: 700,
  fontSize: 14,
  lineHeight: "18px",
  whiteSpace: "nowrap",
};

export const sectionTitleSt: CSSProperties = {
  fontFamily: bodyFont,
  fontWeight: 700,
  fontSize: "clamp(16px, 1.39vw, 20px)",
  color: "var(--color-text-primary)",
};
