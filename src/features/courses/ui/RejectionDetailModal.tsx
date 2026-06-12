"use client";

import { useState, useEffect } from "react";
import { ModalShell } from "@/shared/ui/ModalShell";
import { getCourseBySlug } from "@/entities/course";
import type { RejectedCourseRecord, CourseDetail } from "@/entities/course";

// ── constants ──────────────────────────────────────────────────────────────────

type StatusValue = "approved" | "needs_revision" | "rejected";

const STATUS_ICON: Record<StatusValue, string> = {
  approved:       "/icons/yes.svg",
  needs_revision: "/icons/refine.svg",
  rejected:       "/icons/no.svg",
};
const STATUS_VAR: Record<StatusValue, string> = {
  approved:       "var(--color-success)",
  needs_revision: "var(--color-warning)",
  rejected:       "var(--color-rejected)",
};
const STATUS_LABEL: Record<StatusValue | "", string> = {
  approved:       "Approved",
  needs_revision: "Requires Revision",
  rejected:       "Rejected",
  "":             "",
};
const FIELD_LABEL: Record<string, string> = {
  "field-title":             "Title",
  "field-short-description": "Short Description",
  "field-full-description":  "Full Description",
  "field-icon":              "Icon",
  "field-category":          "Category",
  "field-level":             "Level",
  "field-price":             "Price",
};

// ── helpers ────────────────────────────────────────────────────────────────────

const bf = "var(--font-base)";
const af = "var(--font-accent)";

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB");
}

function getFieldValue(key: string, detail: CourseDetail | null, record: RejectedCourseRecord): string {
  switch (key) {
    case "field-title":             return detail?.title ?? record.course_title;
    case "field-short-description": return detail?.short_description ?? "—";
    case "field-full-description":  return detail?.full_description  ?? "—";
    case "field-icon":              return "";
    case "field-category":          return record.course_category || detail?.category?.name || "—";
    case "field-level": {
      const lvl = detail?.level ?? record.course_level ?? "";
      return lvl.charAt(0).toUpperCase() + lvl.slice(1);
    }
    case "field-price": {
      const plan = detail?.pricing_plans?.[0];
      return plan ? `€${plan.price}` : "Free";
    }
    default: return "—";
  }
}

// ── sub-components ─────────────────────────────────────────────────────────────

/** Comment box: project-style border, readonly, auto height, no button. */
function CommentBox({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div style={{
      padding: 20,
      background: "var(--color-bg)",
      border: "1px solid var(--color-pink-dark)",
      borderRadius: 20,
    }}>
      <p style={{
        fontFamily: bf, fontWeight: 400, fontSize: 16, lineHeight: "20px",
        color: "var(--color-text-primary)", margin: 0, whiteSpace: "pre-wrap",
      }}>
        {text}
      </p>
    </div>
  );
}

function Section({ title, action, comment, children }: {
  title: string;
  action?: string;
  comment?: string;
  children: React.ReactNode;
}) {
  const s = (action ?? "") as StatusValue | "";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        paddingBottom: 10, borderBottom: "1px solid var(--color-border-light)",
      }}>
        <span style={{ fontFamily: bf, fontWeight: 700, fontSize: "clamp(14px, 1.04vw, 18px)", color: "var(--color-text-primary)" }}>
          {title}
        </span>
        {s && STATUS_VAR[s] && (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            border: `1px solid ${STATUS_VAR[s]}`, borderRadius: 20,
            padding: "2px 10px", fontFamily: bf, fontSize: 12,
            fontWeight: 600, color: STATUS_VAR[s],
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={STATUS_ICON[s]} alt={s} width={12} height={12} style={{ width: 12, height: 12 }} />
            {STATUS_LABEL[s]}
          </span>
        )}
      </div>
      {children}
      {comment && <CommentBox text={comment} />}
    </div>
  );
}

// ── component ──────────────────────────────────────────────────────────────────

type Props = {
  record: RejectedCourseRecord;
  onClose: () => void;
  onMoveToDraft?: (slug: string) => Promise<void>;
};

