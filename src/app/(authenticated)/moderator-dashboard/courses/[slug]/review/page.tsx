"use client";

import { useState, useEffect, useMemo } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowRight, ArrowUpRight,
  ChevronDown, Play, Eye, Save,
} from "lucide-react";
import { AccentButton } from "@/shared/ui/AccentButton";
import { GradientButton } from "@/shared/ui/GradientButton";
import {
  getCourseBySlug, approveCourse, rejectCourse, saveReviewDraft,
  approvePendingEdit, rejectPendingEdit, getPendingEdit,
} from "@/entities/course";
import type { CoursePendingEdit, SnapshotModule } from "@/entities/course";
import type { CourseDetail, CourseModule, CourseLesson } from "@/entities/course";
import { CourseCreationLayout, CourseCreationStepper, LessonFormModal, CourseStatsGrid } from "@/features/courses";
import { SectionCard } from "@/shared/ui/SectionCard";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { ApiError } from "@/shared/api/base";

const STEPS = [
  { name: "Basics",           sub: "Course information"       },
  { name: "Course Content",   sub: "Modules, lessons & tests"  },
  { name: "Review & Publish", sub: "Launch course"             },
];

type ModeratorAction = "approved" | "needs_revision" | "rejected" | null;

/** Auto-compute section action from a list of item statuses.
 *  Priority: needs_revision > rejected > approved. Returns null if nothing rated yet. */
function computeSectionAction(statuses: (ItemStatus | null)[]): ItemStatus | null {
  const rated = statuses.filter((s): s is NonNullable<ItemStatus> => s !== null);
  if (rated.length === 0) return null;
  if (rated.some((s) => s === "needs_revision")) return "needs_revision";
  if (rated.some((s) => s === "rejected"))       return "rejected";
  return "approved";
}

/** Auto-compute the final moderator action from the two section actions.
 *  approved+approved=approved | rejected+rejected=rejected | anything else=needs_revision. */
function computeFinalAction(basics: ItemStatus | null, content: ItemStatus | null): ModeratorAction {
  if (basics === null || content === null) return null;
  if (basics === "approved" && content === "approved") return "approved";
  if (basics === "rejected" && content === "rejected") return "rejected";
  return "needs_revision";
}

const OVERALL_ACTIONS: { key: NonNullable<ModeratorAction>; label: string; icon: ReactNode; color: string }[] = [
  { key: "approved",       label: "Approved",          color: "var(--color-success)",
    // eslint-disable-next-line @next/next/no-img-element
    icon: <img src="/icons/yes.svg"    alt="" width={16} height={16} style={{ width: 16, height: 16 }} /> },
  { key: "needs_revision", label: "Requires Revision", color: "var(--color-warning)",
    // eslint-disable-next-line @next/next/no-img-element
    icon: <img src="/icons/refine.svg" alt="" width={14} height={14} style={{ width: 14, height: 14 }} /> },
  { key: "rejected",       label: "Rejected",          color: "var(--color-rejected)",
    // eslint-disable-next-line @next/next/no-img-element
    icon: <img src="/icons/no.svg"     alt="" width={16} height={16} style={{ width: 16, height: 16 }} /> },
];

const SUBMIT_LABEL: Record<NonNullable<ModeratorAction>, string> = {
  approved:       "Approve & Publish",
  needs_revision: "Send for revision",
  rejected:       "Reject course",
};

type ItemStatus = "approved" | "rejected" | "needs_revision" | null;
type ItemStatuses = Record<string, ItemStatus>;

const ITEM_CYCLE: ItemStatus[] = [null, "approved", "needs_revision", "rejected"];

const CONTENT_ACTIONS: { key: NonNullable<ItemStatus>; label: string; color: string }[] = [
  { key: "approved",       label: "Approved",          color: "var(--color-success)" },
  { key: "rejected",       label: "Rejected",          color: "var(--color-rejected)" },
  { key: "needs_revision", label: "Requires Revision", color: "var(--color-warning)" },
];

const bodyFont = "var(--font-base)";
const monoFont = "var(--font-accent)";

const labelSt: CSSProperties = {
  display: "block",
  fontFamily: bodyFont,
  fontWeight: 700,
  fontSize: "clamp(14px, 1.04vw, 20px)",
  color: "var(--color-text-primary)",
  marginBottom: "clamp(8px, 0.63vw, 12px)",
};

const valueSt: CSSProperties = {
  width: "100%",
  borderRadius: 12,
  border: "none",
  padding: "clamp(12px, 0.83vw, 16px)",
  fontSize: "clamp(14px, 1.04vw, 20px)",
  fontFamily: bodyFont,
  color: "var(--color-text-primary)",
  background: "var(--color-input-bg)",
};

const valueWithBadgeSt: CSSProperties = {
  ...valueSt,
  paddingRight: "clamp(56px, 4.5vw, 72px)",
};

const metaSt: CSSProperties = {
  fontFamily: bodyFont,
  fontWeight: 700,
  fontSize: 14,
  lineHeight: "18px",
  whiteSpace: "nowrap",
};

const sectionTitleSt: CSSProperties = {
  fontFamily: bodyFont,
  fontWeight: 700,
  fontSize: "clamp(16px, 1.39vw, 20px)",
  color: "var(--color-text-primary)",
};

function ItemStatusBadge({ status, onClick, locked = false }: { status: ItemStatus; onClick: () => void; locked?: boolean }) {
  return (
    <button
      type="button"
      onClick={locked ? undefined : onClick}
      title={locked ? "Auto-approved (unchanged)" : "Click to change status"}
      style={{ background: "transparent", border: "none", cursor: locked ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, flexShrink: 0, width: 40, height: 40, opacity: locked ? 0.45 : 1 }}
      aria-label={locked ? "Auto-approved" : "Toggle item status"}
    >
      {status === "approved" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/icons/yes.svg" alt="approved" width={40} height={40} style={{ width: 40, height: 40 }} />
      )}
      {status === "rejected" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/icons/no.svg" alt="rejected" width={40} height={40} style={{ width: 40, height: 40 }} />
      )}
      {status === "needs_revision" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/icons/refine.svg" alt="needs revision" width={22} height={22} style={{ width: 22, height: 22 }} />
      )}
      {status === null && (
        <span style={{ width: 22, height: 22, borderRadius: "50%", border: "1.5px dashed var(--color-draft)", display: "block" }} />
      )}
    </button>
  );
}

