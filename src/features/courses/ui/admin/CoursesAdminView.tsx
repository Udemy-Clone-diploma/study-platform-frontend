"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageShell } from "@/shared/ui/PageShell";
import { Pagination } from "@/shared/ui/Pagination";
import { ConfirmActionModal } from "@/shared/ui/ConfirmActionModal";
import { deleteCourse, getCategories, getCourses, hideCourse, openCourse } from "@/entities/course";
import type { Category, CourseListItem } from "@/entities/course";
import type { ApiError } from "@/shared/api/base";
import { CourseStatusTabs, STATUS_TAB_VALUES, type CourseStatusTab } from "./CourseStatusTabs";
import { CoursesToolbar } from "./CoursesToolbar";
import { CoursesTable } from "./CoursesTable";
import { CourseDetailPanel } from "./CourseDetailPanel";

const PAGE_SIZE = 10;

type PendingAction = {
  kind: "hide" | "unhide" | "delete";
  course: CourseListItem;
};

export function CoursesAdminView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const pageParam = Number(searchParams.get("page"));
  const page = Number.isInteger(pageParam) && pageParam > 1 ? pageParam : 1;
  const statusParam = searchParams.get("status");
  const statusTab: CourseStatusTab =
    statusParam !== null && statusParam in STATUS_TAB_VALUES
      ? (statusParam as Exclude<CourseStatusTab, null>)
      : null;
  const category = searchParams.get("category");
  const search = searchParams.get("search") ?? "";
  const ordering = searchParams.get("ordering") ?? "-created_at";

  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [count, setCount] = useState(0);
  const [listError, setListError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  const queryKey = [page, statusTab ?? "", category ?? "", search, ordering, refreshKey].join("|");
  const loading = loadedKey !== queryKey;

  const [categories, setCategories] = useState<Category[]>([]);
  const [detailCourse, setDetailCourse] = useState<CourseListItem | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getCategories()
      .then((data) => {
        if (!cancelled) setCategories(data);
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
      router.push(params.toString() ? `?${params.toString()}` : "/admin/courses", {
        scroll: options?.scroll ?? false,
      });
    },
    [router, searchParams],
  );

  useEffect(() => {
    let cancelled = false;
    getCourses({
      page,
      page_size: PAGE_SIZE,
      search: search || undefined,
      category: category ?? undefined,
      ordering,
      status: statusTab ? STATUS_TAB_VALUES[statusTab] : undefined,
    })
      .then((data) => {
        if (cancelled) return;
        setCourses(data.results);
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
        setCourses([]);
        setCount(0);
        setListError(apiError.message ?? "Failed to load courses.");
        setLoadedKey(queryKey);
      });
    return () => {
      cancelled = true;
    };
  }, [page, statusTab, category, search, ordering, queryKey, updateParams]);

  const refresh = useCallback(() => setRefreshKey((key) => key + 1), []);

  const handleSearchChange = useCallback(
    (value: string) => {
      updateParams({ search: value || null, page: null });
    },
    [updateParams],
  );

  function requestAction(kind: PendingAction["kind"], course: CourseListItem) {
    setActionError(null);
    setPendingAction({ kind, course });
  }

  async function handleConfirmAction() {
    if (!pendingAction) return;
    const { kind, course } = pendingAction;
    setActionLoading(true);
    setActionError(null);
    try {
      if (kind === "delete") {
        await deleteCourse(course.slug);
        if (detailCourse?.id === course.id) setDetailCourse(null);
      } else {
        const nextStatus = kind === "hide" ? "hidden" : "published";
        if (kind === "hide") await hideCourse(course.slug);
        else await openCourse(course.slug);
        if (detailCourse?.id === course.id) {
          setDetailCourse({ ...detailCourse, status: nextStatus });
        }
      }
      setPendingAction(null);
      refresh();
    } catch (err) {
      setActionError((err as ApiError).message ?? "Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const emptyMessage = loading ? "Loading courses…" : "No courses found.";

  const actionCopy = pendingAction
    ? {
        hide: {
          title: "Hide course",
          description: `Hide "${pendingAction.course.title}" from the catalog? Enrolled students keep their access, but new students will not be able to find or buy it.`,
          confirmLabel: "Hide",
        },
        unhide: {
          title: "Unhide course",
          description: `Return "${pendingAction.course.title}" to the catalog and open it for new enrollments?`,
          confirmLabel: "Unhide",
        },
        delete: {
          title: "Delete course",
          description: pendingAction.course.students_count
            ? `Delete "${pendingAction.course.title}"? It has ${pendingAction.course.students_count} enrolled ${
                pendingAction.course.students_count === 1 ? "student" : "students"
              } who may lose access. This cannot be undone.`
            : `Delete "${pendingAction.course.title}"? This cannot be undone.`,
          confirmLabel: "Delete",
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
          Courses
        </h1>

        <div style={{ marginBottom: "clamp(16px, 1.67vw, 24px)" }}>
          <CourseStatusTabs
            active={statusTab}
            onChange={(next) => updateParams({ status: next, page: null })}
          />
        </div>

        <div style={{ marginBottom: "clamp(16px, 1.67vw, 24px)" }}>
          <CoursesToolbar
            search={search}
            onSearchChange={handleSearchChange}
            categories={categories}
            category={category}
            onCategoryChange={(next) => updateParams({ category: next, page: null })}
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
              <CoursesTable
                courses={courses}
                emptyMessage={emptyMessage}
                selectedCourseId={detailCourse?.id ?? null}
                onSelect={setDetailCourse}
                onToggleHidden={(course) =>
                  requestAction(course.status === "hidden" ? "unhide" : "hide", course)
                }
                onDelete={(course) => requestAction("delete", course)}
                currentSort={ordering}
                onSortChange={(next) =>
                  updateParams({ ordering: next === "-created_at" ? null : next, page: null })
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

          {detailCourse && (
            <CourseDetailPanel course={detailCourse} onClose={() => setDetailCourse(null)} />
          )}
        </div>
      </div>

      {pendingAction && actionCopy && (
        <ConfirmActionModal
          title={actionCopy.title}
          description={actionCopy.description}
          confirmLabel={actionCopy.confirmLabel}
          loading={actionLoading}
          error={actionError}
          onConfirm={handleConfirmAction}
          onCancel={() => setPendingAction(null)}
        />
      )}
    </PageShell>
  );
}