/** View-only modal showing all moderation review data for a rejected course record. */
export function RejectionDetailModal({ record, onClose, onMoveToDraft }: Props) {
  const [detail, setDetail] = useState<CourseDetail | null>(null);
  const [moving, setMoving]  = useState(false);

  useEffect(() => {
    if (record.course_slug)
      getCourseBySlug(record.course_slug).then(setDetail).catch(() => {});
  }, [record.course_slug]);

  const basicsStatuses  = record.basics_field_statuses  ?? {};
  const contentStatuses = record.content_item_statuses  ?? {};
  const modules         = detail?.modules ?? [];

  return (
    <ModalShell onClose={onClose} title={record.course_title} width="clamp(480px, 60vw, 860px)">
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

        {/* ── Status header ─────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, paddingBottom: 4 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/no.svg" alt="rejected" style={{ width: 40, height: 40 }} />
          <span style={{
            fontFamily: af, fontWeight: 700,
            fontSize: "clamp(22px, 2.08vw, 32px)",
            letterSpacing: "0.08em", textTransform: "uppercase",
            color: "var(--color-rejected)",
          }}>
            Rejected
          </span>
        </div>

        {/* ── Meta ──────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <span style={{ fontFamily: bf, fontSize: 13, color: "var(--color-text-secondary)" }}>
            Created: {detail ? fmt(detail.created_at) : "—"}&nbsp;·&nbsp;Rejected: {fmt(record.rejected_at)}
          </span>
          {detail?.teacher && (
            <span style={{ fontFamily: bf, fontSize: 13, color: "var(--color-text-secondary)" }}>
              Teacher:&nbsp;
              <strong style={{ color: "var(--color-text-primary)", fontWeight: 600 }}>
                {detail.teacher.name}
              </strong>
            </span>
          )}
        </div>

        {/* ── Basics ────────────────────────────────────────────── */}
        {Object.keys(basicsStatuses).length > 0 && (
          <Section title="Basics" action={record.basics_action} comment={record.basics_comment}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {Object.entries(basicsStatuses).map(([key, rawVal]) => {
                const s          = String(rawVal) as StatusValue;
                const isFullDesc = key === "field-full-description";
                const isIcon     = key === "field-icon";
                const imgSrc     = isIcon ? (detail?.image ?? record.course_image_url ?? null) : null;

                return (
                  <div key={key} style={{
                    display: "flex",
                    alignItems: isFullDesc ? "flex-start" : "center",
                    gap: 12, padding: "10px 0",
                    borderBottom: "1px solid var(--color-border-light)",
                  }}>
                    <span style={{
                      fontFamily: bf, fontWeight: 600, fontSize: 13,
                      color: "var(--color-text-secondary)",
                      flexShrink: 0, minWidth: 140,
                    }}>
                      {FIELD_LABEL[key] ?? key}
                    </span>

                    <span style={{
                      fontFamily: bf, fontSize: 14,
                      color: "var(--color-text-primary)",
                      flex: 1, overflow: "hidden",
                      textOverflow: isFullDesc || isIcon ? undefined : "ellipsis",
                      whiteSpace: isFullDesc ? "pre-wrap" : isIcon ? undefined : "nowrap",
                      wordBreak: isFullDesc ? "break-word" : undefined,
                    }}>
                      {isIcon
                        ? imgSrc
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={imgSrc} alt="icon" style={{ width: 36, height: 36, objectFit: "contain", borderRadius: 6 }} />
                          : "—"
                        : getFieldValue(key, detail, record)
                      }
                    </span>

                    {STATUS_VAR[s] && (
                      <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={STATUS_ICON[s]} alt={s} width={14} height={14} style={{ width: 14, height: 14 }} />
                        <span style={{ fontFamily: bf, fontSize: 12, fontWeight: 600, color: STATUS_VAR[s], whiteSpace: "nowrap" }}>
                          {STATUS_LABEL[s]}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* ── Content ───────────────────────────────────────────── */}
        {modules.length > 0 && (
          <Section title="Content" action={record.content_action} comment={record.content_comment}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {modules.map((mod, i) => (
                <div key={mod.id} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontFamily: bf, fontWeight: 600, fontSize: 14, color: "var(--color-text-primary)" }}>
                    Module {i + 1}: {mod.title}
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3, paddingLeft: 16 }}>
                    {mod.lessons.map((l) => {
                      const s = (contentStatuses[`lesson-${l.id}`] ?? "") as StatusValue | "";
                      return (
                        <div key={l.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                          <span style={{ fontFamily: bf, fontSize: 13, color: "var(--color-text-secondary)" }}>
                            ▸ {l.title}
                          </span>
                          {s && STATUS_VAR[s] && (
                            <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={STATUS_ICON[s]} alt={s} width={12} height={12} style={{ width: 12, height: 12 }} />
                              <span style={{ fontFamily: bf, fontSize: 11, fontWeight: 600, color: STATUS_VAR[s], whiteSpace: "nowrap" }}>
                                {STATUS_LABEL[s]}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {(mod.tests ?? []).map((t) => {
                      const s = (contentStatuses[`test-${t.id}`] ?? "") as StatusValue | "";
                      return (
                        <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                          <span style={{ fontFamily: bf, fontSize: 13, color: "var(--color-text-secondary)" }}>
                            ✓ {t.title}
                          </span>
                          {s && STATUS_VAR[s] && (
                            <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={STATUS_ICON[s]} alt={s} width={12} height={12} style={{ width: 12, height: 12 }} />
                              <span style={{ fontFamily: bf, fontSize: 11, fontWeight: 600, color: STATUS_VAR[s], whiteSpace: "nowrap" }}>
                                {STATUS_LABEL[s]}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── Final comment ─────────────────────────────────────── */}
        {record.final_comment && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontFamily: bf, fontWeight: 700, fontSize: 14, color: "var(--color-text-primary)" }}>
              Final comment
            </span>
            <CommentBox text={record.final_comment} />
          </div>
        )}

        {/* ── Move to Draft ──────────────────────────────────────── */}
        {onMoveToDraft && (
          <div style={{ borderTop: "1px solid var(--color-border-light)", paddingTop: 16, display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              disabled={moving}
              onClick={async () => {
                setMoving(true);
                try { await onMoveToDraft(record.course_slug); onClose(); }
                finally { setMoving(false); }
              }}
              style={{
                background: "var(--color-text-primary)", color: "var(--color-bg)",
                border: "none", borderRadius: 28,
                cursor: moving ? "not-allowed" : "pointer",
                padding: "10px 28px", fontFamily: af,
                fontWeight: 500, fontSize: 15, textTransform: "uppercase",
                opacity: moving ? 0.6 : 1, transition: "opacity 0.2s",
              }}
            >
              {moving ? "Moving…" : "Move to Draft"}
            </button>
          </div>
        )}

      </div>
    </ModalShell>
  );
}
