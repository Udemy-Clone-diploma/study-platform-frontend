"use client";

import type { ReactNode } from "react";
import { SectionCard } from "@/shared/ui/SectionCard";
import { CourseStatsGrid } from "./CourseStatsGrid";
import { ModeratorModuleCard } from "./ModeratorModuleCard";
import { ModerationNavButtons } from "./ModerationNavButtons";
import type { StepProps, ModeratorAction } from "../model/moderatorReview";
import { bodyFont, monoFont } from "../model/moderatorReview";

const OVERALL_ACTIONS: { key: NonNullable<ModeratorAction>; label: string; icon: ReactNode; color: string }[] = [
  { key: "approved",       label: "Approved",          color: "var(--color-success)",
    // eslint-disable-next-line @next/next/no-img-element
    icon: <img src="/icons/yes.svg"    alt="" width={16} height={16} style={{ width: 16, height: 16 }} /> },
  { key: "needs_revision", label: "Requires Revision", color: "var(--color-warning)",
    // eslint-disable-next-line @next/next/no-img-element
    icon: <img src="/icons/refine.svg" alt="" width={14} height={14} style={{ width: 14, height: 14 }} /> },
  { key: "rejected",       label: "Rejected",          color: "var(--color-rejected)",
    // eslint-disable-next-line @next/next/no-img-element
    icon: <img src="/icons/no.svg"     alt="" width={16} height={16} style={{ width: 16, height: 16 }} /> },
];

