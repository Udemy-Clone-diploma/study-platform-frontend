"use client";

import { Pencil, Trash2 } from "lucide-react";
import type { BlogCategory } from "@/entities/blog";
import { DataTable, type DataTableColumn } from "@/shared/ui/DataTable";

type Props = {
  categories: BlogCategory[];
  emptyMessage: string;
  onEdit: (category: BlogCategory) => void;
  onDelete: (category: BlogCategory) => void;
};

/** Blog categories table — same DataTable card look as the course catalog's CategoriesTable. */
export function BlogCategoriesTable({ categories, emptyMessage, onEdit, onDelete }: Props) {
  const columns: DataTableColumn<BlogCategory>[] = [
    {
      key: "name",
      label: "Category",
      flex: 1.8,
      render: (row) => (
        <div className="flex min-w-0 items-center" style={{ gap: "clamp(8px, 0.83vw, 12px)" }}>
          <CategoryTile name={row.name} />
          <span className="min-w-0 overflow-hidden font-semibold text-ellipsis whitespace-nowrap">
            {row.name}
          </span>
        </div>
      ),
    },
    {
      key: "slug",
      label: "Slug",
      flex: 1.2,
      render: (row) => (
        <span className="block overflow-hidden text-ellipsis whitespace-nowrap text-(--color-text-secondary)">
          {row.slug}
        </span>
      ),
    },
    {
      key: "headline",
      label: "Headline",
      flex: 1.8,
      render: (row) => (
        <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
          {row.headline}
        </span>
      ),
    },
    {
      key: "description",
      label: "Description",
      flex: 2,
      render: (row) => (
        <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
          {row.description}
        </span>
      ),
    },
    {
      key: "articles",
      label: "Articles",
      flex: 0.8,
      headerAlign: "center",
      cellAlign: "center",
      render: (row) => (typeof row.articles_count === "number" ? row.articles_count : null),
    },
    {
      key: "actions",
      label: "Actions",
      flex: 1,
      headerAlign: "center",
      cellAlign: "center",
      render: (row) => (
        <div className="flex items-center justify-center" style={{ gap: "clamp(4px, 0.56vw, 8px)" }}>
          <ActionButton title="Edit category" onClick={() => onEdit(row)}>
            <Pencil size={16} />
          </ActionButton>
          <ActionButton title="Delete category" onClick={() => onDelete(row)} danger>
            <Trash2 size={16} />
          </ActionButton>
        </div>
      ),
    },
  ];

  return (
    <DataTable<BlogCategory>
      columns={columns}
      rows={categories}
      getRowKey={(row) => row.id}
      emptyMessage={emptyMessage}
      headerVariant="plain"
      showIndex={false}
      rowVariant="card"
    />
  );
}

function CategoryTile({ name }: { name: string }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-xl"
      style={{
        width: "clamp(36px, 2.78vw, 44px)",
        height: "clamp(36px, 2.78vw, 44px)",
        background: "var(--gradient-brand)",
      }}
    >
      <span
        className="font-(family-name:--font-accent) font-bold text-(--color-text-primary)"
        style={{ fontSize: "clamp(14px, 1.11vw, 16px)", lineHeight: 1 }}
      >
        {name.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}

function ActionButton({
  title,
  onClick,
  danger = false,
  children,
}: {
  title: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className="inline-flex cursor-pointer items-center justify-center rounded-full p-1.5 transition hover:bg-(--color-brand-lavender-soft)"
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
