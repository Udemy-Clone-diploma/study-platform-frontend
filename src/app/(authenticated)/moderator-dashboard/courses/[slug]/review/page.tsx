"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowUpRight, Save } from "lucide-react";
import { AccentButton } from "@/shared/ui/AccentButton";
import { GradientButton } from "@/shared/ui/GradientButton";
import {
  getCourseBySlug, approveCourse, rejectCourse, saveReviewDraft,
  approvePendingEdit, rejectPendingEdit, getPendingEdit,
} from "@/entities/course";
import type { CoursePendingEdit, SnapshotModule } from "@/entities/course";
import type { CourseDetail, CourseModule, CourseLesson } from "@/entities/course";
import { CourseCreationLayout, CourseCreationStepper } from "@/features/courses";
import {
  computeSectionAction, computeFinalAction,
  ITEM_CYCLE, BASICS_FIELD_KEYS,
  type ModeratorAction, type ItemStatus, type ItemStatuses, type StepProps,
  ModeratorBasicsStep, ModeratorContentStep, ModeratorReviewStep,
} from "@/features/courses";
import type { ApiError } from "@/shared/api/base";

const STEPS = [
  { name: "Basics",           sub: "Course information"       },
  { name: "Course Content",   sub: "Modules, lessons & tests"  },
  { name: "Review & Publish", sub: "Launch course"             },
];

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
  }, [itemStatuses]);

  useEffect(() => {
    const allContentKeys = moduleList.flatMap((m) => m.lessons.map((l) => `lesson-${l.id}`));
    const contentStatuses = allContentKeys.map((k) => itemStatuses[k] ?? null);
    const computed = computeSectionAction(contentStatuses);
    if (computed !== null) setContentAction(computed);
  }, [itemStatuses, moduleList]);

  // Auto-set final action from section actions.
  useEffect(() => {
    const computed = computeFinalAction(basicsAction, contentAction);
    if (computed !== null) setAction(computed);
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

      {step === 0 && <ModeratorBasicsStep  {...sharedProps} />}
      {step === 1 && <ModeratorContentStep {...sharedProps} />}
      {step === 2 && <ModeratorReviewStep  {...sharedProps} />}
    </CourseCreationLayout>
  );
}