function ModeratorLessonRow({ lesson, index, status, onToggle, onView, locked = false }: {
  lesson: CourseLesson;
  index: number;
  status: ItemStatus;
  onToggle: () => void;
  onView: () => void;
  locked?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between"
      style={{ background: "var(--color-bg)", border: "2px solid var(--color-border-light)", borderRadius: 16, padding: "clamp(20px, 1.67vw, 24px) clamp(24px, 2.22vw, 32px)" }}
    >
      <div className="flex min-w-0 items-center" style={{ gap: "clamp(8px, 0.83vw, 16px)" }}>
        <span style={{ fontFamily: bodyFont, fontWeight: 400, fontSize: "clamp(16px, 1.39vw, 20px)", color: "var(--color-text-secondary)", flexShrink: 0 }}>
          {index + 1}.
        </span>
        <span style={{ fontFamily: bodyFont, fontWeight: 600, fontSize: "clamp(16px, 1.39vw, 20px)", color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {lesson.title}
        </span>
      </div>
      <div className="flex items-center" style={{ gap: 8, flexShrink: 0, opacity: locked ? 0.6 : 1 }}>
        <button type="button" onClick={onView} title="View lesson"
          style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: 4, borderRadius: 8, color: "var(--color-text-secondary)" }}
          className="transition hover:text-(--color-text-primary)">
          <Eye size={18} />
        </button>
        <ItemStatusBadge status={status} onClick={onToggle} locked={locked} />
      </div>
    </div>
  );
}

