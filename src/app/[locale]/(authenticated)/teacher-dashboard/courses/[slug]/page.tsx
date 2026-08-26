"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import Image from "next/image";
import { BookOpen, ChevronDown, Clock, Play, SquareCheck, Star, Users } from "lucide-react";
import { courseStateColor, deriveCourseState, getCourseBySlug } from "@/entities/course";
import type { CourseDeliveryFormat, CourseDetail } from "@/entities/course";
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
import { CourseManagementReviewsTab } from "@/widgets/course-detail";
import { AccentButton } from "@/shared/ui/AccentButton";
import { PageShell } from "@/shared/ui/PageShell";
import { Tooltip } from "@/shared/ui/Tooltip";
import { WhiteButton } from "@/shared/ui/WhiteButton";
import { usePageLoadingOverlay } from "@/shared/lib/pageLoadingSignal";

type MainTab = "info" | "content" | "reviews" | "pricing";
type FormatTab = "individual" | "group" | "scheduled" | "self_paced";
type Tab = MainTab | FormatTab;

const MAIN_TAB_IDS: MainTab[] = ["info", "content", "reviews", "pricing"];
const FORMAT_ORDER: FormatTab[] = ["individual", "group", "scheduled", "self_paced"];

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontFamily: "var(--font-base)",
        fontWeight: 600,
        fontSize: "clamp(13px, 0.83vw, 15px)",
        padding: "clamp(8px, 0.69vw, 12px) clamp(12px, 1.04vw, 20px)",
        color: active ? "var(--color-blue)" : "var(--color-text-secondary)",
        borderBottom: active ? "2px solid var(--color-blue)" : "2px solid transparent",
        marginBottom: -1,
        background: "none",
        border: active ? undefined : "none",
        cursor: "pointer",
        transition: "color 0.15s",
        whiteSpace: "nowrap" as const,
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

