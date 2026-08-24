"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { ArrowUpRight, Save } from "lucide-react";
import { AccentButton } from "@/shared/ui/AccentButton";
import { GradientButton } from "@/shared/ui/GradientButton";
import {
  getCourseBySlug,
  approveCourse,
  rejectCourse,
  saveReviewDraft,
  approvePendingEdit,
  rejectPendingEdit,
  getPendingEdit,
} from "@/entities/course";
import type { CourseDetail, CoursePendingEdit } from "@/entities/course";
import { CourseCreationLayout, CourseCreationStepper } from "@/features/courses";
import {
  computeSectionAction,
  computeFinalAction,
  ITEM_CYCLE,
  BASICS_FIELD_KEYS,
  type ModeratorAction,
  type ItemStatus,
  type ItemStatuses,
  type StepProps,
  ModeratorBasicsStep,
  ModeratorContentStep,
  ModeratorReviewStep,
} from "@/features/courses";
import type { ApiError } from "@/shared/api/base";
import { usePageLoadingOverlay } from "@/shared/lib/pageLoadingSignal";

const ALL_BASICS_KEYS = new Set([
  "field-title",
  "field-short-description",
  "field-full-description",
  "field-icon",
  "field-category",
  "field-level",
]);

/** Compare the draft course directly to the live course to detect real changes. */
function computeLockedFieldKeys(draft: CourseDetail, course: CourseDetail): Set<string> {
  const changed = new Set<string>();
  if (draft.title !== course.title) changed.add("field-title");
  if (draft.short_description !== course.short_description) changed.add("field-short-description");
  if (draft.full_description !== course.full_description) changed.add("field-full-description");
  // Cloning duplicates the image under a fresh generated storage path, so two
  // byte-identical images never share a URL — compare content hash instead.
  if ((draft.image_hash ?? null) !== (course.image_hash ?? null)) changed.add("field-icon");
  if ((draft.category?.id ?? null) !== (course.category?.id ?? null)) changed.add("field-category");
  if (draft.level !== course.level) changed.add("field-level");
  return new Set([...ALL_BASICS_KEYS].filter((k) => !changed.has(k)));
}

/** Compare the draft course's lessons/tests to the live course's, correlating
 *  by source_lesson_id/source_test_id (null = new-since-clone, never locked).
 *  Keys are the draft's own lesson/test id — matches moduleList (= draftCourse.modules)
 *  and stays stable across a needs_revision cycle, since the draft is reused, not re-cloned. */
function computeLockedContentKeys(
  course: CourseDetail | null,
  draft: CourseDetail | null,
): Set<string> {
  if (!course || !draft) return new Set();
  const liveLessons = new Map(course.modules.flatMap((m) => m.lessons.map((l) => [l.id, l])));
  const liveTests = new Map(course.modules.flatMap((m) => (m.tests ?? []).map((t) => [t.id, t])));
  const locked = new Set<string>();
  for (const mod of draft.modules) {
    for (const dl of mod.lessons) {
      if (dl.source_lesson_id == null) continue;
      const live = liveLessons.get(dl.source_lesson_id);
      if (!live) continue;
      const metaUnchanged =
        dl.title === live.title &&
        dl.duration_minutes === live.duration_minutes &&
        dl.is_preview === live.is_preview &&
        !!dl.is_mandatory === !!live.is_mandatory;
      const draftItems = dl.items ?? [];
      const liveItems = live.items ?? [];
      let itemsUnchanged: boolean;
      if (draftItems.length !== liveItems.length) {
        itemsUnchanged = false;
      } else {
        const liveById = new Map(liveItems.map((i) => [i.id, i]));
        const contentUnchanged = draftItems.every((di) => {
          if (di.source_lesson_item_id == null) return false;
          const li = liveById.get(di.source_lesson_item_id);
          if (li === undefined) return false;
          // Cloning duplicates an uploaded video under a fresh generated path,
          // so video_url (which resolves to the file's URL when there's no
          // external link) always differs even when the file is unchanged —
          // whenever either side has an uploaded file, compare content hash
          // instead and ignore video_url; only fall back to comparing the raw
          // link when neither side has an uploaded file at all.
          const hasFile = !!di.video_hash || !!li.video_hash;
          const videoUnchanged = hasFile
            ? (di.video_hash ?? null) === (li.video_hash ?? null)
            : (di.video_url ?? null) === (li.video_url ?? null);
          return (di.body_html ?? "") === (li.body_html ?? "") && videoUnchanged;
        });
        // Both arrays come back ordered by `order` (model default ordering) --
        // a same-position source-id match confirms the display sequence, not
        // just the per-item content, is unchanged.
        const orderUnchanged = draftItems.every(
          (di, idx) => di.source_lesson_item_id === liveItems[idx]?.id,
        );
        itemsUnchanged = contentUnchanged && orderUnchanged;
      }
      if (metaUnchanged && itemsUnchanged) locked.add(`lesson-${dl.id}`);
    }
    for (const dt of mod.tests) {
      if (dt.source_test_id == null) continue;
      const live = liveTests.get(dt.source_test_id);
      if (live && dt.title === live.title && dt.passing_score === live.passing_score)
        locked.add(`test-${dt.id}`);
    }
  }
  return locked;
}

