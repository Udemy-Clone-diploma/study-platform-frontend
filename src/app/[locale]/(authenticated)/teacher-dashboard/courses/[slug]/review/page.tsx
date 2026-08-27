"use client";

import React, { useState, useEffect } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
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
import { usePageLoadingOverlay } from "@/shared/lib/pageLoadingSignal";

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
  const t = useTranslations("CourseReviewPage");
  return (
    <div className="flex items-center" style={{ gap: 8 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/play-blue.svg" alt="" style={{ width: 20, height: 20, flexShrink: 0 }} />
      <span style={itemTextSt}>{lesson.title}</span>
      {lesson.duration_minutes != null && (
        <span style={durationTextSt}>{t("lessonMinutes", { count: lesson.duration_minutes })}</span>
      )}
    </div>
  );
}

function TestItem({ test }: { test: CourseTest }) {
  const t = useTranslations("CourseReviewPage");
  return (
    <div className="flex items-center" style={{ gap: 8 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/icons/copy-check-yellow.svg"
        alt=""
        style={{ width: 20, height: 20, flexShrink: 0 }}
      />
      <span style={itemTextSt}>{test.title}</span>
      <span style={durationTextSt}>
        {t("testQuestions", { count: test.questions?.length ?? 0 })}
      </span>
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
  const t = useTranslations("CourseReviewPage");
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
      <div
        style={{ width: "calc(100% - 98px)", display: "flex", flexDirection: "column", gap: 13 }}
      >
        <div className="flex items-center justify-between">
          <span
            style={{
              fontFamily: "var(--font-base)",
              fontWeight: 700,
              fontSize: 20,
              lineHeight: "25px",
            }}
          >
            {t("moduleWithTitle", { order: index + 1, title: module.title })}
          </span>
          <div className="flex items-center" style={{ gap: 8 }}>
            <div className="flex items-center" style={{ gap: 4 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/book.svg" alt="" style={metaIconSt} />
              <span style={grayTextSt}>{t("lessonsCount", { count: lessonCount })}</span>
            </div>
            <div className="flex items-center" style={{ gap: 4 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/test.svg" alt="" style={metaIconSt} />
              <span style={grayTextSt}>{t("testsCount", { count: testCount })}</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {lessonCount === 0 && testCount === 0 ? (
            <div className="flex items-center" style={{ gap: 8 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icons/exclamationmark-triangle.svg"
                alt=""
                style={{ width: 20, height: 20, flexShrink: 0 }}
              />
              <span
                style={{
                  fontFamily: "var(--font-base)",
                  fontWeight: 500,
                  fontSize: 16,
                  lineHeight: "20px",
                  color: "var(--color-pink-dark)",
                }}
              >
                {t("moduleEmpty")}
              </span>
            </div>
          ) : (
            <>
              {lessonCount > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                  <span style={sectionLabelSt}>{t("lessonsLabel")}</span>
                  <TwoColGrid
                    items={module.lessons}
                    renderItem={(l) => <LessonItem lesson={l} />}
                  />
                </div>
              )}
              {testCount > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                  <span style={sectionLabelSt}>{t("testsLabel")}</span>
                  <TwoColGrid
                    items={module.tests as CourseTest[]}
                    renderItem={(t) => <TestItem test={t} />}
                  />
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
  const t = useTranslations("CourseReviewPage");
  const locale = useLocale();
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  usePageLoadingOverlay(loading);
  const [moduleList, setModuleList] = useState<CourseModule[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [isPendingEditMode, setIsPendingEditMode] = useState(false);
  /** Title to display — pending edit's title when in pending edit mode. */
  const [displayTitle, setDisplayTitle] = useState("");

  useEffect(() => {
    if (!slug) return;
    getCourseBySlug(slug, undefined, locale)
      .then(async (c) => {
        setCourse(c);
        const isPublished = PUBLISHED_STATUSES.has(c.status);
        setIsPendingEditMode(isPublished);

        if (isPublished) {
          const pe = await getPendingEdit(slug);
          const draft = await getCourseBySlug(pe.draft_course_slug, undefined, locale);
          setDisplayTitle(draft.title);
          setModuleList(Array.isArray(draft.modules) ? draft.modules : []);
        } else {
          setDisplayTitle(c.title);
          setModuleList(Array.isArray(c.modules) ? c.modules : []);
        }
      })
      .catch(() => router.push("/teacher-dashboard/courses"))
      .finally(() => setLoading(false));
  }, [slug, router, locale]);

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

  const title = displayTitle || course?.title || t("untitledCourse");
  const hasEmptyModule = moduleList.some(
    (m) => m.lessons.length === 0 && (m.tests?.length ?? 0) === 0,
  );
  const hasLesson =
    moduleList.length > 0 && moduleList.some((m) => m.lessons.length > 0) && !hasEmptyModule;

  const totalModules = moduleList.length;
  const totalLessons = moduleList.reduce((acc, m) => acc + m.lessons.length, 0);
  const totalTests = moduleList.reduce((acc, m) => acc + (m.tests?.length ?? 0), 0);
  const totalMinutes = course?.total_duration_minutes ?? 0;

  const categoryName = course?.category?.name ?? "";
  const levelLabel = course?.level ? t(`level.${course.level}`) : "";

  const STATS = [
    { icon: "/icons/book-gradient.svg", count: totalModules, label: t("statModules") },
    { icon: "/icons/play-gradient.svg", count: totalLessons, label: t("statLessons") },
    { icon: "/icons/copy-check-gradient.svg", count: totalTests, label: t("statTests") },
    { icon: "/icons/clock-gradient.svg", count: totalMinutes, label: t("statMinutes") },
  ];

  const pageHeading = isPendingEditMode ? t("reviewChanges") : t("reviewAndPublish");
  const pageSubheading = isPendingEditMode
    ? t("reviewChangesSubheading")
    : t("reviewPublishSubheading");
  const submitLabel = t("continueToReviewAndPublish");

  // NavigationLoadingOverlay already covers the load; avoid a second, plain-text one here.
  if (loading) {
    return <CourseCreationLayout>{null}</CourseCreationLayout>;
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
            {t("courseOverview")}
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
                <img
                  src="/icons/book-gradient.svg"
                  alt=""
                  style={{ width: "clamp(36px, 2.6vw, 50px)", height: "clamp(36px, 2.6vw, 50px)" }}
                />
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

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 20,
                flexShrink: 0,
              }}
            >
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

        <CourseStatsGrid stats={STATS} />

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
            {t("courseStructure")}
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {moduleList.map((mod, i) => (
              <ModuleReviewCard key={mod.id} module={mod} index={i} />
            ))}
          </div>
        </div>

        <ModeratorNoteBanner
          title={t("moderatorComment")}
          comment={course?.moderator_comment ?? undefined}
        />

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
            {t("backToEdit")}
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
            {submitting ? t("submitting") : submitLabel}
          </button>
        </div>
      </div>
    </CourseCreationLayout>
  );
}
