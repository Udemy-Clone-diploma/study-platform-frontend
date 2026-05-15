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
} from "@/entities/course";
import type { CourseDetail, CourseModule } from "@/entities/course";
import {
  CourseCreationLayout,
  CourseCreationStepper,
  CoursePageHeader,
  ModuleCard,
  ModuleFormModal,
} from "@/features/courses";
import { AccentButton } from "@/shared/ui/AccentButton";
import { GradientButton } from "@/shared/ui/GradientButton";
import { SectionCard } from "@/shared/ui/SectionCard";
import { WhiteButton } from "@/shared/ui/WhiteButton";


type ModalState =
  | { open: false }
  | { open: true; mode: "add" }
  | { open: true; mode: "edit"; moduleId: number; initialTitle: string };

export default function CourseContentPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [moduleList, setModuleList] = useState<CourseModule[]>([]);
  const [modal, setModal] = useState<ModalState>({ open: false });

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

            <GradientButton type="button" disabled={!hasModules} style={{ gap: 12 }}>
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
    </CourseCreationLayout>
  );
}