function ModeratorModuleCard({ module, index, itemStatuses, onItemToggle, lockedKeys = new Set(), readOnly = false, courseSlug }: {
  module: CourseModule;
  index: number;
  itemStatuses: ItemStatuses;
  onItemToggle: (key: string) => void;
  lockedKeys?: Set<string>;
  readOnly?: boolean;
  courseSlug?: string;
}) {
  const [open, setOpen] = useState(true);
  const [viewLesson, setViewLesson] = useState<CourseLesson | null>(null);
  const lessonCount = module.lessons.length;

  return (
    <div style={{ background: "var(--color-bg)", border: "1px solid var(--color-border-light)", borderRadius: 16, padding: "clamp(14px, 1.04vw, 20px) clamp(16px, 1.25vw, 24px)" }}>
      <div className="flex items-center justify-between" style={{ gap: 8 }}>
        <div className="flex min-w-0 items-center" style={{ gap: 8 }}>
          <span style={{ ...metaSt, color: "var(--color-text-secondary)", flexShrink: 0 }}>Module {index + 1}</span>
          <span style={{ ...metaSt, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis" }}>{module.title}</span>
          <span className="flex shrink-0 items-center" style={{ gap: 4 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/book.svg" alt="" width={16} height={16} style={{ width: 16, height: 16, flexShrink: 0 }} />
            <span style={{ ...metaSt, color: "var(--color-text-secondary)" }}>{lessonCount} lessons</span>
          </span>
        </div>
        <button type="button" onClick={() => setOpen((v) => !v)}
          className="flex shrink-0 items-center justify-center rounded-full transition hover:bg-gray-100"
          style={{ width: 40, height: 40 }} aria-label={open ? "Collapse" : "Expand"}>
          <ChevronDown size={20} style={{ color: "var(--color-text-primary)", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
        </button>
      </div>

      {/* Lessons only: tests live inside lesson content blocks */}
      {open && (
        <div style={{ marginTop: "clamp(16px, 1.25vw, 24px)", display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="flex items-center" style={{ gap: 8 }}>
            <Play size={20} style={{ color: "var(--color-text-primary)", flexShrink: 0 }} />
            <span style={sectionTitleSt}>Lessons</span>
          </div>
          {lessonCount === 0 ? (
            <p style={{ fontFamily: bodyFont, color: "var(--color-text-secondary)", fontSize: 15 }}>No lessons.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "clamp(8px, 0.52vw, 10px)" }}>
              {module.lessons.map((lesson, i) => {
                const key = `lesson-${lesson.id}`;
                return readOnly
                  ? (
                    <div key={lesson.id} className="flex items-center justify-between"
                      style={{ background: "var(--color-bg)", border: "2px solid var(--color-border-light)", borderRadius: 16, padding: "clamp(20px, 1.67vw, 24px) clamp(24px, 2.22vw, 32px)" }}>
                      <span style={{ fontFamily: bodyFont, fontWeight: 600, fontSize: "clamp(16px, 1.39vw, 20px)", color: "var(--color-text-primary)" }}>{i + 1}. {lesson.title}</span>
                    </div>
                  )
                  : (
                    <ModeratorLessonRow key={lesson.id} lesson={lesson} index={i}
                      status={itemStatuses[key] ?? null}
                      onToggle={() => onItemToggle(key)}
                      onView={() => setViewLesson(lesson)}
                      locked={lockedKeys.has(key)}
                    />
                  );
              })}
            </div>
          )}
        </div>
      )}

      {viewLesson && (
        <LessonFormModal
          mode="view"
          onClose={() => setViewLesson(null)}
          initialValues={{
            title: viewLesson.title,
            duration_minutes: viewLesson.duration_minutes?.toString() ?? "",
            min_score: viewLesson.min_score?.toString() ?? "",
            existing_documents: viewLesson.documents ?? [],
            new_documents: [],
            deleted_document_ids: [],
            items: viewLesson.items ?? [],
          }}
          courseSlug={courseSlug}
          moduleId={module.id}
          lessonId={viewLesson.id}
        />
      )}
    </div>
  );
}

function NoteActionBlock({ note, onNoteChange, itemAction, onItemActionChange, onSave, title = "Section action" }: {
  note: string;
  onNoteChange: (v: string) => void;
  itemAction: ItemStatus;
  onItemActionChange: (s: ItemStatus) => void;
  onSave: () => void;
  title?: string;
}) {
  const [isEditing, setIsEditing] = useState(!note);

  function handleChange(value: string) {
    onNoteChange(value);
  }

  function handleSave() {
    onSave();
    setIsEditing(false);
  }

  function handleEdit() {
    setIsEditing(true);
  }

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", width: "100%", maxWidth: 880 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 16, border: "1px solid var(--color-pink-dark)", borderRadius: 20, padding: "28px 34px" }}>
          {isEditing ? (
            <textarea
              autoFocus
              value={note}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="Take a note"
              style={{ flex: 1, minHeight: 360, resize: "none", border: "none", outline: "none", fontFamily: bodyFont, fontWeight: 400, fontSize: 16, lineHeight: "20px", color: note ? "var(--color-text-primary)" : "var(--color-draft)" }}
            />
          ) : (
            <div style={{ flex: 1, minHeight: 360, fontFamily: bodyFont, fontWeight: 400, fontSize: 16, lineHeight: "20px", color: note ? "var(--color-text-primary)" : "var(--color-draft)", whiteSpace: "pre-wrap" }}>
              {note || "Take a note"}
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "center" }}>
            {isEditing ? (
              <button type="button" onClick={handleSave}
                style={{ background: "var(--color-text-primary)", color: "white", borderRadius: 28, padding: "10px 28px", minWidth: 200, height: 52, fontFamily: monoFont, fontWeight: 500, fontSize: 20, lineHeight: "150%", textTransform: "uppercase", border: "none", cursor: note.trim() ? "pointer" : "default", opacity: note.trim() ? 1 : 0.6, transition: "opacity 0.2s" }}>
                Save
              </button>
            ) : (
              <button type="button" onClick={handleEdit}
                style={{ background: "transparent", color: "var(--color-text-secondary)", borderRadius: 28, padding: "10px 28px", minWidth: 200, height: 52, fontFamily: monoFont, fontWeight: 500, fontSize: 20, lineHeight: "150%", textTransform: "uppercase", border: "1px solid var(--color-draft)", cursor: "pointer" }}>
                Edit
              </button>
            )}
          </div>
        </div>

        {/* Action panel */}
        <div style={{ width: 274, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-start", padding: "28px 34px", gap: 12, border: "1px solid var(--color-pink-dark)", borderRadius: 20 }}>
          <span style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 16, lineHeight: "20px", width: "100%", textAlign: "center" }}>{title}</span>
          <span style={{ fontFamily: bodyFont, fontWeight: 500, fontSize: 15, lineHeight: "19px", color: "var(--color-text-secondary)", width: "100%", textAlign: "center" }}>Select a status:</span>
          {CONTENT_ACTIONS.map(({ key, label, color }) => {
            const isActive = itemAction === key;
            return (
              <button key={key} type="button" onClick={() => onItemActionChange(isActive ? null : key)}
                style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: "2px 12px", width: "100%", height: 23, background: "white", border: `1px solid ${isActive ? color : "var(--color-draft)"}`, borderRadius: 20, cursor: "pointer", fontFamily: monoFont, fontWeight: 500, fontSize: 15, lineHeight: "19px", color: isActive ? color : "var(--color-text-secondary)", transition: "border-color 0.2s, color 0.2s" }}>
                <span>{label}</span>
                {key === "approved" && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src="/icons/yes.svg" alt="" width={16} height={16} style={{ width: 16, height: 16, opacity: isActive ? 1 : 0.35 }} />
                )}
                {key === "rejected" && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src="/icons/no.svg" alt="" width={16} height={16} style={{ width: 16, height: 16, opacity: isActive ? 1 : 0.35 }} />
                )}
                {key === "needs_revision" && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src="/icons/refine.svg" alt="" width={14} height={14} style={{ width: 14, height: 14, opacity: isActive ? 1 : 0.35 }} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

type StepProps = {
  course: CourseDetail | null;
  pendingEdit: CoursePendingEdit | null;
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

function NavButtons({ step, action, hasAnyFlagged, canContinue = true, submitting, error, onNext, onBack, onSubmit, router }: Pick<StepProps, "step" | "action" | "hasAnyFlagged" | "submitting" | "error" | "onNext" | "onBack" | "onSubmit" | "router"> & { canContinue?: boolean }) {
  const isLast = step === 2;
  const effectiveAction: ModeratorAction = hasAnyFlagged && action === "approved" ? "needs_revision" : action;
  const submitLabel = effectiveAction ? SUBMIT_LABEL[effectiveAction] : "Select an action";
  const actionColor = effectiveAction === "approved"       ? "var(--gradient-brand)"
    : effectiveAction === "needs_revision" ? "var(--color-brand-yellow)"
    : effectiveAction === "rejected"       ? "#FF383C"
    : "var(--color-draft)";

  return (
    <div className="flex items-center justify-between" style={{ marginTop: "clamp(8px, 0.83vw, 16px)" }}>
      {step > 0 ? (
        <button type="button" onClick={onBack} className="inline-flex items-center transition hover:opacity-80"
          style={{ gap: 10, border: "1px solid var(--color-draft)", borderRadius: 28, padding: "4px 16px", background: "var(--color-bg)", fontFamily: monoFont, fontWeight: 500, fontSize: "clamp(13px, 1.04vw, 20px)", cursor: "pointer", height: 44 }}>
          <ArrowLeft size={18} /> Back
        </button>
      ) : (
        <button type="button" onClick={() => router.push("/moderator-dashboard/courses")} className="inline-flex items-center transition hover:opacity-80"
          style={{ gap: 10, border: "1px solid var(--color-draft)", borderRadius: 28, padding: "4px 16px", background: "var(--color-bg)", fontFamily: monoFont, fontWeight: 500, fontSize: "clamp(13px, 1.04vw, 20px)", cursor: "pointer", height: 44 }}>
          <ArrowLeft size={18} /> Back to courses
        </button>
      )}

      {isLast ? (
        <div className="flex items-center" style={{ gap: 12 }}>
          {hasAnyFlagged && action === "approved" && (
            <span style={{ fontFamily: bodyFont, fontSize: 13, color: "var(--color-brand-yellow)" }}>
              Some items are flagged — will send for revision
            </span>
          )}
          {error && <span style={{ fontFamily: bodyFont, fontSize: 14, color: "var(--color-pink-dark)" }}>{error}</span>}
          <button type="button" disabled={!action || submitting} onClick={onSubmit}
            style={{ background: action ? actionColor : "var(--color-draft)", borderRadius: 28, padding: "clamp(8px, 0.83vw, 12px) clamp(16px, 1.94vw, 28px)", fontFamily: monoFont, fontWeight: 600, fontSize: "clamp(13px, 1.04vw, 20px)", cursor: action && !submitting ? "pointer" : "not-allowed", border: "none", opacity: !action || submitting ? 0.45 : 1, transition: "opacity 0.2s" }}>
            {submitting ? "Submitting…" : submitLabel}
          </button>
        </div>
      ) : (
        <GradientButton type="button" disabled={!canContinue} onClick={onNext}
          style={{ gap: "clamp(8px, 0.83vw, 12px)" }}>
          Continue <ArrowRight size={18} />
        </GradientButton>
      )}
    </div>
  );
}

function FieldRow({ fieldKey, label, children, itemStatuses, onItemStatusToggle, locked = false }: {
  fieldKey: string;
  label: string;
  children: React.ReactNode;
  itemStatuses: ItemStatuses;
  onItemStatusToggle: (key: string) => void;
  locked?: boolean;
}) {
  return (
    <div style={{ opacity: locked ? 0.6 : 1 }}>
      <span style={labelSt}>{label}</span>
      <div style={{ position: "relative" }}>
        {children}
        <div style={{ position: "absolute", right: "clamp(10px, 0.83vw, 16px)", top: "50%", transform: "translateY(-50%)" }}>
          <ItemStatusBadge status={itemStatuses[fieldKey] ?? null} onClick={() => onItemStatusToggle(fieldKey)} locked={locked} />
        </div>
      </div>
    </div>
  );
}


const BASICS_FIELD_KEYS = ["field-title", "field-short-description", "field-full-description", "field-icon", "field-category", "field-level", "field-price"];

function BasicsStep(props: StepProps) {
  const { course, pendingEdit, lockedKeys, action, comment, submitting, error, step, hasAnyFlagged, itemStatuses,
          onActionChange, onCommentChange, onItemStatusToggle, basicsAction, onBasicsActionChange,
          onNext, onBack, onSubmit, router } = props;
  void onActionChange; void onCommentChange;

  // For pending edits, show proposed values for changed fields
  const pe = pendingEdit;
  const displayTitle     = (!lockedKeys.has("field-title")             && pe?.title)             || course?.title             || "—";
  const displayShortDesc = (!lockedKeys.has("field-short-description") && pe?.short_description) || course?.short_description || "—";
  const displayFullDesc  = (!lockedKeys.has("field-full-description")  && pe?.full_description)  || course?.full_description  || "—";
  const displayImage    = (!lockedKeys.has("field-icon")        && pe?.image)             ?? course?.image ?? null;
  const displayCategory = !lockedKeys.has("field-category") && pe
    ? (pe.category_id != null ? `Category #${pe.category_id}` : "—")
    : (course?.category?.name ?? "—");
  const displayLevel    = (!lockedKeys.has("field-level") && pe?.level) ?? course?.level ?? "";

  const priceValue   = course?.pricing_plans?.length ? `${course.pricing_plans[0].price}` : "";
  const levelLabel   = displayLevel ? displayLevel.charAt(0).toUpperCase() + displayLevel.slice(1) : "—";

  const canContinue =
    BASICS_FIELD_KEYS.every((k) => (itemStatuses[k] ?? null) !== null) &&
    basicsAction !== null;


  return (
    <div className="rounded-2xl bg-white" style={{ padding: "clamp(24px, 2.08vw, 40px) clamp(24px, 2.6vw, 50px)", boxShadow: "var(--shadow-dashboard-card)", display: "flex", flexDirection: "column", gap: "clamp(16px, 1.25vw, 24px)" }}>
      <div>
        <h2 style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: "clamp(20px, 1.875vw, 36px)", marginBottom: "clamp(4px, 0.42vw, 8px)" }}>Basics</h2>
        <p style={{ fontFamily: bodyFont, fontWeight: 500, fontSize: "clamp(13px, 1.04vw, 20px)", letterSpacing: "-0.011em", color: "var(--color-text-secondary)" }}>
          Course information — review and mark each field
        </p>
      </div>

      <SectionCard>
        <p style={{ fontFamily: bodyFont, fontSize: "clamp(14px, 1.25vw, 24px)", marginBottom: "clamp(14px, 1.04vw, 20px)" }}>
          Course information
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "clamp(14px, 1.25vw, 20px)" }}>

          {/* Course Title */}
          <FieldRow fieldKey="field-title" label="Course Title*" itemStatuses={itemStatuses} onItemStatusToggle={onItemStatusToggle} locked={lockedKeys.has("field-title")}>
            <div style={valueWithBadgeSt}>{displayTitle}</div>
          </FieldRow>

          {/* Short Description */}
          <FieldRow fieldKey="field-short-description" label="Short Description*" itemStatuses={itemStatuses} onItemStatusToggle={onItemStatusToggle} locked={lockedKeys.has("field-short-description")}>
            <div style={valueWithBadgeSt}>{displayShortDesc}</div>
          </FieldRow>

          {/* Full Description */}
          <FieldRow fieldKey="field-full-description" label="Full Description*" itemStatuses={itemStatuses} onItemStatusToggle={onItemStatusToggle} locked={lockedKeys.has("field-full-description")}>
            <div style={{ ...valueWithBadgeSt, whiteSpace: "pre-wrap" }}>{displayFullDesc}</div>
          </FieldRow>

          {/* Course Icon */}
          <FieldRow fieldKey="field-icon" label="Course Icon*" itemStatuses={itemStatuses} onItemStatusToggle={onItemStatusToggle} locked={lockedKeys.has("field-icon")}>
            <div style={{ ...valueWithBadgeSt, display: "flex", alignItems: "center", gap: 12 }}>
              {displayImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={displayImage} alt="course icon" style={{ width: "clamp(44px, 4.06vw, 78px)", height: "clamp(44px, 4.06vw, 78px)", objectFit: "contain", flexShrink: 0 }} />
              ) : (
                <span style={{ color: "var(--color-text-secondary)", fontStyle: "italic" }}>No image</span>
              )}
            </div>
          </FieldRow>

          {/* Category + Level */}
          <div className="grid grid-cols-2" style={{ gap: "clamp(16px, 2.08vw, 40px)" }}>
            <FieldRow fieldKey="field-category" label="Category*" itemStatuses={itemStatuses} onItemStatusToggle={onItemStatusToggle} locked={lockedKeys.has("field-category")}>
              <div style={valueWithBadgeSt}>{displayCategory}</div>
            </FieldRow>
            <FieldRow fieldKey="field-level" label="Level*" itemStatuses={itemStatuses} onItemStatusToggle={onItemStatusToggle} locked={lockedKeys.has("field-level")}>
              <div style={valueWithBadgeSt}>{levelLabel}</div>
            </FieldRow>
          </div>

          {/* Price: always locked for pending edits (pricing not tracked in pending edit) */}
          <FieldRow fieldKey="field-price" label="Price (EUR)" itemStatuses={itemStatuses} onItemStatusToggle={onItemStatusToggle} locked={lockedKeys.has("field-price")}>
            <span style={{ position: "absolute", left: "clamp(12px, 0.83vw, 16px)", top: "50%", transform: "translateY(-50%)", fontSize: "clamp(14px, 1.04vw, 20px)", fontFamily: bodyFont, color: "var(--color-text-secondary)", pointerEvents: "none", zIndex: 1 }} aria-hidden="true">€</span>
            <div style={{ ...valueWithBadgeSt, paddingLeft: "clamp(28px, 2.08vw, 36px)" }}>{priceValue || "Free"}</div>
          </FieldRow>


        </div>
      </SectionCard>

      <NoteActionBlock note={comment} onNoteChange={onCommentChange} itemAction={basicsAction} onItemActionChange={onBasicsActionChange} onSave={() => {}} title="Section action" />

      <NavButtons step={step} action={action} hasAnyFlagged={hasAnyFlagged} canContinue={canContinue} submitting={submitting} error={error} onNext={onNext} onBack={onBack} onSubmit={onSubmit} router={router} />
    </div>
  );
}

function ContentStep(props: StepProps) {
  const { moduleList, lockedKeys, action, submitting, error, step, hasAnyFlagged, itemStatuses, contentNote,
          contentAction, onActionChange, onItemStatusToggle, onContentNoteChange, onContentActionChange,
          onNext, onBack, onSubmit, router, courseSlug } = props;
  void onActionChange;

  const allItemKeys = moduleList.flatMap((m) => m.lessons.map((l) => `lesson-${l.id}`));
  const canContinue =
    (allItemKeys.length === 0 || allItemKeys.every((k) => (itemStatuses[k] ?? null) !== null)) &&
    contentAction !== null;

  return (
    <div className="rounded-2xl bg-white" style={{ padding: "clamp(24px, 2.08vw, 40px) clamp(24px, 2.6vw, 50px)", boxShadow: "var(--shadow-dashboard-card)", display: "flex", flexDirection: "column", gap: "clamp(16px, 1.25vw, 24px)" }}>
      <div>
        <h2 style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: "clamp(20px, 1.875vw, 36px)", marginBottom: "clamp(4px, 0.42vw, 8px)" }}>Course Content</h2>
        <p style={{ fontFamily: bodyFont, fontWeight: 500, fontSize: "clamp(13px, 1.04vw, 20px)", letterSpacing: "-0.011em", color: "var(--color-text-secondary)" }}>
          Modules, lessons &amp; tests — click the circle to mark each item
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "clamp(10px, 0.83vw, 16px)" }}>
        {moduleList.length === 0
          ? <p style={{ fontFamily: bodyFont, color: "var(--color-text-secondary)", fontSize: 15 }}>No modules found.</p>
          : moduleList.map((mod, i) => (
              <ModeratorModuleCard key={mod.id} module={mod} index={i} itemStatuses={itemStatuses} onItemToggle={onItemStatusToggle} lockedKeys={lockedKeys} courseSlug={courseSlug} />
            ))}
      </div>

      <NoteActionBlock note={contentNote} onNoteChange={onContentNoteChange} itemAction={contentAction} onItemActionChange={onContentActionChange} onSave={() => {}} title="Content action" />

      <NavButtons step={step} action={action} hasAnyFlagged={hasAnyFlagged} canContinue={canContinue} submitting={submitting} error={error} onNext={onNext} onBack={onBack} onSubmit={onSubmit} router={router} />
    </div>
  );
}

