"use client";

import { useState, useEffect } from "react";
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
} from "@/entities/course";
import type { CourseDetail, CourseModule, CourseLesson, CourseTest } from "@/entities/course";
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

export default function CourseContentPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [moduleList, setModuleList] = useState<CourseModule[]>([]);
  const [modal, setModal] = useState<ModalState>({ open: false });
  const [lessonModal, setLessonModal] = useState<LessonModalState>({ open: false });
  const [testModal, setTestModal] = useState<TestModalState>({ open: false });

  useEffect(() => {
    if (slug) {
      getCourseBySlug(slug)
        .then((c) => {
          setCourse(c);
          setModuleList(Array.isArray(c.modules) ? c.modules : []);
        })
        .catch(() => {});
    }
  }, [slug]);

  const title = course?.title || "Untitled Course";
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
    if (!slug) return;
    if (modal.open && modal.mode === "add") {
      const newMod = await createModule(slug, { title: moduleTitle });
      setModuleList((prev) => [...prev, newMod]);
    } else if (modal.open && modal.mode === "edit") {
      const updated = await updateModule(slug, modal.moduleId, { title: moduleTitle });
      setModuleList((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    }
    closeModal();
  }

  async function handleDeleteModule(moduleId: number) {
    if (!slug) return;
    await deleteModule(slug, moduleId);
    setModuleList((prev) => prev.filter((m) => m.id !== moduleId));
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

  async function handleSaveLesson(values: LessonFormValues) {
    if (!slug || !lessonModal.open) return;
    const mode = lessonModal.mode;
    const moduleId = lessonModal.moduleId;
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
    if (mode === "add") {
      const newLesson = await createLesson(slug, moduleId, payload);
      setModuleList((prev) =>
        prev.map((m) => m.id === moduleId ? { ...m, lessons: [...m.lessons, newLesson] } : m),
      );
    } else if (lessonId !== null) {
      const updated = await updateLesson(slug, moduleId, lessonId, payload);
      setModuleList((prev) =>
        prev.map((m) =>
          m.id === moduleId
            ? { ...m, lessons: m.lessons.map((l) => (l.id === updated.id ? updated : l)) }
            : m,
        ),
      );
    }
    closeLessonModal();
  }

  async function handleDeleteLesson(moduleId: number, lessonId: number) {
    if (!slug) return;
    await deleteLesson(slug, moduleId, lessonId);
    setModuleList((prev) =>
      prev.map((m) =>
        m.id === moduleId ? { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) } : m,
      ),
    );
  }

  async function handleDeleteTest(moduleId: number, testId: number) {
    if (!slug) return;
    await deleteTest(slug, moduleId, testId);
    setModuleList((prev) =>
      prev.map((m) =>
        m.id === moduleId ? { ...m, tests: (m.tests ?? []).filter((t) => t.id !== testId) } : m,
      ),
    );
  }

  function openAddTestModal(moduleId: number) {
    setTestModal({ open: true, mode: "add", moduleId });
  }

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
    setTestModal({
      open: true,
      mode: "edit",
      moduleId,
      testId: test.id,
      initialValues: {
        title: test.title,
        description: test.description,
        passing_score: String(test.passing_score),
        questions,
      },
    });
  }

  function closeTestModal() {
    setTestModal({ open: false });
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
    closeTestModal();
  }

  function handleSaveDraft() {
    router.push("/teacher-dashboard/courses");
  }

  return (
    <CourseCreationLayout>
      <CoursePageHeader title={title} saving={false} onSaveDraft={handleSaveDraft} />
      <CourseCreationStepper currentStep={1} />

      {/* ── Content card ── */}
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
          Create modules, lessons, and assessments for your course
        </p>

        {/* ── Modules section ── */}
        <SectionCard>
          <div style={{ display: "flex", flexDirection: "column", gap: "clamp(16px, 1.25vw, 20px)" }}>
          {/* Row: label + Add Module button */}
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
            <AccentButton type="button" size="md" style={{ gap: "8px" }} onClick={openAddModal}>
              <Plus size={20} />
              Add Module
            </AccentButton>
          </div>

          {/* Empty state */}
          {!hasModules ? (
            <div
              className="flex items-center justify-center"
              style={{
                padding: "clamp(32px, 2.6vw, 50px) 24px",
              }}
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
                      No modules yet
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
                      Create your first module to start building your course structure
                    </span>
                  </div>
                </div>

                <GradientButton type="button" style={{ gap: "8px" }} onClick={openAddModal}>
                  <Plus size={20} />
                  Create Your First Module
                </GradientButton>
              </div>
            </div>
          ) : (
            /* Module list */
            <div
              style={{ display: "flex", flexDirection: "column", gap: "clamp(12px, 0.83vw, 16px)" }}
            >
              {moduleList.map((mod, i) => (
                <ModuleCard
                  key={mod.id}
                  module={mod}
                  index={i}
                  onEdit={() => openEditModal(mod)}
                  onDelete={() => handleDeleteModule(mod.id)}
                  onAddLesson={() => openAddLessonModal(mod.id)}
                  onEditLesson={(lesson) => openEditLessonModal(mod.id, lesson)}
                  onDeleteLesson={(lessonId) => handleDeleteLesson(mod.id, lessonId)}
                  onAddTest={() => openAddTestModal(mod.id)}
                  onEditTest={(test) => openEditTestModal(mod.id, test)}
                  onDeleteTest={(testId) => handleDeleteTest(mod.id, testId)}
                />
              ))}
            </div>
          )}

          {/* Bottom row: back + continue */}
          <div
            className="flex items-center justify-between"
            style={{ marginTop: "clamp(8px, 0.63vw, 12px)" }}
          >
            <WhiteButton onClick={() => router.push(`/teacher-dashboard/courses/${slug}/edit`)}>
              Back to Basics
            </WhiteButton>

            <GradientButton
              type="button"
              disabled={!hasLesson}
              onClick={() => router.push(`/teacher-dashboard/courses/${slug}/review`)}
              style={{ gap: 12 }}
            >
              Continue to Review &amp; Publish
              <ArrowUpRight size={20} aria-hidden="true" />
            </GradientButton>
          </div>
          </div>
        </SectionCard>
      </div>

      {/* ── Module form modal ── */}
      {modal.open && (
        <ModuleFormModal
          mode={modal.mode}
          initialTitle={modal.mode === "edit" ? modal.initialTitle : ""}
          onClose={closeModal}
          onSave={handleSaveModule}
        />
      )}

      {/* ── Test form modal ── */}
      {testModal.open && (
        <TestFormModal
          mode={testModal.mode}
          initialValues={testModal.mode === "edit" ? testModal.initialValues : undefined}
          onClose={closeTestModal}
          onSave={handleSaveTest}
        />
      )}

      {/* ── Lesson form modal ── */}
      {lessonModal.open && (
        <LessonFormModal
          mode={lessonModal.mode}
          initialValues={lessonModal.mode === "edit" ? {
            title: lessonModal.lesson.title,
            content: lessonModal.lesson.content ?? "",
            video_url: lessonModal.lesson.video_url ?? undefined,
            duration_minutes: lessonModal.lesson.duration_minutes != null
              ? String(lessonModal.lesson.duration_minutes)
              : "",
            min_score: lessonModal.lesson.min_score != null
              ? String(lessonModal.lesson.min_score)
              : "",
          } : undefined}
          onClose={closeLessonModal}
          onSave={handleSaveLesson}
        />
      )}
    </CourseCreationLayout>
  );
}
