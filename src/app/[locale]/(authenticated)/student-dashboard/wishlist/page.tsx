"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CourseCard } from "@/features/courses";
import { Pagination } from "@/shared/ui/Pagination";
import { PageShell } from "@/shared/ui/PageShell";
import { getWishlist } from "@/entities/course";
import type { CourseListItem } from "@/entities/course";
import type { ApiError } from "@/shared/api/base";

const PAGE_SIZE = 6;

export default function WishlistPage() {
  const t = useTranslations("StudentWishlistPage");
  const tCommon = useTranslations("Common");
  const tSidebar = useTranslations("AppSidebar");
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    getWishlist()
      .then((data) => setCourses(data.results))
      .catch((err: Partial<ApiError>) => setError(err.message ?? t("errorLoad")))
      .finally(() => setLoading(false));
  }, [t]);

  const totalPages = Math.max(1, Math.ceil(courses.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageSlice = courses.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function handlePageChange(newPage: number) {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <PageShell className="bg-wishlist" style={{ display: "flex", flexDirection: "column" }}>
      <h1
        className="font-normal text-(--color-text-primary)"
        style={{ fontSize: "clamp(20px, 2.22vw, 32px)", marginBottom: "clamp(16px, 1.67vw, 32px)", flexShrink: 0 }}
      >
        {tSidebar("wishlist")}
      </h1>

      <div style={{ flex: 1 }}>
        {loading ? (
          <p className="text-center text-lg text-(--color-text-secondary)">{tCommon("loading")}</p>
        ) : error ? (
          <p className="text-center text-lg text-red-500">{error}</p>
        ) : courses.length === 0 ? (
          <p className="text-center text-lg text-(--color-text-secondary)">
            {t("noCoursesInWishlist")}
          </p>
        ) : (
          <div className="flex flex-wrap" style={{ gap: "clamp(12px, 1.25vw, 24px)" }}>
            {pageSlice.map((course) => (
              <CourseCard key={course.id} course={course} isWishlisted />
            ))}
          </div>
        )}
      </div>

      {!loading && !error && courses.length > 0 && totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", paddingTop: "clamp(16px, 2.22vw, 32px)", flexShrink: 0 }}>
          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </PageShell>
  );
}