function ReviewStep(props: StepProps) {
  const { course, moduleList, action, finalComment, submitting, error, step, hasAnyFlagged, allApproved, onActionChange, onFinalCommentChange, onNext, onBack, onSubmit, router } = props;

  const title        = course?.title ?? "Untitled Course";
  const categoryName = course?.category?.name ?? "";
  const levelLabel   = course?.level ? course.level.charAt(0).toUpperCase() + course.level.slice(1) : "";
  const submittedAt  = course?.created_at ? new Date(course.created_at).toLocaleDateString("en-GB") : "—";

  const totalModules = moduleList.length;
  const totalLessons = moduleList.reduce((a, m) => a + m.lessons.length, 0);
  const totalTests   = moduleList.reduce((a, m) => a + m.lessons.reduce((la, l) => la + (l.items ?? []).filter((i) => i.item_type === "test").length, 0), 0);
  const totalMin     = course?.total_duration_minutes ?? 0;

  const STATS = [
    { icon: "/icons/book-gradient.svg",       count: totalModules, label: "Modules"  },
    { icon: "/icons/play-gradient.svg",       count: totalLessons, label: "Lessons"  },
    { icon: "/icons/copy-check-gradient.svg", count: totalTests,   label: "Tests"    },
    { icon: "/icons/clock-gradient.svg",      count: totalMin,     label: "Minutes"  },
  ];

  return (
    <div className="rounded-2xl bg-white" style={{ padding: "clamp(24px, 2.08vw, 40px) clamp(24px, 2.6vw, 50px)", boxShadow: "var(--shadow-dashboard-card)", display: "flex", flexDirection: "column", gap: "clamp(16px, 1.25vw, 24px)" }}>
      <div>
        <h2 style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: "clamp(20px, 1.875vw, 36px)", marginBottom: "clamp(4px, 0.42vw, 8px)" }}>Review &amp; Publish</h2>
        <p style={{ fontFamily: bodyFont, fontWeight: 500, fontSize: "clamp(13px, 1.04vw, 20px)", letterSpacing: "-0.011em", color: "var(--color-text-secondary)" }}>
          Review course content and take a moderation action
        </p>
      </div>

      {/* Overview */}
      <SectionCard>
        <p style={{ fontFamily: bodyFont, fontWeight: 400, fontSize: "clamp(13px, 1.04vw, 20px)", letterSpacing: "-0.011em", marginBottom: 12 }}>Course Overview</p>
        <div className="flex items-start justify-between" style={{ gap: 16 }}>
          <div className="flex items-center" style={{ gap: 12, minWidth: 0 }}>
            <div style={{ width: "clamp(60px, 5.21vw, 100px)", height: "clamp(40px, 3.33vw, 64px)", background: "var(--color-text-primary)", borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/book-gradient.svg" alt="" style={{ width: "clamp(28px, 2.6vw, 50px)", height: "clamp(28px, 2.6vw, 50px)" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
              <span style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: "clamp(12px, 0.83vw, 16px)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
              <span style={{ fontFamily: bodyFont, fontWeight: 500, fontSize: "clamp(11px, 0.78vw, 15px)", color: "var(--color-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{course?.short_description}</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12, flexShrink: 0 }}>
            <div className="flex items-center" style={{ gap: 8 }}>
              {categoryName && <span style={{ background: "var(--gradient-brand)", borderRadius: 20, padding: "2px 12px", fontFamily: monoFont, fontWeight: 500, fontSize: "clamp(11px, 0.78vw, 15px)" }}>{categoryName}</span>}
              {levelLabel   && <span style={{ border: "1px solid var(--color-draft)", borderRadius: 20, padding: "2px 12px", fontFamily: monoFont, fontWeight: 500, fontSize: "clamp(11px, 0.78vw, 15px)", background: "var(--color-bg)" }}>{levelLabel}</span>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
              <span style={{ fontFamily: monoFont, fontWeight: 500, fontSize: "clamp(11px, 0.73vw, 14px)", background: "var(--color-brand-yellow)", padding: "1px 8px", borderRadius: 6 }}>Under Review</span>
              <span style={{ fontFamily: bodyFont, fontSize: "clamp(10px, 0.63vw, 12px)", color: "var(--color-text-secondary)" }}>Submitted: {submittedAt}</span>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Stats */}
      <CourseStatsGrid stats={STATS} />

      {/* Structure */}
      <SectionCard>
        <p style={{ fontFamily: bodyFont, fontWeight: 400, fontSize: "clamp(14px, 1.04vw, 20px)", letterSpacing: "-0.011em", marginBottom: 20 }}>Course Structure</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "clamp(10px, 0.83vw, 16px)" }}>
          {moduleList.map((mod, i) => (
            <ModeratorModuleCard key={mod.id} module={mod} index={i} itemStatuses={{}} onItemToggle={() => {}} readOnly />
          ))}
        </div>
      </SectionCard>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <div style={{ display: "flex", gap: 20, width: "100%", maxWidth: 880, alignItems: "flex-start" }}>

          <div style={{ flex: 1, border: "1px solid var(--color-pink-dark)", borderRadius: 20, padding: "28px 34px", display: "flex", flexDirection: "column", gap: 12 }}>
            <span style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 16, lineHeight: "20px" }}>Moderator comment</span>
            <textarea value={finalComment} onChange={(e) => onFinalCommentChange(e.target.value)}
              placeholder="Leave a comment for the teacher…"
              style={{ minHeight: 260, resize: "none", border: "none", outline: "none", fontFamily: bodyFont, fontWeight: 400, fontSize: 16, lineHeight: "20px", color: finalComment ? "var(--color-text-primary)" : "var(--color-draft)" }} />
          </div>

          <div style={{ width: 274, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-start", padding: "28px 34px", gap: 12, border: "1px solid var(--color-pink-dark)", borderRadius: 20 }}>
            <span style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 16, lineHeight: "20px", width: "100%", textAlign: "center" }}>Moderator action</span>
            <span style={{ fontFamily: bodyFont, fontWeight: 500, fontSize: 15, lineHeight: "19px", color: "var(--color-text-secondary)", width: "100%", textAlign: "center" }}>Select a status:</span>
            {OVERALL_ACTIONS.map(({ key, label, icon, color }) => {
              const isActive = action === key;
              const isBlocked =
                (hasAnyFlagged && key === "approved") ||
                (allApproved && (key === "needs_revision" || key === "rejected"));
              const title = hasAnyFlagged && key === "approved"
                ? "Some items are flagged — cannot approve"
                : allApproved && (key === "needs_revision" || key === "rejected")
                  ? "All items are approved — cannot send for revision or reject"
                  : undefined;
              return (
                <button key={key} type="button"
                  onClick={() => !isBlocked && onActionChange(isActive ? null : key)}
                  title={title}
                  style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: "2px 12px", width: "100%", height: 23, background: "white", border: `1px solid ${isBlocked ? "var(--color-border-light)" : isActive ? color : "var(--color-draft)"}`, borderRadius: 20, cursor: isBlocked ? "not-allowed" : "pointer", opacity: isBlocked ? 0.4 : 1, fontFamily: monoFont, fontWeight: 500, fontSize: 15, lineHeight: "19px", color: isBlocked ? "var(--color-text-secondary)" : isActive ? color : "var(--color-text-secondary)", transition: "border-color 0.2s, color 0.2s" }}>
                  <span>{label}</span>
                  <span style={{ flexShrink: 0, display: "flex", alignItems: "center", opacity: isActive && !isBlocked ? 1 : 0.35 }}>{icon}</span>
                </button>
              );
            })}
            {hasAnyFlagged && (
              <p style={{ fontFamily: bodyFont, fontSize: 12, color: "var(--color-brand-yellow)", margin: 0, width: "100%", textAlign: "center" }}>
                Flagged items — approve disabled
              </p>
            )}
            {allApproved && (
              <p style={{ fontFamily: bodyFont, fontSize: 12, color: "var(--color-success)", margin: 0, width: "100%", textAlign: "center" }}>
                All approved — only publish available
              </p>
            )}
          </div>

        </div>
      </div>

      <NavButtons step={step} action={action} hasAnyFlagged={hasAnyFlagged} submitting={submitting} error={error} onNext={onNext} onBack={onBack} onSubmit={onSubmit} router={router} />
    </div>
  );
}

