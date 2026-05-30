"use client";

import { useState, useEffect, useCallback } from "react";
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
  createTest,
  updateTest,
  deleteTest,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getPendingEdit,
  savePendingEditModules,
  discardPendingEdit,
  nextTempId,
  uploadLessonDocument,
  deleteLessonDocument,
} from "@/entities/course";
import type { CourseDetail, CourseModule, CourseLesson, CourseTest } from "@/entities/course";
import type { SnapshotModule, SnapshotQuestion } from "@/entities/course";
import {
  CourseCreationLayout,
  CourseCreationStepper,
  CoursePageHeader,
  ModuleCard,
  ModuleFormModal,
  LessonFormModal,
  TestFormModal,
} from "@/features/courses";
import type { LessonFormValues, TestFormValues, TestQuestion } from "@/features/courses";
import { AccentButton } from "@/shared/ui/AccentButton";
import { GradientButton } from "@/shared/ui/GradientButton";
import { SectionCard } from "@/shared/ui/SectionCard";
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

type TestModalState =
  | { open: false }
  | { open: true; mode: "add"; moduleId: number }
  | { open: true; mode: "edit"; moduleId: number; testId: number; initialValues: Partial<TestFormValues> & { questions: TestQuestion[] } };

// ── helpers to convert SnapshotModule ↔ CourseModule ─────────────────────