export default function ModeratorReviewPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const t = useTranslations("ModeratorCourseReviewPage");
  const tStepper = useTranslations("CourseCreationStepper");
  const tReview = useTranslations("CourseReviewPage");
  const tBasics = useTranslations("CourseBasicsForm");

  const STEPS = [
    { name: tStepper("stepBasicsName"), sub: tStepper("stepBasicsSub") },
    { name: tStepper("stepContentName"), sub: tStepper("stepContentSub") },
    { name: t("reviewPublishStepName"), sub: t("reviewPublishStepSub") },
  ];

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  usePageLoadingOverlay(loading);
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [action, setAction] = useState<ModeratorAction>(null);
  const [comment, setComment] = useState("");
  const [finalComment, setFinalComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [itemStatuses, setItemStatuses] = useState<ItemStatuses>({});
  const [contentNote, setContentNote] = useState("");
  const [basicsAction, setBasicsAction] = useState<ItemStatus>(null);
  const [contentAction, setContentAction] = useState<ItemStatus>(null);
  const [pendingEdit, setPendingEdit] = useState<CoursePendingEdit | null>(null);
  const [draftCourse, setDraftCourse] = useState<CourseDetail | null>(null);
  const [lockedKeys, setLockedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!slug) return;
    getCourseBySlug(slug)
      .then(async (c) => {
        setCourse(c);
        const isPE = c.status === "published" || c.status === "hidden";
        let pe: CoursePendingEdit | null = null;
        let draft: CourseDetail | null = null;
        if (isPE) {
          try {
            pe = await getPendingEdit(slug);
            draft = await getCourseBySlug(pe.draft_course_slug);
          } catch {
            /* no pending edit */
          }
        }
        setPendingEdit(pe);
        setDraftCourse(draft);

        if (pe && draft) {
          // Compute locked keys from diff
          const fieldLocked = computeLockedFieldKeys(draft, c);
          const contentLocked = computeLockedContentKeys(c, draft);
          const allLocked = new Set([...fieldLocked, ...contentLocked]);
          setLockedKeys(allLocked);

          // Pre-populate locked keys as "approved"
          const autoStatuses: ItemStatuses = {};
          for (const k of allLocked) autoStatuses[k] = "approved";

          // Merge with previous moderation review if any, but skip stale data
          // from a previous moderation cycle (predates this pending edit entirely).
          const mr = c.moderation_review;
          const isStale = mr != null && new Date(mr.updated_at) < new Date(pe.created_at);
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
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const moduleList = useMemo(
    () =>
      pendingEdit && draftCourse
        ? draftCourse.modules
        : Array.isArray(course?.modules)
          ? course.modules
          : [],
    [pendingEdit, draftCourse, course],
  );
  const title = course?.title ?? tReview("untitledCourse");

  // Auto-set section actions when item statuses change.
  // The moderator can still manually override by clicking the action buttons.
  useEffect(() => {
    const basicsStatuses = BASICS_FIELD_KEYS.map((k) => itemStatuses[k] ?? null);
    const computed = computeSectionAction(basicsStatuses);
    if (computed !== null) setBasicsAction(computed);
  }, [itemStatuses]);

  useEffect(() => {
    const allContentKeys = moduleList.flatMap((m) => [
      ...m.lessons.map((l) => `lesson-${l.id}`),
      ...(m.tests ?? []).map((t) => `test-${t.id}`),
    ]);
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
      const idx = ITEM_CYCLE.indexOf(cur);
      return { ...prev, [key]: ITEM_CYCLE[(idx + 1) % ITEM_CYCLE.length] };
    });
  }

  // Only count statuses for content that still exists — a lesson/test/field carried
  // over from a previous review cycle's saved statuses but since deleted by the
  // teacher must not keep blocking approval as a phantom "flagged" item.
  const validItemKeys = useMemo(() => {
    const keys = new Set<string>(BASICS_FIELD_KEYS);
    for (const m of moduleList) {
      for (const l of m.lessons) keys.add(`lesson-${l.id}`);
      for (const t of m.tests ?? []) keys.add(`test-${t.id}`);
    }
    return keys;
  }, [moduleList]);
  const validItemEntries = Object.entries(itemStatuses).filter(([k]) => validItemKeys.has(k));

  const hasAnyFlagged = validItemEntries.some(
    ([, s]) => s === "rejected" || s === "needs_revision",
  );

  const allApproved =
    !hasAnyFlagged &&
    validItemEntries.length > 0 &&
    validItemEntries.every(([, s]) => s === "approved") &&
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
    const isPendingEdit = course?.status === "published" || course?.status === "hidden";

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
        effectiveAction === "approved"
          ? "approved"
          : effectiveAction === "rejected"
            ? "rejected"
            : effectiveAction === "needs_revision"
              ? "needs_revision"
              : "review";
      router.push(`/moderator-dashboard/courses?tab=${returnTab}`);
    } catch (err: unknown) {
      setError((err as Partial<ApiError>).message ?? t("actionFailedError"));
      setSubmitting(false);
    }
  }

  const sharedProps: StepProps = {
    course,
    draftCourse,
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
    onActionChange: setAction,
    onCommentChange: setComment,
    onFinalCommentChange: setFinalComment,
    onItemStatusToggle: handleItemStatusToggle,
    onContentNoteChange: setContentNote,
    onBasicsActionChange: setBasicsAction,
    onContentActionChange: setContentAction,
    onNext: () => setStep((s) => Math.min(s + 1, 2) as 0 | 1 | 2),
    onBack: () => setStep((s) => Math.max(s - 1, 0) as 0 | 1 | 2),
    onSubmit: handleSubmit,
    router,
    courseSlug: slug ?? "",
  };

  // NavigationLoadingOverlay already covers the load; avoid a second, plain-text one here.
  if (loading) {
    return <CourseCreationLayout>{null}</CourseCreationLayout>;
  }

  return (
    <CourseCreationLayout>
      {/* Header */}
      <div
        className="flex flex-wrap items-center justify-between"
        style={{ marginBottom: "clamp(16px, 1.56vw, 30px)", gap: "clamp(10px, 0.83vw, 12px)" }}
      >
        <div className="flex items-center" style={{ gap: "clamp(10px, 1.04vw, 20px)" }}>
          <h1
            className="font-semibold font-(family-name:--font-base) text-(--color-text-primary)"
            style={{ fontSize: "clamp(22px, 1.875vw, 36px)", lineHeight: 1.25 }}
          >
            {title}
          </h1>
          <span
            className="rounded bg-(--color-draft) font-medium font-(family-name:--font-accent) text-(--color-text-secondary)"
            style={{
              padding: "clamp(3px, 0.21vw, 4px) clamp(6px, 0.56vw, 8px)",
              fontSize: "clamp(11px, 0.78vw, 15px)",
            }}
          >
            {course?.status ?? "review"}
          </span>
        </div>
        <div className="flex items-center" style={{ gap: "clamp(10px, 1.25vw, 24px)" }}>
          <AccentButton
            type="button"
            size="md"
            disabled={saving || submitting}
            style={{ gap: "clamp(8px, 0.69vw, 10px)" }}
            onClick={handleSaveDraft}
          >
            <Save size={20} />
            {saving ? tBasics("saving") : saved ? t("savedLabel") : t("saveDraftLabel")}
          </AccentButton>
          <GradientButton
            type="button"
            disabled={step !== 2 || !action || submitting}
            onClick={step === 2 && action && !submitting ? handleSubmit : undefined}
            style={{ gap: "clamp(8px, 0.83vw, 12px)" }}
          >
            {tReview("continueToReviewAndPublish")}
            <ArrowUpRight size={20} aria-hidden="true" />
          </GradientButton>
        </div>
      </div>

      <CourseCreationStepper currentStep={step} steps={STEPS} />

      {step === 0 && <ModeratorBasicsStep {...sharedProps} />}
      {step === 1 && <ModeratorContentStep {...sharedProps} />}
      {step === 2 && <ModeratorReviewStep {...sharedProps} />}
    </CourseCreationLayout>
  );
}
