"use client";

import { useEffect, useState } from "react";
import { CourseCard } from "@/features/courses";
import { getWishlist } from "@/entities/course";
import type { CourseListItem } from "@/entities/course";
import type { ApiError } from "@/shared/api/base";

export default function WishlistPage() {
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getWishlist()
      .then((data) => setCourses(data.results))
      .catch((err: Partial<ApiError>) => setError(err.message ?? "Failed to load wishlist."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main
      className="bg-wishlist min-h-[calc(100vh-76px)]"
      style={{ paddingInline: "clamp(16px, 2.78vw, 40px)", paddingBlock: "clamp(16px, 2.22vw, 32px)" }}
    >
      <h1
        className="font-normal text-(--color-text-primary)"
        style={{ fontSize: "clamp(20px, 2.22vw, 32px)", marginBottom: "clamp(16px, 1.67vw, 32px)" }}
      >
        Wishlist
      </h1>

      {loading ? (
        <p className="mt-16 text-center text-lg text-(--color-text-secondary)">Loading...</p>
      ) : error ? (
        <p className="mt-16 text-center text-lg text-red-500">{error}</p>
      ) : courses.length === 0 ? (
        <p className="mt-16 text-center text-lg text-(--color-text-secondary)">
          No courses in your wishlist yet.
        </p>
      ) : (
        <div className="flex flex-wrap" style={{ gap: "clamp(12px, 1.25vw, 24px)" }}>
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} isWishlisted />
          ))}
        </div>
      )}
    </main>
  );
}
