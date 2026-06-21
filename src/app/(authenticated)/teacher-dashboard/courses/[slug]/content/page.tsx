"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { Plus, ArrowUpRight } from "lucide-react";
import {
  getCourseBySlug,
  createModule,
  updateModule,
  deleteModule,
  createLesson,
  updateLesson,
  deleteLesson,
  updateCourse,
  getPendingEdit,
  savePendingEditModules,
  savePendingEditMetadata,
  discardPendingEdit,
  nextTempId,
  uploadLessonDocument,
  deleteLessonDocument,
} from "@/entities/course";
import type { CourseDetail, CourseModule, CourseLesson, ModerationReview } from "@/entities/course";
import type { SnapshotModule, SnapshotQuestion } from "@/entities/course";
import {
  CourseCreationLayout,
  CourseCreationStepper,
  CoursePageHeader,
  ModuleCard,
  ModuleFormModal,
  LessonFormModal,
  ModeratorNoteBanner,
} from "@/features/courses";
import type { LessonFormValues } from "@/features/courses";
import { AccentButton } from "@/shared/ui/AccentButton";
import { GradientButton } from "@/shared/ui/GradientButton";
import { SectionCard } from "@/shared/ui/SectionCard";
import { WhiteButton } from "@/shared/ui/WhiteButton";

const PUBLISHED_STATUSES = new Set(["published", "hidden"]);

type ItemsBaseline = Array<{ id: number; item_type: string; content: string; video_url: string | null }> | undefined;

type ModalState =
  | { open: false }
  | { open: true; mode: "add" }
  | { open: true; mode: "edit"; moduleId: number; initialTitle: string };

type LessonModalState =
  | { open: false }
  | { open: true; mode: "add"; moduleId: number }
  | { open: true; mode: "edit"; moduleId: number; lesson: CourseLesson };

function snapshotToCourseModule(s: SnapshotModule): CourseModule {
  return {
    id: s.id ?? 0,
    title: s.title,
    description: s.description,
    order: s.order,
    lessons: s.lessons.map((l) => ({
      id: l.id ?? 0,
      title: l.title,
      duration_minutes: l.duration_minutes,
      min_score: l.min_score,
      is_preview: l.is_preview,
      order: l.order,
    })),
    tests: s.tests.map((t) => ({
      id: t.id ?? 0,
      title: t.title,
      description: t.description,
      passing_score: t.passing_score,
      order: t.order,
      questions: t.questions.map((q) => ({
        id: q.id ?? 0,
        question_type: q.question_type,
        text: q.text,
        options: q.options,
        correct_index: q.correct_index,
        correct_bool: q.correct_bool,
        sample_answer: q.sample_answer,
        order: q.order,
      })),
    })),
  };
}

function courseModuleToSnapshot(m: CourseModule): SnapshotModule {
  return {
    id: m.id > 0 ? m.id : null,
    title: m.title,
    description: m.description,
    order: m.order,
    lessons: m.lessons.map((l) => ({
      id: l.id > 0 ? l.id : null,
      title: l.title,
      duration_minutes: l.duration_minutes ?? null,
      min_score: l.min_score ?? null,
      is_preview: l.is_preview,
      order: l.order,
    })),
    tests: m.tests.map((t) => ({
      id: t.id > 0 ? t.id : null,
      title: t.title,
      description: t.description,
      passing_score: t.passing_score,
      order: t.order,
      questions: t.questions.map((q) => ({
        id: q.id > 0 ? q.id : null,
        question_type: q.question_type as SnapshotQuestion["question_type"],
        text: q.text,
        options: q.options,
        correct_index: q.correct_index,
        correct_bool: q.correct_bool,
        sample_answer: q.sample_answer ?? "",
        order: q.order,
      })),
    })),
  };
}

