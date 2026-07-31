"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { PageShell } from "@/shared/ui/PageShell";
import { Pagination } from "@/shared/ui/Pagination";
import {
  getCertificateCounts,
  getCertificates,
  reissueCertificate,
  restoreCertificate,
  revokeCertificate,
} from "@/entities/certificate";
import type { Certificate, CertificateCounts } from "@/entities/certificate";
import { getCourses } from "@/entities/course";
import type { ApiError } from "@/shared/api/base";
import { mapApiFieldErrors } from "@/shared/lib/apiErrors";
import {
  CertificateStatusTabs,
  STATUS_TAB_VALUES,
  type CertificateStatusTab,
} from "./CertificateStatusTabs";
import { CertificatesToolbar } from "./CertificatesToolbar";
import { CertificatesTable } from "./CertificatesTable";
import { CertificateDetailPanel } from "./CertificateDetailPanel";
import { IssueCertificateModal } from "./IssueCertificateModal";
import { ReasonPromptModal } from "./ReasonPromptModal";

const PAGE_SIZE = 10;
const DEFAULT_ORDERING = "-issued_at";
const COURSE_FILTER_LIMIT = 100;

type PendingAction = {
  kind: "revoke" | "reissue" | "restore";
  certificate: Certificate;
};

export function CertificatesAdminView() {
  const t = useTranslations("CertificatesAdminView");
  const router = useRouter();
  const searchParams = useSearchParams();

  const pageParam = Number(searchParams.get("page"));
  const page = Number.isInteger(pageParam) && pageParam > 1 ? pageParam : 1;
  const statusParam = searchParams.get("status");
  const statusTab: CertificateStatusTab =
    statusParam !== null && statusParam in STATUS_TAB_VALUES
      ? (statusParam as Exclude<CertificateStatusTab, null>)
      : null;
  const course = searchParams.get("course");
  const search = searchParams.get("search") ?? "";
  const ordering = searchParams.get("ordering") ?? DEFAULT_ORDERING;

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [count, setCount] = useState(0);
  const [listError, setListError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  const queryKey = [page, statusTab ?? "", course ?? "", search, ordering, refreshKey].join("|");
  const loading = loadedKey !== queryKey;

  const [courseOptions, setCourseOptions] = useState<{ label: string; value: string }[]>([]);
  const [counts, setCounts] = useState<CertificateCounts | null>(null);
  const [detailCertificate, setDetailCertificate] = useState<Certificate | null>(null);
  const [issueOpen, setIssueOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionFieldError, setActionFieldError] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    getCourses({ page_size: COURSE_FILTER_LIMIT })
      .then((data) => {
        if (cancelled) return;
        setCourseOptions(data.results.map((item) => ({ label: item.title, value: item.slug })));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const updateParams = useCallback(
    (updates: Record<string, string | null>, options?: { scroll?: boolean }) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") params.delete(key);
        else params.set(key, value);
      }
      router.push(params.toString() ? `?${params.toString()}` : "/admin/certificates", {
        scroll: options?.scroll ?? false,
      });
    },
    [router, searchParams],
  );

  useEffect(() => {
    let cancelled = false;
    getCertificates({
      page,
      page_size: PAGE_SIZE,
      search: search || undefined,
      course: course ?? undefined,
      ordering,
      status: statusTab ? STATUS_TAB_VALUES[statusTab] : undefined,
    })
      .then((data) => {
        if (cancelled) return;
        setCertificates(data.results);
        setCount(data.count);
        setListError(null);
        setLoadedKey(queryKey);
      })
      .catch((err) => {
        if (cancelled) return;
        const apiError = err as ApiError;
        if (apiError.status === 404 && page > 1) {
          updateParams({ page: null });
          return;
        }
        setCertificates([]);
        setCount(0);
        setListError(apiError.message ?? t("errorLoadCertificates"));
        setLoadedKey(queryKey);
      });
    return () => {
      cancelled = true;
    };
  }, [page, statusTab, course, search, ordering, queryKey, updateParams, t]);

  useEffect(() => {
    let cancelled = false;
    getCertificateCounts({ search: search || undefined, course: course ?? undefined })
      .then((data) => {
        if (!cancelled) setCounts(data);
      })
      .catch(() => {
        if (!cancelled) setCounts(null);
      });
    return () => {
      cancelled = true;
    };
  }, [search, course, refreshKey]);

  const refresh = useCallback(() => setRefreshKey((key) => key + 1), []);

  const handleSearchChange = useCallback(
    (value: string) => {
      updateParams({ search: value || null, page: null });
    },
    [updateParams],
  );

  function requestAction(kind: PendingAction["kind"], certificate: Certificate) {
    setActionError(null);
    setActionFieldError(undefined);
    setPendingAction({ kind, certificate });
  }

  async function handleConfirmAction(reason: string) {
    if (!pendingAction) return;
    const { kind, certificate } = pendingAction;
    setActionLoading(true);
    setActionError(null);
    setActionFieldError(undefined);
    try {
      if (kind === "revoke") await revokeCertificate(certificate.id, reason);
      else if (kind === "restore") await restoreCertificate(certificate.id, reason);
      else await reissueCertificate(certificate.id, reason);
      if (detailCertificate?.id === certificate.id) setDetailCertificate(null);
      setPendingAction(null);
      refresh();
    } catch (err) {
      const apiError = err as ApiError;
      setActionFieldError(mapApiFieldErrors(apiError.fields).reason);
      setActionError(apiError.message ?? t("errorActionGeneric"));
    } finally {
      setActionLoading(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const emptyMessage = loading ? t("loadingCertificates") : t("noCertificatesFound");

  const actionCopy = pendingAction
    ? {
        revoke: {
          title: t("revokeTitle"),
          description: t("revokeDescription", {
            serial: pendingAction.certificate.serial,
            student: pendingAction.certificate.student.full_name,
            course: pendingAction.certificate.course.title,
          }),
          reasonLabel: t("revokeReasonLabel"),
          placeholder: t("revokePlaceholder"),
          confirmLabel: t("revokeConfirmLabel"),
        },
        reissue: {
          title: t("reissueTitle"),
          description: t("reissueDescription", { serial: pendingAction.certificate.serial }),
          reasonLabel: t("reissueReasonLabel"),
          placeholder: t("reissuePlaceholder"),
          confirmLabel: t("reissueConfirmLabel"),
        },
        restore: {
          title: t("restoreTitle"),
          description: t("restoreDescription", {
            serial: pendingAction.certificate.serial,
            student: pendingAction.certificate.student.full_name,
          }),
          reasonLabel: t("restoreReasonLabel"),
          placeholder: t("restorePlaceholder"),
          confirmLabel: t("restoreConfirmLabel"),
        },
      }[pendingAction.kind]
    : null;

  return (
    <PageShell className="bg-(--color-brand-lavender-soft)">
      <div className="flex w-full flex-col" style={{ maxWidth: 1648, margin: "0 auto" }}>
        <h1
          className="font-semibold text-(--color-text-primary)"
          style={{
            fontFamily: "var(--font-base)",
            fontSize: "clamp(24px, 2.5vw, 36px)",
            margin: "0 0 clamp(16px, 1.67vw, 24px)",
          }}
        >
          {t("heading")}
        </h1>

        <div style={{ marginBottom: "clamp(16px, 1.67vw, 24px)" }}>
          <CertificateStatusTabs
            active={statusTab}
            onChange={(next) => updateParams({ status: next, page: null })}
            counts={counts}
          />
        </div>

        <div style={{ marginBottom: "clamp(16px, 1.67vw, 24px)" }}>
          <CertificatesToolbar
            search={search}
            onSearchChange={handleSearchChange}
            courses={courseOptions}
            course={course}
            onCourseChange={(next) => updateParams({ course: next, page: null })}
            onRefresh={refresh}
            refreshing={loading}
            onIssue={() => setIssueOpen(true)}
          />
        </div>

        {listError && (
          <p
            className="text-(--color-danger)"
            style={{
              fontFamily: "var(--font-base)",
              fontSize: "clamp(12px, 0.97vw, 14px)",
              margin: "0 0 8px",
            }}
          >
            {listError}
          </p>
        )}

        <div className="flex flex-wrap items-start" style={{ gap: "clamp(16px, 1.67vw, 24px)" }}>
          <div className="flex min-w-0 flex-col" style={{ flex: "1 1 640px" }}>
            <div
              key={refreshKey}
              className={`animate-[table-refresh_400ms_ease-out] transition-opacity ${loading ? "opacity-60" : ""}`}
            >
              <CertificatesTable
                certificates={certificates}
                emptyMessage={emptyMessage}
                selectedCertificateId={detailCertificate?.id ?? null}
                onSelect={setDetailCertificate}
                onReissue={(certificate) => requestAction("reissue", certificate)}
                onRevoke={(certificate) => requestAction("revoke", certificate)}
                onRestore={(certificate) => requestAction("restore", certificate)}
                currentSort={ordering}
                onSortChange={(next) =>
                  updateParams({ ordering: next === DEFAULT_ORDERING ? null : next })
                }
              />
            </div>

            {totalPages > 1 && (
              <div style={{ marginTop: "clamp(16px, 1.67vw, 24px)" }}>
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={(next) =>
                    updateParams({ page: next > 1 ? String(next) : null }, { scroll: true })
                  }
                />
              </div>
            )}
          </div>

          {detailCertificate && (
            <CertificateDetailPanel
              certificate={detailCertificate}
              onClose={() => setDetailCertificate(null)}
              onVisibilityChange={(updated) => {
                setDetailCertificate(updated);
                setCertificates((rows) =>
                  rows.map((row) => (row.id === updated.id ? updated : row)),
                );
              }}
            />
          )}
        </div>
      </div>

      {issueOpen && (
        <IssueCertificateModal
          onClose={() => setIssueOpen(false)}
          onIssued={() => {
            setIssueOpen(false);
            refresh();
          }}
        />
      )}

      {pendingAction && actionCopy && (
        <ReasonPromptModal
          key={`${pendingAction.kind}-${pendingAction.certificate.id}`}
          title={actionCopy.title}
          description={actionCopy.description}
          reasonLabel={actionCopy.reasonLabel}
          placeholder={actionCopy.placeholder}
          confirmLabel={actionCopy.confirmLabel}
          loading={actionLoading}
          error={actionError}
          fieldError={actionFieldError}
          onConfirm={handleConfirmAction}
          onCancel={() => setPendingAction(null)}
        />
      )}
    </PageShell>
  );
}
