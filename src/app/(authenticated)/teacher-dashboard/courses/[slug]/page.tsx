"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { BookOpen, ChevronDown, Clock, Play, SquareCheck, Star, Users } from "lucide-react";
import { getCourseBySlug } from "@/entities/course";
import type { CourseDetail, CourseStatus } from "@/entities/course";
import { CourseManagementInfoTab, CourseManagementContentTab, CourseManagementPricingTab } from "@/features/courses";
import { AccentButton } from "@/shared/ui/AccentButton";
import { WhiteButton } from "@/shared/ui/WhiteButton";

// ── Lookups ────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<CourseStatus, string> = {
  draft:          "Draft",
  review:         "In Review",
  needs_revision: "Needs Revision",
  rejected:       "Rejected",
  published:      "Published",
  hidden:         "Hidden",
  archived:       "Archived",
};

const STATUS_BG: Record<CourseStatus, string> = {
  draft:          "var(--color-draft)",
  review:         "var(--color-warning)",
  needs_revision: "var(--color-warning)",
  rejected:       "var(--color-rejected)",
  published:      "var(--color-success)",
  hidden:         "var(--color-text-secondary)",
  archived:       "var(--color-text-muted)",
};

const LEVEL_LABEL: Record<string, string> = {
  beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced",
};

// ── Tabs ───────────────────────────────────────────────────────────────────

type Tab = "info" | "content" | "pricing" | "cohorts" | "schedule";

const TABS: { id: Tab; label: string }[] = [
  { id: "info",     label: "Info" },
  { id: "content",  label: "Content" },
  { id: "pricing",  label: "Pricing" },
  { id: "cohorts",  label: "Cohorts" },
  { id: "schedule", label: "Schedule" },
];

// ── Page ───────────────────────────────────────────────────────────────────

