"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Check, Star, X } from "lucide-react";
import { useAutoRefresh } from "@/shared/lib/useAutoRefresh";
import { PageShell } from "@/shared/ui/PageShell";
import { AccentButton } from "@/shared/ui/AccentButton";
import { CourseConfirmModal } from "@/features/courses/ui/CourseConfirmModal";
import {
  getUnassignedReportedReviews,
  getMyReportedReviews,
  assignReviewModeratorSelf,
  approveReportedReview,
  rejectReportedReview,
} from "@/entities/course";
import type { ModeratorReview } from "@/entities/course";
import type { ApiError } from "@/shared/api/base";

const TABS = [
  { key: "unassigned", label: "Unassigned" },
  { key: "all", label: "All Reviews" },
  { key: "pending", label: "Under Review" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function StatusPill({ status }: { status: "pending" | "approved" | "rejected" }) {
  const config = {
    pending: { label: "Under Review", color: "var(--color-gold)" },
    approved: { label: "Approved", color: "var(--color-success)" },
    rejected: { label: "Rejected", color: "var(--color-danger)" },
  }[status];
  return (
    <span
      className="rounded-full font-semibold uppercase"
      style={{
        padding: "2px 12px",
        fontSize: "clamp(10px, 0.78vw, 13px)",
        border: `1px solid ${config.color}`,
        color: config.color,
        background: "white",
        whiteSpace: "nowrap",
      }}
    >
      {config.label}
    </span>
  );
}

function PillActionButton({
  color,
  icon,
  onClick,
  disabled,
  children,
}: {
  color: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center rounded-full font-semibold uppercase transition hover:opacity-75 disabled:cursor-not-allowed disabled:opacity-50"
      style={{
        gap: 6,
        padding: "clamp(5px, 0.42vw, 8px) clamp(12px, 1.04vw, 18px)",
        fontSize: "clamp(10px, 0.78vw, 13px)",
        letterSpacing: "0.06em",
        border: `1px solid ${color}`,
        color,
        background: "white",
      }}
    >
      {children}
      {icon}
    </button>
  );
}

function ReviewCard({
  review,
  onAssign,
  onApprove,
  onReject,
  busy,
}: {
  review: ModeratorReview;
  onAssign: () => void;
  onApprove: () => void;
  onReject: () => void;
  busy: boolean;
}) {
  const [showReports, setShowReports] = useState(false);
  const initial = review.student.name.charAt(0);
  const isUnassigned = review.moderator_id == null;
  const isPending = !isUnassigned && review.moderation_status === "pending";

  return (
    <div
      className="rounded-2xl bg-white"
      style={{
        padding: "clamp(16px, 1.67vw, 24px)",
        border: "1px solid var(--color-border-light)",
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="relative h-13 w-13 flex-shrink-0 overflow-hidden rounded-full bg-(--color-placeholder)">
            {review.student.avatar ? (
              <Image
                src={review.student.avatar}
                alt={review.student.name}
                fill
                className="object-cover"
                sizes="52px"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-base font-semibold text-(--color-text-primary)">
                {initial}
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Link
                href={`/profile/${review.student.id}?view=review&from=moderator-reviews`}
                className="font-bold text-(--color-text-primary) hover:text-(--color-blue)"
              >
                {review.student.name}
              </Link>
              <span className="text-sm text-(--color-text-secondary)">
                {new Date(review.created_at).toLocaleDateString()}
              </span>
            </div>
            <Link
              href={`/courses/${review.course.slug}`}
              className="text-sm text-(--color-text-secondary) hover:underline"
            >
              {review.course.title}
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={18}
              fill={i < review.rating ? "var(--color-gold)" : "transparent"}
              stroke="var(--color-gold)"
            />
          ))}
        </div>
      </div>

      {review.text && (
        <p
          className="mt-3 text-(--color-text-secondary)"
          style={{ fontSize: "clamp(13px, 0.97vw, 16px)" }}
        >
          {review.text}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {!isUnassigned && <StatusPill status={review.moderation_status || "pending"} />}
          <button
            type="button"
            onClick={() => setShowReports((v) => !v)}
            className="rounded-full font-semibold"
            style={{
              padding: "2px 12px",
              fontSize: "clamp(10px, 0.78vw, 13px)",
              border: "1px solid var(--color-border-light)",
              background: "white",
              cursor: "pointer",
            }}
          >
            {review.report_count} {review.report_count === 1 ? "report" : "reports"}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {isUnassigned && (
            <AccentButton type="button" size="sm" disabled={busy} onClick={onAssign}>
              {busy ? "…" : "Assign to me"}
            </AccentButton>
          )}
          {isPending && (
            <>
              <PillActionButton
                color="var(--color-danger)"
                icon={<X size={13} />}
                disabled={busy}
                onClick={onReject}
              >
                Reject
              </PillActionButton>
              <PillActionButton
                color="var(--color-success)"
                icon={<Check size={13} />}
                disabled={busy}
                onClick={onApprove}
              >
                Approve
              </PillActionButton>
            </>
          )}
        </div>
      </div>

      {showReports && (
        <div className="mt-3 flex flex-col border-t border-(--color-border-light) pt-3">
          {review.reports.map((r, i) => (
            <div
              key={i}
              className="flex items-center gap-3 py-2"
              style={{
                borderBottom:
                  i < review.reports.length - 1 ? "1px solid var(--color-border-light)" : "none",
              }}
            >
              <div className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-full bg-(--color-placeholder)">
                {r.reporter_avatar ? (
                  <Image
                    src={r.reporter_avatar}
                    alt={r.reporter_name}
                    fill
                    className="object-cover"
                    sizes="36px"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-(--color-text-primary)">
                    {r.reporter_name.charAt(0)}
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <Link
                    href={`/profile/${r.reporter_id}?view=review&from=moderator-reviews`}
                    className="font-semibold text-(--color-text-primary) hover:text-(--color-blue)"
                  >
                    {r.reporter_name}
                  </Link>
                  <span className="text-xs text-(--color-text-secondary)">
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-(--color-text-secondary)">{r.reason}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ModeratorReviewsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("unassigned");
  const [unassigned, setUnassigned] = useState<ModeratorReview[]>([]);
  const [mine, setMine] = useState<ModeratorReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingAssignId, setPendingAssignId] = useState<number | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const refresh = useCallback(() => {
    Promise.all([
      getUnassignedReportedReviews().then((r) => r.results),
      getMyReportedReviews().then((r) => r.results),
    ])
      .then(([u, m]) => {
        setUnassigned(u);
        setMine(m);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    Promise.all([
      getUnassignedReportedReviews().then((r) => r.results),
      getMyReportedReviews().then((r) => r.results),
    ])
      .then(([u, m]) => {
        setUnassigned(u);
        setMine(m);
        setLoading(false);
      })
      .catch((err: Partial<ApiError>) => {
        setError(err.message ?? "Failed to load reviews.");
        setLoading(false);
      });
  }, []);

  useAutoRefresh(refresh);

  async function handleAssignConfirm() {
    if (pendingAssignId == null) return;
    setAssigning(true);
    setAssignError("");
    try {
      await assignReviewModeratorSelf(pendingAssignId);
      // Refetch both lists instead of patching local state -- the optimistic
      // patch previously left moderator_id unset on the moved card, so it
      // still rendered as unassigned ("Assign to me") until a manual refresh.
      const [u, m] = await Promise.all([
        getUnassignedReportedReviews().then((r) => r.results),
        getMyReportedReviews().then((r) => r.results),
      ]);
      setUnassigned(u);
      setMine(m);
      setActiveTab("pending");
      setPendingAssignId(null);
    } catch (err: unknown) {
      setAssignError((err as Partial<ApiError>).message ?? "Failed to assign. Please try again.");
    } finally {
      setAssigning(false);
    }
  }

  async function handleApprove(id: number) {
    setBusyId(id);
    try {
      await approveReportedReview(id);
      setMine((prev) =>
        prev.map((r) => (r.id === id ? { ...r, moderation_status: "approved" } : r)),
      );
    } catch {
      // ignore -- card just stays in "Under Review"
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(id: number) {
    setBusyId(id);
    try {
      await rejectReportedReview(id);
      setMine((prev) =>
        prev.map((r) => (r.id === id ? { ...r, moderation_status: "rejected" } : r)),
      );
    } catch {
      // ignore -- card just stays in "Under Review"
    } finally {
      setBusyId(null);
    }
  }

  function getVisible(): ModeratorReview[] {
    if (activeTab === "unassigned") return unassigned;
    if (activeTab === "all") return mine;
    return mine.filter((r) => r.moderation_status === activeTab);
  }

  const visible = getVisible();

  return (
    <PageShell style={{ background: "var(--color-brand-lavender-soft)" }}>
      <div style={{ maxWidth: "1648px", margin: "0 auto" }}>
        <nav
          aria-label="Review moderation filter"
          className="flex flex-wrap items-center"
          style={{ gap: "clamp(12px, 2.6vw, 50px)", marginBottom: "clamp(12px, 1.67vw, 28px)" }}
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

        <div
          className="rounded-2xl bg-white"
          style={{ padding: "clamp(16px, 1.67vw, 24px)", marginTop: "clamp(16px, 1.67vw, 24px)" }}
        >
          {loading ? (
            <p className="py-16 text-center text-lg text-(--color-text-secondary)">Loading…</p>
          ) : error ? (
            <p className="py-16 text-center text-lg text-red-500">{error}</p>
          ) : visible.length === 0 ? (
            <p className="py-16 text-center text-lg text-(--color-text-secondary)">
              No reviews found.
            </p>
          ) : (
            <div className="flex flex-col" style={{ gap: "clamp(12px, 1.11vw, 16px)" }}>
              {visible.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  busy={busyId === review.id}
                  onAssign={() => {
                    setAssignError("");
                    setPendingAssignId(review.id);
                  }}
                  onApprove={() => handleApprove(review.id)}
                  onReject={() => handleReject(review.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {pendingAssignId != null && (
        <CourseConfirmModal
          title="Assign as moderator"
          description={
            assignError ||
            "Assign yourself as moderator for this reported review? It will move to your Under Review list."
          }
          confirmLabel="Assign to me"
          loading={assigning}
          onConfirm={handleAssignConfirm}
          onCancel={() => {
            setPendingAssignId(null);
            setAssignError("");
          }}
        />
      )}
    </PageShell>
  );
}
