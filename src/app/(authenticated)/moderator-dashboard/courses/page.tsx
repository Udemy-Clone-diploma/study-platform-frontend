"use client";

import { useState, useEffect } from "react";
import {
  getUnassignedModerationCourses,
  getMyModerationCourses,
  assignModeratorSelf,
} from "@/entities/course";
import { CourseCard } from "@/features/courses/ui/CourseCard";
import { CourseConfirmModal } from "@/features/courses/ui/CourseConfirmModal";
import type { CourseListItem, CourseStatus } from "@/entities/course";
import type { ApiError } from "@/shared/api/base";

// ── Tab config ────────────────────────────────────────────────────────────────
// "unassigned" and "my" use separate API calls;
// the status tabs filter inside "my courses" by CourseStatus.

const TABS = [
  { key: "unassigned",      label: "Unassigned" },
  { key: "my",              label: "All my courses" },
  { key: "review",          label: "Under review" },
  { key: "needs_revision",  label: "Requires revision" },
  { key: "published",       label: "Approved" },
  { key: "rejected",        label: "Rejected" },
  { key: "hidden",          label: "Suspended" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

// Status tabs that filter inside the "my courses" list
const MY_STATUS_FILTER: Partial<Record<TabKey, CourseStatus>> = {
  review:         "review",
  needs_revision: "needs_revision",
  published:      "published",
  hidden:         "hidden",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear();

function getMonthLabel(course: CourseListItem): string {
  const d    = new Date(course.created_at);
  const name = d.toLocaleString("en-US", { month: "long" });
  return d.getFullYear() === CURRENT_YEAR ? name : `${name} ${d.getFullYear()}`;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ModeratorCoursesPage() {
  const [activeTab, setActiveTab]           = useState<TabKey>("unassigned");
  const [unassigned, setUnassigned]         = useState<CourseListItem[]>([]);
  const [myCourses, setMyCourses]           = useState<CourseListItem[]>([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState("");
  const [pendingSlug, setPendingSlug]       = useState<string | null>(null);
  const [assigning, setAssigning]           = useState(false);
  const [assignError, setAssignError]       = useState("");

  // Initial load: unassigned courses + courses assigned to me
  useEffect(() => {
    Promise.all([
      getUnassignedModerationCourses().then((r) => r.results),
      getMyModerationCourses().then((r) => r.results),
    ])
      .then(([u, m]) => {
        setUnassigned(u);
        setMyCourses(m);
        setLoading(false);
      })
      .catch((err: Partial<ApiError>) => {
        setError(err.message ?? "Failed to load courses.");
        setLoading(false);
      });
  }, []);

  // Derive visible list from active tab
  function getVisible(): CourseListItem[] {
    if (activeTab === "unassigned") return unassigned;
    if (activeTab === "my")         return myCourses;
    const status = MY_STATUS_FILTER[activeTab];
    return status ? myCourses.filter((c) => c.status === status) : [];
  }

  function handleTabClick(key: TabKey) {
    setActiveTab(key);
    setError("");
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
      setActiveTab("my");
      setPendingSlug(null);
    } catch (err: unknown) {
      const msg = (err as Partial<ApiError>).message;
      setAssignError(msg ?? "Failed to assign. Please try again.");
    } finally {
      setAssigning(false);
    }
  }

  const visible = getVisible();
  const months  = [...new Set(visible.map(getMonthLabel))];

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
              onClick={() => handleTabClick(key)}
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
        ) : visible.length === 0 ? (
          <p className="mt-16 text-center text-lg text-(--color-text-secondary)">No courses found.</p>
        ) : (
          months.map((month) => (
            <section key={month} style={{ marginBottom: "clamp(16px, 2.22vw, 32px)" }}>
              <h2
                className="text-(--color-text-primary)"
                style={{
                  fontSize: "clamp(16px, 1.67vw, 24px)",
                  marginBottom: "clamp(8px, 1.11vw, 16px)",
                }}
              >
                {month}
              </h2>

              <div className="flex flex-wrap" style={{ gap: "clamp(8px, 1.11vw, 20px)" }}>
                {visible
                  .filter((c) => getMonthLabel(c) === month)
                  .map((course) =>
                    activeTab === "unassigned" ? (
                      <CourseCard
                        key={course.id}
                        course={course}
                        onClick={() => { setAssignError(""); setPendingSlug(course.slug); }}
                      />
                    ) : (
                      <CourseCard
                        key={course.id}
                        course={course}
                        href={`/moderator-dashboard/courses/${course.slug}/review`}
                      />
                    ),
                  )}
              </div>
            </section>
          ))
        )}
      </div>

      {pendingSlug && (
        <CourseConfirmModal
          title="Assign as moderator"
          description={
            assignError ||
            "Assign yourself as moderator for this course? It will appear in your assigned list."
          }
          confirmLabel="Assign to me"
          loading={assigning}
          onConfirm={handleAssignConfirm}
          onCancel={() => { setPendingSlug(null); setAssignError(""); }}
        />
      )}
    </main>
  );
}