function snapshotToCourseModule(s: SnapshotModule): CourseModule {
  return {
    id: s.id ?? 0,
    title: s.title,
    description: s.description,
    order: s.order,
    lessons: s.lessons.map((l) => ({
      id: l.id ?? 0,
      title: l.title,
      content: l.content,
      video_url: l.video_url ?? undefined,
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
      content: l.content ?? "",
      video_url: l.video_url ?? null,
      body_html: "",
      duration_minutes: l.duration_minutes ?? null,
      min_score: l.min_score ?? null,
      is_preview: l.is_preview,
      content_type: "text",
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
  /** True when working with a pending edit instead of the live course. */
  const [isPendingEditMode, setIsPendingEditMode] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const [modal, setModal] = useState<ModalState>({ open: false });
  const [lessonModal, setLessonModal] = useState<LessonModalState>({ open: false });
  const [testModal, setTestModal] = useState<TestModalState>({ open: false });

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
          setModuleList(pe.modules_snapshot.map(snapshotToCourseModule));
        } else {
          setModuleList(Array.isArray(c.modules) ? c.modules : []);
        }
      })
      .catch(() => {});
  }, [slug]);

  /** Persist the current moduleList as the pending edit snapshot. */
  const flushSnapshot = useCallback(
    async (modules: CourseModule[]) => {
      if (!slug) return;
      const snapshot = modules.map(courseModuleToSnapshot);
      await savePendingEditModules(slug, snapshot);
    },
    [slug],
  );

  const title = course?.title || "Untitled Course";
  const hasModules = moduleList.length > 0;
  const hasLesson = moduleList.some((m) => m.lessons.length > 0);

  // ── Module handlers ───────────────────────────────────────────────────

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
    } else {
      await deleteModule(slug, moduleId);
      setModuleList((prev) => prev.filter((m) => m.id !== moduleId));
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
      ...(values.content.trim() ? { content: values.content.trim() } : {}),
      ...(values.video_file ? { video: values.video_file } : {}),
      ...(durNum !== null && !isNaN(durNum) ? { duration_minutes: durNum } : {}),
      ...(scoreNum !== null && !isNaN(scoreNum) ? { min_score: scoreNum } : {}),
    };

    if (isPendingEditMode) {
      let updated: CourseModule[];
      if (mode === "add") {
        const newLesson: CourseLesson = {
          id: nextTempId(),
          title: payload.title,
          content: values.content.trim(),
          video_url: undefined,
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
                    ? { ...l, title: payload.title, content: values.content.trim(), duration_minutes: durNum, min_score: scoreNum }
                    : l,
                ),
              }
            : m,
        );
        if (lessonId > 0) await _syncDocuments(moduleId, lessonId, values);
      } else return;
      setModuleList(updated);
      await flushSnapshot(updated);
    } else {
      if (mode === "add") {
        const newLesson = await createLesson(slug, moduleId, payload);
        setModuleList((prev) =>
          prev.map((m) => m.id === moduleId ? { ...m, lessons: [...m.lessons, newLesson] } : m),
        );
        await _syncDocuments(moduleId, newLesson.id, values);
      } else if (lessonId !== null) {
        const updated = await updateLesson(slug, moduleId, lessonId, payload);
        setModuleList((prev) =>
          prev.map((m) =>
            m.id === moduleId
              ? { ...m, lessons: m.lessons.map((l) => (l.id === updated.id ? updated : l)) }
              : m,
          ),
        );
        await _syncDocuments(moduleId, lessonId, values);
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
    } else {
      await deleteLesson(slug, moduleId, lessonId);
      setModuleList((prev) =>
        prev.map((m) =>
          m.id === moduleId ? { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) } : m,
        ),
      );
    }
  }

  // ── Test handlers ─────────────────────────────────────────────────────

  function openAddTestModal(moduleId: number) { setTestModal({ open: true, mode: "add", moduleId }); }
  function closeTestModal() { setTestModal({ open: false }); }

  function openEditTestModal(moduleId: number, test: CourseTest) {
    const questions: TestQuestion[] = test.questions.map((q) => ({
      _key: String(q.id),
      id: q.id,
      type: q.question_type,
      text: q.text,
      options: (q.options.length === 4 ? q.options : [...q.options, "", "", "", ""].slice(0, 4)) as [string, string, string, string],
      correct_index: q.correct_index ?? 0,
      correct_bool: q.correct_bool ?? true,
      sample_answer: q.sample_answer ?? "",
    }));
    setTestModal({ open: true, mode: "edit", moduleId, testId: test.id, initialValues: { title: test.title, description: test.description, passing_score: String(test.passing_score), questions } });
  }

  function buildQuestionPayload(q: TestQuestion) {
    return {
      question_type: q.type,
      text: q.text,
      options: q.type === "multiple_choice" ? q.options : undefined,
      correct_index: q.type === "multiple_choice" ? q.correct_index : undefined,
      correct_bool: q.type === "true_false" ? q.correct_bool : undefined,
      sample_answer: q.type === "short_answer" ? q.sample_answer : undefined,
    };
  }

  async function handleSaveTest(values: TestFormValues) {
    if (!slug || !testModal.open) return;
    const { moduleId } = testModal;

    if (isPendingEditMode) {
      const testId = testModal.mode === "edit" ? testModal.testId : nextTempId();
      const newTest: CourseTest = {
        id: testId,
        title: values.title.trim(),
        description: values.description.trim(),
        passing_score: values.passing_score ? parseInt(values.passing_score, 10) : 70,
        order: testModal.mode === "add"
          ? (moduleList.find((m) => m.id === moduleId)?.tests?.length ?? 0) + 1
          : (moduleList.find((m) => m.id === moduleId)?.tests?.find((t) => t.id === testId)?.order ?? 1),
        questions: values.questions.map((q, i) => ({
          id: q.id ?? nextTempId(),
          question_type: q.type,
          text: q.text,
          options: q.options,
          correct_index: q.correct_index,
          correct_bool: q.correct_bool,
          sample_answer: q.sample_answer ?? "",
          order: i + 1,
        })),
      };
      let updated: CourseModule[];
      if (testModal.mode === "add") {
        updated = moduleList.map((m) =>
          m.id === moduleId ? { ...m, tests: [...(m.tests ?? []), newTest] } : m,
        );
      } else {
        updated = moduleList.map((m) =>
          m.id === moduleId
            ? { ...m, tests: (m.tests ?? []).map((t) => (t.id === testModal.testId ? newTest : t)) }
            : m,
        );
      }
      setModuleList(updated);
      await flushSnapshot(updated);
    } else {
      if (testModal.mode === "add") {
        const test = await createTest(slug, moduleId, {
          title: values.title.trim(),
          description: values.description.trim() || undefined,
          passing_score: values.passing_score ? parseInt(values.passing_score, 10) : undefined,
        });
        const savedQuestions = await Promise.all(
          values.questions.map((q) => createQuestion(slug, moduleId, test.id, buildQuestionPayload(q))),
        );
        setModuleList((prev) =>
          prev.map((m) => m.id === moduleId ? { ...m, tests: [...(m.tests ?? []), { ...test, questions: savedQuestions }] } : m),
        );
      } else {
        const { testId } = testModal;
        const updatedTest = await updateTest(slug, moduleId, testId, {
          title: values.title.trim(),
          description: values.description.trim() || undefined,
          passing_score: values.passing_score ? parseInt(values.passing_score, 10) : undefined,
        });
        const originalIds = new Set(testModal.initialValues.questions.map((q) => q.id).filter(Boolean) as number[]);
        const keptIds = new Set(values.questions.map((q) => q.id).filter(Boolean) as number[]);
        for (const id of originalIds) {
          if (!keptIds.has(id)) await deleteQuestion(slug, moduleId, testId, id);
        }
        const savedQuestions = await Promise.all(
          values.questions.map((q) =>
            q.id
              ? updateQuestion(slug, moduleId, testId, q.id, buildQuestionPayload(q))
              : createQuestion(slug, moduleId, testId, buildQuestionPayload(q)),
          ),
        );
        setModuleList((prev) =>
          prev.map((m) =>
            m.id === moduleId
              ? { ...m, tests: (m.tests ?? []).map((t) => t.id === testId ? { ...updatedTest, questions: savedQuestions } : t) }
              : m,
          ),
        );
      }
    }
    closeTestModal();
  }

  async function handleDeleteTest(moduleId: number, testId: number) {
    if (!slug) return;
    if (isPendingEditMode) {
      const updated = moduleList.map((m) =>
        m.id === moduleId ? { ...m, tests: (m.tests ?? []).filter((t) => t.id !== testId) } : m,
      );
      setModuleList(updated);
      await flushSnapshot(updated);
    } else {
      await deleteTest(slug, moduleId, testId);
      setModuleList((prev) =>
        prev.map((m) =>
          m.id === moduleId ? { ...m, tests: (m.tests ?? []).filter((t) => t.id !== testId) } : m,
        ),
      );
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
                    onAddTest={isLocked ? undefined : () => openAddTestModal(mod.id)}
                    onEditTest={isLocked ? undefined : (test) => openEditTestModal(mod.id, test)}
                    onDeleteTest={isLocked ? undefined : (testId) => handleDeleteTest(mod.id, testId)}
                  />
                ))}
              </div>
            )}

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

      {testModal.open && (
        <TestFormModal
          mode={testModal.mode}
          initialValues={testModal.mode === "edit" ? testModal.initialValues : undefined}
          onClose={closeTestModal}
          onSave={handleSaveTest}
        />
      )}

      {lessonModal.open && (
        <LessonFormModal
          mode={lessonModal.mode}
          initialValues={lessonModal.mode === "edit" ? {
            title: lessonModal.lesson.title,
            content: lessonModal.lesson.content ?? "",
            video_url: lessonModal.lesson.video_url ?? undefined,
            original_video_name: lessonModal.lesson.original_video_name,
            duration_minutes: lessonModal.lesson.duration_minutes != null ? String(lessonModal.lesson.duration_minutes) : "",
            min_score: lessonModal.lesson.min_score != null ? String(lessonModal.lesson.min_score) : "",
            existing_documents: lessonModal.lesson.documents ?? [],
            new_documents: [],
            deleted_document_ids: [],
          } : undefined}
          onClose={closeLessonModal}
          onSave={handleSaveLesson}
        />
      )}
    </CourseCreationLayout>
  );
}