/** Step 3: full course overview, structure, and final moderator action. */
export function ModeratorReviewStep(props: StepProps) {
  const { course, moduleList, action, finalComment, submitting, error, step, hasAnyFlagged, allApproved, onActionChange, onFinalCommentChange, onNext, onBack, onSubmit, router } = props;

  const title        = course?.title ?? "Untitled Course";
  const categoryName = course?.category?.name ?? "";
  const levelLabel   = course?.level ? course.level.charAt(0).toUpperCase() + course.level.slice(1) : "";
  const submittedAt  = course?.created_at ? new Date(course.created_at).toLocaleDateString("en-GB") : "—";

  const totalModules = moduleList.length;
  const totalLessons = moduleList.reduce((a, m) => a + m.lessons.length, 0);
  const totalTests   = moduleList.reduce((a, m) => a + m.lessons.reduce((la, l) => la + (l.items ?? []).filter((i) => i.item_type === "test").length, 0), 0);
  const totalMin     = course?.total_duration_minutes ?? 0;

  const STATS = [
    { icon: "/icons/book-gradient.svg",       count: totalModules, label: "Modules"  },
    { icon: "/icons/play-gradient.svg",       count: totalLessons, label: "Lessons"  },
    { icon: "/icons/copy-check-gradient.svg", count: totalTests,   label: "Tests"    },
    { icon: "/icons/clock-gradient.svg",      count: totalMin,     label: "Minutes"  },
  ];

  return (
    <div className="rounded-2xl bg-white" style={{ padding: "clamp(24px, 2.08vw, 40px) clamp(24px, 2.6vw, 50px)", boxShadow: "var(--shadow-dashboard-card)", display: "flex", flexDirection: "column", gap: "clamp(16px, 1.25vw, 24px)" }}>
      <div>
        <h2 style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: "clamp(20px, 1.875vw, 36px)", marginBottom: "clamp(4px, 0.42vw, 8px)" }}>Review &amp; Publish</h2>
        <p style={{ fontFamily: bodyFont, fontWeight: 500, fontSize: "clamp(13px, 1.04vw, 20px)", letterSpacing: "-0.011em", color: "var(--color-text-secondary)" }}>
          Review course content and take a moderation action
        </p>
      </div>

      {/* Overview */}
      <SectionCard>
        <p style={{ fontFamily: bodyFont, fontWeight: 400, fontSize: "clamp(13px, 1.04vw, 20px)", letterSpacing: "-0.011em", marginBottom: 12 }}>Course Overview</p>
        <div className="flex items-start justify-between" style={{ gap: 16 }}>
          <div className="flex items-center" style={{ gap: 12, minWidth: 0 }}>
            <div style={{ width: "clamp(60px, 5.21vw, 100px)", height: "clamp(40px, 3.33vw, 64px)", background: "var(--color-text-primary)", borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/book-gradient.svg" alt="" style={{ width: "clamp(28px, 2.6vw, 50px)", height: "clamp(28px, 2.6vw, 50px)" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
              <span style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: "clamp(12px, 0.83vw, 16px)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
              <span style={{ fontFamily: bodyFont, fontWeight: 500, fontSize: "clamp(11px, 0.78vw, 15px)", color: "var(--color-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{course?.short_description}</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12, flexShrink: 0 }}>
            <div className="flex items-center" style={{ gap: 8 }}>
              {categoryName && <span style={{ background: "var(--gradient-brand)", borderRadius: 20, padding: "2px 12px", fontFamily: monoFont, fontWeight: 500, fontSize: "clamp(11px, 0.78vw, 15px)" }}>{categoryName}</span>}
              {levelLabel   && <span style={{ border: "1px solid var(--color-draft)", borderRadius: 20, padding: "2px 12px", fontFamily: monoFont, fontWeight: 500, fontSize: "clamp(11px, 0.78vw, 15px)", background: "var(--color-bg)" }}>{levelLabel}</span>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
              <span style={{ fontFamily: monoFont, fontWeight: 500, fontSize: "clamp(11px, 0.73vw, 14px)", background: "var(--color-brand-yellow)", padding: "1px 8px", borderRadius: 6 }}>Under Review</span>
              <span style={{ fontFamily: bodyFont, fontSize: "clamp(10px, 0.63vw, 12px)", color: "var(--color-text-secondary)" }}>Submitted: {submittedAt}</span>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Stats */}
      <CourseStatsGrid stats={STATS} />

      {/* Structure */}
      <SectionCard>
        <p style={{ fontFamily: bodyFont, fontWeight: 400, fontSize: "clamp(14px, 1.04vw, 20px)", letterSpacing: "-0.011em", marginBottom: 20 }}>Course Structure</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "clamp(10px, 0.83vw, 16px)" }}>
          {moduleList.map((mod, i) => (
            <ModeratorModuleCard key={mod.id} module={mod} index={i} itemStatuses={{}} onItemToggle={() => {}} readOnly />
          ))}
        </div>
      </SectionCard>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <div style={{ display: "flex", gap: 20, width: "100%", maxWidth: 880, alignItems: "flex-start" }}>

          <div style={{ flex: 1, border: "1px solid var(--color-pink-dark)", borderRadius: 20, padding: "28px 34px", display: "flex", flexDirection: "column", gap: 12 }}>
            <span style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 16, lineHeight: "20px" }}>Moderator comment</span>
            <textarea value={finalComment} onChange={(e) => onFinalCommentChange(e.target.value)}
              placeholder="Leave a comment for the teacher…"
              style={{ minHeight: 260, resize: "none", border: "none", outline: "none", fontFamily: bodyFont, fontWeight: 400, fontSize: 16, lineHeight: "20px", color: finalComment ? "var(--color-text-primary)" : "var(--color-draft)" }} />
          </div>

          <div style={{ width: 274, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-start", padding: "28px 34px", gap: 12, border: "1px solid var(--color-pink-dark)", borderRadius: 20 }}>
            <span style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 16, lineHeight: "20px", width: "100%", textAlign: "center" }}>Moderator action</span>
            <span style={{ fontFamily: bodyFont, fontWeight: 500, fontSize: 15, lineHeight: "19px", color: "var(--color-text-secondary)", width: "100%", textAlign: "center" }}>Select a status:</span>
            {OVERALL_ACTIONS.map(({ key, label, icon, color }) => {
              const isActive = action === key;
              const isBlocked =
                (hasAnyFlagged && key === "approved") ||
                (allApproved && (key === "needs_revision" || key === "rejected"));
              const title = hasAnyFlagged && key === "approved"
                ? "Some items are flagged — cannot approve"
                : allApproved && (key === "needs_revision" || key === "rejected")
                  ? "All items are approved — cannot send for revision or reject"
                  : undefined;
              return (
                <button key={key} type="button"
                  onClick={() => !isBlocked && onActionChange(isActive ? null : key)}
                  title={title}
                  style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: "2px 12px", width: "100%", height: 23, background: "white", border: `1px solid ${isBlocked ? "var(--color-border-light)" : isActive ? color : "var(--color-draft)"}`, borderRadius: 20, cursor: isBlocked ? "not-allowed" : "pointer", opacity: isBlocked ? 0.4 : 1, fontFamily: monoFont, fontWeight: 500, fontSize: 15, lineHeight: "19px", color: isBlocked ? "var(--color-text-secondary)" : isActive ? color : "var(--color-text-secondary)", transition: "border-color 0.2s, color 0.2s" }}>
                  <span>{label}</span>
                  <span style={{ flexShrink: 0, display: "flex", alignItems: "center", opacity: isActive && !isBlocked ? 1 : 0.35 }}>{icon}</span>
                </button>
              );
            })}
            {hasAnyFlagged && (
              <p style={{ fontFamily: bodyFont, fontSize: 12, color: "var(--color-brand-yellow)", margin: 0, width: "100%", textAlign: "center" }}>
                Flagged items — approve disabled
              </p>
            )}
            {allApproved && (
              <p style={{ fontFamily: bodyFont, fontSize: 12, color: "var(--color-success)", margin: 0, width: "100%", textAlign: "center" }}>
                All approved — only publish available
              </p>
            )}
          </div>

        </div>
      </div>

      <ModerationNavButtons step={step} action={action} hasAnyFlagged={hasAnyFlagged} submitting={submitting} error={error} onNext={onNext} onBack={onBack} onSubmit={onSubmit} router={router} />
    </div>
  );
}
