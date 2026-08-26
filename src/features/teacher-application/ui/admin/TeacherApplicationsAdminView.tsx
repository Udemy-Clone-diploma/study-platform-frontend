"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { PageShell } from "@/shared/ui/PageShell";
import { Pagination } from "@/shared/ui/Pagination";
import {
  approveTeacherApplication,
  cancelTeacherApplication,
  getTeacherApplications,
} from "@/entities/teacher-application";
import type { TeacherApplication, TeacherApplicationStatus } from "@/entities/teacher-application";
import type { ApiError } from "@/shared/api/base";
import { ApplicationsToolbar } from "./ApplicationsToolbar";
import { StatusTabs } from "./StatusTabs";
import { TeacherApplicationsTable } from "./TeacherApplicationsTable";
import { TeacherApplicationDetailPanel } from "./TeacherApplicationDetailPanel";
import { TeacherApplicationDecisionModal } from "./TeacherApplicationDecisionModal";

const PAGE_SIZE = 10;
const STATUSES: TeacherApplicationStatus[] = ["pending", "approved", "cancelled"];

type PendingDecision = { kind: "approve" | "cancel"; application: TeacherApplication };

export function TeacherApplicationsAdminView() {
  const t = useTranslations("TeacherApplicationsAdmin");
  const router = useRouter();
  const searchParams = useSearchParams();

  const pageParam = Number(searchParams.get("page"));
  const page = Number.isInteger(pageParam) && pageParam > 1 ? pageParam : 1;
  const statusParam = searchParams.get("status");
  const status: TeacherApplicationStatus | null = STATUSES.includes(
    statusParam as TeacherApplicationStatus,
  )
    ? (statusParam as TeacherApplicationStatus)
    : null;
  const ordering = searchParams.get("ordering") ?? "-submitted_at";
  const search = searchParams.get("search") ?? "";

  const [applications, setApplications] = useState<TeacherApplication[]>([]);
  const [count, setCount] = useState(0);
  const [listError, setListError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  const queryKey = [page, status ?? "", search, ordering, refreshKey].join("|");
  const loading = loadedKey !== queryKey;

  const [detailApplication, setDetailApplication] = useState<TeacherApplication | null>(null);
  const [pendingDecision, setPendingDecision] = useState<PendingDecision | null>(null);
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [decisionError, setDecisionError] = useState<string | null>(null);

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") params.delete(key);
        else params.set(key, value);
      }
      router.push(
        params.toString() ? `?${params.toString()}` : "/moderator-dashboard/teacher-applications",
        { scroll: false },
      );
    },
    [router, searchParams],
  );

  useEffect(() => {
    let cancelled = false;
    getTeacherApplications({
      page,
      pageSize: PAGE_SIZE,
      status: status ?? undefined,
      search: search || undefined,
      ordering,
    })
      .then((data) => {
        if (cancelled) return;
        setApplications(data.results);
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
        setApplications([]);
        setCount(0);
        setListError(apiError.message ?? t("failedToLoad"));
        setLoadedKey(queryKey);
      });
    return () => {
      cancelled = true;
    };
  }, [page, status, search, ordering, queryKey, updateParams, t]);

  const refresh = useCallback(() => setRefreshKey((key) => key + 1), []);

  const handleSearchChange = useCallback(
    (value: string) => {
      updateParams({ search: value || null, page: null });
    },
    [updateParams],
  );

  function requestDecision(kind: PendingDecision["kind"], application: TeacherApplication) {
    setDecisionError(null);
    setPendingDecision({ kind, application });
  }

  async function handleConfirmDecision(comment: string) {
    if (!pendingDecision) return;
    setDecisionLoading(true);
    setDecisionError(null);
    try {
      const updated =
        pendingDecision.kind === "approve"
          ? await approveTeacherApplication(pendingDecision.application.id, comment)
          : await cancelTeacherApplication(pendingDecision.application.id, comment);
      if (detailApplication?.id === updated.id) setDetailApplication(updated);
      setPendingDecision(null);
      refresh();
    } catch (err) {
      setDecisionError((err as ApiError).message ?? t("somethingWrong"));
    } finally {
      setDecisionLoading(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const emptyMessage = loading ? t("loadingApplications") : t("noApplicationsFound");

  const applicantName = pendingDecision
    ? `${pendingDecision.application.first_name} ${pendingDecision.application.last_name}`.trim() ||
      pendingDecision.application.email
    : "";
  const decisionCopy = pendingDecision
    ? {
        approve: {
          title: t("approveApplicationTitle"),
          description: t("approveApplicationDescription", { name: applicantName }),
          confirmLabel: t("approve"),
          commentRequired: false,
        },
        cancel: {
          title: t("cancelApplicationTitle"),
          description: t("cancelApplicationDescription", { name: applicantName }),
          confirmLabel: t("cancelApplicationConfirmLabel"),
          commentRequired: true,
        },
      }[pendingDecision.kind]
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
          <StatusTabs
            active={status}
            onChange={(next) => updateParams({ status: next, page: null })}
          />
        </div>

        <div style={{ marginBottom: "clamp(16px, 1.67vw, 24px)" }}>
          <ApplicationsToolbar
            search={search}
            onSearchChange={handleSearchChange}
            onRefresh={refresh}
            refreshing={loading}
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
              <TeacherApplicationsTable
                applications={applications}
                emptyMessage={emptyMessage}
                selectedApplicationId={detailApplication?.id ?? null}
                onSelect={setDetailApplication}
                currentSort={ordering}
                onSortChange={(next) =>
                  updateParams({ ordering: next === "-submitted_at" ? null : next, page: null })
                }
              />
            </div>

            {totalPages > 1 && (
              <div style={{ marginTop: "clamp(16px, 1.67vw, 24px)" }}>
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={(next) => updateParams({ page: next > 1 ? String(next) : null })}
                />
              </div>
            )}
          </div>

          {detailApplication && (
            <TeacherApplicationDetailPanel
              application={detailApplication}
              onClose={() => setDetailApplication(null)}
              onApprove={() => requestDecision("approve", detailApplication)}
              onCancelApplication={() => requestDecision("cancel", detailApplication)}
            />
          )}
        </div>
      </div>

      {pendingDecision && decisionCopy && (
        <TeacherApplicationDecisionModal
          title={decisionCopy.title}
          description={decisionCopy.description}
          confirmLabel={decisionCopy.confirmLabel}
          commentRequired={decisionCopy.commentRequired}
          loading={decisionLoading}
          error={decisionError}
          onConfirm={handleConfirmDecision}
          onCancel={() => setPendingDecision(null)}
        />
      )}
    </PageShell>
  );
}
