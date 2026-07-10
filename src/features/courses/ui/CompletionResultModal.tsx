"use client";

import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { ModalShell } from "@/shared/ui/ModalShell";
import { getCourseBySlug } from "@/entities/course";
import type { CourseCompletion, CourseDetail } from "@/entities/course";

// ── helpers ────────────────────────────────────────────────────────────────────

const bf = "var(--font-base)";
const af = "var(--font-accent)";

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB");
}

// ── sub-components ─────────────────────────────────────────────────────────────

function FieldRow({ label, value, last }: { label: string; value: React.ReactNode; last?: boolean }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 12, padding: "10px 0",
      borderBottom: last ? undefined : "1px solid var(--color-border-light)",
    }}>
      <span style={{ fontFamily: bf, fontWeight: 600, fontSize: 13, color: "var(--color-text-secondary)", flexShrink: 0 }}>
        {label}
      </span>
      <span style={{ fontFamily: bf, fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)", textAlign: "right" }}>
        {value}
      </span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <span style={{
        display: "block", fontFamily: bf, fontWeight: 700,
        fontSize: "clamp(13px, 1.04vw, 16px)", color: "var(--color-text-primary)",
        paddingBottom: 10, borderBottom: "1px solid var(--color-border-light)",
        marginBottom: 0,
      }}>
        {title}
      </span>
      {children}
    </div>
  );
}

// ── component ──────────────────────────────────────────────────────────────────

type Props = {
  completion: CourseCompletion;
  onClose: () => void;
};

/** Modal showing course completion results for a student. */
export function CompletionResultModal({ completion, onClose }: Props) {
  const [detail, setDetail] = useState<CourseDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(!!completion.slug);

  useEffect(() => {
    if (!completion.slug) return;
    setDetailLoading(true);
    getCourseBySlug(completion.slug)
      .then(setDetail)
      .catch(() => {})
      .finally(() => setDetailLoading(false));
  }, [completion.slug]);

  const level = (detail?.level ?? completion.level ?? "").replace(/^\w/, (c) => c.toUpperCase());
  const category = detail?.category?.name ?? completion.category ?? null;
  const shortDesc = detail?.short_description ?? completion.short_description ?? null;
  const fullDesc  = detail?.full_description ?? null;
  const pricePaid = completion.paid_amount
    ? `${completion.paid_currency.toUpperCase()} ${completion.paid_amount}`
    : "Free";
  const modules   = detail?.modules ?? [];
  const totalLessons = modules.reduce((s, m) => s + m.lessons.length, 0);
  const totalTests   = modules.reduce((s, m) => s + (m.tests?.length ?? 0), 0);

  return (
    <ModalShell onClose={onClose} title={completion.title} width="clamp(400px, 50vw, 680px)">
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

        {/* ── Status header ─────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, paddingBottom: 4 }}>
          {completion.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={completion.image_url}
              alt={completion.title}
              style={{ width: 64, height: 64, objectFit: "contain", borderRadius: 12 }}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/icons/yes.svg" alt="completed" style={{ width: 40, height: 40 }} />
          )}
          <span style={{
            fontFamily: af, fontWeight: 700,
            fontSize: "clamp(22px, 2.08vw, 32px)",
            letterSpacing: "0.08em", textTransform: "uppercase",
            color: "var(--color-text-primary)",
          }}>
            Completed
          </span>
        </div>

        {/* ── Meta ──────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <span style={{ fontFamily: bf, fontSize: 13, color: "var(--color-text-secondary)" }}>
            Started: {fmt(completion.started_at)}&nbsp;·&nbsp;Completed: {fmt(completion.completed_at)}
          </span>
          <span style={{ fontFamily: bf, fontSize: 13, color: "var(--color-text-secondary)" }}>
            Teacher:&nbsp;
            <strong style={{ color: "var(--color-text-primary)", fontWeight: 600 }}>
              {completion.teacher_name}
            </strong>
          </span>
        </div>

        {/* ── Course info ───────────────────────────────────────── */}
        <Section title="Course">
          {detailLoading ? (
            <p style={{ fontFamily: bf, fontSize: 13, color: "var(--color-text-secondary)", padding: "10px 0", margin: 0 }}>
              Loading course details…
            </p>
          ) : (
            <>
              {shortDesc && (
                <div style={{ padding: "10px 0", borderBottom: "1px solid var(--color-border-light)" }}>
                  <span style={{ fontFamily: bf, fontWeight: 600, fontSize: 13, color: "var(--color-text-secondary)", display: "block", marginBottom: 4 }}>
                    Short Description
                  </span>
                  <p style={{ fontFamily: bf, fontSize: 14, color: "var(--color-text-primary)", margin: 0, lineHeight: "20px" }}>
                    {shortDesc}
                  </p>
                </div>
              )}
              {fullDesc && (
                <div style={{ padding: "10px 0", borderBottom: "1px solid var(--color-border-light)" }}>
                  <span style={{ fontFamily: bf, fontWeight: 600, fontSize: 13, color: "var(--color-text-secondary)", display: "block", marginBottom: 4 }}>
                    Full Description
                  </span>
                  <p style={{ fontFamily: bf, fontSize: 14, color: "var(--color-text-primary)", margin: 0, lineHeight: "20px", whiteSpace: "pre-wrap" }}>
                    {fullDesc}
                  </p>
                </div>
              )}
              {category && <FieldRow label="Category" value={category} />}
              <FieldRow label="Level" value={level || "—"} last={!detail} />
              {detail && (
                <FieldRow
                  label="Content"
                  last
                  value={`${modules.length} modules · ${totalLessons} lessons · ${totalTests} tests`}
                />
              )}
            </>
          )}
        </Section>

        {/* ── Purchase ──────────────────────────────────────────── */}
        <Section title="Purchase">
          <FieldRow label="Price paid" value={pricePaid} />
          <FieldRow
            label="Purchased"
            last
            value={completion.purchased_at ? fmt(completion.purchased_at) : "—"}
          />
        </Section>

        {/* ── Results ───────────────────────────────────────────── */}
        <Section title="Results">
          <FieldRow label="Progress"    value={`${completion.progress_percent}%`} />
          <FieldRow label="Final score" value={completion.final_score ?? "—"} />
          <FieldRow
            label="Certificate"
            last
            value={
              completion.certificate_url ? (
                <a
                  href={completion.certificate_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    fontFamily: af, fontWeight: 600, fontSize: 12,
                    color: "white", textTransform: "uppercase", letterSpacing: "0.04em",
                    background: "var(--color-text-primary)", borderRadius: 999,
                    padding: "6px 14px", textDecoration: "none",
                  }}
                >
                  <Download size={14} />
                  Download
                </a>
              ) : (
                <span style={{ fontFamily: bf, fontSize: 13, color: "var(--color-text-muted)" }}>
                  Not available for this course
                </span>
              )
            }
          />
        </Section>

      </div>
    </ModalShell>
  );
}
