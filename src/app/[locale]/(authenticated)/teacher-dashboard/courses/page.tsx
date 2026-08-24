"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { MoreVertical, RotateCcw } from "lucide-react";
import { useAutoRefresh } from "@/shared/lib/useAutoRefresh";
import { ModalShell } from "@/shared/ui/ModalShell";
import { AccentButton } from "@/shared/ui/AccentButton";
import { PageShell } from "@/shared/ui/PageShell";
import { TeacherCourseCard, type TeacherCourseStatus } from "@/features/courses";
import { RejectionDetailModal } from "@/features/courses/ui/RejectionDetailModal";
import {
  getTeacherCourses,
  getTeacherRejectionRecords,
  deleteCourse,
  archiveCourse,
  withdrawCourseFromReview,
  unarchiveCourse,
  hideCourse,
  openCourse,
  submitCourseForReview,
  submitPendingEdit,
  withdrawPendingEdit,
  discardPendingEdit,
  restoreCourseFromRejected,
} from "@/entities/course";
import type {
  CourseListItem,
  CourseLevel,
  CourseStatus,
  RejectedCourseRecord,
} from "@/entities/course";
import type { ApiError } from "@/shared/api/base";

const TABS = [
  "all",
  "active",
  "drafts",
  "pendingModeration",
  "forReview",
  "completed",
  "rejected",
] as const;
type Tab = (typeof TABS)[number];

const TAB_LABEL_KEYS: Record<Tab, string> = {
  all: "tabAll",
  active: "tabActive",
  drafts: "tabDrafts",
  pendingModeration: "tabPendingModeration",
  forReview: "tabForReview",
  completed: "tabCompleted",
  rejected: "tabRejected",
};

const TAB_STATUSES: Partial<Record<Tab, CourseStatus[]>> = {
  active: ["published", "hidden"],
  drafts: ["draft"],
  pendingModeration: ["review"],
  forReview: ["needs_revision"],
  completed: ["archived"],
};

function resolveCardStatus(course: CourseListItem): TeacherCourseStatus {
  const { status, pending_edit_status } = course;
  if ((status === "published" || status === "hidden") && pending_edit_status) {
    if (pending_edit_status === "pending") return "active_pending_edit";
    if (pending_edit_status === "needs_revision") return "active_needs_revision";
    return "active_draft_edit";
  }
  const MAP: Record<CourseStatus, TeacherCourseStatus> = {
    draft: "draft",
    review: "pending_moderation",
    needs_revision: "needs_revision",
    rejected: "needs_revision",
    published: "active",
    hidden: "hidden",
    archived: "completed",
  };
  return MAP[status] ?? "draft";
}

const LEVEL_ICON: Record<CourseLevel, string> = {
  beginner: "/icons/curses.svg",
  intermediate: "/icons/world.png",
  advanced: "/icons/statistics.svg",
};

const CURRENT_YEAR = new Date().getFullYear();

function getCourseMonthLabel(course: CourseListItem, locale: string): string {
  const date = new Date(course.created_at);
  const monthName = date.toLocaleString(locale, { month: "long" });
  return date.getFullYear() === CURRENT_YEAR ? monthName : `${monthName} ${date.getFullYear()}`;
}

type PendingEditStatus = NonNullable<CourseListItem["pending_edit_status"]>;

// ── Rejected courses grid ─────────────────────────────────────────────────────

const LEVEL_GRADIENT_R: Record<CourseLevel, string> = {
  beginner: "var(--gradient-card-blue)",
  intermediate: "var(--gradient-card-yellow)",
  advanced: "var(--gradient-card-pink)",
};

