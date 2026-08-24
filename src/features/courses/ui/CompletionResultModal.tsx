"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Download, Star } from "lucide-react";
import { ModalShell } from "@/shared/ui/ModalShell";
import { GradientButton } from "@/shared/ui/GradientButton";
import {
  getCourseBySlug,
  getMyCourseReview,
  submitCourseReview,
  updateCourseReview,
} from "@/entities/course";
import type { CourseCompletion, CourseDetail, CourseReview } from "@/entities/course";
import type { ApiError } from "@/shared/api/base";

// ── helpers ────────────────────────────────────────────────────────────────────

const bf = "var(--font-base)";
const af = "var(--font-accent)";

function fmt(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale);
}

// ── sub-components ─────────────────────────────────────────────────────────────

function FieldRow({
  label,
  value,
  last,
}: {
  label: string;
  value: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "10px 0",
        borderBottom: last ? undefined : "1px solid var(--color-border-light)",
      }}
    >
      <span
        style={{
          fontFamily: bf,
          fontWeight: 600,
          fontSize: 13,
          color: "var(--color-text-secondary)",
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: bf,
          fontSize: 14,
          fontWeight: 500,
          color: "var(--color-text-primary)",
          textAlign: "right",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <span
        style={{
          display: "block",
          fontFamily: bf,
          fontWeight: 700,
          fontSize: "clamp(13px, 1.04vw, 16px)",
          color: "var(--color-text-primary)",
          paddingBottom: 10,
          borderBottom: "1px solid var(--color-border-light)",
          marginBottom: 0,
        }}
      >
        {title}
      </span>
      {children}
    </div>
  );
}

