"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
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
  discardPendingEdit,
  uploadLessonDocument,
  deleteLessonDocument,
} from "@/entities/course";
import type { CourseDetail, CourseModule, CourseLesson, ModerationReview } from "@/entities/course";
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
import { usePageLoadingOverlay } from "@/shared/lib/pageLoadingSignal";
import { WhiteButton } from "@/shared/ui/WhiteButton";

const PUBLISHED_STATUSES = new Set(["published", "hidden"]);

type ModalState =
  | { open: false }
  | { open: true; mode: "add" }
  | { open: true; mode: "edit"; moduleId: number; initialTitle: string };

type LessonModalState =
  | { open: false }
  | { open: true; mode: "add"; moduleId: number }
  | { open: true; mode: "edit"; moduleId: number; lesson: CourseLesson };

export default function CourseContentPage() {
  const t = useTranslations("CourseContentPage");
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  usePageLoadingOverlay(loading);
  const [moduleList, setModuleList] = useState<CourseModule[]>([]);
  const [moderationReview, setModerationReview] = useState<ModerationReview | null>(null);
  /** True when working with a pending edit (published course) instead of a live draft course. */
  const [isPendingEditMode, setIsPendingEditMode] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  /** The slug every CRUD call targets: the live course's slug for a normal draft,
   *  or the hidden PENDING_EDIT shadow course's slug when editing a published course. */
  const [contentSlug, setContentSlug] = useState<string | null>(null);

  const [documentError, setDocumentError] = useState("");

  const [modal, setModal] = useState<ModalState>({ open: false });
  const [lessonModal, setLessonModal] = useState<LessonModalState>({ open: false });

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
          const draft = await getCourseBySlug(pe.draft_course_slug);
          setContentSlug(pe.draft_course_slug);
          setModuleList(Array.isArray(draft.modules) ? draft.modules : []);
        } else {
          setContentSlug(slug);
          setModuleList(Array.isArray(c.modules) ? c.modules : []);
          if (c.moderation_review) setModerationReview(c.moderation_review);
        }
      })
      .catch(() => router.push("/teacher-dashboard/courses"))
      .finally(() => setLoading(false));
  }, [slug, router]);

  async function syncCourseDuration(modules: CourseModule[]) {
    if (!contentSlug) return;
    const totalMin = modules
      .flatMap((m) => m.lessons)
      .reduce((s, l) => s + (l.duration_minutes ?? 0), 0);
    if (totalMin <= 0) return;
    const hours = Math.max(1, Math.ceil(totalMin / 60));
    try {
      await updateCourse(contentSlug, { duration_hours: hours });
    } catch {
      /* best-effort */
    }
  }

  const title = course?.title || t("untitledCourse");
  const hasModules = moduleList.length > 0;
  const hasLesson = moduleList.some((m) => m.lessons.length > 0);

  function openAddModal() {
    setModal({ open: true, mode: "add" });
  }
  function openEditModal(mod: CourseModule) {
    setModal({ open: true, mode: "edit", moduleId: mod.id, initialTitle: mod.title });
  }
  function closeModal() {
    setModal({ open: false });
  }

  async function handleSaveModule(moduleTitle: string) {
    if (!contentSlug) return;
    if (modal.open && modal.mode === "add") {
      const newMod = await createModule(contentSlug, { title: moduleTitle });
      setModuleList((prev) => [...prev, newMod]);
    } else if (modal.open && modal.mode === "edit") {
      const updated = await updateModule(contentSlug, modal.moduleId, { title: moduleTitle });
      setModuleList((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    }
    closeModal();
  }

  async function handleDeleteModule(moduleId: number) {
    if (!contentSlug) return;
    await deleteModule(contentSlug, moduleId);
    const updatedModules = moduleList.filter((m) => m.id !== moduleId);
    setModuleList(updatedModules);
    void syncCourseDuration(updatedModules);
  }

  function openAddLessonModal(moduleId: number) {
    setLessonModal({ open: true, mode: "add", moduleId });
  }
  function openEditLessonModal(moduleId: number, lesson: CourseLesson) {
    setLessonModal({ open: true, mode: "edit", moduleId, lesson });
  }
  function closeLessonModal() {
    setLessonModal({ open: false });
  }

  /** Settles every document call independently: one rejected upload must not discard the
   *  files that did go through, and the lesson itself is already saved by this point. */
  async function syncDocuments(moduleId: number, lessonId: number, values: LessonFormValues) {
    if (!contentSlug) return;

    const deletions = await Promise.allSettled(
      values.deleted_document_ids.map((id) =>
        deleteLessonDocument(contentSlug, moduleId, lessonId, id),
      ),
    );
    const removedIds = values.deleted_document_ids.filter(
      (_, i) => deletions[i].status === "fulfilled",
    );

    const uploads = await Promise.allSettled(
      values.new_documents.map((file) =>
        uploadLessonDocument(contentSlug, moduleId, lessonId, file),
      ),
    );
    const uploaded = uploads.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
    const failedNames = values.new_documents
      .filter((_, i) => uploads[i].status === "rejected")
      .map((file) => file.name);

    setModuleList((prev) =>
      prev.map((m) =>
        m.id === moduleId
          ? {
              ...m,
              lessons: m.lessons.map((l) => {
                if (l.id !== lessonId) return l;
                const kept = (l.documents ?? []).filter((d) => !removedIds.includes(d.id));
                return { ...l, documents: [...kept, ...uploaded] };
              }),
            }
          : m,
      ),
    );

    if (failedNames.length > 0) {
      setDocumentError(t("documentsUploadFailed", { files: failedNames.join(", ") }));
    } else if (deletions.some((r) => r.status === "rejected")) {
      setDocumentError(t("documentsDeleteFailed"));
    } else {
      setDocumentError("");
    }
  }

  async function handleSaveLesson(values: LessonFormValues) {
    if (!contentSlug || !lessonModal.open) return;
    const { mode, moduleId } = lessonModal;
    const lessonId = mode === "edit" ? lessonModal.lesson.id : null;
    const durNum = values.duration_minutes ? parseInt(values.duration_minutes, 10) : null;
    const scoreNum = values.min_score ? parseInt(values.min_score, 10) : null;
    const payload = {
      title: values.title.trim(),
      is_mandatory: values.is_mandatory,
      ...(durNum !== null && !isNaN(durNum) ? { duration_minutes: durNum } : {}),
      ...(scoreNum !== null && !isNaN(scoreNum) ? { min_score: scoreNum } : {}),
    };

    if (mode === "add") {
      const newLesson = await createLesson(contentSlug, moduleId, payload);
      const updatedModules = moduleList.map((m) =>
        m.id === moduleId ? { ...m, lessons: [...m.lessons, newLesson] } : m,
      );
      setModuleList(updatedModules);
      await syncDocuments(moduleId, newLesson.id, values);
      void syncCourseDuration(updatedModules);
      // Switch to edit mode so the user can immediately add content blocks
      setLessonModal({ open: true, mode: "edit", moduleId, lesson: { ...newLesson, items: [] } });
      return;
    } else if (lessonId !== null) {
      const updated = await updateLesson(contentSlug, moduleId, lessonId, payload);
      const updatedModules = moduleList.map((m) =>
        m.id === moduleId
          ? { ...m, lessons: m.lessons.map((l) => (l.id === updated.id ? updated : l)) }
          : m,
      );
      setModuleList(updatedModules);
      await syncDocuments(moduleId, lessonId, values);
      void syncCourseDuration(updatedModules);
    }
    closeLessonModal();
  }

  async function handleDeleteLesson(moduleId: number, lessonId: number) {
    if (!contentSlug) return;
    await deleteLesson(contentSlug, moduleId, lessonId);
    const updatedModules = moduleList.map((m) =>
      m.id === moduleId ? { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) } : m,
    );
    setModuleList(updatedModules);
    void syncCourseDuration(updatedModules);
  }

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

  // NavigationLoadingOverlay already covers the load; avoid a second, plain-text one here.
  if (loading) {
    return <CourseCreationLayout>{null}</CourseCreationLayout>;
  }

  return (
    <CourseCreationLayout>
      <CoursePageHeader title={title} saving={false} onSaveDraft={handleSaveDraft} />
      <CourseCreationStepper currentStep={1} />

      {documentError && (
        <p
          role="alert"
          className="rounded-xl px-4 py-3 text-sm"
          style={{
            fontFamily: "var(--font-base)",
            color: "var(--color-danger)",
            border: "1px solid var(--color-danger)",
          }}
        >
          {documentError}
        </p>
      )}

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
          {t("courseContent")}
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
              ? t("subtitleLocked")
              : t("subtitleEditing")
            : t("subtitleDefault")}
        </p>

        <SectionCard>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "clamp(16px, 1.25vw, 20px)" }}
          >
            <div className="flex items-center justify-between">
              <span
                style={{
                  fontFamily: "var(--font-base)",
                  fontWeight: 700,
                  fontSize: "clamp(14px, 1.04vw, 20px)",
                  color: "var(--color-text-primary)",
                }}
              >
                {t("courseContent")}
              </span>
              {!isLocked && (
                <AccentButton type="button" size="md" style={{ gap: "8px" }} onClick={openAddModal}>
                  <Plus size={20} />
                  {t("addModule")}
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
                    <Image
                      src="/icons/moduls.svg"
                      alt=""
                      width={100}
                      height={100}
                      unoptimized
                      aria-hidden="true"
                    />
                    <div className="flex flex-col items-center" style={{ gap: "8px" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-base)",
                          fontWeight: 700,
                          fontSize: "clamp(14px, 1.04vw, 20px)",
                          color: "var(--color-text-primary)",
                          textAlign: "center",
                        }}
                      >
                        {t("noModulesYet")}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-base)",
                          fontWeight: 500,
                          fontSize: "clamp(13px, 1.04vw, 20px)",
                          color: "var(--color-text-secondary)",
                          letterSpacing: "-0.011em",
                          textAlign: "center",
                        }}
                      >
                        {t("noModulesDescription")}
                      </span>
                    </div>
                  </div>
                  {!isLocked && (
                    <GradientButton type="button" style={{ gap: "8px" }} onClick={openAddModal}>
                      <Plus size={20} />
                      {t("createFirstModule")}
                    </GradientButton>
                  )}
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "clamp(12px, 0.83vw, 16px)",
                }}
              >
                {moduleList.map((mod, i) => (
                  <ModuleCard
                    key={mod.id}
                    module={mod}
                    index={i}
                    onEdit={isLocked ? () => {} : () => openEditModal(mod)}
                    onDelete={isLocked ? () => {} : () => handleDeleteModule(mod.id)}
                    onAddLesson={isLocked ? () => {} : () => openAddLessonModal(mod.id)}
                    onEditLesson={
                      isLocked ? () => {} : (lesson) => openEditLessonModal(mod.id, lesson)
                    }
                    onDeleteLesson={
                      isLocked ? () => {} : (lessonId) => handleDeleteLesson(mod.id, lessonId)
                    }
                    itemStatuses={moderationReview?.content_item_statuses}
                  />
                ))}
              </div>
            )}

            {moderationReview &&
              (() => {
                const ACTION_MAP: Record<string, { label: string; color: string }> = {
                  approved: { label: t("statusApproved"), color: "var(--color-success)" },
                  needs_revision: {
                    label: t("statusNeedsRevision"),
                    color: "var(--color-warning)",
                  },
                  rejected: { label: t("statusRejected"), color: "var(--color-rejected)" },
                };
                const actionInfo = moderationReview.content_action
                  ? ACTION_MAP[moderationReview.content_action]
                  : undefined;
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
                {t("backToBasics")}
              </WhiteButton>

              {isPendingEditMode ? (
                <div className="flex items-center" style={{ gap: "clamp(8px, 0.83vw, 12px)" }}>
                  {!isLocked && (
                    <WhiteButton onClick={handleDiscardChanges}>{t("discardChanges")}</WhiteButton>
                  )}
                  {isLocked ? (
                    <GradientButton
                      type="button"
                      onClick={() => router.push("/teacher-dashboard/courses")}
                      style={{ gap: 12 }}
                    >
                      {t("backToMyCourses")}
                    </GradientButton>
                  ) : (
                    <GradientButton
                      type="button"
                      disabled={!hasLesson}
                      onClick={handleGoToReview}
                      style={{ gap: 12 }}
                    >
                      {t("continueToReviewAndPublish")}
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
                  {t("continueToReviewAndPublish")}
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
          initialValues={
            lessonModal.mode === "edit"
              ? {
                  title: lessonModal.lesson.title,
                  duration_minutes:
                    lessonModal.lesson.duration_minutes != null
                      ? String(lessonModal.lesson.duration_minutes)
                      : "",
                  min_score:
                    lessonModal.lesson.min_score != null
                      ? String(lessonModal.lesson.min_score)
                      : "",
                  is_mandatory: lessonModal.lesson.is_mandatory ?? false,
                  existing_documents: lessonModal.lesson.documents ?? [],
                  new_documents: [],
                  deleted_document_ids: [],
                  items: lessonModal.lesson.items ?? [],
                }
              : undefined
          }
          courseSlug={lessonModal.mode === "edit" ? (contentSlug ?? undefined) : undefined}
          moduleId={lessonModal.mode === "edit" ? lessonModal.moduleId : undefined}
          lessonId={lessonModal.mode === "edit" ? lessonModal.lesson.id : undefined}
          hideDocuments={isPendingEditMode}
          onClose={closeLessonModal}
          onSave={handleSaveLesson}
          onItemsChange={
            lessonModal.mode === "edit"
              ? (items) => {
                  const { moduleId, lesson } = lessonModal;
                  setModuleList((prev) =>
                    prev.map((m) =>
                      m.id === moduleId
                        ? {
                            ...m,
                            lessons: m.lessons.map((l) =>
                              l.id === lesson.id ? { ...l, items } : l,
                            ),
                          }
                        : m,
                    ),
                  );
                }
              : undefined
          }
        />
      )}
    </CourseCreationLayout>
  );
}
