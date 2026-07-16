"use client";

import Image from "next/image";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import type { Category } from "@/entities/course";
import { DataTable, type DataTableColumn } from "@/shared/ui/DataTable";

const CATEGORY_ICONS: Record<string, string> = {
  business: "/cources-default-pic/intelligence-pic.svg",
  design: "/cources-default-pic/workspace-pic.svg",
  it: "/cources-default-pic/innovation-pic.svg",
  languages: "/cources-default-pic/communication-pic.svg",
  marketing: "/cources-default-pic/automation-pic.svg",
};

type Props = {
  categories: Category[];
  emptyMessage: string;
  featuredSavingId: number | null;
  onFeaturedChange: (category: Category, order: number | null) => void;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  currentSort?: string | null;
  onSortChange?: (ordering: string) => void;
};

export function CategoriesTable({
  categories,
  emptyMessage,
  featuredSavingId,
  onFeaturedChange,
  onEdit,
  onDelete,
  currentSort,
  onSortChange,
}: Props) {
  const columns: DataTableColumn<Category>[] = [
    {
      key: "name",
      label: "Category",
      flex: 1.8,
      sortKey: "name",
      render: (row) => (
        <div className="flex min-w-0 items-center" style={{ gap: "clamp(8px, 0.83vw, 12px)" }}>
          <CategoryTile name={row.name} slug={row.slug} />
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
      key: "description",
      label: "Description",
      flex: 2.6,
      render: (row) => (
        <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
          {row.description}
        </span>
      ),
    },
    {
      key: "courses",
      label: "Courses",
      flex: 0.8,
      headerAlign: "center",
      cellAlign: "center",
      sortKey: "courses_count",
      render: (row) =>
        typeof row.courses_count === "number" ? (
          <Link
            href={`/catalog?category=${row.slug}`}
            className="underline decoration-from-font hover:text-(--color-blue)"
            title={`View ${row.name} courses in the catalog`}
          >
            {row.courses_count}
          </Link>
        ) : null,
    },
    {
      key: "featured",
      label: "Featured",
      flex: 0.9,
      headerAlign: "center",
      cellAlign: "center",
      render: (row) => (
        <FeaturedOrderSelect
          value={row.featured_order ?? null}
          disabled={featuredSavingId === row.id}
          onCommit={(next) => onFeaturedChange(row, next)}
        />
      ),
    },
    {
      key: "actions",
      label: "Actions",
      flex: 1,
      headerAlign: "center",
      cellAlign: "center",
      render: (row) => (
        <div
          className="flex items-center justify-center"
          style={{ gap: "clamp(4px, 0.56vw, 8px)" }}
        >
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
    <DataTable<Category>
      columns={columns}
      rows={categories}
      getRowKey={(row) => row.id}
      emptyMessage={emptyMessage}
      headerVariant="plain"
      showIndex={false}
      rowVariant="card"
      currentSort={currentSort}
      onSortChange={onSortChange}
    />
  );
}

const FEATURED_LIMIT = 6;

function FeaturedOrderSelect({
  value,
  disabled,
  onCommit,
}: {
  value: number | null;
  disabled: boolean;
  onCommit: (next: number | null) => void;
}) {
  const orders = Array.from({ length: FEATURED_LIMIT }, (_, i) => i + 1);
  if (value !== null && !orders.includes(value)) orders.push(value);

  return (
    <select
      value={value === null ? "" : String(value)}
      disabled={disabled}
      onChange={(e) => onCommit(e.target.value === "" ? null : Number(e.target.value))}
      aria-label="Featured order"
      title="Position among the featured categories on the homepage. None removes it from featured."
      className="cursor-pointer rounded-lg border border-(--color-border-light) bg-white text-center outline-none transition focus:border-(--color-blue) disabled:cursor-default disabled:opacity-50"
      style={{
        width: "clamp(64px, 5vw, 80px)",
        height: "clamp(30px, 2.36vw, 36px)",
        fontFamily: "var(--font-base)",
        fontSize: "clamp(13px, 1.11vw, 16px)",
        color: "var(--color-text-primary)",
      }}
    >
      <option value="">None</option>
      {orders.map((order) => (
        <option key={order} value={order}>
          {order}
        </option>
      ))}
    </select>
  );
}

function CategoryTile({ name, slug }: { name: string; slug: string }) {
  const iconSrc = CATEGORY_ICONS[slug];

  if (iconSrc) {
    return (
      <Image
        src={iconSrc}
        alt=""
        width={44}
        height={44}
        className="shrink-0 object-contain"
        style={{
          width: "clamp(36px, 2.78vw, 44px)",
          height: "clamp(36px, 2.78vw, 44px)",
        }}
      />
    );
  }

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