const ALL_BASICS_KEYS = new Set(["field-title", "field-short-description", "field-full-description", "field-icon", "field-category", "field-level", "field-price"]);

/** Compare pending edit values directly to the live course to detect real changes.
 *  Treats empty-string pending edit values as "same as live course" - they come from
 *  the backend auto-creating the pending edit without copying the course fields. */
function computeLockedFieldKeys(pe: CoursePendingEdit, course: CourseDetail): Set<string> {
  const changed = new Set<string>();
  if ((pe.title || course.title) !== course.title)                                        changed.add("field-title");
  if ((pe.short_description || course.short_description) !== course.short_description)    changed.add("field-short-description");
  if ((pe.full_description  || course.full_description)  !== course.full_description)     changed.add("field-full-description");
  if (pe.image && pe.image !== course.image)                                              changed.add("field-icon");
  if ((pe.category_id ?? course.category?.id) !== course.category?.id)                   changed.add("field-category");
  if ((pe.level || course.level) !== course.level)                                        changed.add("field-level");
  return new Set([...ALL_BASICS_KEYS].filter((k) => !changed.has(k)));
}

function computeLockedContentKeys(course: CourseDetail | null, snapshot: SnapshotModule[]): Set<string> {
  if (!course) return new Set();
  const liveLessons = new Map(course.modules.flatMap((m) => m.lessons.map((l) => [l.id, l])));
  const liveTests   = new Map(course.modules.flatMap((m) => (m.tests ?? []).map((t) => [t.id, t])));
  const locked = new Set<string>();
  for (const mod of snapshot) {
    for (const sl of mod.lessons) {
      if (sl.id === null) continue;
      const live = liveLessons.get(sl.id);
      if (!live) continue;
      const metaUnchanged =
        sl.title === live.title &&
        sl.duration_minutes === live.duration_minutes &&
        sl.is_preview === live.is_preview;
      const liveItems = live.items ?? [];
      let itemsUnchanged: boolean;
      if (sl.items_snapshot !== undefined) {
        // Full comparison against baseline captured at pending-edit creation time.
        if (sl.items_snapshot.length !== liveItems.length) {
          itemsUnchanged = false;
        } else {
          const liveById = new Map(liveItems.map((i) => [i.id, i]));
          itemsUnchanged = sl.items_snapshot.every((si) => {
            const li = liveById.get(si.id);
            return li !== undefined &&
              (si.content ?? "") === (li.content ?? "") &&
              // Same rationale as above: null snapshot video_url = file video, not a real change.
              (si.video_url == null || si.video_url === (li.video_url ?? null));
          });
        }
      } else {
        // No baseline (old snapshot): safe to auto-lock only when the lesson
        // has no content blocks at all; if blocks exist we can't tell what changed.
        itemsUnchanged = liveItems.length === 0;
      }
      if (metaUnchanged && itemsUnchanged) locked.add(`lesson-${sl.id}`);
    }
    for (const st of mod.tests) {
      if (st.id === null) continue;
      const live = liveTests.get(st.id);
      if (live && st.title === live.title && st.passing_score === live.passing_score)
        locked.add(`test-${st.id}`);
    }
  }
  return locked;
}

