"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { PageShell } from "@/shared/ui/PageShell";
import { Pagination } from "@/shared/ui/Pagination";
import { deleteUser, getMe, getUsers, restoreUser, setUserBlocked } from "@/entities/user";
import type { UserData, UserRole } from "@/entities/user";
import type { ApiError } from "@/shared/api/base";
import { RoleTabs } from "./RoleTabs";
import { UsersToolbar, type StatusFilter } from "./UsersToolbar";
import { UsersTable } from "./UsersTable";
import { ConfirmActionModal } from "@/shared/ui/ConfirmActionModal";
import { CreateUserModal } from "./CreateUserModal";
import { EditUserModal } from "./EditUserModal";
import { UserDetailPanel } from "./UserDetailPanel";

const PAGE_SIZE = 10;
const ROLES: UserRole[] = ["student", "teacher", "moderator", "administrator"];

type PendingAction = {
  kind: "delete" | "block" | "unblock" | "restore";
  user: UserData;
};

export function UsersAdminView() {
  const t = useTranslations("UsersAdminView");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const searchParams = useSearchParams();

  const pageParam = Number(searchParams.get("page"));
  const page = Number.isInteger(pageParam) && pageParam > 1 ? pageParam : 1;
  const roleParam = searchParams.get("role");
  const role = ROLES.includes(roleParam as UserRole) ? (roleParam as UserRole) : null;
  const statusParam = searchParams.get("status");
  const status: StatusFilter =
    statusParam === "active" ||
    statusParam === "inactive" ||
    statusParam === "blocked" ||
    statusParam === "deleted"
      ? statusParam
      : null;
  const search = searchParams.get("search") ?? "";
  const ordering = searchParams.get("ordering") ?? "-date_joined";

  const [users, setUsers] = useState<UserData[]>([]);
  const [count, setCount] = useState(0);
  const [listError, setListError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  const queryKey = [page, role ?? "", status ?? "", search, ordering, refreshKey].join("|");
  const loading = loadedKey !== queryKey;

  const [detailUser, setDetailUser] = useState<UserData | null>(null);
  const [editUser, setEditUser] = useState<UserData | null>(null);
  const [creating, setCreating] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMe()
      .then((me) => {
        if (!cancelled) setCurrentUserId(me.id);
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
      router.push(params.toString() ? `?${params.toString()}` : "/admin/users", {
        scroll: options?.scroll ?? false,
      });
    },
    [router, searchParams],
  );

  useEffect(() => {
    let cancelled = false;
    getUsers({
      page,
      pageSize: PAGE_SIZE,
      role: role ?? undefined,
      status: status === "active" || status === "inactive" ? status : undefined,
      isBlocked: status === "blocked" ? true : undefined,
      isDeleted: status === "deleted" ? true : undefined,
      search: search || undefined,
      ordering,
    })
      .then((data) => {
        if (cancelled) return;
        setUsers(data.results);
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
        setUsers([]);
        setCount(0);
        setListError(apiError.message ?? t("failedToLoadUsers"));
        setLoadedKey(queryKey);
      });
    return () => {
      cancelled = true;
    };
  }, [page, role, status, search, ordering, queryKey, updateParams, t]);

  const refresh = useCallback(() => setRefreshKey((key) => key + 1), []);

  const handleSearchChange = useCallback(
    (value: string) => {
      updateParams({ search: value || null, page: null });
    },
    [updateParams],
  );

  function requestAction(kind: PendingAction["kind"], user: UserData) {
    setActionError(null);
    setPendingAction({ kind, user });
  }

  async function handleConfirmAction() {
    if (!pendingAction) return;
    setActionLoading(true);
    setActionError(null);
    try {
      if (pendingAction.kind === "delete") {
        await deleteUser(pendingAction.user.id);
        if (detailUser?.id === pendingAction.user.id) setDetailUser(null);
      } else if (pendingAction.kind === "restore") {
        const restored = await restoreUser(pendingAction.user.id);
        if (detailUser?.id === restored.id) setDetailUser(restored);
      } else {
        const updated = await setUserBlocked(pendingAction.user.id, pendingAction.kind === "block");
        if (detailUser?.id === updated.id) setDetailUser(updated);
      }
      setPendingAction(null);
      refresh();
    } catch (err) {
      setActionError((err as ApiError).message ?? t("genericError"));
    } finally {
      setActionLoading(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const emptyMessage = loading ? t("loadingUsers") : t("noUsersFound");

  const actionName = pendingAction
    ? `${pendingAction.user.first_name} ${pendingAction.user.last_name}`.trim() ||
      pendingAction.user.email
    : "";
  const actionCopy = pendingAction
    ? {
        delete: {
          title: t("deleteUserTitle"),
          description: t("deleteUserDescription", { name: actionName }),
          confirmLabel: tCommon("delete"),
        },
        block: {
          title: t("blockUserTitle"),
          description: t("blockUserDescription", { name: actionName }),
          confirmLabel: t("blockConfirmLabel"),
        },
        unblock: {
          title: t("unblockUserTitle"),
          description: t("unblockUserDescription", { name: actionName }),
          confirmLabel: t("unblockConfirmLabel"),
        },
        restore: {
          title: t("restoreUserTitle"),
          description: t("restoreUserDescription", { name: actionName }),
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
          {t("title")}
        </h1>

        <div style={{ marginBottom: "clamp(16px, 1.67vw, 24px)" }}>
          <RoleTabs active={role} onChange={(next) => updateParams({ role: next, page: null })} />
        </div>

        <div style={{ marginBottom: "clamp(16px, 1.67vw, 24px)" }}>
          <UsersToolbar
            search={search}
            onSearchChange={handleSearchChange}
            status={status}
            onStatusChange={(next) => updateParams({ status: next, page: null })}
            onRefresh={refresh}
            refreshing={loading}
            onAddUser={() => setCreating(true)}
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
              <UsersTable
                users={users}
                emptyMessage={emptyMessage}
                selectedUserId={detailUser?.id ?? null}
                currentUserId={currentUserId}
                onSelect={setDetailUser}
                onEdit={setEditUser}
                onToggleBlock={(user) => requestAction(user.is_blocked ? "unblock" : "block", user)}
                onDelete={(user) => requestAction("delete", user)}
                onRestore={(user) => requestAction("restore", user)}
                currentSort={ordering}
                onSortChange={(next) =>
                  updateParams({ ordering: next === "-date_joined" ? null : next })
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

          {detailUser && <UserDetailPanel user={detailUser} onClose={() => setDetailUser(null)} />}
        </div>
      </div>

      {creating && (
        <CreateUserModal
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            updateParams({ page: null });
            refresh();
          }}
        />
      )}

      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSaved={(updated) => {
            setEditUser(null);
            setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
            if (detailUser?.id === updated.id) setDetailUser(updated);
            if (role && updated.role !== role) refresh();
          }}
        />
      )}

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
