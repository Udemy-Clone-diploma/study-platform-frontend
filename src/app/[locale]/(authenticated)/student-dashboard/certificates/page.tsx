"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CertificateCard, CompletionResultModal } from "@/features/courses";
import { getStudentCompletions } from "@/entities/course";
import type { CourseCompletion } from "@/entities/course";
import type { ApiError } from "@/shared/api/base";
import { PageShell } from "@/shared/ui/PageShell";
import { Pagination } from "@/shared/ui/Pagination";

const PAGE_SIZE = 10;

export default function StudentCertificatesPage() {
  const t = useTranslations("StudentCertificates");
  const [completions, setCompletions] = useState<CourseCompletion[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCompletion, setSelectedCompletion] = useState<CourseCompletion | null>(null);

  useEffect(() => {
    setLoading(true);
    getStudentCompletions({ page, page_size: PAGE_SIZE, with_certificate: true })
      .then((data) => {
        setCompletions(data.results);
        setCount(data.count);
      })
      .catch((err: Partial<ApiError>) => setError(err.message ?? t("errorLoad")))
      .finally(() => setLoading(false));
  }, [page, t]);

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  function handlePageChange(next: number) {
    setPage(Math.min(Math.max(next, 1), totalPages));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <PageShell className="bg-wishlist" style={{ display: "flex", flexDirection: "column" }}>
      <h1
        className="font-normal text-(--color-text-primary)"
        style={{
          fontSize: "clamp(20px, 2.22vw, 32px)",
          marginBottom: "clamp(16px, 1.67vw, 32px)",
          flexShrink: 0,
        }}
      >
        {t("title")}
      </h1>

      <div style={{ flex: 1 }}>
        {loading ? (
          <p className="text-center text-lg text-(--color-text-secondary)">{t("loading")}</p>
        ) : error ? (
          <p className="text-center text-lg text-red-500">{error}</p>
        ) : completions.length === 0 ? (
          <p className="text-center text-lg text-(--color-text-secondary)">
            {t("noCertificatesYet")}
          </p>
        ) : (
          <div className="flex flex-wrap" style={{ gap: "clamp(12px, 1.25vw, 24px)" }}>
            {completions.map((completion) => (
              <CertificateCard
                key={completion.id}
                title={completion.title}
                thumbnailUrl={completion.certificate_thumbnail_url}
                onClick={() => setSelectedCompletion(completion)}
              />
            ))}
          </div>
        )}
      </div>

      {!loading && !error && completions.length > 0 && totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            paddingTop: "clamp(16px, 2.22vw, 32px)",
            flexShrink: 0,
          }}
        >
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
        </div>
      )}

      {selectedCompletion && (
        <CompletionResultModal
          completion={selectedCompletion}
          onClose={() => setSelectedCompletion(null)}
        />
      )}
    </PageShell>
  );
}