function buildDisplayModules(snapshot: SnapshotModule[], course?: CourseDetail | null): CourseModule[] {
  const liveLessonsById = new Map<number, CourseLesson>(
    (course?.modules ?? []).flatMap((m) => m.lessons).map((l) => [l.id, l]),
  );
  return snapshot.map((mod, mi) => ({
    id: mod.id ?? -(mi + 1),
    title: mod.title,
    description: mod.description ?? null,
    order: mod.order,
    lessons: mod.lessons.map((l, li) => {
      const actual = l.id != null && l.id > 0 ? liveLessonsById.get(l.id) : undefined;
      return {
        id: l.id ?? -(li + 1) - (mi + 1) * 1000,
        title: l.title,
        order: l.order,
        duration_minutes: l.duration_minutes ?? null,
        is_preview: l.is_preview,
        min_score: l.min_score ?? null,
        items: actual?.items ?? [],
        documents: actual?.documents ?? [],
      };
    }),
    tests: mod.tests.map((t, ti) => ({
      id: t.id ?? -(ti + 1) - (mi + 1) * 1000,
      title: t.title,
      description: t.description ?? "",
      passing_score: t.passing_score ?? 70,
      order: t.order,
      questions: t.questions.map((q, qi) => ({
        id: q.id ?? -(qi + 1),
        question_type: q.question_type,
        text: q.text,
        options: q.options ?? [],
        correct_index: q.correct_index ?? null,
        correct_bool: q.correct_bool ?? null,
        sample_answer: q.sample_answer ?? "",
        order: q.order,
      })),
    })),
  })) as unknown as CourseModule[];
}

