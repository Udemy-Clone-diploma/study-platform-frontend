"use client";

import Image from "next/image";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Flag } from "lucide-react";
import { ReportReviewModal } from "@/shared/ui/ReportReviewModal";
import { reportReview } from "@/entities/course";
import { useIsAuthenticated } from "@/shared/lib/useIsAuthenticated";

export type StudentReview = {
  id: number;
  text: string;
  authorName: string;
  authorRole: string;
  authorAvatar: string | null;
};

type Props = {
  review: StudentReview;
  /** Sets the lg+ flex-grow ratio for the zigzag narrow/wide layout (e.g. "lg:grow-[580]").
   * Below lg the card always stays w-full since the row stacks into a column there. */
  className?: string;
};

export function StudentReviewCard({ review, className = "" }: Props) {
  const [reporting, setReporting] = useState(false);
<<<<<<< HEAD
  const canReport = useIsAuthenticated();
=======
>>>>>>> origin/develop
  const t = useTranslations("StudentReviewCard");

  return (
    <div
      className={`w-full lg:w-0 lg:shrink lg:grow ${className}`}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: "clamp(160px, 11.46vw, 165px)",
        padding: "clamp(16px, 1.46vw, 21px) clamp(16px, 1.25vw, 18px) clamp(18px, 1.67vw, 24px)",
        background: "var(--color-bg)",
        boxShadow: "var(--shadow-testimonial)",
        borderRadius: "20px",
      }}
    >
<<<<<<< HEAD
      {canReport && (
        <button
          type="button"
          onClick={() => setReporting(true)}
          aria-label={t("reportReview")}
          title={t("reportReview")}
          style={{
            position: "absolute",
            top: "0.83vw",
            right: "0.83vw",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "1.67vw",
            height: "1.67vw",
            minWidth: 22,
            minHeight: 22,
            border: "none",
            background: "transparent",
            color: "var(--color-text-secondary)",
            cursor: "pointer",
            transition: "opacity 150ms ease",
          }}
          className="opacity-0 hover:opacity-100 focus-visible:opacity-100"
        >
          <Flag size={14} />
        </button>
      )}

      {/* Quote: clamped to 4 lines so a long review can't grow the card. */}
      <p
        className="text-[14px] leading-[18px] md:text-[15px] md:leading-[19px] lg:text-[1.04vw] lg:leading-[1.3vw]"
        style={{
          fontFamily: "var(--font-base)",
          fontWeight: 500,
          color: "var(--color-text-secondary)",
          margin: 0,
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: 4,
          overflow: "hidden",
        }}
      >
        {review.text}
      </p>

      {/* Author */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "0.625vw",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "clamp(32px, 2.71vw, 39px)",
            height: "clamp(32px, 2.71vw, 39px)",
            borderRadius: "50%",
            overflow: "hidden",
            flexShrink: 0,
            background: "var(--gradient-blob)",
          }}
        >
=======
      <button
        type="button"
        onClick={() => setReporting(true)}
        aria-label={t("reportReview")}
        title={t("reportReview")}
        style={{
          position: "absolute",
          top: "0.83vw",
          right: "0.83vw",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "1.67vw",
          height: "1.67vw",
          minWidth: 22,
          minHeight: 22,
          border: "none",
          background: "transparent",
          color: "var(--color-text-secondary)",
          cursor: "pointer",
        }}
      >
        <Flag size={14} />
      </button>

      {/* Quote: clamped to 4 lines so a long review can't grow the card. */}
      <p
        className="text-[14px] leading-[18px] md:text-[15px] md:leading-[19px] lg:text-[1.04vw] lg:leading-[1.3vw]"
        style={{
          fontFamily: "var(--font-base)",
          fontWeight: 500,
          color: "var(--color-text-secondary)",
          margin: 0,
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: 4,
          overflow: "hidden",
        }}
      >
        {review.text}
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "0.625vw",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "clamp(32px, 2.71vw, 39px)",
            height: "clamp(32px, 2.71vw, 39px)",
            borderRadius: "50%",
            overflow: "hidden",
            flexShrink: 0,
            background: "var(--gradient-blob)",
          }}
        >
>>>>>>> origin/develop
          {review.authorAvatar && (
            <Image
              src={review.authorAvatar}
              alt={review.authorName}
              fill
              unoptimized
              style={{ objectFit: "cover" }}
            />
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.21vw" }}>
          <span
            className="text-[12px] leading-[15px] md:text-[13px] md:leading-[16px] lg:text-[0.83vw] lg:leading-[1.04vw]"
            style={{
              fontFamily: "var(--font-base)",
              fontWeight: 600,
              color: "var(--color-text-primary)",
            }}
          >
            {review.authorName}
          </span>
          <span
            className="text-[12px] leading-[15px] md:text-[13px] md:leading-[16px] lg:text-[0.83vw] lg:leading-[1.04vw]"
            style={{
              fontFamily: "var(--font-base)",
              fontWeight: 400,
              color: "var(--color-text-secondary)",
            }}
          >
            {review.authorRole}
          </span>
        </div>
      </div>

<<<<<<< HEAD
      {canReport && reporting && (
=======
      {reporting && (
>>>>>>> origin/develop
        <ReportReviewModal
          onClose={() => setReporting(false)}
          onSubmit={(reason) => reportReview(review.id, reason)}
        />
      )}
    </div>
  );
}
