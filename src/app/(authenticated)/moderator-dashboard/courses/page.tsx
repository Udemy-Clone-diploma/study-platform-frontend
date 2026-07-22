"use client";

import { useCallback, useEffect, useState } from "react";
import { useAutoRefresh } from "@/shared/lib/useAutoRefresh";
import { PageShell } from "@/shared/ui/PageShell";
import {
  assignModeratorSelf,
  getModeratorApprovalRecords,
  getModeratorRejectionRecords,
  getMyModerationCourses,
  getUnassignedModerationCourses,
  type ApprovedCourseRecord,
  type CourseListItem,
  type RejectedCourseRecord,
} from "@/entities/course";
import type { ApiError } from "@/shared/api/base";
import { CourseConfirmModal } from "@/features/courses/ui/CourseConfirmModal";
import { CourseInfoModal } from "@/features/courses/ui/CourseInfoModal";
import { RejectionDetailModal } from "@/features/courses/ui/RejectionDetailModal";
import {
  ModeratorCoursesTable,
  ModeratorHistoryTable,
  type ModeratorCourseTab,
} from "@/features/courses/ui/ModeratorCoursesTable";

const TABS = [
  { key: "unassigned", label: "Unassigned" },
  { key: "review", label: "Under review" },
  { key: "needs_revision", label: "Requires revision" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function ModeratorCoursesPage() {
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    if (typeof window === "undefined") return "unassigned";
    const tab = new URLSearchParams(window.location.search).get("tab");
    return (TABS.some((item) => item.key === tab) ? tab : "unassigned") as TabKey;
  });
  const [unassigned, setUnassigned] = useState<CourseListItem[]>([]);
  const [myCourses, setMyCourses] = useState<CourseListItem[]>([]);
  const [rejected, setRejected] = useState<RejectedCourseRecord[]>([]);
  const [approvedRecords, setApprovedRecords] = useState<ApprovedCourseRecord[]>([]);
  const [viewRejected, setViewRejected] = useState<RejectedCourseRecord | null>(null);
  const [viewApproved, setViewApproved] = useState<ApprovedCourseRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState("");

  const loadCourses = useCallback(async () => {
    const [unassignedResult, myResult, rejectedResult, approvedResult] = await Promise.all([
      getUnassignedModerationCourses(),
      getMyModerationCourses(),
      getModeratorRejectionRecords(),
      getModeratorApprovalRecords(),
    ]);

    setUnassigned(unassignedResult.results);
    setMyCourses(myResult.results);
    setRejected(rejectedResult.results);
    setApprovedRecords(approvedResult.results);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    loadCourses()
      .catch((requestError: Partial<ApiError>) => {
        if (!cancelled) setError(requestError.message ?? "Failed to load courses.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [loadCourses]);

  const refresh = useCallback(() => {
    void loadCourses().catch(() => {});
  }, [loadCourses]);

  useAutoRefresh(refresh);

  function getVisibleCourses() {
    if (activeTab === "unassigned") return unassigned;
    if (activeTab === "review") {
      return myCourses.filter(
        (course) =>
          course.status === "review" ||
          ((course.status === "published" || course.status === "hidden") &&
            course.pending_edit_status === "pending"),
      );
    }
    if (activeTab === "needs_revision") {
      return myCourses.filter(
        (course) =>
          course.status === "needs_revision" ||
          ((course.status === "published" || course.status === "hidden") &&
            course.pending_edit_status === "needs_revision"),
      );
    }
    return [];
  }

  async function handleAssignConfirm() {
    if (!pendingSlug) return;
    setAssigning(true);
    setAssignError("");

    try {
      await assignModeratorSelf(pendingSlug);
      const moved = unassigned.find((course) => course.slug === pendingSlug);
      if (moved) {
        setUnassigned((current) => current.filter((course) => course.slug !== pendingSlug));
        setMyCourses((current) => [{ ...moved, status: "review" }, ...current]);
      }
      setActiveTab("review");
      setPendingSlug(null);
    } catch (requestError: unknown) {
      setAssignError(
        (requestError as Partial<ApiError>).message ?? "Failed to assign. Please try again.",
      );
    } finally {
      setAssigning(false);
    }
  }

  const visibleCourses = getVisibleCourses();

  return (
    <PageShell className="bg-my-courses">
      <div className="mx-auto w-full" style={{ maxWidth: 1648 }}>
        <h1
          className="font-semibold text-(--color-text-primary)"
          style={{
            fontFamily: "var(--font-base)",
            fontSize: "clamp(24px, 2.5vw, 36px)",
            margin: "0 0 clamp(16px, 1.67vw, 24px)",
          }}
        >
          Courses
        </h1>

        <nav
          aria-label="Moderation filter"
          className="flex flex-wrap items-center"
          style={{ gap: "clamp(12px, 2.6vw, 50px)", marginBottom: "clamp(16px, 1.67vw, 24px)" }}
        >
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setActiveTab(key);
                setError("");
              }}
              aria-current={activeTab === key ? "page" : undefined}
              className={`font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-blue) ${
                activeTab === key
                  ? "text-(--color-text-primary)"
                  : "text-(--color-text-secondary) opacity-35 hover:opacity-100"
              }`}
              style={{ fontSize: "clamp(14px, 1.25vw, 24px)" }}
            >
              {label}
            </button>
          ))}
        </nav>

        {loading ? (
          <p className="mt-16 text-center text-lg text-(--color-text-secondary)">Loading…</p>
        ) : error ? (
          <p className="mt-16 text-center text-lg text-red-500">{error}</p>
        ) : activeTab === "approved" ? (
          <ModeratorHistoryTable
            records={approvedRecords}
            status="approved"
            emptyMessage="No approved courses."
            onView={(record) => setViewApproved(record as ApprovedCourseRecord)}
          />
        ) : activeTab === "rejected" ? (
          <ModeratorHistoryTable
            records={rejected}
            status="rejected"
            emptyMessage="No rejected courses."
            onView={(record) => setViewRejected(record as RejectedCourseRecord)}
          />
        ) : (
          <ModeratorCoursesTable
            courses={visibleCourses}
            tab={activeTab as ModeratorCourseTab}
            emptyMessage="No courses found."
            onAssign={(course) => {
              setAssignError("");
              setPendingSlug(course.slug);
            }}
          />
        )}
      </div>

      {viewRejected ? (
        <RejectionDetailModal record={viewRejected} onClose={() => setViewRejected(null)} />
      ) : null}

      {viewApproved ? (
        <CourseInfoModal record={viewApproved} onClose={() => setViewApproved(null)} />
      ) : null}

      {pendingSlug ? (
        <CourseConfirmModal
          title="Assign as moderator"
          description={
            assignError ||
            "Assign yourself as moderator for this course? It will appear in your assigned list."
          }
          confirmLabel="Assign to me"
          loading={assigning}
          onConfirm={handleAssignConfirm}
          onCancel={() => {
            setPendingSlug(null);
            setAssignError("");
          }}
        />
      ) : null}
    </PageShell>
  );
}
