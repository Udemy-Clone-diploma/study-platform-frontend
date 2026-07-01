"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { BookOpen, ChevronDown, Clock, Play, SquareCheck, Star, Users } from "lucide-react";
import { getCourseBySlug } from "@/entities/course";
import type { CourseDeliveryFormat, CourseDetail, CourseStatus } from "@/entities/course";
import {
  CourseManagementContentTab,
  CourseManagementGroupTab,
  CourseManagementInfoTab,
  CourseManagementPricingTab,
  CourseManagementScheduleTab,
  CourseManagementScheduledTab,
  GroupStudentsList,
  IndividualStudentsList,
  SimpleStudentsList,
} from "@/features/courses";
import { AccentButton } from "@/shared/ui/AccentButton";
import { WhiteButton } from "@/shared/ui/WhiteButton";

// ── Lookups ────────────────────────────────────────────────────────────────────
const STATUS_LABEL: Record<CourseStatus, string> = {
  draft: "Draft", review: "In Review", needs_revision: "Needs Revision",
  rejected: "Rejected", published: "Published", hidden: "Hidden", archived: "Archived",
};
const STATUS_BG: Record<CourseStatus, string> = {
  draft: "var(--color-draft)", review: "var(--color-warning)", needs_revision: "var(--color-warning)",
  rejected: "var(--color-rejected)", published: "var(--color-success)",
  hidden: "var(--color-text-secondary)", archived: "var(--color-text-muted)",
};
const LEVEL_LABEL: Record<string, string> = {
  beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced",
};

// ── Tab types ──────────────────────────────────────────────────────────────────
type MainTab   = "info" | "content" | "pricing";
type FormatTab = "individual" | "group" | "scheduled" | "self_paced";
type Tab = MainTab | FormatTab;

const MAIN_TABS: { id: MainTab; label: string }[] = [
  { id: "info",    label: "Info" },
  { id: "content", label: "Content" },
  { id: "pricing", label: "Format & Price" },
];
const FORMAT_TAB_LABEL: Record<FormatTab, string> = {
  individual: "Individual", group: "Group", scheduled: "Scheduled", self_paced: "Self-paced",
};
const FORMAT_ORDER: FormatTab[] = ["individual", "group", "scheduled", "self_paced"];

// ── TabBtn ─────────────────────────────────────────────────────────────────────
function TabBtn({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} style={{
      fontFamily: "var(--font-base)", fontWeight: 600,
      fontSize: "clamp(13px, 0.83vw, 15px)",
      padding: "clamp(8px, 0.69vw, 12px) clamp(12px, 1.04vw, 20px)",
      color: active ? "var(--color-blue)" : "var(--color-text-secondary)",
      borderBottom: active ? "2px solid var(--color-blue)" : "2px solid transparent",
      marginBottom: -1, background: "none",
      border: active ? undefined : "none",
      cursor: "pointer", transition: "color 0.15s", whiteSpace: "nowrap" as const,
    }}>
      {children}
    </button>
  );
}

