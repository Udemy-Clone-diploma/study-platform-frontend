"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAutoRefresh } from "@/shared/lib/useAutoRefresh";
import {
  getUnassignedModerationCourses,
  getMyModerationCourses,
  getModeratorRejectionRecords,
  getModeratorApprovalRecords,
  assignModeratorSelf,
} from "@/entities/course";
import { CourseConfirmModal } from "@/features/courses/ui/CourseConfirmModal";
import { RejectionDetailModal } from "@/features/courses/ui/RejectionDetailModal";
import { CourseInfoModal } from "@/features/courses/ui/CourseInfoModal";
import type { ApprovedCourseRecord, CourseListItem, CourseLevel, RejectedCourseRecord } from "@/entities/course";
import type { ApiError } from "@/shared/api/base";

// ── Tabs ──────────────────────────────────────────────────────────────────────

const TABS = [
  { key: "unassigned",     label: "Unassigned" },
  { key: "review",         label: "Under review" },
  { key: "needs_revision", label: "Requires revision" },
  { key: "approved",       label: "Approved" },
  { key: "rejected",       label: "Rejected" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const MY_STATUS_FILTER: Partial<Record<TabKey, string>> = {
  review:         "review",
  needs_revision: "needs_revision",
  approved:       "published",
};

// ── Card design ───────────────────────────────────────────────────────────────

const LEVEL_GRADIENT: Record<CourseLevel, string> = {
  beginner:     "var(--gradient-card-blue)",
  intermediate: "var(--gradient-card-yellow)",
  advanced:     "var(--gradient-card-pink)",
};

const TAB_STATUS_ICON: Record<TabKey, string | null> = {
  unassigned:     null,
  review:         "/icons/clock.svg",
  needs_revision: "/icons/exclamationmark-triangle.svg",
  approved:       "/icons/yes.svg",
  rejected:       "/icons/no.svg",
};

const LEVEL_FALLBACK: Record<CourseLevel, string> = {
  beginner:     "/icons/curses.svg",
  intermediate: "/icons/world.png",
  advanced:     "/icons/statistics.svg",
};

function ModeratorCourseCard({ course, tab, onClick, href }: {
  course: CourseListItem;
  tab: TabKey;
  onClick?: () => void;
  href?: string;
}) {
  const gradient   = LEVEL_GRADIENT[course.level] ?? "var(--gradient-card-blue)";
  const fallback   = LEVEL_FALLBACK[course.level] ?? "/icons/curses.svg";
  const statusIcon = TAB_STATUS_ICON[tab];
  const thumbSize  = "clamp(36px, 4.17vw, 60px)";
  const iconSize   = "clamp(16px, 1.67vw, 24px)";

  const cardClass = "flex items-center shadow-(--shadow-my-courses-card) transition-[box-shadow,filter] hover:shadow-[0px_0px_40px_rgba(0,0,0,0.22)] focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-blue)";
  const cardStyle = {
    background: gradient,
    borderRadius: "clamp(12px, 1.39vw, 20px)",
    padding: "clamp(10px, 2.09vw, 40px) clamp(8px, 0.83vw, 12px)",
    gap: "clamp(4px, 0.56vw, 8px)",
  };

  const body = (
    <>
      <Image
        src={course.image ?? fallback}
        alt=""
        width={60}
        height={60}
        unoptimized={!!course.image}
        className="shrink-0 object-contain"
        style={{ width: thumbSize, height: thumbSize }}
      />

      <div className="flex min-w-0 flex-1 flex-col justify-center" style={{ gap: "clamp(4px, 0.56vw, 8px)" }}>
        <div className="flex items-center" style={{ gap: "clamp(4px, 0.28vw, 4px)" }}>
          <h3
            className="line-clamp-2 flex-1 font-bold uppercase text-(--color-text-primary)"
            style={{ fontSize: "clamp(10px, 0.97vw, 14px)", lineHeight: "clamp(13px, 1.25vw, 18px)" }}
          >
            {course.title}
          </h3>

          {statusIcon ? (
            <div className="flex shrink-0 items-center justify-center" style={{ width: "clamp(24px, 2.5vw, 36px)", height: "clamp(24px, 2.5vw, 36px)" }}>
              <Image src={statusIcon} alt="" width={24} height={24} style={{ width: iconSize, height: iconSize }} />
            </div>
          ) : tab === "unassigned" ? (
            <span className="shrink-0 rounded-full border border-dashed border-(--color-draft) bg-white/50 font-(family-name:--font-accent) font-semibold uppercase"
              style={{ fontSize: "clamp(8px, 0.63vw, 11px)", padding: "2px 7px", color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>
              New
            </span>
          ) : null}
        </div>
      </div>

      <div aria-hidden className="shrink-0" style={{ width: "clamp(24px, 2.5vw, 40px)" }} />
    </>
  );

  if (onClick) {
    return (
      <div className="relative">
        <button type="button" onClick={onClick} className={`${cardClass} w-full text-left`} style={cardStyle}>
          {body}
        </button>
      </div>
    );
  }
  return (
    <div className="relative">
      <Link href={href ?? "#"} className={cardClass} style={cardStyle}>
        {body}
      </Link>
    </div>
  );
}

// ── Record card (approved / rejected history tabs) ────────────────────────────

const CURRENT_YEAR = new Date().getFullYear();

function recordMonthLabel(date: string): string {
  const d    = new Date(date);
  const name = d.toLocaleString("en-US", { month: "long" });
  return d.getFullYear() === CURRENT_YEAR ? name : `${name} ${d.getFullYear()}`;
}

function ModeratorRecordCard({ title, image, level, statusIcon, statusAlt, onClick }: {
  title: string;
  image?: string | null;
  level: CourseLevel;
  statusIcon: string;
  statusAlt: string;
  onClick: () => void;
}) {
  const gradient  = LEVEL_GRADIENT[level] ?? "var(--gradient-card-blue)";
  const fallback  = LEVEL_FALLBACK[level]  ?? "/icons/curses.svg";
  const thumbSize = "clamp(36px, 4.17vw, 60px)";
  const iconSize  = "clamp(16px, 1.67vw, 24px)";
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center text-left shadow-(--shadow-my-courses-card) transition-[box-shadow,filter] hover:shadow-[0px_0px_40px_rgba(0,0,0,0.22)] focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-blue)"
        style={{ background: gradient, borderRadius: "clamp(12px, 1.39vw, 20px)", padding: "clamp(10px, 2.09vw, 40px) clamp(8px, 0.83vw, 12px)", gap: "clamp(4px, 0.56vw, 8px)" }}
      >
        <Image src={image ?? fallback} alt="" width={60} height={60} unoptimized={!!image} className="shrink-0 object-contain" style={{ width: thumbSize, height: thumbSize }} />
        <div className="flex min-w-0 flex-1 flex-col justify-center" style={{ gap: "clamp(4px, 0.56vw, 8px)" }}>
          <div className="flex items-center" style={{ gap: "clamp(4px, 0.28vw, 4px)" }}>
            <h3 className="line-clamp-2 flex-1 font-bold uppercase text-(--color-text-primary)" style={{ fontSize: "clamp(10px, 0.97vw, 14px)", lineHeight: "clamp(13px, 1.25vw, 18px)" }}>
              {title}
            </h3>
            <div className="flex shrink-0 items-center justify-center" style={{ width: "clamp(24px, 2.5vw, 36px)", height: "clamp(24px, 2.5vw, 36px)" }}>
              <Image src={statusIcon} alt={statusAlt} width={24} height={24} style={{ width: iconSize, height: iconSize }} />
            </div>
          </div>
        </div>
        <div aria-hidden className="shrink-0" style={{ width: "clamp(24px, 2.5vw, 40px)" }} />
      </button>
    </div>
  );
}

function RecordMonthGrid<T extends { id: number | string }>({
  records, dateKey, statusIcon, statusAlt, getTitle, getImage, getLevel, onView, emptyText,
}: {
  records: T[];
  dateKey: keyof T;
  statusIcon: string;
  statusAlt: string;
  getTitle: (r: T) => string;
  getImage: (r: T) => string | null | undefined;
  getLevel: (r: T) => CourseLevel;
  onView: (r: T) => void;
  emptyText: string;
}) {
  if (records.length === 0) {
    return <p className="mt-16 text-center text-lg text-(--color-text-secondary)">{emptyText}</p>;
  }
  const months = [...new Set(records.map((r) => recordMonthLabel(r[dateKey] as string)))];
  return (
    <>
      {months.map((month) => (
        <section key={month} style={{ marginBottom: "clamp(16px, 2.22vw, 32px)" }}>
          <h2 style={{ fontFamily: "var(--font-base)", fontSize: "clamp(16px, 1.67vw, 24px)", marginBottom: "clamp(8px, 1.11vw, 16px)", color: "var(--color-text-primary)" }}>{month}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" style={{ gap: "clamp(8px, 1.11vw, 16px)" }}>
            {records.filter((r) => recordMonthLabel(r[dateKey] as string) === month).map((r) => (
              <ModeratorRecordCard
                key={r.id}
                title={getTitle(r)}
                image={getImage(r)}
                level={getLevel(r)}
                statusIcon={statusIcon}
                statusAlt={statusAlt}
                onClick={() => onView(r)}
              />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}



// ── Page ──────────────────────────────────────────────────────────────────────

export default function ModeratorCoursesPage() {
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    if (typeof window === "undefined") return "unassigned";
    const p = new URLSearchParams(window.location.search).get("tab");
    return (TABS.some((t) => t.key === p) ? p : "unassigned") as TabKey;
  });
  const [unassigned, setUnassigned]   = useState<CourseListItem[]>([]);
  const [myCourses, setMyCourses]     = useState<CourseListItem[]>([]);
  const [rejected, setRejected]           = useState<RejectedCourseRecord[]>([]);
  const [approvedRecords, setApprovedRecords] = useState<ApprovedCourseRecord[]>([]);
  const [viewRejected, setViewRejected]   = useState<RejectedCourseRecord | null>(null);
  const [viewApproved, setViewApproved]   = useState<ApprovedCourseRecord | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);
  const [assigning, setAssigning]     = useState(false);
  const [assignError, setAssignError] = useState("");

  const refresh = useCallback(() => {
    Promise.all([
      getUnassignedModerationCourses().then((r) => r.results),
      getMyModerationCourses().then((r) => r.results),
      getModeratorRejectionRecords().then((r) => r.results),
      getModeratorApprovalRecords().then((r) => r.results),
    ]).then(([u, m, rej, appr]) => {
      setUnassigned(u);
      setMyCourses(m);
      setRejected(rej);
      setApprovedRecords(appr);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    Promise.all([
      getUnassignedModerationCourses().then((r) => r.results),
      getMyModerationCourses().then((r) => r.results),
      getModeratorRejectionRecords().then((r) => r.results),
      getModeratorApprovalRecords().then((r) => r.results),
    ])
      .then(([u, m, rej, appr]) => {
        setUnassigned(u);
        setMyCourses(m);
        setRejected(rej);
        setApprovedRecords(appr);
        setLoading(false);
      })
      .catch((err: Partial<ApiError>) => {
        setError(err.message ?? "Failed to load courses.");
        setLoading(false);
      });
  }, []);

  useAutoRefresh(refresh);

  function getVisible(): CourseListItem[] {
    if (activeTab === "unassigned") return unassigned;
    if (activeTab === "rejected" || activeTab === "approved") return [];
    if (activeTab === "review") {
      return myCourses.filter(
        (c) =>
          c.status === "review" ||
          ((c.status === "published" || c.status === "hidden") &&
            c.pending_edit_status === "pending"),
      );
    }
    if (activeTab === "needs_revision") {
      return myCourses.filter(
        (c) =>
          c.status === "needs_revision" ||
          ((c.status === "published" || c.status === "hidden") &&
            c.pending_edit_status === "needs_revision"),
      );
    }
    const status = MY_STATUS_FILTER[activeTab];
    return status ? myCourses.filter((c) => c.status === status) : [];
  }

  async function handleAssignConfirm() {
    if (!pendingSlug) return;
    setAssigning(true);
    setAssignError("");
    try {
      await assignModeratorSelf(pendingSlug);
      const moved = unassigned.find((c) => c.slug === pendingSlug);
      if (moved) {
        setUnassigned((prev) => prev.filter((c) => c.slug !== pendingSlug));
        setMyCourses((prev) => [{ ...moved, status: "review" }, ...prev]);
      }
      setActiveTab("review");
      setPendingSlug(null);
    } catch (err: unknown) {
      setAssignError((err as Partial<ApiError>).message ?? "Failed to assign. Please try again.");
    } finally {
      setAssigning(false);
    }
  }

  const visible = getVisible();

  return (
    <main
      className="bg-my-courses min-h-[calc(100vh-76px)]"
      style={{ paddingInline: "clamp(16px, 2.78vw, 40px)", paddingBlock: "clamp(16px, 2.22vw, 32px)" }}
    >
      <div style={{ maxWidth: "1648px", margin: "0 auto" }}>

        {/* Tabs */}
        <nav
          aria-label="Moderation filter"
          className="flex flex-wrap items-center"
          style={{ gap: "clamp(12px, 2.6vw, 50px)", marginBottom: "clamp(12px, 1.67vw, 28px)" }}
        >
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => { setActiveTab(key); setError(""); }}
              aria-current={activeTab === key ? "page" : undefined}
              className={[
                "font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-blue)",
                activeTab === key
                  ? "text-(--color-text-primary)"
                  : "text-(--color-text-secondary) opacity-35 hover:opacity-100",
              ].join(" ")}
              style={{ fontSize: "clamp(14px, 1.25vw, 24px)" }}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Content */}
        {loading ? (
          <p className="mt-16 text-center text-lg text-(--color-text-secondary)">Loading…</p>
        ) : error ? (
          <p className="mt-16 text-center text-lg text-red-500">{error}</p>
        ) : activeTab === "rejected" ? (
          <RecordMonthGrid
            records={rejected}
            dateKey="rejected_at"
            statusIcon="/icons/no.svg"
            statusAlt="rejected"
            getTitle={(r) => r.course_title}
            getImage={(r) => r.course_image_url}
            getLevel={(r) => (r.course_level as CourseLevel) ?? "beginner"}
            onView={setViewRejected}
            emptyText="No rejected courses."
          />
        ) : activeTab === "approved" ? (
          <RecordMonthGrid
            records={approvedRecords}
            dateKey="approved_at"
            statusIcon="/icons/yes.svg"
            statusAlt="approved"
            getTitle={(r) => r.course_title}
            getImage={(r) => r.course_image_url}
            getLevel={(r) => (r.course_level as CourseLevel) ?? "beginner"}
            onView={setViewApproved}
            emptyText="No approved courses."
          />
        ) : activeTab === "unassigned" ? (
          unassigned.length === 0 ? (
            <p className="mt-16 text-center text-lg text-(--color-text-secondary)">No courses found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" style={{ gap: "clamp(8px, 1.11vw, 16px)" }}>
              {unassigned.map((course) => (
                <ModeratorCourseCard
                  key={course.slug}
                  course={course}
                  tab="unassigned"
                  onClick={() => { setAssignError(""); setPendingSlug(course.slug); }}
                />
              ))}
            </div>
          )
        ) : visible.length === 0 ? (
          <p className="mt-16 text-center text-lg text-(--color-text-secondary)">No courses found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" style={{ gap: "clamp(8px, 1.11vw, 16px)" }}>
            {visible.map((course) => (
              <ModeratorCourseCard
                key={course.slug}
                course={course}
                tab={activeTab}
                href={`/moderator-dashboard/courses/${course.slug}/review`}
              />
            ))}
          </div>
        )}
      </div>

      {viewRejected && (
        <RejectionDetailModal
          record={viewRejected}
          onClose={() => setViewRejected(null)}
        />
      )}

      {viewApproved && (
        <CourseInfoModal
          record={viewApproved}
          onClose={() => setViewApproved(null)}
        />
      )}

      {pendingSlug && (
        <CourseConfirmModal
          title="Assign as moderator"
          description={assignError || "Assign yourself as moderator for this course? It will appear in your assigned list."}
          confirmLabel="Assign to me"
          loading={assigning}
          onConfirm={handleAssignConfirm}
          onCancel={() => { setPendingSlug(null); setAssignError(""); }}
        />
      )}
    </main>
  );
}
