"use client";

import { useState, useEffect } from "react";
import { ModalShell } from "@/shared/ui/ModalShell";
import { getCourseBySlug } from "@/entities/course";
import type { ApprovedCourseRecord, CourseDetail } from "@/entities/course";

const bf = "var(--font-base)";
const af = "var(--font-accent)";

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB");
}

function CommentBox({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div style={{
      padding: 20,
      background: "var(--color-bg)",
      border: "1px solid var(--color-success)",
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

function Section({ title, comment, children }: {
  title: string;
  comment?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <span style={{
        display: "block", fontFamily: bf, fontWeight: 700,
        fontSize: "clamp(14px, 1.04vw, 18px)", color: "var(--color-text-primary)",
        paddingBottom: 10, borderBottom: "1px solid var(--color-border-light)",
      }}>
        {title}
      </span>
      {children}
      {comment && <CommentBox text={comment} />}
    </div>
  );
}

function FieldRow({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div style={{
      display: "flex", alignItems: multiline ? "flex-start" : "center",
      gap: 12, padding: "10px 0",
      borderBottom: "1px solid var(--color-border-light)",
    }}>
      <span style={{
        fontFamily: bf, fontWeight: 600, fontSize: 13,
        color: "var(--color-text-secondary)",
        flexShrink: 0, minWidth: 140,
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: bf, fontSize: 14, color: "var(--color-text-primary)", flex: 1,
        overflow: "hidden",
        textOverflow: multiline ? undefined : "ellipsis",
        whiteSpace: multiline ? "pre-wrap" : "nowrap",
        wordBreak: multiline ? "break-word" : undefined,
      }}>
        {value}
      </span>
    </div>
  );
}

type Props = {
  record: ApprovedCourseRecord;
  onClose: () => void;
};

/** View-only modal showing course info for an approved course record. */
export function CourseInfoModal({ record, onClose }: Props) {
  const [detail, setDetail] = useState<CourseDetail | null>(null);

  useEffect(() => {
    getCourseBySlug(record.course_slug).then(setDetail).catch(() => {});
  }, [record.course_slug]);

  const modules = detail?.modules ?? [];
  const price   = detail?.pricing_plans?.[0] ? `€${detail.pricing_plans[0].price}` : "Free";
  const level   = (detail?.level ?? record.course_level ?? "").replace(/^\w/, (c) => c.toUpperCase());
  const imgSrc  = detail?.image ?? record.course_image_url ?? null;

  return (
    <ModalShell onClose={onClose} title={record.course_title} width="clamp(480px, 60vw, 860px)">
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, paddingBottom: 4 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/yes.svg" alt="approved" style={{ width: 40, height: 40 }} />
          <span style={{
            fontFamily: af, fontWeight: 700,
            fontSize: "clamp(22px, 2.08vw, 32px)",
            letterSpacing: "0.08em", textTransform: "uppercase",
            color: "var(--color-success)",
          }}>
            Approved
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <span style={{ fontFamily: bf, fontSize: 13, color: "var(--color-text-secondary)" }}>
            Created: {detail ? fmt(detail.created_at) : "—"}&nbsp;·&nbsp;Approved: {fmt(record.approved_at)}
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

        <Section title="Basics">
          <div style={{ display: "flex", flexDirection: "column" }}>
            <FieldRow label="Title"             value={detail?.title           ?? record.course_title} />
            <FieldRow label="Short Description" value={detail?.short_description ?? "—"} />
            <FieldRow label="Full Description"  value={detail?.full_description  ?? "—"} multiline />
            {imgSrc && (
              <div style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 0", borderBottom: "1px solid var(--color-border-light)",
              }}>
                <span style={{ fontFamily: bf, fontWeight: 600, fontSize: 13, color: "var(--color-text-secondary)", flexShrink: 0, minWidth: 140 }}>
                  Icon
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imgSrc} alt="icon" style={{ width: 36, height: 36, objectFit: "contain", borderRadius: 6 }} />
              </div>
            )}
            <FieldRow label="Category" value={record.course_category || detail?.category?.name || "—"} />
            <FieldRow label="Level"    value={level || "—"} />
            <FieldRow label="Price"    value={price} />
          </div>
        </Section>

        {modules.length > 0 && (
          <Section title="Content">
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {modules.map((mod, i) => (
                <div key={mod.id} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontFamily: bf, fontWeight: 600, fontSize: 14, color: "var(--color-text-primary)" }}>
                    Module {i + 1}: {mod.title}
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3, paddingLeft: 16 }}>
                    {mod.lessons.map((l) => (
                      <span key={l.id} style={{ fontFamily: bf, fontSize: 13, color: "var(--color-text-secondary)" }}>
                        ▸ {l.title}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {!detail && (
          <p style={{ fontFamily: bf, color: "var(--color-text-secondary)", fontSize: 14, textAlign: "center" }}>
            Loading…
          </p>
        )}

      </div>
    </ModalShell>
  );
}
