"use client";

import { Ban, LockOpen, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { resendVerificationEmail } from "@/entities/user";
import type { UserData } from "@/entities/user";
import { DataTable, type DataTableColumn } from "@/shared/ui/DataTable";
import { formatUserDate } from "../../lib/dates";
import { ROLE_LABELS } from "../../model/labels";
import { UserAvatar } from "./UserAvatar";
import { UserStatusBadge } from "./UserStatusBadge";

type Props = {
  users: UserData[];
  emptyMessage: string;
  selectedUserId: number | null;
  currentUserId: number | null;
  onSelect: (user: UserData) => void;
  onEdit: (user: UserData) => void;
  onToggleBlock: (user: UserData) => void;
  onDelete: (user: UserData) => void;
  onRestore: (user: UserData) => void;
  currentSort?: string | null;
  onSortChange?: (ordering: string) => void;
};

export function UsersTable({
  users,
  emptyMessage,
  selectedUserId,
  currentUserId,
  onSelect,
  onEdit,
  onToggleBlock,
  onDelete,
  onRestore,
  currentSort,
  onSortChange,
}: Props) {
  const columns: DataTableColumn<UserData>[] = [
    {
      key: "user",
      label: "User",
      flex: 2.5,
      sortKey: "full_name",
      render: (row) => (
        <div className="flex min-w-0 items-center" style={{ gap: "clamp(8px, 0.83vw, 12px)" }}>
          <UserAvatar user={row} />
          <button
            type="button"
            onClick={() => onSelect(row)}
            className="min-w-0 cursor-pointer overflow-hidden border-none bg-transparent p-0 text-left text-ellipsis whitespace-nowrap underline decoration-from-font hover:text-(--color-blue)"
            style={{ font: "inherit", color: "inherit" }}
          >
            {`${row.first_name} ${row.last_name}`.trim() || row.email}
          </button>
        </div>
      ),
    },
    {
      key: "role",
      label: "Role",
      flex: 1.4,
      headerAlign: "center",
      cellAlign: "center",
      render: (row) => <span>{ROLE_LABELS[row.role]}</span>,
    },
    {
      key: "email",
      label: "Email",
      flex: 2.4,
      headerAlign: "center",
      cellAlign: "center",
      sortKey: "email",
      render: (row) => (
        <span className="block overflow-hidden text-ellipsis whitespace-nowrap">{row.email}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      flex: 1.2,
      headerAlign: "center",
      cellAlign: "center",
      render: (row) => (
        <UserStatusBadge
          user={row}
          onResendVerification={() => resendVerificationEmail(row.email)}
        />
      ),
    },
    {
      key: "date_joined",
      label: "Reg. date",
      flex: 1.2,
      headerAlign: "center",
      cellAlign: "center",
      sortKey: "date_joined",
      render: (row) => <span>{formatUserDate(row.date_joined)}</span>,
    },
    {
      key: "actions",
      label: "Actions",
      flex: 1.3,
      headerAlign: "center",
      cellAlign: "center",
      render: (row) => {
        if (row.is_deleted) {
          return (
            <div className="flex items-center justify-center">
              <ActionButton title="Restore user" onClick={() => onRestore(row)}>
                <RotateCcw size={16} />
              </ActionButton>
            </div>
          );
        }
        const isSelf = row.id === currentUserId;
        return (
          <div
            className="flex items-center justify-center"
            style={{ gap: "clamp(4px, 0.56vw, 8px)" }}
          >
            <ActionButton title="Edit user" onClick={() => onEdit(row)}>
              <Pencil size={16} />
            </ActionButton>
            <ActionButton
              title={
                isSelf
                  ? "You cannot block your own account"
                  : row.is_blocked
                    ? "Unblock user"
                    : "Block user"
              }
              onClick={() => onToggleBlock(row)}
              danger={!row.is_blocked}
              disabled={isSelf}
            >
              {row.is_blocked ? <LockOpen size={16} /> : <Ban size={16} />}
            </ActionButton>
            <ActionButton
              title={isSelf ? "You cannot delete your own account" : "Delete user"}
              onClick={() => onDelete(row)}
              danger
              disabled={isSelf}
            >
              <Trash2 size={16} />
            </ActionButton>
          </div>
        );
      },
    },
  ];

  return (
    <DataTable<UserData>
      columns={columns}
      rows={users}
      getRowKey={(row) => row.id}
      emptyMessage={emptyMessage}
      headerVariant="plain"
      showIndex={false}
      rowVariant="card"
      selectedKey={selectedUserId}
      currentSort={currentSort}
      onSortChange={onSortChange}
    />
  );
}

function ActionButton({
  title,
  onClick,
  danger = false,
  disabled = false,
  children,
}: {
  title: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center rounded-full p-1.5 transition enabled:cursor-pointer enabled:hover:bg-(--color-brand-lavender-soft) disabled:cursor-not-allowed disabled:opacity-35"
      style={{
        background: "none",
        border: "none",
        color: danger ? "var(--color-rejected)" : "var(--color-text-primary)",
      }}
    >
      {children}
    </button>
  );
}