function FormatStatsBar({
  fmt,
  slug,
  course,
  slotsKey,
  onMemberCompleted,
  onMemberUncompleted,
}: {
  fmt: CourseDeliveryFormat;
  slug?: string;
  course?: CourseDetail;
  slotsKey?: number;
  onMemberCompleted?: (enrollmentId: number) => void;
  onMemberUncompleted?: (enrollmentId: number) => void;
}) {
  const t = useTranslations("CourseManagementPage");
  const locale = useLocale();
  const [studentsOpen, setStudentsOpen] = useState(false);

  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" });

  const UNLOCK: Record<string, string> = {
    immediate: t("unlockImmediate"),
    date_based: t("unlockDateBased"),
    sequential: t("unlockSequential"),
  };

  type Stat = { label: string; value: string };
  const extras: Stat[] = [];
  const enrolled = fmt.enrolled_count ?? 0;
  const completed = fmt.completed_count ?? 0;
  const studying = Math.max(enrolled - completed, 0);
  // "still studying / already completed the course"
  const enrolledValue = `${studying} / ${completed}`;

  if (fmt.start_date) extras.push({ label: t("starts"), value: fmtDate(fmt.start_date) });
  if (fmt.course_start_date)
    extras.push({ label: t("starts"), value: fmtDate(fmt.course_start_date) });
  if (fmt.access_duration_days != null)
    extras.push({ label: t("access"), value: t("daysCount", { count: fmt.access_duration_days }) });
  else if (fmt.format_type === "self_paced")
    extras.push({ label: t("access"), value: t("lifetime") });
  if (fmt.unlock_mode)
    extras.push({ label: t("unlock"), value: UNLOCK[fmt.unlock_mode] ?? fmt.unlock_mode });

  const LABEL_ST: React.CSSProperties = {
    fontFamily: "var(--font-base)",
    fontSize: "clamp(10px, 0.63vw, 11px)",
    fontWeight: 600,
    color: "var(--color-text-secondary)",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  };
  const VALUE_ST: React.CSSProperties = {
    fontFamily: "var(--font-base)",
    fontWeight: 700,
    fontSize: "clamp(14px, 1.04vw, 18px)",
    color: "var(--color-text-primary)",
  };

  return (
    <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
      {/* Entire stats row is the toggle button */}
      <button
        type="button"
        onClick={() => setStudentsOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-start",
          gap: "clamp(16px, 1.67vw, 28px)",
          padding: "clamp(14px, 1.04vw, 20px) clamp(16px, 1.39vw, 24px)",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <span style={LABEL_ST}>{t("enrolled")}</span>
          <span style={VALUE_ST}>{enrolledValue}</span>
        </div>

        {extras.map((s) => (
          <div key={s.label} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <span style={LABEL_ST}>{s.label}</span>
            <span style={VALUE_ST}>{s.value}</span>
          </div>
        ))}

        <ChevronDown
          size={16}
          style={{
            marginLeft: "auto",
            alignSelf: "center",
            color: "var(--color-text-secondary)",
            transition: "transform 0.2s",
            transform: studentsOpen ? "rotate(180deg)" : "rotate(0deg)",
            flexShrink: 0,
          }}
        />
      </button>

      {studentsOpen && slug && (
        <div
          style={{
            borderTop: "1px solid var(--color-border-light)",
            padding: "clamp(14px, 1.04vw, 18px) clamp(16px, 1.39vw, 24px)",
          }}
        >
          {fmt.format_type === "individual" && (
            <IndividualStudentsList slug={slug} fmtId={fmt.id} refreshKey={slotsKey} />
          )}
          {fmt.format_type === "group" && course && slug && (
            <GroupStudentsList
              course={course}
              slug={slug}
              onMemberCompleted={onMemberCompleted}
              onMemberUncompleted={onMemberUncompleted}
            />
          )}
          {(fmt.format_type === "scheduled" || fmt.format_type === "self_paced") && (
            <SimpleStudentsList slug={slug} fmtId={fmt.id} />
          )}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 0",
        borderBottom: "1px solid var(--color-border-light)",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-base)",
          fontSize: "clamp(13px, 0.83vw, 15px)",
          color: "var(--color-text-secondary)",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--font-base)",
          fontWeight: 600,
          fontSize: "clamp(13px, 0.83vw, 15px)",
          color: "var(--color-text-primary)",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function SelfPacedFormatTab({ fmt, slug }: { fmt: CourseDeliveryFormat; slug: string }) {
  const t = useTranslations("CourseManagementPage");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <FormatStatsBar fmt={fmt} slug={slug} />
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          padding: "clamp(16px, 1.25vw, 22px)",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-base)",
            fontWeight: 700,
            fontSize: "clamp(15px, 1.04vw, 19px)",
            color: "var(--color-text-primary)",
            margin: "0 0 12px",
          }}
        >
          {t("accessSettings")}
        </p>
        <InfoRow
          label={t("startType")}
          value={fmt.start_type === "date" ? t("fixedStartDate") : t("manualUnlock")}
        />
        {fmt.course_start_date && <InfoRow label={t("startDate")} value={fmt.course_start_date} />}
        <InfoRow
          label={t("accessDuration")}
          value={
            fmt.access_duration_days != null
              ? t("daysCount", { count: fmt.access_duration_days })
              : t("lifetime")
          }
        />
      </div>
    </div>
  );
}