// ── FormatStatsBar ─────────────────────────────────────────────────────────────
function FormatStatsBar({ fmt, slug, course, slotsKey }: {
  fmt: CourseDeliveryFormat; slug?: string; course?: CourseDetail; slotsKey?: number;
}) {
  const [studentsOpen, setStudentsOpen] = useState(false);

  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const UNLOCK: Record<string, string> = {
    immediate: "Immediate", date_based: "Date-based", sequential: "Sequential",
  };

  type Stat = { label: string; value: string };
  const extras: Stat[] = [];
  const enrolled = fmt.enrolled_count ?? 0;
  const enrolledValue = fmt.max_students != null ? `${enrolled} / ${fmt.max_students}` : String(enrolled);

  if (fmt.start_date)          extras.push({ label: "Starts",    value: fmtDate(fmt.start_date) });
  if (fmt.course_start_date)   extras.push({ label: "Starts",    value: fmtDate(fmt.course_start_date) });
  if (fmt.enrollment_deadline) extras.push({ label: "Enroll by", value: fmtDate(fmt.enrollment_deadline) });
  if (fmt.access_duration_days != null)
    extras.push({ label: "Access", value: `${fmt.access_duration_days} days` });
  else if (fmt.format_type === "self_paced")
    extras.push({ label: "Access", value: "Lifetime" });
  if (fmt.unlock_mode)
    extras.push({ label: "Unlock", value: UNLOCK[fmt.unlock_mode] ?? fmt.unlock_mode });

  const LABEL_ST: React.CSSProperties = {
    fontFamily: "var(--font-base)", fontSize: "clamp(10px, 0.63vw, 11px)",
    fontWeight: 600, color: "var(--color-text-secondary)",
    textTransform: "uppercase", letterSpacing: "0.06em",
  };
  const VALUE_ST: React.CSSProperties = {
    fontFamily: "var(--font-base)", fontWeight: 700,
    fontSize: "clamp(14px, 1.04vw, 18px)", color: "var(--color-text-primary)",
  };

  return (
    <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
      {/* Entire stats row is the toggle button */}
      <button
        type="button"
        onClick={() => setStudentsOpen(v => !v)}
        style={{
          width: "100%", display: "flex", flexWrap: "wrap", alignItems: "flex-start",
          gap: "clamp(16px, 1.67vw, 28px)",
          padding: "clamp(14px, 1.04vw, 20px) clamp(16px, 1.39vw, 24px)",
          background: "none", border: "none", cursor: "pointer", textAlign: "left",
        }}
      >
        {/* Enrolled stat */}
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <span style={LABEL_ST}>Enrolled</span>
          <span style={VALUE_ST}>{enrolledValue}</span>
        </div>

        {extras.map(s => (
          <div key={s.label} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <span style={LABEL_ST}>{s.label}</span>
            <span style={VALUE_ST}>{s.value}</span>
          </div>
        ))}

        {/* Chevron pushed to right */}
        <ChevronDown
          size={16}
          style={{
            marginLeft: "auto", alignSelf: "center", color: "var(--color-text-secondary)",
            transition: "transform 0.2s", transform: studentsOpen ? "rotate(180deg)" : "rotate(0deg)",
            flexShrink: 0,
          }}
        />
      </button>

      {studentsOpen && slug && (
        <div style={{ borderTop: "1px solid var(--color-border-light)", padding: "clamp(14px, 1.04vw, 18px) clamp(16px, 1.39vw, 24px)" }}>
          {fmt.format_type === "individual" && (
            <IndividualStudentsList slug={slug} fmtId={fmt.id} refreshKey={slotsKey} />
          )}
          {fmt.format_type === "group" && course && (
            <GroupStudentsList course={course} />
          )}
          {(fmt.format_type === "scheduled" || fmt.format_type === "self_paced") && (
            <SimpleStudentsList slug={slug} fmtId={fmt.id} />
          )}
        </div>
      )}
    </div>
  );
}

// ── InfoRow ────────────────────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--color-border-light)" }}>
      <span style={{ fontFamily: "var(--font-base)", fontSize: "clamp(13px, 0.83vw, 15px)", color: "var(--color-text-secondary)" }}>{label}</span>
      <span style={{ fontFamily: "var(--font-base)", fontWeight: 600, fontSize: "clamp(13px, 0.83vw, 15px)", color: "var(--color-text-primary)" }}>{value}</span>
    </div>
  );
}