export default function ModeratorReviewPage() {
  const { slug }  = useParams<{ slug: string }>();
  const router    = useRouter();

  const [course, setCourse]                       = useState<CourseDetail | null>(null);
  const [step, setStep]                           = useState<0 | 1 | 2>(0);
  const [action, setAction]                       = useState<ModeratorAction>(null);
  const [comment, setComment]                     = useState("");
  const [finalComment, setFinalComment]           = useState("");
  const [submitting, setSubmitting]               = useState(false);
  const [saving, setSaving]                       = useState(false);
  const [saved, setSaved]                         = useState(false);
  const [error, setError]                         = useState("");
  const [itemStatuses, setItemStatuses]           = useState<ItemStatuses>({});
  const [contentNote, setContentNote]   = useState("");
  const [basicsAction, setBasicsAction] = useState<ItemStatus>(null);
  const [contentAction, setContentAction] = useState<ItemStatus>(null);
  const [pendingEdit, setPendingEdit]   = useState<CoursePendingEdit | null>(null);
  const [lockedKeys, setLockedKeys]     = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!slug) return;
    getCourseBySlug(slug).then(async (c) => {
      setCourse(c);
      const isPE = c.status === "published" || c.status === "hidden";
      let pe: CoursePendingEdit | null = null;
      if (isPE) {
        try { pe = await getPendingEdit(slug); } catch { /* no pending edit */ }
      }
      setPendingEdit(pe);

      if (pe) {
        // Compute locked keys from diff
        const fieldLocked    = computeLockedFieldKeys(pe, c);
        const contentLocked  = computeLockedContentKeys(c, pe.modules_snapshot ?? []);
        const allLocked      = new Set([...fieldLocked, ...contentLocked]);
        setLockedKeys(allLocked);

        // Pre-populate locked keys as "approved"
        const autoStatuses: ItemStatuses = {};
        for (const k of allLocked) autoStatuses[k] = "approved";

        // Merge with previous moderation review if any, but skip stale data
        // from a previous moderation cycle (predates this pending edit entirely).
        const mr = c.moderation_review;
        const isStale = mr != null &&
          new Date(mr.updated_at) < new Date(pe.created_at);
        if (mr && !isStale) {
          setComment(mr.basics_comment ?? "");
          setBasicsAction((mr.basics_action || null) as ItemStatus);
          setContentNote(mr.content_comment ?? "");
          setContentAction((mr.content_action || null) as ItemStatus);
          setFinalComment(mr.final_comment ?? "");
          setAction((mr.final_action || null) as ModeratorAction);
          setItemStatuses({
            ...autoStatuses,
            ...(mr.basics_field_statuses ?? {}),
            ...(mr.content_item_statuses ?? {}),
          } as ItemStatuses);
        } else {
          setItemStatuses(autoStatuses);
        }
        return;
      }

      // Regular (initial) review: restore from ModerationReview if present
      const mr = c.moderation_review;
      if (!mr) return;
      setComment(mr.basics_comment ?? "");
      setBasicsAction((mr.basics_action || null) as ItemStatus);
      setContentNote(mr.content_comment ?? "");
      setContentAction((mr.content_action || null) as ItemStatus);
      setFinalComment(mr.final_comment ?? "");
      setAction((mr.final_action || null) as ModeratorAction);
      setItemStatuses({
        ...(mr.basics_field_statuses ?? {}),
        ...(mr.content_item_statuses ?? {}),
      } as ItemStatuses);
    }).catch(() => {});
  }, [slug]);

  const moduleList = useMemo(
    () => pendingEdit
      ? buildDisplayModules(pendingEdit.modules_snapshot ?? [], course)
      : Array.isArray(course?.modules) ? course.modules : [],
    [pendingEdit, course],
  );
  const title      = course?.title ?? "Untitled Course";

  // Auto-set section actions when item statuses change.
  // The moderator can still manually override by clicking the action buttons.
  useEffect(() => {
    const basicsStatuses = BASICS_FIELD_KEYS.map((k) => itemStatuses[k] ?? null);
    const computed = computeSectionAction(basicsStatuses);
    if (computed !== null) setBasicsAction(computed);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemStatuses]);

  useEffect(() => {
    const allContentKeys = moduleList.flatMap((m) => m.lessons.map((l) => `lesson-${l.id}`));
    const contentStatuses = allContentKeys.map((k) => itemStatuses[k] ?? null);
    const computed = computeSectionAction(contentStatuses);
    if (computed !== null) setContentAction(computed);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemStatuses, moduleList]);

  // Auto-set final action from section actions.
  useEffect(() => {
    const computed = computeFinalAction(basicsAction, contentAction);
    if (computed !== null) setAction(computed);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basicsAction, contentAction]);

  function handleItemStatusToggle(key: string) {
    setItemStatuses((prev) => {
      const cur = prev[key] ?? null;
      const idx  = ITEM_CYCLE.indexOf(cur);
      return { ...prev, [key]: ITEM_CYCLE[(idx + 1) % ITEM_CYCLE.length] };
    });
  }

  const hasAnyFlagged = Object.values(itemStatuses).some(
    (s) => s === "rejected" || s === "needs_revision",
  );

  const allApproved =
    !hasAnyFlagged &&
    Object.values(itemStatuses).length > 0 &&
    Object.values(itemStatuses).every((s) => s === "approved") &&
    basicsAction === "approved" &&
    contentAction === "approved";

  async function handleSaveDraft() {
    if (!slug || saving || submitting) return;
    setSaving(true);
    setSaved(false);
    try {
      const basicsFieldStatuses: Record<string, string> = {};
      const contentItemStatuses: Record<string, string> = {};
      for (const [k, v] of Object.entries(itemStatuses)) {
        if (v === null) continue;
        if (k.startsWith("field-")) basicsFieldStatuses[k] = v;
        else contentItemStatuses[k] = v;
      }
      await saveReviewDraft(
        slug,
        basicsFieldStatuses,
        basicsAction ?? "",
        comment,
        contentItemStatuses,
        contentAction ?? "",
        contentNote,
        action ?? "",
        finalComment,
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit() {
    if (!slug || !action || submitting) return;
    const effectiveAction = hasAnyFlagged && action === "approved" ? "needs_revision" : action;
    setSubmitting(true);
    setError("");
    const isPendingEdit =
      course?.status === "published" || course?.status === "hidden";

    try {
      if (effectiveAction === "approved") {
        await (isPendingEdit ? approvePendingEdit(slug) : approveCourse(slug));
      } else if (isPendingEdit) {
        const basicsFieldStatuses: Record<string, string> = {};
        const contentItemStatuses: Record<string, string> = {};
        for (const [k, v] of Object.entries(itemStatuses)) {
          if (v === null) continue;
          if (k.startsWith("field-")) basicsFieldStatuses[k] = v;
          else contentItemStatuses[k] = v;
        }
        await rejectPendingEdit(
          slug,
          basicsFieldStatuses,
          basicsAction ?? "",
          comment,
          contentItemStatuses,
          contentAction ?? "",
          contentNote,
          effectiveAction,
          finalComment,
        );
      } else {
        const basicsFieldStatuses: Record<string, string> = {};
        const contentItemStatuses: Record<string, string> = {};
        for (const [k, v] of Object.entries(itemStatuses)) {
          if (v === null) continue;
          if (k.startsWith("field-")) basicsFieldStatuses[k] = v;
          else contentItemStatuses[k] = v;
        }
        await rejectCourse(
          slug,
          basicsFieldStatuses,
          basicsAction ?? "",
          comment,
          contentItemStatuses,
          contentAction ?? "",
          contentNote,
          effectiveAction,
          finalComment,
        );
      }
      const returnTab =
        effectiveAction === "approved"       ? "approved"
        : effectiveAction === "rejected"     ? "rejected"
        : effectiveAction === "needs_revision" ? "needs_revision"
        : "review";
      router.push(`/moderator-dashboard/courses?tab=${returnTab}`);
    } catch (err: unknown) {
      setError((err as Partial<ApiError>).message ?? "Action failed. Please try again.");
      setSubmitting(false);
    }
  }

  const sharedProps: StepProps = {
    course,
    pendingEdit,
    lockedKeys,
    moduleList,
    action,
    comment,
    finalComment,
    submitting,
    error,
    step,
    itemStatuses,
    hasAnyFlagged,
    allApproved,
    contentNote,
    basicsAction,
    contentAction,
    onActionChange:         setAction,
    onCommentChange:        setComment,
    onFinalCommentChange:   setFinalComment,
    onItemStatusToggle:     handleItemStatusToggle,
    onContentNoteChange:    setContentNote,
    onBasicsActionChange:   setBasicsAction,
    onContentActionChange:  setContentAction,
    onNext:    () => setStep((s) => Math.min(s + 1, 2) as 0 | 1 | 2),
    onBack:    () => setStep((s) => Math.max(s - 1, 0) as 0 | 1 | 2),
    onSubmit:  handleSubmit,
    router,
    courseSlug: slug ?? "",
  };

  return (
    <CourseCreationLayout>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between"
        style={{ marginBottom: "clamp(16px, 1.56vw, 30px)", gap: "clamp(10px, 0.83vw, 12px)" }}>
        <div className="flex items-center" style={{ gap: "clamp(10px, 1.04vw, 20px)" }}>
          <h1 className="font-semibold font-(family-name:--font-base) text-(--color-text-primary)"
            style={{ fontSize: "clamp(22px, 1.875vw, 36px)", lineHeight: 1.25 }}>{title}</h1>
          <span className="rounded bg-(--color-draft) font-medium font-(family-name:--font-accent) text-(--color-text-secondary)"
            style={{ padding: "clamp(3px, 0.21vw, 4px) clamp(6px, 0.56vw, 8px)", fontSize: "clamp(11px, 0.78vw, 15px)" }}>
            {course?.status ?? "review"}
          </span>
        </div>
        <div className="flex items-center" style={{ gap: "clamp(10px, 1.25vw, 24px)" }}>
          <AccentButton type="button" size="md" disabled={saving || submitting} style={{ gap: "clamp(8px, 0.69vw, 10px)" }} onClick={handleSaveDraft}>
            <Save size={20} />
            {saving ? "Saving..." : saved ? "Saved ✓" : "Save Draft"}
          </AccentButton>
          <GradientButton type="button"
            disabled={step !== 2 || !action || submitting}
            onClick={step === 2 && action && !submitting ? handleSubmit : undefined}
            style={{ gap: "clamp(8px, 0.83vw, 12px)" }}>
            Continue to Review &amp; Publish
            <ArrowUpRight size={20} aria-hidden="true" />
          </GradientButton>
        </div>
      </div>

      <CourseCreationStepper currentStep={step} steps={STEPS} />

      {step === 0 && <BasicsStep  {...sharedProps} />}
      {step === 1 && <ContentStep {...sharedProps} />}
      {step === 2 && <ReviewStep  {...sharedProps} />}
    </CourseCreationLayout>
  );
}