export default function CourseContentPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [moduleList, setModuleList] = useState<CourseModule[]>([]);
  const [moderationReview, setModerationReview] = useState<ModerationReview | null>(null);
  /** True when working with a pending edit instead of the live course. */
  const [isPendingEditMode, setIsPendingEditMode] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const [modal, setModal] = useState<ModalState>({ open: false });
  const [lessonModal, setLessonModal] = useState<LessonModalState>({ open: false });

  // Baseline items_snapshot per lesson ID from when the pending edit was created.
  // Never mutated after initial load — used to detect item changes during moderation.
  const originalItemsRef = useRef<Map<number, ItemsBaseline>>(new Map());

  useEffect(() => {
    if (!slug) return;
    getCourseBySlug(slug)
      .then(async (c) => {
        setCourse(c);
        const isPublished = PUBLISHED_STATUSES.has(c.status);
        setIsPendingEditMode(isPublished);

        if (isPublished) {
          const pe = await getPendingEdit(slug);
          setIsLocked(pe.status === "pending");
          if (c.moderation_review) setModerationReview(c.moderation_review);
          // Capture the original items_snapshot baseline once at load time.
          originalItemsRef.current = new Map(
            pe.modules_snapshot.flatMap((m) =>
              m.lessons
                .filter((l) => l.id !== null)
                .map((l) => [l.id as number, l.items_snapshot]),
            ),
          );
          const actualLessonsById = new Map<number, CourseLesson>(
            (Array.isArray(c.modules) ? c.modules : []).flatMap((m) => m.lessons).map((l) => [l.id, l]),
          );
          setModuleList(
            pe.modules_snapshot.map((s) => {
              const mod = snapshotToCourseModule(s);
              return {
                ...mod,
                lessons: mod.lessons.map((l) => {
                  const actual = l.id > 0 ? actualLessonsById.get(l.id) : undefined;
                  return actual ? { ...l, items: actual.items ?? [] } : l;
                }),
              };
            }),
          );
        } else {
          setModuleList(Array.isArray(c.modules) ? c.modules : []);
          if (c.moderation_review) setModerationReview(c.moderation_review);
        }
      })
      .catch(() => {});
  }, [slug]);

  /** Persist the current moduleList as the pending edit snapshot.
   *  Restores the original items_snapshot baseline for each existing lesson
   *  so the moderator can always compare against the pre-edit state. */
  const flushSnapshot = useCallback(
    async (modules: CourseModule[]) => {
      if (!slug) return;
      const snapshot = modules.map((m) => {
        const base = courseModuleToSnapshot(m);
        return {
          ...base,
          lessons: base.lessons.map((sl) => ({
            ...sl,
            items_snapshot: sl.id != null && sl.id > 0
              ? originalItemsRef.current.get(sl.id)
              : undefined,
          })),
        };
      });
      await savePendingEditModules(slug, snapshot);
    },
    [slug],
  );

  async function syncCourseDuration(modules: CourseModule[]) {
    if (!slug) return;
    const totalMin = modules.flatMap((m) => m.lessons).reduce((s, l) => s + (l.duration_minutes ?? 0), 0);
    if (totalMin <= 0) return;
    const hours = Math.max(1, Math.ceil(totalMin / 60));
    try {
      if (isPendingEditMode) {
        await savePendingEditMetadata(slug, { duration_hours: hours });
      } else {
        await updateCourse(slug, { duration_hours: hours });
      }
    } catch { /* best-effort */ }
  }

  const title = course?.title || "Untitled Course";
  const hasModules = moduleList.length > 0;
  const hasLesson = moduleList.some((m) => m.lessons.length > 0);

  function openAddModal() { setModal({ open: true, mode: "add" }); }
  function openEditModal(mod: CourseModule) { setModal({ open: true, mode: "edit", moduleId: mod.id, initialTitle: mod.title }); }
  function closeModal() { setModal({ open: false }); }

  async function handleSaveModule(moduleTitle: string) {
    if (!slug) return;
    if (isPendingEditMode) {
      const order = moduleList.length + 1;
      let updated: CourseModule[];
      if (modal.open && modal.mode === "add") {
        const newMod: CourseModule = { id: nextTempId(), title: moduleTitle, description: "", order, lessons: [], tests: [] };
        updated = [...moduleList, newMod];
      } else if (modal.open && modal.mode === "edit") {
        updated = moduleList.map((m) =>
          m.id === modal.moduleId ? { ...m, title: moduleTitle } : m,
        );
      } else return;
      setModuleList(updated);
      await flushSnapshot(updated);
    } else {
      if (modal.open && modal.mode === "add") {
        const newMod = await createModule(slug, { title: moduleTitle });
        setModuleList((prev) => [...prev, newMod]);
      } else if (modal.open && modal.mode === "edit") {
        const updated = await updateModule(slug, modal.moduleId, { title: moduleTitle });
        setModuleList((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      }
    }
    closeModal();
  }

  async function handleDeleteModule(moduleId: number) {
    if (!slug) return;
    if (isPendingEditMode) {
      const updated = moduleList.filter((m) => m.id !== moduleId);
      setModuleList(updated);
      await flushSnapshot(updated);
      void syncCourseDuration(updated);
    } else {
      await deleteModule(slug, moduleId);
      const updatedModules = moduleList.filter((m) => m.id !== moduleId);
      setModuleList(updatedModules);
      void syncCourseDuration(updatedModules);
    }
  }

  // ── Lesson handlers ───────────────────────────────────────────────────

  function openAddLessonModal(moduleId: number) { setLessonModal({ open: true, mode: "add", moduleId }); }
  function openEditLessonModal(moduleId: number, lesson: CourseLesson) { setLessonModal({ open: true, mode: "edit", moduleId, lesson }); }
  function closeLessonModal() { setLessonModal({ open: false }); }

  async function _syncDocuments(moduleId: number, lessonId: number, values: LessonFormValues) {
    if (!slug || lessonId <= 0) return;
    await Promise.all(
      values.deleted_document_ids.map((id) => deleteLessonDocument(slug, moduleId, lessonId, id)),
    );
    const uploaded = await Promise.all(
      values.new_documents.map((file) => uploadLessonDocument(slug, moduleId, lessonId, file)),
    );
    setModuleList((prev) =>
      prev.map((m) =>
        m.id === moduleId
          ? {
              ...m,
              lessons: m.lessons.map((l) => {
                if (l.id !== lessonId) return l;
                const kept = (l.documents ?? []).filter((d) => !values.deleted_document_ids.includes(d.id));
                return { ...l, documents: [...kept, ...uploaded] };
              }),
            }
          : m,
      ),
    );
  }

  async function handleSaveLesson(values: LessonFormValues) {
    if (!slug || !lessonModal.open) return;
    const { mode, moduleId } = lessonModal;
    const lessonId = mode === "edit" ? lessonModal.lesson.id : null;
    const durNum = values.duration_minutes ? parseInt(values.duration_minutes, 10) : null;
    const scoreNum = values.min_score ? parseInt(values.min_score, 10) : null;
    const payload = {
      title: values.title.trim(),
      ...(durNum !== null && !isNaN(durNum) ? { duration_minutes: durNum } : {}),
      ...(scoreNum !== null && !isNaN(scoreNum) ? { min_score: scoreNum } : {}),
    };

    if (isPendingEditMode) {
      let updated: CourseModule[];
      if (mode === "add") {
        const newLesson: CourseLesson = {
          id: nextTempId(),
          title: payload.title,
          duration_minutes: durNum,
          min_score: scoreNum,
          is_preview: false,
          order: (moduleList.find((m) => m.id === moduleId)?.lessons.length ?? 0) + 1,
        };
        updated = moduleList.map((m) =>
          m.id === moduleId ? { ...m, lessons: [...m.lessons, newLesson] } : m,
        );
      } else if (lessonId !== null) {
        updated = moduleList.map((m) =>
          m.id === moduleId
            ? {
                ...m,
                lessons: m.lessons.map((l) =>
                  l.id === lessonId
                    ? { ...l, title: payload.title, duration_minutes: durNum, min_score: scoreNum }
                    : l,
                ),
              }
            : m,
        );
        if (lessonId > 0) await _syncDocuments(moduleId, lessonId, values);
      } else return;
      setModuleList(updated);
      await flushSnapshot(updated);
      void syncCourseDuration(updated);
    } else {
      if (mode === "add") {
        const newLesson = await createLesson(slug, moduleId, payload);
        const updatedModules = moduleList.map((m) =>
          m.id === moduleId ? { ...m, lessons: [...m.lessons, newLesson] } : m,
        );
        setModuleList(updatedModules);
        await _syncDocuments(moduleId, newLesson.id, values);
        void syncCourseDuration(updatedModules);
        // Switch to edit mode so the user can immediately add content blocks
        setLessonModal({ open: true, mode: "edit", moduleId, lesson: { ...newLesson, items: [] } });
        return;
      } else if (lessonId !== null) {
        const updated = await updateLesson(slug, moduleId, lessonId, payload);
        const updatedModules = moduleList.map((m) =>
          m.id === moduleId
            ? { ...m, lessons: m.lessons.map((l) => (l.id === updated.id ? updated : l)) }
            : m,
        );
        setModuleList(updatedModules);
        await _syncDocuments(moduleId, lessonId, values);
        void syncCourseDuration(updatedModules);
      }
    }
    closeLessonModal();
  }

  async function handleDeleteLesson(moduleId: number, lessonId: number) {
    if (!slug) return;
    if (isPendingEditMode) {
      const updated = moduleList.map((m) =>
        m.id === moduleId ? { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) } : m,
      );
      setModuleList(updated);
      await flushSnapshot(updated);
      void syncCourseDuration(updated);
    } else {
      await deleteLesson(slug, moduleId, lessonId);
      const updatedModules = moduleList.map((m) =>
        m.id === moduleId ? { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) } : m,
      );
      setModuleList(updatedModules);
      void syncCourseDuration(updatedModules);
    }
  }

  // ── Submit / discard for pending edit ────────────────────────────────

  function handleGoToReview() {
    router.push(`/teacher-dashboard/courses/${slug}/review`);
  }

  async function handleDiscardChanges() {
    if (!slug) return;
    await discardPendingEdit(slug);
    router.push("/teacher-dashboard/courses");
  }

  function handleSaveDraft() {
    router.push("/teacher-dashboard/courses");
  }

  return (
    <CourseCreationLayout>
      <CoursePageHeader title={title} saving={false} onSaveDraft={handleSaveDraft} />
      <CourseCreationStepper currentStep={1} />

      <div
        className="rounded-2xl bg-white"
        style={{
          padding: "clamp(24px, 2.08vw, 40px) clamp(24px, 2.6vw, 50px)",
          boxShadow: "var(--shadow-dashboard-card)",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-base)",
            fontWeight: 700,
            fontSize: "clamp(20px, 1.875vw, 36px)",
            color: "var(--color-text-primary)",
            marginBottom: "clamp(4px, 0.42vw, 8px)",
          }}
        >
          Course Content
        </h2>
        <p
          style={{
            fontFamily: "var(--font-base)",
            fontWeight: 500,
            fontSize: "clamp(13px, 1.04vw, 20px)",
            color: "var(--color-text-secondary)",
            letterSpacing: "-0.011em",
            marginBottom: "clamp(16px, 1.56vw, 24px)",
          }}
        >
          {isPendingEditMode
            ? isLocked
              ? "Your changes are under moderation review."
              : "You are editing a published course. Changes will be applied after moderation."
            : "Create modules, lessons, and assessments for your course"}
        </p>

        <SectionCard>
          <div style={{ display: "flex", flexDirection: "column", gap: "clamp(16px, 1.25vw, 20px)" }}>
            <div className="flex items-center justify-between">
              <span
                style={{
                  fontFamily: "var(--font-base)",
                  fontWeight: 700,
                  fontSize: "clamp(14px, 1.04vw, 20px)",
                  color: "var(--color-text-primary)",
                }}
              >
                Course Content
              </span>
              {!isLocked && (
                <AccentButton type="button" size="md" style={{ gap: "8px" }} onClick={openAddModal}>
                  <Plus size={20} />
                  Add Module
                </AccentButton>
              )}
            </div>

            {!hasModules ? (
              <div
                className="flex items-center justify-center"
                style={{ padding: "clamp(32px, 2.6vw, 50px) 24px" }}
              >
                <div className="flex flex-col items-center" style={{ gap: "24px" }}>
                  <div className="flex flex-col items-center" style={{ gap: "16px" }}>
                    <Image src="/icons/moduls.svg" alt="" width={100} height={100} unoptimized aria-hidden="true" />
                    <div className="flex flex-col items-center" style={{ gap: "8px" }}>
                      <span style={{ fontFamily: "var(--font-base)", fontWeight: 700, fontSize: "clamp(14px, 1.04vw, 20px)", color: "var(--color-text-primary)", textAlign: "center" }}>
                        No modules yet
                      </span>
                      <span style={{ fontFamily: "var(--font-base)", fontWeight: 500, fontSize: "clamp(13px, 1.04vw, 20px)", color: "var(--color-text-secondary)", letterSpacing: "-0.011em", textAlign: "center" }}>
                        Create your first module to start building your course structure
                      </span>
                    </div>
                  </div>
                  {!isLocked && (
                    <GradientButton type="button" style={{ gap: "8px" }} onClick={openAddModal}>
                      <Plus size={20} />
                      Create Your First Module
                    </GradientButton>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "clamp(12px, 0.83vw, 16px)" }}>
                {moduleList.map((mod, i) => (
                  <ModuleCard
                    key={mod.id}
                    module={mod}
                    index={i}
                    onEdit={isLocked ? () => {} : () => openEditModal(mod)}
                    onDelete={isLocked ? () => {} : () => handleDeleteModule(mod.id)}
                    onAddLesson={isLocked ? () => {} : () => openAddLessonModal(mod.id)}
                    onEditLesson={isLocked ? () => {} : (lesson) => openEditLessonModal(mod.id, lesson)}
                    onDeleteLesson={isLocked ? () => {} : (lessonId) => handleDeleteLesson(mod.id, lessonId)}
                    itemStatuses={moderationReview?.content_item_statuses}
                  />
                ))}
              </div>
            )}

            {/* Moderator content feedback */}
            {moderationReview && (() => {
              const ACTION_MAP: Record<string, { label: string; color: string }> = {
                approved:       { label: "Approved",          color: "var(--color-success)" },
                needs_revision: { label: "Requires Revision", color: "var(--color-warning)" },
                rejected:       { label: "Rejected",          color: "var(--color-rejected)" },
              };
              const actionInfo = moderationReview.content_action ? ACTION_MAP[moderationReview.content_action] : undefined;
              return (
                <ModeratorNoteBanner
                  comment={moderationReview.content_comment || undefined}
                  actionLabel={actionInfo?.label}
                  actionColor={actionInfo?.color}
                />
              );
            })()}

            <div
              className="flex items-center justify-between"
              style={{ marginTop: "clamp(8px, 0.63vw, 12px)" }}
            >
              <WhiteButton onClick={() => router.push(`/teacher-dashboard/courses/${slug}/edit`)}>
                Back to Basics
              </WhiteButton>

              {isPendingEditMode ? (
                <div className="flex items-center" style={{ gap: "clamp(8px, 0.83vw, 12px)" }}>
                  {!isLocked && (
                    <WhiteButton onClick={handleDiscardChanges}>
                      Discard Changes
                    </WhiteButton>
                  )}
                  {isLocked ? (
                    <GradientButton type="button" onClick={() => router.push("/teacher-dashboard/courses")} style={{ gap: 12 }}>
                      Back to My Courses
                    </GradientButton>
                  ) : (
                    <GradientButton
                      type="button"
                      disabled={!hasLesson}
                      onClick={handleGoToReview}
                      style={{ gap: 12 }}
                    >
                      Continue to Review &amp; Publish
                      <ArrowUpRight size={20} aria-hidden="true" />
                    </GradientButton>
                  )}
                </div>
              ) : (
                <GradientButton
                  type="button"
                  disabled={!hasLesson}
                  onClick={() => router.push(`/teacher-dashboard/courses/${slug}/review`)}
                  style={{ gap: 12 }}
                >
                  Continue to Review &amp; Publish
                  <ArrowUpRight size={20} aria-hidden="true" />
                </GradientButton>
              )}
            </div>
          </div>
        </SectionCard>
      </div>

      {modal.open && (
        <ModuleFormModal
          mode={modal.mode}
          initialTitle={modal.mode === "edit" ? modal.initialTitle : ""}
          onClose={closeModal}
          onSave={handleSaveModule}
        />
      )}

      {lessonModal.open && (
        <LessonFormModal
          key={lessonModal.mode === "edit" ? lessonModal.lesson.id : "add"}
          mode={lessonModal.mode}
          initialValues={lessonModal.mode === "edit" ? {
            title: lessonModal.lesson.title,
            duration_minutes: lessonModal.lesson.duration_minutes != null ? String(lessonModal.lesson.duration_minutes) : "",
            min_score: lessonModal.lesson.min_score != null ? String(lessonModal.lesson.min_score) : "",
            existing_documents: lessonModal.lesson.documents ?? [],
            new_documents: [],
            deleted_document_ids: [],
            items: lessonModal.lesson.items ?? [],
          } : undefined}
          courseSlug={lessonModal.mode === "edit" ? slug : undefined}
          moduleId={lessonModal.mode === "edit" ? lessonModal.moduleId : undefined}
          lessonId={lessonModal.mode === "edit" ? lessonModal.lesson.id : undefined}
          onClose={closeLessonModal}
          onSave={handleSaveLesson}
          onItemsChange={lessonModal.mode === "edit" ? (items) => {
            const { moduleId, lesson } = lessonModal;
            setModuleList((prev) =>
              prev.map((m) =>
                m.id === moduleId
                  ? { ...m, lessons: m.lessons.map((l) => l.id === lesson.id ? { ...l, items } : l) }
                  : m,
              ),
            );
          } : undefined}
        />
      )}
    </CourseCreationLayout>
  );
}