export default function CourseManagementPage() {
  const t = useTranslations("CourseManagementPage");
  const locale = useLocale();
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  usePageLoadingOverlay(loading);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("info");
  const [descExpanded, setDescExpanded] = useState(false);
  const [slotsKey, setSlotsKey] = useState(0);

  useEffect(() => {
    if (!slug) return;
    getCourseBySlug(slug, undefined, locale)
      .then(setCourse)
      .catch(() => setError(t("errorLoad")))
      .finally(() => setLoading(false));
  }, [slug, t, locale]);

  function handleCourseUpdated(updates: Partial<CourseDetail>) {
    setCourse((prev) => (prev ? { ...prev, ...updates } : prev));
  }

  function handleMemberCompleted(enrollmentId: number) {
    setCourse((prev) =>
      prev
        ? {
            ...prev,
            cohorts: (prev.cohorts ?? []).map((c) => ({
              ...c,
              members: (c.members ?? []).map((m) =>
                m.enrollment_id === enrollmentId ? { ...m, is_completed: true } : m,
              ),
            })),
          }
        : prev,
    );
  }

  function handleMemberUncompleted(enrollmentId: number) {
    setCourse((prev) =>
      prev
        ? {
            ...prev,
            cohorts: (prev.cohorts ?? []).map((c) => ({
              ...c,
              members: (c.members ?? []).map((m) =>
                m.enrollment_id === enrollmentId ? { ...m, is_completed: false } : m,
              ),
            })),
          }
        : prev,
    );
  }

  const fmtByType = useMemo(
    () =>
      Object.fromEntries(
        (course?.delivery_formats ?? []).map((f) => [f.format_type, f]),
      ) as Partial<Record<FormatTab, CourseDeliveryFormat>>,
    [course?.delivery_formats],
  );
  const dynamicTabs = FORMAT_ORDER.filter((ft) => fmtByType[ft]);

  useEffect(() => {
    if (FORMAT_ORDER.includes(tab as FormatTab) && !fmtByType[tab as FormatTab]) {
      setTab("pricing");
    }
  }, [fmtByType, tab]);

  // NavigationLoadingOverlay already covers the load; avoid a second, plain-text one here.
  if (loading) {
    return <main className="bg-my-courses min-h-[calc(100vh-76px)]" />;
  }
  if (error || !course) {
    return (
      <main
        className="bg-my-courses min-h-[calc(100vh-76px)] flex flex-col items-center justify-center"
        style={{ gap: 16 }}
      >
        <p
          style={{
            fontFamily: "var(--font-base)",
            fontSize: "clamp(14px, 0.83vw, 16px)",
            color: "var(--color-text-secondary)",
          }}
        >
          {error ?? t("courseNotFound")}
        </p>
        <AccentButton
          type="button"
          size="md"
          onClick={() => router.push("/teacher-dashboard/courses")}
        >
          {t("backToMyCourses")}
        </AccentButton>
      </main>
    );
  }

  const courseState = deriveCourseState(course);
  const statusBg = courseStateColor(courseState);
  const statusLabel =
    courseState.key === course.status ? t(`status.${course.status}`) : courseState.label;
  const modulesCount = course.modules.length;
  const testsCount = course.modules.reduce((s, m) => s + m.tests.length, 0);
  const DESC_LIMIT = 260;
  const descIsLong = course.full_description.length > DESC_LIMIT;

  const STAT_ST: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontFamily: "var(--font-base)",
    fontSize: "clamp(12px, 0.83vw, 15px)",
    color: "var(--color-text-secondary)",
  };
  const ICON_BOX: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 22,
    height: 22,
    borderRadius: 7,
    flexShrink: 0,
    border: "1.5px solid transparent",
    background:
      "linear-gradient(var(--color-bg), var(--color-bg)) padding-box, var(--gradient-brand) border-box",
  };

  return (
    <PageShell className="bg-my-courses" style={{ paddingBottom: 360 }}>
      <div style={{ maxWidth: "1648px", margin: "0 auto" }}>
        <div style={{ marginBottom: "clamp(16px, 1.39vw, 24px)" }}>
          <WhiteButton onClick={() => router.push("/teacher-dashboard/courses")}>
            {t("myCourses")}
          </WhiteButton>
        </div>

        <div style={{ marginBottom: "clamp(20px, 1.67vw, 32px)" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "clamp(20px, 2.08vw, 32px)",
              marginBottom: "clamp(16px, 1.39vw, 24px)",
            }}
          >
            <div
              style={{
                background: "var(--gradient-brand)",
                borderRadius: 24,
                padding: 3,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: "clamp(100px, 8.33vw, 120px)",
                  height: "clamp(100px, 8.33vw, 120px)",
                  borderRadius: 21,
                  overflow: "hidden",
                  background: "var(--color-bg)",
                }}
              >
                {course.image ? (
                  <Image
                    src={course.image}
                    alt=""
                    width={120}
                    height={120}
                    unoptimized
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      background: "var(--color-input-bg)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <BookOpen size={32} style={{ color: "var(--color-text-muted)" }} />
                  </div>
                )}
              </div>
            </div>

            <div
              style={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                gap: "clamp(10px, 0.83vw, 14px)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  gap: "clamp(8px, 0.69vw, 12px)",
                }}
              >
                <h1
                  style={{
                    fontFamily: "var(--font-base)",
                    fontWeight: 700,
                    fontSize: "clamp(22px, 1.88vw, 34px)",
                    lineHeight: 1.2,
                    color: "var(--color-text-primary)",
                    margin: 0,
                  }}
                >
                  {course.title}
                </h1>
                <Tooltip content={courseState.description} className="self-center">
                  <span
                    style={{
                      background: statusBg,
                      color: "white",
                      borderRadius: 999,
                      padding: "clamp(3px, 0.26vw, 5px) clamp(10px, 0.83vw, 14px)",
                      fontFamily: "var(--font-accent)",
                      fontWeight: 600,
                      fontSize: "clamp(9px, 0.63vw, 12px)",
                      letterSpacing: "0.04em",
                      flexShrink: 0,
                    }}
                  >
                    {statusLabel}
                  </span>
                </Tooltip>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {course.category && (
                  <span
                    style={{
                      background: "var(--gradient-brand)",
                      borderRadius: 20,
                      padding: "clamp(2px, 0.21vw, 4px) clamp(10px, 0.83vw, 14px)",
                      fontFamily: "var(--font-accent)",
                      fontWeight: 500,
                      fontSize: "clamp(11px, 0.78vw, 15px)",
                    }}
                  >
                    {course.category.name}
                  </span>
                )}
                <span
                  style={{
                    border: "1px solid var(--color-draft)",
                    borderRadius: 20,
                    padding: "clamp(2px, 0.21vw, 4px) clamp(10px, 0.83vw, 14px)",
                    fontFamily: "var(--font-accent)",
                    fontWeight: 500,
                    fontSize: "clamp(11px, 0.78vw, 15px)",
                    background: "var(--color-bg)",
                  }}
                >
                  {t(`level.${course.level}`)}
                </span>
              </div>

              <p
                style={{
                  fontFamily: "var(--font-base)",
                  fontSize: "clamp(14px, 1.04vw, 18px)",
                  color: "var(--color-text-secondary)",
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {course.short_description}
              </p>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: "clamp(6px, 0.52vw, 10px)",
                }}
              >
                <span style={STAT_ST}>
                  <span style={ICON_BOX}>
                    <Star size={13} style={{ color: "var(--color-gold)" }} />
                  </span>
                  {parseFloat(course.rating_avg).toFixed(1)} ({course.rating_count})
                </span>
                <span style={STAT_ST}>
                  <span style={ICON_BOX}>
                    <Users size={13} style={{ color: "var(--color-text-muted)" }} />
                  </span>
                  {t("studentsCount", { count: course.students_count })}
                </span>
                <div style={{ width: 1, height: 14, background: "var(--color-border-light)" }} />
                {(
                  [
                    {
                      icon: <BookOpen size={13} style={{ color: "var(--color-brand-lavender)" }} />,
                      count: modulesCount,
                      label: "modules",
                    },
                    {
                      icon: <Play size={13} style={{ color: "var(--color-brand-lavender)" }} />,
                      count: course.lessons_count,
                      label: "lessons",
                    },
                    {
                      icon: (
                        <SquareCheck size={13} style={{ color: "var(--color-brand-lavender)" }} />
                      ),
                      count: testsCount,
                      label: "tests",
                    },
                    {
                      icon: <Clock size={13} style={{ color: "var(--color-brand-lavender)" }} />,
                      count: course.total_duration_minutes,
                      label: "min",
                    },
                  ] as const
                ).map(({ icon, count, label }) => (
                  <span key={label} style={STAT_ST}>
                    <span style={ICON_BOX}>{icon}</span>
                    {t(`statLabel.${label}`, { count })}
                  </span>
                ))}
                {course.duration_hours != null && course.duration_hours > 0 && (
                  <>
                    <div
                      style={{ width: 1, height: 14, background: "var(--color-border-light)" }}
                    />
                    <span style={STAT_ST}>≈ {course.duration_hours}h</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {course.full_description && (
            <div
              style={{
                marginTop: "clamp(16px, 1.39vw, 24px)",
                borderTop: "1px solid var(--color-border-light)",
                paddingTop: "clamp(16px, 1.39vw, 24px)",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-base)",
                  fontSize: "clamp(13px, 0.9vw, 17px)",
                  color: "var(--color-text-secondary)",
                  lineHeight: 1.7,
                  margin: "0 0 8px",
                }}
              >
                {descExpanded || !descIsLong
                  ? course.full_description
                  : course.full_description.slice(0, DESC_LIMIT) + "…"}
              </p>
              {descIsLong && (
                <button
                  type="button"
                  onClick={() => setDescExpanded((v) => !v)}
                  style={{
                    fontFamily: "var(--font-base)",
                    fontWeight: 600,
                    fontSize: "clamp(12px, 0.83vw, 14px)",
                    color: "var(--color-blue)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  {descExpanded ? t("showLess") : t("showFullDescription")}
                  <ChevronDown
                    size={14}
                    style={{
                      transform: descExpanded ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s",
                    }}
                  />
                </button>
              )}
            </div>
          )}
        </div>

        <div
          className="flex overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] lg:flex-wrap lg:overflow-visible [&::-webkit-scrollbar]:hidden"
          style={{
            borderBottom: "1px solid var(--color-border-light)",
            marginBottom: "clamp(16px, 1.39vw, 28px)",
          }}
        >
          {MAIN_TAB_IDS.map((mainTabId) => (
            <TabBtn key={mainTabId} active={tab === mainTabId} onClick={() => setTab(mainTabId)}>
              {t(`mainTab.${mainTabId}`)}
            </TabBtn>
          ))}

          {dynamicTabs.length > 0 && (
            <>
              <div
                style={{
                  alignSelf: "stretch",
                  width: 1,
                  flexShrink: 0,
                  background: "var(--color-border-light)",
                  margin: "6px 6px 0",
                }}
              />
              {dynamicTabs.map((ft) => (
                <TabBtn key={ft} active={tab === ft} onClick={() => setTab(ft)}>
                  {t(`formatTab.${ft}`)}
                </TabBtn>
              ))}
            </>
          )}
        </div>

        {tab === "info" && (
          <CourseManagementInfoTab
            course={course}
            slug={slug}
            onCourseUpdated={handleCourseUpdated}
            onTabChange={(t) => setTab(t as Tab)}
          />
        )}
        {tab === "content" && (
          <CourseManagementContentTab
            course={course}
            slug={slug}
            onLessonUpdated={(moduleId, lesson) =>
              handleCourseUpdated({
                modules: course.modules.map((m) =>
                  m.id === moduleId
                    ? { ...m, lessons: m.lessons.map((l) => (l.id === lesson.id ? lesson : l)) }
                    : m,
                ),
              })
            }
          />
        )}
        {tab === "reviews" && <CourseManagementReviewsTab slug={slug} />}
        {tab === "pricing" && (
          <CourseManagementPricingTab
            course={course}
            slug={slug}
            onFormatsChanged={(delivery_formats) => handleCourseUpdated({ delivery_formats })}
          />
        )}

        {tab === "individual" && fmtByType.individual && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "clamp(16px, 1.39vw, 24px)" }}
          >
            <FormatStatsBar
              fmt={fmtByType.individual}
              slug={slug}
              course={course}
              slotsKey={slotsKey}
            />
            <CourseManagementScheduleTab
              course={course}
              slug={slug}
              onSlotsChanged={() => setSlotsKey((k) => k + 1)}
            />
          </div>
        )}
        {tab === "group" && fmtByType.group && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "clamp(16px, 1.39vw, 24px)" }}
          >
            <FormatStatsBar
              fmt={fmtByType.group}
              slug={slug}
              course={course}
              onMemberCompleted={handleMemberCompleted}
              onMemberUncompleted={handleMemberUncompleted}
            />
            <CourseManagementGroupTab
              course={course}
              slug={slug}
              onCohortsChanged={(cohorts) => handleCourseUpdated({ cohorts })}
            />
          </div>
        )}
        {tab === "scheduled" && fmtByType.scheduled && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "clamp(16px, 1.39vw, 24px)" }}
          >
            <FormatStatsBar fmt={fmtByType.scheduled} slug={slug} />
            <CourseManagementScheduledTab
              modules={course.modules}
              slug={slug}
              onLessonUpdated={(moduleId, lesson) =>
                handleCourseUpdated({
                  modules: course.modules.map((m) =>
                    m.id === moduleId
                      ? { ...m, lessons: m.lessons.map((l) => (l.id === lesson.id ? lesson : l)) }
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
    </PageShell>
  );
}