function RejectedCourseCard({
  record,
  onView,
  onMoveToDraft,
}: {
  record: RejectedCourseRecord;
  onView: () => void;
  onMoveToDraft: () => void;
}) {
  const t = useTranslations("TeacherCoursesPage");
  const [menuOpen, setMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (dropdownRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const level = (record.course_level as CourseLevel) ?? "beginner";
  const gradient = LEVEL_GRADIENT_R[level] ?? "var(--gradient-card-blue)";
  const fallback = LEVEL_ICON[level] ?? "/icons/curses.svg";
  const thumbSize = "clamp(36px, 4.17vw, 60px)";
  const iconSize = "clamp(16px, 1.67vw, 24px)";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onView}
        className="flex w-full items-center text-left shadow-(--shadow-my-courses-card) transition-[box-shadow,filter] hover:shadow-[0px_0px_40px_rgba(0,0,0,0.22)] focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-blue)"
        style={{
          background: gradient,
          borderRadius: "clamp(12px, 1.39vw, 20px)",
          padding: "clamp(10px, 2.09vw, 40px) clamp(8px, 0.83vw, 12px)",
          gap: "clamp(4px, 0.56vw, 8px)",
        }}
      >
        <Image
          src={record.course_image_url ?? fallback}
          alt=""
          width={60}
          height={60}
          unoptimized={!!record.course_image_url}
          className="shrink-0 object-contain"
          style={{ width: thumbSize, height: thumbSize }}
        />
        <div
          className="flex min-w-0 flex-1 flex-col justify-center"
          style={{ gap: "clamp(4px, 0.56vw, 8px)" }}
        >
          <div className="flex items-center" style={{ gap: "clamp(4px, 0.28vw, 4px)" }}>
            <h3
              className="line-clamp-2 flex-1 font-bold uppercase text-(--color-text-primary)"
              style={{
                fontSize: "clamp(10px, 0.97vw, 14px)",
                lineHeight: "clamp(13px, 1.25vw, 18px)",
              }}
            >
              {record.course_title}
            </h3>
            <div
              className="flex shrink-0 items-center justify-center"
              style={{ width: "clamp(24px, 2.5vw, 36px)", height: "clamp(24px, 2.5vw, 36px)" }}
            >
              <Image
                src="/icons/no.svg"
                alt="rejected"
                width={24}
                height={24}
                style={{ width: iconSize, height: iconSize }}
              />
            </div>
          </div>
        </div>
        <div aria-hidden className="shrink-0" style={{ width: "clamp(24px, 2.5vw, 40px)" }} />
      </button>

      {/* ⋮ context menu — absolutely positioned over the card's right spacer */}
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          display: "flex",
          alignItems: "center",
        }}
      >
        <button
          ref={triggerRef}
          type="button"
          aria-label={t("courseOptionsAriaLabel")}
          aria-expanded={menuOpen}
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
          className="flex shrink-0 items-center justify-center rounded transition-opacity hover:opacity-60"
          style={{
            width: "clamp(24px, 2.5vw, 40px)",
            height: "clamp(24px, 2.5vw, 40px)",
            marginRight: "clamp(8px, 0.83vw, 12px)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          <MoreVertical
            style={{ width: "clamp(16px, 1.67vw, 24px)", height: "clamp(16px, 1.67vw, 24px)" }}
          />
        </button>

        {menuOpen && (
          <div
            ref={dropdownRef}
            style={{
              position: "absolute",
              top: "calc(100% - 16px)",
              right: 0,
              width: 220,
              background:
                "linear-gradient(90deg, var(--color-brand-lavender) -210.91%, var(--color-brand-pink) 233.85%, var(--color-brand-cream) 661.82%)",
              borderRadius: 12,
              padding: "16px",
              zIndex: 20,
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <button
              type="button"
              className="flex w-full items-center transition-opacity hover:opacity-70 text-(--color-text-primary)"
              style={{ gap: 10, height: 28 }}
              onClick={() => {
                setMenuOpen(false);
                onMoveToDraft();
              }}
            >
              <span
                className="flex-1 text-left font-(family-name:--font-accent) font-medium uppercase"
                style={{ fontSize: "clamp(12px, 0.97vw, 16px)", lineHeight: "20px" }}
              >
                {t("returnToDraft")}
              </span>
              <RotateCcw size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TeacherCoursesPage() {
  const t = useTranslations("TeacherCoursesPage");
  const locale = useLocale();
  const router = useRouter();
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [rejectedCourses, setRejectedCourses] = useState<RejectedCourseRecord[]>([]);
  const [viewRejected, setViewRejected] = useState<RejectedCourseRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [statusError, setStatusError] = useState<{ currentStatus: string } | null>(null);

  const refresh = useCallback(() => {
    Promise.all([getTeacherCourses(), getTeacherRejectionRecords()])
      .then(([main, rejected]) => {
        setCourses(main.results);
        setRejectedCourses(rejected.results);
      })
      .catch(() => {});
  }, []);

  useAutoRefresh(refresh);

  useEffect(() => {
    Promise.all([getTeacherCourses(), getTeacherRejectionRecords()])
      .then(([main, rejected]) => {
        setCourses(main.results);
        setRejectedCourses(rejected.results);
      })
      .catch((err: Partial<ApiError>) => setError(err.message ?? t("errorLoad")))
      .finally(() => setLoading(false));
  }, [t]);

  function updateStatus(slug: string, newStatus: CourseStatus) {
    setCourses((prev) => prev.map((c) => (c.slug === slug ? { ...c, status: newStatus } : c)));
  }

  function updatePendingStatus(slug: string, newPending: PendingEditStatus | null) {
    setCourses((prev) =>
      prev.map((c) => (c.slug === slug ? { ...c, pending_edit_status: newPending } : c)),
    );
  }

  function removeCourse(slug: string) {
    setCourses((prev) => prev.filter((c) => c.slug !== slug));
  }

  async function handleMoveToDraft(slug: string) {
    try {
      await restoreCourseFromRejected(slug);
      // Card stays in Rejected tab — it's permanent history.
      const updated = await getTeacherCourses();
      setCourses(updated.results);
      setActiveTab("drafts");
    } catch (err: unknown) {
      const apiErr = err as { status?: number; fields?: Record<string, unknown> };
      if (apiErr.status === 409) {
        const currentStatus = (apiErr.fields?.current_status as string) ?? "unknown";
        setStatusError({ currentStatus });
      }
    }
  }

  function makeHandlers(course: CourseListItem) {
    const { slug } = course;
    return {
      onEdit: () => router.push(`/teacher-dashboard/courses/${slug}/edit`),
      onPublish: () =>
        submitCourseForReview(slug)
          .then(() => updateStatus(slug, "review"))
          .catch(() => {}),
      onWithdraw: () =>
        withdrawCourseFromReview(slug)
          .then(() => updateStatus(slug, "draft"))
          .catch(() => {}),
      onArchive: () =>
        archiveCourse(slug)
          .then(() => updateStatus(slug, "archived"))
          .catch(() => {}),
      onUnarchive: () =>
        unarchiveCourse(slug)
          .then(() => updateStatus(slug, "draft"))
          .catch(() => {}),
      onDelete: () =>
        deleteCourse(slug)
          .then(() => removeCourse(slug))
          .catch(() => {}),
      onHide: () =>
        hideCourse(slug)
          .then(() => updateStatus(slug, "hidden"))
          .catch(() => {}),
      onOpen: () =>
        openCourse(slug)
          .then(() => updateStatus(slug, "published"))
          .catch(() => {}),
      onEditChanges: () => router.push(`/teacher-dashboard/courses/${slug}/edit`),
      onSubmitChanges: () =>
        submitPendingEdit(slug)
          .then(() => updatePendingStatus(slug, "pending"))
          .catch(() => {}),
      onWithdrawEdit: () =>
        withdrawPendingEdit(slug)
          .then(() => updatePendingStatus(slug, "draft"))
          .catch(() => {}),
      onDiscardChanges: () =>
        discardPendingEdit(slug)
          .then(() => updatePendingStatus(slug, null))
          .catch(() => {}),
    };
  }

  const filtered = courses
    .filter((course) => course.status !== "rejected")
    .filter((course) => {
      if (activeTab === "all") return true;
      const { status, pending_edit_status } = course;
      const isPub = status === "published" || status === "hidden";
      if (activeTab === "active") {
        return isPub && !pending_edit_status;
      }
      if (activeTab === "drafts") {
        return status === "draft" || (isPub && pending_edit_status === "draft");
      }
      if (activeTab === "pendingModeration") {
        return status === "review" || (isPub && pending_edit_status === "pending");
      }
      if (activeTab === "forReview") {
        return status === "needs_revision" || (isPub && pending_edit_status === "needs_revision");
      }
      const allowed = TAB_STATUSES[activeTab];
      if (!allowed) return true;
      return allowed.includes(status);
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const months = [...new Set(filtered.map((course) => getCourseMonthLabel(course, locale)))];

  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const addCourseButton = (
    <Link
      href="/teacher-dashboard/courses/new"
      className="flex shrink-0 items-center font-(family-name:--font-accent) font-medium uppercase text-(--color-text-primary) transition-opacity hover:opacity-85 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-blue)"
      style={{
        background: "var(--gradient-brand)",
        borderRadius: "clamp(16px, 1.94vw, 28px)",
        padding: "clamp(8px, 0.83vw, 12px) clamp(16px, 1.94vw, 28px)",
        fontSize: "clamp(16px, 1.39vw, 20px)",
        gap: "clamp(8px, 0.83vw, 12px)",
      }}
    >
      {t("addCourse")}
      <Image
        src="/icons/add.svg"
        alt=""
        width={14}
        height={14}
        style={{ width: "clamp(18px, 1.94vw, 28px)", height: "clamp(18px, 1.94vw, 28px)" }}
      />
    </Link>
  );

  return (
    <PageShell className="bg-my-courses">
      <div style={{ maxWidth: "1648px", margin: "0 auto" }}>
        {/* Tabs */}
        <nav
          aria-label={t("courseFilterAriaLabel")}
          className="-mx-4 flex items-center overflow-x-auto px-4 [-ms-overflow-style:none] [scrollbar-width:none] lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden"
          style={{ marginBottom: "clamp(16px, 2.22vw, 32px)", gap: "clamp(16px, 1.67vw, 40px)" }}
        >
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              aria-current={activeTab === tab ? "page" : undefined}
              className={[
                "shrink-0 cursor-pointer whitespace-nowrap font-semibold text-(--color-text-primary) transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-blue)",
                activeTab === tab ? "underline underline-offset-4" : "hover:opacity-70",
              ].join(" ")}
              style={{
                fontFamily: "var(--font-base)",
                fontWeight: 600,
                fontSize: "clamp(20px, 1.39vw, 24px)",
              }}
            >
              {t(TAB_LABEL_KEYS[tab])}
            </button>
          ))}
        </nav>

        {activeTab === "rejected" || (!loading && !error && months.length === 0) ? (
          <div className="flex justify-end" style={{ marginBottom: "clamp(16px, 2.22vw, 32px)" }}>
            {addCourseButton}
          </div>
        ) : null}

        {loading ? (
          <p className="mt-16 text-center text-lg text-(--color-text-secondary)">{t("loading")}</p>
        ) : error ? (
          <p className="mt-16 text-center text-lg text-red-500">{error}</p>
        ) : activeTab === "rejected" ? (
          rejectedCourses.length === 0 ? (
            <p className="mt-16 text-center text-lg text-(--color-text-secondary)">
              {t("noRejectedCourses")}
            </p>
          ) : (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              style={{ gap: "clamp(8px, 1.11vw, 16px)" }}
            >
              {rejectedCourses.map((record) => (
                <RejectedCourseCard
                  key={record.id}
                  record={record}
                  onView={() => setViewRejected(record)}
                  onMoveToDraft={() => handleMoveToDraft(record.course_slug)}
                />
              ))}
            </div>
          )
        ) : months.length === 0 ? (
          <p className="mt-16 text-center text-lg text-(--color-text-secondary)">
            {t("noCoursesFound")}
          </p>
        ) : (
          months.map((month, monthIndex) => (
            <section key={month} style={{ marginBottom: "clamp(24px, 3.06vw, 44px)" }}>
              <div
                className="flex items-center justify-between"
                style={{ marginBottom: "clamp(20px, 2.22vw, 32px)" }}
              >
                <h2
                  className="font-normal text-(--color-text-primary) capitalize"
                  style={{ fontSize: "clamp(16px, 1.67vw, 24px)" }}
                >
                  {month}
                </h2>
                {monthIndex === 0 && addCourseButton}
              </div>
              <div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                style={{ gap: "clamp(8px, 1.11vw, 16px)" }}
              >
                {filtered
                  .filter((c) => getCourseMonthLabel(c, locale) === month)
                  .map((course) => (
                    <TeacherCourseCard
                      key={course.id}
                      title={course.title}
                      level={course.level}
                      status={resolveCardStatus(course)}
                      imageSrc={course.image}
                      iconSrc={LEVEL_ICON[course.level] ?? "/icons/curses.svg"}
                      rating={
                        course.status === "archived" || course.status === "published"
                          ? Number(course.rating_avg)
                          : undefined
                      }
                      slug={course.slug}
                      enrolledCount={course.students_count}
                      {...makeHandlers(course)}
                    />
                  ))}
              </div>
            </section>
          ))
        )}
      </div>

      {viewRejected && (
        <RejectionDetailModal
          record={viewRejected}
          onClose={() => setViewRejected(null)}
          onMoveToDraft={handleMoveToDraft}
        />
      )}

      {statusError && (
        <ModalShell
          title={t("cannotReturnToDraft")}
          width="clamp(360px, 30vw, 480px)"
          onClose={() => setStatusError(null)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p
              style={{
                fontFamily: "var(--font-base)",
                fontSize: 14,
                color: "var(--color-text-secondary)",
                margin: 0,
              }}
            >
              {t("noLongerRejected")}
            </p>
            <p
              style={{
                fontFamily: "var(--font-base)",
                fontSize: 14,
                color: "var(--color-text-primary)",
                margin: 0,
              }}
            >
              {t("currentStatus")}{" "}
              <strong style={{ textTransform: "capitalize" }}>
                {statusError.currentStatus.replace(/_/g, " ")}
              </strong>
            </p>
            <div style={{ paddingTop: 8 }}>
              <AccentButton type="button" size="md" onClick={() => setStatusError(null)}>
                {t("ok")}
              </AccentButton>
            </div>
          </div>
        </ModalShell>
      )}
    </PageShell>
  );
}
