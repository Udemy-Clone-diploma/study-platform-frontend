"use client";

import React, { useState, useEffect } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  getCourseBySlug,
  submitCourseForReview,
  getPendingEdit,
  submitPendingEdit,
} from "@/entities/course";
import type { CourseDetail, CourseModule, CourseLesson, CourseTest } from "@/entities/course";
import {
  CourseCreationLayout,
  CourseCreationStepper,
  CoursePageHeader,
  CourseStatsGrid,
  ModeratorNoteBanner,
} from "@/features/courses";

const PUBLISHED_STATUSES = new Set(["published", "hidden"]);

const metaIconSt: CSSProperties = { width: 16, height: 16, flexShrink: 0 };
const grayTextSt: CSSProperties = {
  fontFamily: "var(--font-base)",
  fontWeight: 700,
  fontSize: 14,
  lineHeight: "18px",
  color: "var(--color-text-secondary)",
};
const sectionLabelSt: CSSProperties = {
  fontFamily: "var(--font-base)",
  fontWeight: 700,
  fontSize: 15,
  lineHeight: "19px",
  color: "var(--color-text-secondary)",
};
const itemTextSt: CSSProperties = {
  fontFamily: "var(--font-base)",
  fontWeight: 400,
  fontSize: 15,
  lineHeight: "19px",
};
const durationTextSt: CSSProperties = {
  ...itemTextSt,
  color: "var(--color-text-secondary)",
};

function LessonItem({ lesson }: { lesson: CourseLesson }) {
  return (
    <div className="flex items-center" style={{ gap: 8 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/play-blue.svg" alt="" style={{ width: 20, height: 20, flexShrink: 0 }} />
      <span style={itemTextSt}>{lesson.title}</span>
      {lesson.duration_minutes != null && (
        <span style={durationTextSt}>({lesson.duration_minutes} min)</span>
      )}
    </div>
  );
}

function TestItem({ test }: { test: CourseTest }) {
  return (
    <div className="flex items-center" style={{ gap: 8 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/copy-check-yellow.svg" alt="" style={{ width: 20, height: 20, flexShrink: 0 }} />
      <span style={itemTextSt}>{test.title}</span>
      <span style={durationTextSt}>({test.questions?.length ?? 0} questions)</span>
    </div>
  );
}

function TwoColGrid<T>({ items, renderItem }: { items: T[]; renderItem: (item: T) => ReactNode }) {
  const left = items.filter((_, i) => i % 2 === 0);
  const right = items.filter((_, i) => i % 2 === 1);
  const rows = Math.ceil(items.length / 2);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 0" }}>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <React.Fragment key={rowIdx}>
          <div>{left[rowIdx] ? renderItem(left[rowIdx]) : null}</div>
          <div>{right[rowIdx] ? renderItem(right[rowIdx]) : null}</div>
        </React.Fragment>
      ))}
    </div>
  );
}