function StarRow({
  rating,
  interactive,
  hoverRating,
  onHover,
  onPick,
  ariaLabel,
}: {
  rating: number;
  interactive?: boolean;
  hoverRating?: number;
  onHover?: (value: number) => void;
  onPick?: (value: number) => void;
  ariaLabel?: string;
}) {
  const displayRating = interactive ? hoverRating || rating : rating;
  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: interactive ? 2 : 4 }}
      role={interactive ? "radiogroup" : undefined}
      aria-label={interactive ? ariaLabel : undefined}
    >
      {Array.from({ length: 5 }).map((_, i) => {
        const value = i + 1;
        const star = (
          <Star
            className={interactive ? "h-7 w-7" : "h-4 w-4"}
            fill={value <= displayRating ? "var(--color-gold)" : "transparent"}
            stroke="var(--color-gold)"
            strokeWidth={1.5}
          />
        );
        if (!interactive) return <span key={value}>{star}</span>;
        return (
          <button
            key={value}
            type="button"
            onClick={() => onPick?.(value)}
            onMouseEnter={() => onHover?.(value)}
            onMouseLeave={() => onHover?.(0)}
            aria-pressed={rating === value}
            className="p-0.5"
            style={{ background: "transparent", border: "none", cursor: "pointer" }}
          >
            {star}
          </button>
        );
      })}
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
  const t = useTranslations("CompletionResultModal");
  const locale = useLocale();
  const [detail, setDetail] = useState<CourseDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(!!completion.slug);

  const [myReview, setMyReview] = useState<CourseReview | null>(null);
  const [reviewLoading, setReviewLoading] = useState(!!completion.slug);
  const [reviewLoadFailed, setReviewLoadFailed] = useState(false);
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHoverRating, setReviewHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  useEffect(() => {
    if (!completion.slug) return;
    setDetailLoading(true);
    getCourseBySlug(completion.slug)
      .then(setDetail)
      .catch(() => {})
      .finally(() => setDetailLoading(false));
  }, [completion.slug]);

  useEffect(() => {
    if (!completion.slug) return;
    setReviewLoading(true);
    setReviewLoadFailed(false);
    getMyCourseReview(completion.slug)
      .then(setMyReview)
      .catch(() => setReviewLoadFailed(true))
      .finally(() => setReviewLoading(false));
  }, [completion.slug]);

  function handleStartEditReview() {
    if (!myReview) return;
    setReviewRating(myReview.rating);
    setReviewText(myReview.text);
    setReviewError(null);
    setIsEditingReview(true);
  }

  function handleCancelEditReview() {
    setIsEditingReview(false);
    setReviewError(null);
  }

  async function handleSubmitReview() {
    if (!completion.slug || reviewRating === 0) return;
    setReviewSubmitting(true);
    setReviewError(null);
    try {
      const review = isEditingReview
        ? await updateCourseReview(completion.slug, {
            rating: reviewRating,
            text: reviewText.trim(),
          })
        : await submitCourseReview(completion.slug, {
            rating: reviewRating,
            text: reviewText.trim(),
          });
      setMyReview(review);
      setIsEditingReview(false);
    } catch (err) {
      const apiError = err as Partial<ApiError>;
      if (!isEditingReview && apiError.status === 409 && completion.slug) {
        const existing = await getMyCourseReview(completion.slug).catch(() => null);
        if (existing) {
          setMyReview(existing);
          return;
        }
      }
      setReviewError(apiError.message || t("reviewErrorGeneric"));
    } finally {
      setReviewSubmitting(false);
    }
  }

  const level = (detail?.level ?? completion.level ?? "").replace(/^\w/, (c) => c.toUpperCase());
  const category = detail?.category?.name ?? completion.category ?? null;
  const shortDesc = detail?.short_description ?? completion.short_description ?? null;
  const fullDesc = detail?.full_description ?? null;
  const pricePaid = completion.paid_amount
    ? `${completion.paid_currency.toUpperCase()} ${completion.paid_amount}`
    : t("free");
  const modules = detail?.modules ?? [];
  const totalLessons = modules.reduce((s, m) => s + m.lessons.length, 0);
  const totalTests = modules.reduce((s, m) => s + (m.tests?.length ?? 0), 0);

  return (
    <ModalShell onClose={onClose} title={completion.title} width="clamp(400px, 50vw, 680px)">
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* ── Status header ─────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            paddingBottom: 4,
          }}
        >
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
          <span
            style={{
              fontFamily: af,
              fontWeight: 700,
              fontSize: "clamp(22px, 2.08vw, 32px)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--color-text-primary)",
            }}
          >
            {t("completed")}
          </span>
        </div>

        {/* ── Meta ──────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <span style={{ fontFamily: bf, fontSize: 13, color: "var(--color-text-secondary)" }}>
            {t("startedCompleted", {
              started: fmt(completion.started_at, locale),
              completed: fmt(completion.completed_at, locale),
            })}
          </span>
          <span style={{ fontFamily: bf, fontSize: 13, color: "var(--color-text-secondary)" }}>
            {t("teacher")}&nbsp;
            <strong style={{ color: "var(--color-text-primary)", fontWeight: 600 }}>
              {completion.teacher_name}
            </strong>
          </span>
        </div>

        {/* ── Course info ───────────────────────────────────────── */}
        <Section title={t("course")}>
          {detailLoading ? (
            <p
              style={{
                fontFamily: bf,
                fontSize: 13,
                color: "var(--color-text-secondary)",
                padding: "10px 0",
                margin: 0,
              }}
            >
              {t("loadingCourseDetails")}
            </p>
          ) : (
            <>
              {shortDesc && (
                <div
                  style={{ padding: "10px 0", borderBottom: "1px solid var(--color-border-light)" }}
                >
                  <span
                    style={{
                      fontFamily: bf,
                      fontWeight: 600,
                      fontSize: 13,
                      color: "var(--color-text-secondary)",
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    {t("shortDescription")}
                  </span>
                  <p
                    style={{
                      fontFamily: bf,
                      fontSize: 14,
                      color: "var(--color-text-primary)",
                      margin: 0,
                      lineHeight: "20px",
                    }}
                  >
                    {shortDesc}
                  </p>
                </div>
              )}
              {fullDesc && (
                <div
                  style={{ padding: "10px 0", borderBottom: "1px solid var(--color-border-light)" }}
                >
                  <span
                    style={{
                      fontFamily: bf,
                      fontWeight: 600,
                      fontSize: 13,
                      color: "var(--color-text-secondary)",
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    {t("fullDescription")}
                  </span>
                  <p
                    style={{
                      fontFamily: bf,
                      fontSize: 14,
                      color: "var(--color-text-primary)",
                      margin: 0,
                      lineHeight: "20px",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {fullDesc}
                  </p>
                </div>
              )}
              {category && <FieldRow label={t("category")} value={category} />}
              <FieldRow label={t("level")} value={level || "—"} last={!detail} />
              {detail && (
                <FieldRow
                  label={t("content")}
                  last
                  value={t("contentSummary", {
                    modules: modules.length,
                    lessons: totalLessons,
                    tests: totalTests,
                  })}
                />
              )}
            </>
          )}
        </Section>

        {/* ── Purchase ──────────────────────────────────────────── */}
        <Section title={t("purchase")}>
          <FieldRow label={t("pricePaid")} value={pricePaid} />
          <FieldRow
            label={t("purchased")}
            last
            value={completion.purchased_at ? fmt(completion.purchased_at, locale) : "—"}
          />
        </Section>

        {/* ── Results ───────────────────────────────────────────── */}
        <Section title={t("results")}>
          <FieldRow label={t("progress")} value={`${completion.progress_percent}%`} />
          <FieldRow label={t("finalScore")} value={completion.final_score ?? "—"} />
          <FieldRow
            label={t("certificate")}
            last
            value={
              completion.certificate_url ? (
                <a
                  href={completion.certificate_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontFamily: af,
                    fontWeight: 600,
                    fontSize: 12,
                    color: "white",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    background: "var(--color-text-primary)",
                    borderRadius: 999,
                    padding: "6px 14px",
                    textDecoration: "none",
                  }}
                >
                  <Download size={14} />
                  {t("download")}
                </a>
              ) : (
                <span style={{ fontFamily: bf, fontSize: 13, color: "var(--color-text-muted)" }}>
                  {t("notAvailable")}
                </span>
              )
            }
          />
        </Section>

        {/* ── Review ────────────────────────────────────────────── */}
        {completion.slug && !reviewLoadFailed && (
          <Section title={t("review")}>
            {reviewLoading ? (
              <p
                style={{
                  fontFamily: bf,
                  fontSize: 13,
                  color: "var(--color-text-secondary)",
                  padding: "10px 0",
                  margin: 0,
                }}
              >
                {t("loadingReview")}
              </p>
            ) : myReview && !isEditingReview ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "10px 0" }}>
                <StarRow rating={myReview.rating} />
                {myReview.text && (
                  <p
                    style={{
                      fontFamily: bf,
                      fontSize: 14,
                      color: "var(--color-text-primary)",
                      margin: 0,
                      lineHeight: "20px",
                    }}
                  >
                    {myReview.text}
                  </p>
                )}
                <div>
                  <button
                    type="button"
                    onClick={handleStartEditReview}
                    style={{
                      fontFamily: bf,
                      fontWeight: 600,
                      fontSize: 13,
                      color: "var(--color-blue)",
                      background: "transparent",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                    }}
                  >
                    {t("editReview")}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "10px 0" }}>
                {!isEditingReview && (
                  <p
                    style={{
                      fontFamily: bf,
                      fontSize: 13,
                      color: "var(--color-text-secondary)",
                      margin: 0,
                    }}
                  >
                    {t("leaveReviewPrompt")}
                  </p>
                )}
                <StarRow
                  rating={reviewRating}
                  interactive
                  hoverRating={reviewHoverRating}
                  onHover={setReviewHoverRating}
                  onPick={setReviewRating}
                  ariaLabel={t("ratingAriaLabel")}
                />
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder={t("reviewPlaceholder")}
                  rows={3}
                  className="w-full resize-none rounded-2xl border border-(--color-border-light) p-3 font-(family-name:--font-base) text-sm text-(--color-text-primary) outline-none focus:border-(--color-blue)"
                />
                {reviewError && (
                  <p
                    role="status"
                    style={{
                      fontFamily: bf,
                      fontSize: 13,
                      color: "var(--color-pink-dark)",
                      margin: 0,
                    }}
                  >
                    {reviewError}
                  </p>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <GradientButton
                    type="button"
                    onClick={handleSubmitReview}
                    disabled={reviewSubmitting || reviewRating === 0}
                  >
                    {reviewSubmitting
                      ? isEditingReview
                        ? t("savingReview")
                        : t("submittingReview")
                      : isEditingReview
                        ? t("saveReviewChanges")
                        : t("submitReview")}
                  </GradientButton>
                  {isEditingReview && (
                    <button
                      type="button"
                      onClick={handleCancelEditReview}
                      disabled={reviewSubmitting}
                      style={{
                        fontFamily: bf,
                        fontWeight: 600,
                        fontSize: 13,
                        color: "var(--color-text-secondary)",
                        background: "transparent",
                        border: "none",
                        padding: 0,
                        cursor: "pointer",
                      }}
                    >
                      {t("cancelEdit")}
                    </button>
                  )}
                </div>
              </div>
            )}
          </Section>
        )}
      </div>
    </ModalShell>
  );
}
