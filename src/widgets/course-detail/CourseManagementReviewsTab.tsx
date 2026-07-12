"use client";

import { useEffect, useState } from "react";
import { getCourseReviews } from "@/entities/course";
import type { CourseReview } from "@/entities/course";
import { SectionCard } from "@/shared/ui/SectionCard";
import { CourseReviewCard } from "./CourseReviewCard";

type Props = { slug: string };

/** Course management "Reviews" tab -- read-only list of the course's reviews, with the report action available. */
export function CourseManagementReviewsTab({ slug }: Props) {
  const [reviews, setReviews] = useState<CourseReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getCourseReviews(slug)
      .then(data => setReviews(data.results))
      .catch(() => setError("Failed to load reviews."))
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <SectionCard>
      <h2 style={{ fontFamily: "var(--font-base)", fontWeight: 700, fontSize: "clamp(16px, 1.25vw, 22px)", color: "var(--color-text-primary)", margin: "0 0 clamp(16px, 1.39vw, 24px)" }}>
        Reviews
      </h2>

      {loading ? (
        <p style={{ fontFamily: "var(--font-base)", fontSize: "clamp(13px, 0.83vw, 15px)", color: "var(--color-text-secondary)" }}>Loading…</p>
      ) : error ? (
        <p style={{ fontFamily: "var(--font-base)", fontSize: "clamp(13px, 0.83vw, 15px)", color: "var(--color-danger)" }}>{error}</p>
      ) : reviews.length === 0 ? (
        <p style={{ fontFamily: "var(--font-base)", fontSize: "clamp(13px, 0.83vw, 15px)", color: "var(--color-text-muted)" }}>No reviews yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "clamp(12px, 1.11vw, 16px)" }}>
          {reviews.map(review => (
            <CourseReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </SectionCard>
  );
}