// ── SelfPacedFormatTab ─────────────────────────────────────────────────────────
function SelfPacedFormatTab({ fmt, slug }: { fmt: CourseDeliveryFormat; slug: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <FormatStatsBar fmt={fmt} slug={slug} />
      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", padding: "clamp(16px, 1.25vw, 22px)" }}>
        <p style={{ fontFamily: "var(--font-base)", fontWeight: 700, fontSize: "clamp(15px, 1.04vw, 19px)", color: "var(--color-text-primary)", margin: "0 0 12px" }}>
          Access settings
        </p>
        <InfoRow label="Start type" value={fmt.start_type === "date" ? "Fixed start date" : "Manual unlock"} />
        {fmt.course_start_date && <InfoRow label="Start date" value={fmt.course_start_date} />}
        <InfoRow
          label="Access duration"
          value={fmt.access_duration_days != null ? `${fmt.access_duration_days} days` : "Lifetime"}
        />
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function CourseManagementPage() {
  const { slug }  = useParams<{ slug: string }>();
  const router    = useRouter();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const [tab, setTab]       = useState<Tab>("info");
  const [descExpanded, setDescExpanded] = useState(false);
  const [slotsKey, setSlotsKey] = useState(0);

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

  // Map format_type → CourseDeliveryFormat for O(1) lookup
  const fmtByType = useMemo(
    () => Object.fromEntries(
      (course?.delivery_formats ?? []).map(f => [f.format_type, f])
    ) as Partial<Record<FormatTab, CourseDeliveryFormat>>,
    [course?.delivery_formats],
  );
  const dynamicTabs = FORMAT_ORDER.filter(ft => fmtByType[ft]);

  // If the active format tab was removed, fall back to pricing
  useEffect(() => {
    if (FORMAT_ORDER.includes(tab as FormatTab) && !fmtByType[tab as FormatTab]) {
      setTab("pricing");
    }
  }, [fmtByType, tab]);

  // ── Loading / error ──────────────────────────────────────────────────────────
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

  // ── Derived values ───────────────────────────────────────────────────────────
  const statusBg    = STATUS_BG[course.status]    ?? "var(--color-draft)";
  const statusLabel = STATUS_LABEL[course.status] ?? course.status;
  const modulesCount = course.modules.length;
  const testsCount   = course.modules.reduce((s, m) => s + m.tests.length, 0);
  const DESC_LIMIT   = 260;
  const descIsLong   = course.full_description.length > DESC_LIMIT;

  const STAT_ST: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 6,
    fontFamily: "var(--font-base)", fontSize: "clamp(12px, 0.83vw, 15px)",
    color: "var(--color-text-secondary)",
  };
  const ICON_BOX: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    width: 22, height: 22, borderRadius: 7, flexShrink: 0,
    border: "1.5px solid transparent",
    background: "linear-gradient(var(--color-bg), var(--color-bg)) padding-box, var(--gradient-brand) border-box",
  };

  return (
    <main
      className="bg-my-courses min-h-[calc(100vh-76px)]"
      style={{
        paddingLeft: "clamp(40px, calc(-110px + 10.42vw), 90px)",
        paddingRight: "clamp(40px, calc(-110px + 10.42vw), 90px)",
        paddingTop: "clamp(16px, 2.22vw, 32px)",
        paddingBottom: 360,
      }}
    >
      <div style={{ maxWidth: "1648px", margin: "0 auto" }}>
      {/* Back nav */}
      <div style={{ marginBottom: "clamp(16px, 1.39vw, 24px)" }}>
        <WhiteButton onClick={() => router.push("/teacher-dashboard/courses")}>My courses</WhiteButton>
      </div>

      {/* ── Course header ──────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: "clamp(20px, 1.67vw, 32px)" }}>
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

            {/* Category + Level */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {course.category && (
                <span style={{ background: "var(--gradient-brand)", borderRadius: 20, padding: "clamp(2px, 0.21vw, 4px) clamp(10px, 0.83vw, 14px)", fontFamily: "var(--font-accent)", fontWeight: 500, fontSize: "clamp(11px, 0.78vw, 15px)" }}>
                  {course.category.name}
                </span>
              )}
              <span style={{ border: "1px solid var(--color-draft)", borderRadius: 20, padding: "clamp(2px, 0.21vw, 4px) clamp(10px, 0.83vw, 14px)", fontFamily: "var(--font-accent)", fontWeight: 500, fontSize: "clamp(11px, 0.78vw, 15px)", background: "var(--color-bg)" }}>
                {LEVEL_LABEL[course.level] ?? course.level}
              </span>
            </div>

            {/* Short description */}
            <p style={{ fontFamily: "var(--font-base)", fontSize: "clamp(14px, 1.04vw, 18px)", color: "var(--color-text-secondary)", lineHeight: 1.6, margin: 0 }}>
              {course.short_description}
            </p>

            {/* Stats */}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "clamp(6px, 0.52vw, 10px)" }}>
              <span style={STAT_ST}><span style={ICON_BOX}><Star size={13} style={{ color: "var(--color-gold)" }} /></span>{parseFloat(course.rating_avg).toFixed(1)} ({course.rating_count})</span>
              <span style={STAT_ST}><span style={ICON_BOX}><Users size={13} style={{ color: "var(--color-text-muted)" }} /></span>{course.students_count} students</span>
              <div style={{ width: 1, height: 14, background: "var(--color-border-light)" }} />
              {([
                { icon: <BookOpen    size={13} style={{ color: "var(--color-brand-lavender)" }} />, count: modulesCount,                  label: "modules" },
                { icon: <Play        size={13} style={{ color: "var(--color-brand-lavender)" }} />, count: course.lessons_count,          label: "lessons" },
                { icon: <SquareCheck size={13} style={{ color: "var(--color-brand-lavender)" }} />, count: testsCount,                    label: "tests"   },
                { icon: <Clock       size={13} style={{ color: "var(--color-brand-lavender)" }} />, count: course.total_duration_minutes, label: "min"     },
              ] as const).map(({ icon, count, label }) => (
                <span key={label} style={STAT_ST}><span style={ICON_BOX}>{icon}</span>{count} {label}</span>
              ))}
              {course.duration_hours != null && course.duration_hours > 0 && (
                <><div style={{ width: 1, height: 14, background: "var(--color-border-light)" }} /><span style={STAT_ST}>≈ {course.duration_hours}h</span></>
              )}
            </div>
          </div>
        </div>

        {/* Full description (collapsible) */}
        {course.full_description && (
          <div style={{ marginTop: "clamp(16px, 1.39vw, 24px)", borderTop: "1px solid var(--color-border-light)", paddingTop: "clamp(16px, 1.39vw, 24px)" }}>
            <p style={{ fontFamily: "var(--font-base)", fontSize: "clamp(13px, 0.9vw, 17px)", color: "var(--color-text-secondary)", lineHeight: 1.7, margin: "0 0 8px" }}>
              {descExpanded || !descIsLong ? course.full_description : course.full_description.slice(0, DESC_LIMIT) + "…"}
            </p>
            {descIsLong && (
              <button type="button" onClick={() => setDescExpanded(v => !v)}
                style={{ fontFamily: "var(--font-base)", fontWeight: 600, fontSize: "clamp(12px, 0.83vw, 14px)", color: "var(--color-blue)", background: "none", border: "none", cursor: "pointer", padding: 0, display: "inline-flex", alignItems: "center", gap: 4 }}>
                {descExpanded ? "Show less" : "Show full description"}
                <ChevronDown size={14} style={{ transform: descExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Tab bar ────────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--color-border-light)", marginBottom: "clamp(16px, 1.39vw, 28px)", flexWrap: "wrap" }}>
        {MAIN_TABS.map(t => (
          <TabBtn key={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>{t.label}</TabBtn>
        ))}

        {dynamicTabs.length > 0 && (
          <>
            <div style={{ alignSelf: "stretch", width: 1, background: "var(--color-border-light)", margin: "6px 6px 0" }} />
            {dynamicTabs.map(ft => (
              <TabBtn key={ft} active={tab === ft} onClick={() => setTab(ft)}>
                {FORMAT_TAB_LABEL[ft]}
              </TabBtn>
            ))}
          </>
        )}
      </div>

      {/* ── Tab content ────────────────────────────────────────────────────────── */}

      {/* Main tabs */}
      {tab === "info" && (
        <CourseManagementInfoTab course={course} slug={slug} onCourseUpdated={handleCourseUpdated} onTabChange={t => setTab(t as Tab)} />
      )}
      {tab === "content" && <CourseManagementContentTab course={course} slug={slug} />}
      {tab === "pricing" && (
        <CourseManagementPricingTab
          course={course}
          slug={slug}
          onFormatsChanged={delivery_formats => handleCourseUpdated({ delivery_formats })}
        />
      )}

      {/* Format tabs */}
      {tab === "individual" && fmtByType.individual && (
        <div style={{ display: "flex", flexDirection: "column", gap: "clamp(16px, 1.39vw, 24px)" }}>
          <FormatStatsBar fmt={fmtByType.individual} slug={slug} course={course} slotsKey={slotsKey} />
          <CourseManagementScheduleTab course={course} slug={slug} onSlotsChanged={() => setSlotsKey(k => k + 1)} />
        </div>
      )}
      {tab === "group" && fmtByType.group && (
        <div style={{ display: "flex", flexDirection: "column", gap: "clamp(16px, 1.39vw, 24px)" }}>
          <FormatStatsBar fmt={fmtByType.group} slug={slug} course={course} />
          <CourseManagementGroupTab
            course={course}
            slug={slug}
            onCohortsChanged={cohorts => handleCourseUpdated({ cohorts })}
          />
        </div>
      )}
      {tab === "scheduled" && fmtByType.scheduled && (
        <div style={{ display: "flex", flexDirection: "column", gap: "clamp(16px, 1.39vw, 24px)" }}>
          <FormatStatsBar fmt={fmtByType.scheduled} slug={slug} />
          <CourseManagementScheduledTab
            modules={course.modules}
            slug={slug}
            onLessonUpdated={(moduleId, lesson) =>
              handleCourseUpdated({
                modules: course.modules.map(m =>
                  m.id === moduleId
                    ? { ...m, lessons: m.lessons.map(l => (l.id === lesson.id ? lesson : l)) }
                    : m,
                ),
              })
            }
          />
        </div>
      )}
      {tab === "self_paced" && fmtByType.self_paced && (
        <SelfPacedFormatTab fmt={fmtByType.self_paced} slug={slug} />
      )}
      </div>
    </main>
  );
}