function ModuleReviewCard({ module, index }: { module: CourseModule; index: number }) {
  const lessonCount = module.lessons.length;
  const testCount = module.tests?.length ?? 0;

  return (
    <div
      style={{
        border: "1px solid var(--color-draft)",
        borderRadius: 16,
        padding: "28px 0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
      }}
    >
      <div style={{ width: "calc(100% - 98px)", display: "flex", flexDirection: "column", gap: 13 }}>
        <div className="flex items-center justify-between">
          <span style={{ fontFamily: "var(--font-base)", fontWeight: 700, fontSize: 20, lineHeight: "25px" }}>
            Module {index + 1}: {module.title}
          </span>
          <div className="flex items-center" style={{ gap: 8 }}>
            <div className="flex items-center" style={{ gap: 4 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/book.svg" alt="" style={metaIconSt} />
              <span style={grayTextSt}>{lessonCount} lessons</span>
            </div>
            <div className="flex items-center" style={{ gap: 4 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/test.svg" alt="" style={metaIconSt} />
              <span style={grayTextSt}>{testCount} tests</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {lessonCount === 0 && testCount === 0 ? (
            <div className="flex items-center" style={{ gap: 8 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/exclamationmark-triangle.svg" alt="" style={{ width: 20, height: 20, flexShrink: 0 }} />
              <span style={{ fontFamily: "var(--font-base)", fontWeight: 500, fontSize: 16, lineHeight: "20px", color: "var(--color-pink-dark)" }}>
                This module is empty
              </span>
            </div>
          ) : (
            <>
              {lessonCount > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                  <span style={sectionLabelSt}>Lessons:</span>
                  <TwoColGrid items={module.lessons} renderItem={(l) => <LessonItem lesson={l} />} />
                </div>
              )}
              {testCount > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                  <span style={sectionLabelSt}>Tests:</span>
                  <TwoColGrid items={module.tests as CourseTest[]} renderItem={(t) => <TestItem test={t} />} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CourseReviewPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [moduleList, setModuleList] = useState<CourseModule[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [isPendingEditMode, setIsPendingEditMode] = useState(false);
  /** Title to display — pending edit's title when in pending edit mode. */
  const [displayTitle, setDisplayTitle] = useState("");

  useEffect(() => {
    if (!slug) return;
    getCourseBySlug(slug)
      .then(async (c) => {
        setCourse(c);
        const isPublished = PUBLISHED_STATUSES.has(c.status);
        setIsPendingEditMode(isPublished);

        if (isPublished) {
          const pe = await getPendingEdit(slug);
          const draft = await getCourseBySlug(pe.draft_course_slug);
          setDisplayTitle(draft.title);
          setModuleList(Array.isArray(draft.modules) ? draft.modules : []);
        } else {
          setDisplayTitle(c.title);
          setModuleList(Array.isArray(c.modules) ? c.modules : []);
        }
      })
      .catch(() => router.push("/teacher-dashboard/courses"))
      .finally(() => setLoading(false));
  }, [slug, router]);

  async function handleSubmit() {
    if (!slug || submitting) return;
    setSubmitting(true);
    try {
      if (isPendingEditMode) {
        await submitPendingEdit(slug);
      } else {
        await submitCourseForReview(slug);
      }
      router.push("/teacher-dashboard/courses");
    } finally {
      setSubmitting(false);
    }
  }

  const title = displayTitle || course?.title || "Untitled Course";
  const hasEmptyModule = moduleList.some((m) => m.lessons.length === 0 && (m.tests?.length ?? 0) === 0);
  const hasLesson = moduleList.length > 0 && moduleList.some((m) => m.lessons.length > 0) && !hasEmptyModule;

  const totalModules = moduleList.length;
  const totalLessons = moduleList.reduce((acc, m) => acc + m.lessons.length, 0);
  const totalTests = moduleList.reduce((acc, m) => acc + (m.tests?.length ?? 0), 0);
  const totalMinutes = course?.total_duration_minutes ?? 0;

  const categoryName = course?.category?.name ?? "";
  const levelLabel = course?.level
    ? course.level.charAt(0).toUpperCase() + course.level.slice(1)
    : "";

  const STATS = [
    { icon: "/icons/book-gradient.svg",       count: totalModules, label: "Modules" },
    { icon: "/icons/play-gradient.svg",       count: totalLessons, label: "Lessons" },
    { icon: "/icons/copy-check-gradient.svg", count: totalTests,   label: "Tests"   },
    { icon: "/icons/clock-gradient.svg",      count: totalMinutes, label: "Minutes" },
  ];

  const pageHeading = isPendingEditMode ? "Review Changes" : "Review & Publish";
  const pageSubheading = isPendingEditMode
    ? "Review your changes before submitting for moderation"
    : "Review your course content and publish when ready";
  const submitLabel = "Continue to Review & Publish";

  if (loading) {
    return (
      <CourseCreationLayout>
        <p
          style={{
            fontFamily: "var(--font-base)",
            fontSize: "clamp(14px, 0.83vw, 16px)",
            color: "var(--color-text-secondary)",
            textAlign: "center",
            padding: "clamp(40px, 6vw, 80px) 0",
          }}
        >
          Loading…
        </p>
      </CourseCreationLayout>
    );
  }

  return (
    <CourseCreationLayout>
      <CoursePageHeader
        title={title}
        saving={submitting}
        canPublish={hasLesson && !submitting}
        onSaveDraft={() => router.push("/teacher-dashboard/courses")}
        onContinue={handleSubmit}
      />
      <CourseCreationStepper currentStep={2} />

      <div
        className="rounded-2xl bg-white"
        style={{
          padding: "clamp(24px, 2.08vw, 40px) clamp(24px, 2.6vw, 50px)",
          boxShadow: "var(--shadow-dashboard-card)",
          display: "flex",
          flexDirection: "column",
          gap: "clamp(16px, 1.25vw, 28px)",
        }}
      >
        {/* Page heading */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h2
            style={{
              fontFamily: "var(--font-base)",
              fontWeight: 700,
              fontSize: "clamp(20px, 1.875vw, 36px)",
              lineHeight: "125%",
              color: "var(--color-text-primary)",
            }}
          >
            {pageHeading}
          </h2>
          <p
            style={{
              fontFamily: "var(--font-base)",
              fontWeight: 500,
              fontSize: "clamp(13px, 1.04vw, 20px)",
              lineHeight: "150%",
              letterSpacing: "-0.011em",
              color: "var(--color-text-secondary)",
            }}
          >
            {pageSubheading}
          </p>
        </div>

        {/* Course Overview card */}
        <div
          style={{
            border: "2px solid var(--color-border-light)",
            borderRadius: 16,
            padding: "clamp(20px, 1.46vw, 28px) clamp(24px, 2.6vw, 50px)",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-base)",
              fontWeight: 400,
              fontSize: "clamp(15px, 1.04vw, 20px)",
              lineHeight: "150%",
              letterSpacing: "-0.011em",
            }}
          >
            Course Overview
          </span>
          <div className="flex items-start justify-between" style={{ gap: 16 }}>
            <div className="flex items-center" style={{ gap: 12, minWidth: 0 }}>
              <div
                style={{
                  width: "clamp(72px, 5.21vw, 100px)",
                  height: "clamp(48px, 3.33vw, 64px)",
                  background: "var(--color-text-primary)",
                  borderRadius: 8,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/book-gradient.svg" alt="" style={{ width: "clamp(36px, 2.6vw, 50px)", height: "clamp(36px, 2.6vw, 50px)" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0, minWidth: 0 }}>
                <span
                  style={{
                    fontFamily: "var(--font-base)",
                    fontWeight: 700,
                    fontSize: "clamp(13px, 0.83vw, 16px)",
                    lineHeight: "20px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {title}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-base)",
                    fontWeight: 500,
                    fontSize: "clamp(12px, 0.78vw, 15px)",
                    lineHeight: "19px",
                    color: "var(--color-text-secondary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {course?.short_description}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 20, flexShrink: 0 }}>
              <div className="flex items-center" style={{ gap: 8 }}>
                {categoryName && (
                  <span
                    style={{
                      background: "var(--gradient-brand)",
                      borderRadius: 20,
                      padding: "2px 12px",
                      fontFamily: "var(--font-accent)",
                      fontWeight: 500,
                      fontSize: "clamp(12px, 0.78vw, 15px)",
                      lineHeight: "19px",
                    }}
                  >
                    {categoryName}
                  </span>
                )}
                {levelLabel && (
                  <span
                    style={{
                      border: "1px solid var(--color-draft)",
                      borderRadius: 20,
                      padding: "2px 12px",
                      fontFamily: "var(--font-accent)",
                      fontWeight: 500,
                      fontSize: "clamp(12px, 0.78vw, 15px)",
                      lineHeight: "19px",
                      background: "var(--color-bg)",
                    }}
                  >
                    {levelLabel}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <CourseStatsGrid stats={STATS} />

        {/* Course Structure */}
        <div
          style={{
            border: "1px solid var(--color-draft)",
            borderRadius: 16,
            padding: "clamp(20px, 1.46vw, 28px) clamp(24px, 2.6vw, 50px)",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-base)",
              fontWeight: 400,
              fontSize: "clamp(15px, 1.04vw, 20px)",
              lineHeight: "150%",
              letterSpacing: "-0.011em",
            }}
          >
            Course Structure
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {moduleList.map((mod, i) => (
              <ModuleReviewCard key={mod.id} module={mod} index={i} />
            ))}
          </div>
        </div>

        {/* Moderator final comment */}
        <ModeratorNoteBanner title="Moderator comment" comment={course?.moderator_comment ?? undefined} />

        {/* Bottom: back + submit */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push(`/teacher-dashboard/courses/${slug}/content`)}
            className="inline-flex items-center transition hover:opacity-80"
            style={{
              gap: 10,
              border: "1px solid var(--color-draft)",
              borderRadius: 28,
              padding: "4px 16px",
              background: "var(--color-bg)",
              fontFamily: "var(--font-accent)",
              fontWeight: 500,
              fontSize: "clamp(15px, 1.04vw, 20px)",
              lineHeight: "150%",
              letterSpacing: "-0.011em",
              cursor: "pointer",
              height: 44,
            }}
          >
            <ArrowLeft size={20} />
            Back to Edit
          </button>

          <button
            type="button"
            disabled={!hasLesson || submitting}
            onClick={handleSubmit}
            className="inline-flex items-center transition hover:opacity-80 disabled:opacity-40"
            style={{
              gap: 10,
              background: hasLesson && !submitting ? "var(--gradient-brand)" : undefined,
              backgroundColor: hasLesson && !submitting ? undefined : "var(--color-draft)",
              borderRadius: 28,
              padding: "clamp(8px, 0.83vw, 12px) clamp(16px, 1.94vw, 28px)",
              fontFamily: "var(--font-accent)",
              fontWeight: 500,
              fontSize: "clamp(14px, 1.39vw, 20px)",
              cursor: hasLesson && !submitting ? "pointer" : "not-allowed",
              border: "none",
              color: "var(--color-text-primary)",
            }}
          >
            {submitting ? "Submitting..." : submitLabel}
          </button>
        </div>
      </div>
    </CourseCreationLayout>
  );
}