export default function CourseManagementPage() {
  const { slug }            = useParams<{ slug: string }>();
  const router              = useRouter();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const [tab, setTab]       = useState<Tab>("info");
  const [descExpanded, setDescExpanded] = useState(false);

  useEffect(() => {
    if (!slug) return;
    getCourseBySlug(slug)
      .then(setCourse)
      .catch(() => setError("Failed to load course."))
      .finally(() => setLoading(false));
  }, [slug]);

  function handleCourseUpdated(updates: Partial<CourseDetail>) {
    setCourse(prev => prev ? { ...prev, ...updates } : prev);
  }

  if (loading) {
    return (
      <main className="bg-my-courses min-h-[calc(100vh-76px)] flex items-center justify-center">
        <p style={{ fontFamily: "var(--font-base)", fontSize: "clamp(14px, 0.83vw, 16px)", color: "var(--color-text-secondary)" }}>
          Loading…
        </p>
      </main>
    );
  }

  if (error || !course) {
    return (
      <main className="bg-my-courses min-h-[calc(100vh-76px)] flex flex-col items-center justify-center" style={{ gap: 16 }}>
        <p style={{ fontFamily: "var(--font-base)", fontSize: "clamp(14px, 0.83vw, 16px)", color: "var(--color-text-secondary)" }}>
          {error ?? "Course not found."}
        </p>
        <AccentButton type="button" size="md" onClick={() => router.push("/teacher-dashboard/courses")}>
          Back to my courses
        </AccentButton>
      </main>
    );
  }

  const statusBg    = STATUS_BG[course.status]    ?? "var(--color-draft)";
  const statusLabel = STATUS_LABEL[course.status] ?? course.status;

  const modulesCount = course.modules.length;
  const testsCount   = course.modules.reduce((s, m) => s + m.tests.length, 0);

  const DESC_LIMIT = 260;
  const descIsLong = course.full_description.length > DESC_LIMIT;

  const STAT_ST: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 6,
    fontFamily: "var(--font-base)",
    fontSize: "clamp(12px, 0.83vw, 15px)",
    color: "var(--color-text-secondary)",
  };

  const ICON_BOX: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    width: 22, height: 22, borderRadius: 7, flexShrink: 0,
    border: "1.5px solid transparent",
    background: "linear-gradient(var(--color-bg), var(--color-bg)) padding-box, var(--gradient-brand) border-box",
  };

  // Pill styles matching Step 3 review page
  const CATEGORY_PILL: React.CSSProperties = {
    background: "var(--gradient-brand)",
    borderRadius: 20,
    padding: "clamp(2px, 0.21vw, 4px) clamp(10px, 0.83vw, 14px)",
    fontFamily: "var(--font-accent)",
    fontWeight: 500,
    fontSize: "clamp(11px, 0.78vw, 15px)",
  };

  const LEVEL_PILL: React.CSSProperties = {
    border: "1px solid var(--color-draft)",
    borderRadius: 20,
    padding: "clamp(2px, 0.21vw, 4px) clamp(10px, 0.83vw, 14px)",
    fontFamily: "var(--font-accent)",
    fontWeight: 500,
    fontSize: "clamp(11px, 0.78vw, 15px)",
    background: "var(--color-bg)",
  };

  return (
    <main
      className="bg-my-courses min-h-[calc(100vh-76px)]"
      style={{ paddingInline: "clamp(16px, 2.78vw, 40px)", paddingBlock: "clamp(16px, 1.67vw, 28px)" }}
    >
      {/* Back nav */}
      <div style={{ marginBottom: "clamp(16px, 1.39vw, 24px)" }}>
        <WhiteButton onClick={() => router.push("/teacher-dashboard/courses")}>My courses</WhiteButton>
      </div>

      {/* ── Course header ─────────────────────────────────────────────── */}
      <div style={{ marginBottom: "clamp(20px, 1.67vw, 32px)" }}>

        {/* Hero row: image + title/meta */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "clamp(20px, 2.08vw, 32px)", marginBottom: "clamp(16px, 1.39vw, 24px)" }}>

          {/* Gradient-bordered image */}
          <div style={{ background: "var(--gradient-brand)", borderRadius: 24, padding: 3, flexShrink: 0 }}>
            <div style={{ width: "clamp(100px, 8.33vw, 120px)", height: "clamp(100px, 8.33vw, 120px)", borderRadius: 21, overflow: "hidden", background: "var(--color-bg)" }}>
              {course.image ? (
                <Image src={course.image} alt="" width={120} height={120} unoptimized style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", background: "var(--color-input-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <BookOpen size={32} style={{ color: "var(--color-text-muted)" }} />
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "clamp(10px, 0.83vw, 14px)" }}>

            {/* Title + status */}
            <div style={{ display: "flex", alignItems: "flex-start", flexWrap: "wrap", gap: "clamp(8px, 0.69vw, 12px)" }}>
              <h1 style={{ fontFamily: "var(--font-base)", fontWeight: 700, fontSize: "clamp(22px, 1.88vw, 34px)", lineHeight: 1.2, color: "var(--color-text-primary)", margin: 0 }}>
                {course.title}
              </h1>
              <span style={{ background: statusBg, color: "white", borderRadius: 999, padding: "clamp(3px, 0.26vw, 5px) clamp(10px, 0.83vw, 14px)", fontFamily: "var(--font-accent)", fontWeight: 600, fontSize: "clamp(9px, 0.63vw, 12px)", letterSpacing: "0.04em", alignSelf: "center", flexShrink: 0 }}>
                {statusLabel}
              </span>
            </div>

            {/* Category + Level pills — Step-3 style */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {course.category && <span style={CATEGORY_PILL}>{course.category.name}</span>}
              <span style={LEVEL_PILL}>{LEVEL_LABEL[course.level] ?? course.level}</span>
            </div>

            {/* Short description */}
            <p style={{ fontFamily: "var(--font-base)", fontSize: "clamp(14px, 1.04vw, 18px)", color: "var(--color-text-secondary)", lineHeight: 1.6, margin: 0 }}>
              {course.short_description}
            </p>

            {/* Stats: rating · students | modules · lessons · tests · minutes */}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "clamp(6px, 0.52vw, 10px)" }}>
              <span style={STAT_ST}>
                <span style={ICON_BOX}><Star size={13} style={{ color: "var(--color-gold)" }} /></span>
                {parseFloat(course.rating_avg).toFixed(1)} ({course.rating_count})
              </span>
              <span style={STAT_ST}>
                <span style={ICON_BOX}><Users size={13} style={{ color: "var(--color-text-muted)" }} /></span>
                {course.students_count} students
              </span>
              <div style={{ width: 1, height: 14, background: "var(--color-border-light)" }} />
              {([
                { icon: <BookOpen    size={13} style={{ color: "var(--color-brand-lavender)" }} />, count: modulesCount,                  label: "modules" },
                { icon: <Play        size={13} style={{ color: "var(--color-brand-lavender)" }} />, count: course.lessons_count,          label: "lessons" },
                { icon: <SquareCheck size={13} style={{ color: "var(--color-brand-lavender)" }} />, count: testsCount,                    label: "tests"   },
                { icon: <Clock       size={13} style={{ color: "var(--color-brand-lavender)" }} />, count: course.total_duration_minutes, label: "min"     },
              ] as const).map(({ icon, count, label }) => (
                <span key={label} style={STAT_ST}>
                  <span style={ICON_BOX}>{icon}</span>
                  {count} {label}
                </span>
              ))}
              {course.duration_hours != null && course.duration_hours > 0 && <>
                <div style={{ width: 1, height: 14, background: "var(--color-border-light)" }} />
                <span style={STAT_ST}>≈ {course.duration_hours}h</span>
              </>}
            </div>
          </div>
        </div>

        {/* Full description (collapsible) */}
        {course.full_description ? (
          <div style={{ marginTop: "clamp(16px, 1.39vw, 24px)", borderTop: "1px solid var(--color-border-light)", paddingTop: "clamp(16px, 1.39vw, 24px)" }}>
            <p style={{ fontFamily: "var(--font-base)", fontSize: "clamp(13px, 0.9vw, 17px)", color: "var(--color-text-secondary)", lineHeight: 1.7, margin: "0 0 8px" }}>
              {descExpanded || !descIsLong
                ? course.full_description
                : course.full_description.slice(0, DESC_LIMIT) + "…"}
            </p>
            {descIsLong && (
              <button
                type="button"
                onClick={() => setDescExpanded(v => !v)}
                style={{ fontFamily: "var(--font-base)", fontWeight: 600, fontSize: "clamp(12px, 0.83vw, 14px)", color: "var(--color-blue)", background: "none", border: "none", cursor: "pointer", padding: 0, display: "inline-flex", alignItems: "center", gap: 4 }}
              >
                {descExpanded ? "Show less" : "Show full description"}
                <ChevronDown size={14} style={{ transform: descExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
              </button>
            )}
          </div>
        ) : null}
      </div>

      {/* ── Tab bar ──────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--color-border-light)", marginBottom: "clamp(16px, 1.39vw, 28px)" }}>
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            style={{
              fontFamily: "var(--font-base)", fontWeight: 600,
              fontSize: "clamp(13px, 0.83vw, 15px)",
              padding: "clamp(8px, 0.69vw, 12px) clamp(14px, 1.25vw, 22px)",
              color: tab === id ? "var(--color-blue)" : "var(--color-text-secondary)",
              borderBottom: tab === id ? "2px solid var(--color-blue)" : "2px solid transparent",
              marginBottom: -1,
              background: "none",
              border: tab === id ? undefined : "none",
              cursor: "pointer",
              transition: "color 0.15s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab content ───────────────────────────────────────────────────── */}
      {tab === "info" && (
        <CourseManagementInfoTab
          course={course}
          slug={slug}
          onCourseUpdated={handleCourseUpdated}
          onTabChange={t => setTab(t as Tab)}
        />
      )}

      {tab === "content" && (
        <CourseManagementContentTab course={course} slug={slug} />
      )}

      {tab === "pricing" && (
        <CourseManagementPricingTab course={course} slug={slug} />
      )}

      {tab !== "info" && tab !== "content" && tab !== "pricing" && (
        <div className="flex items-center justify-center" style={{ minHeight: "clamp(160px, 14vw, 220px)", fontFamily: "var(--font-base)", fontSize: "clamp(13px, 0.83vw, 15px)", color: "var(--color-text-muted)" }}>
          Coming soon
        </div>
      )}
    </main>
  );
}
