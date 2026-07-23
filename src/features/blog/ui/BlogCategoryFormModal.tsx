"use client";

import { useState } from "react";
import { ModalShell } from "@/shared/ui/ModalShell";
import { ModalFooter } from "@/shared/ui/ModalFooter";
import type { BlogCategory, BlogCategoryFormValues } from "@/entities/blog";
import type { ApiError } from "@/shared/api/base";

const labelSt: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-base)",
  fontWeight: 700,
  fontSize: 14,
  color: "var(--color-text-primary)",
  marginBottom: 8,
};

const inputSt: React.CSSProperties = {
  display: "block",
  width: "100%",
  backgroundColor: "var(--color-input-bg)",
  border: "none",
  borderRadius: 12,
  padding: "12px 16px",
  fontFamily: "var(--font-base)",
  fontSize: 14,
  color: "var(--color-text-primary)",
  outline: "none",
  boxSizing: "border-box",
};

type Props = {
  category?: BlogCategory;
  onClose: () => void;
  onSave: (values: BlogCategoryFormValues) => Promise<void>;
};

/** Administrator-only modal for adding or editing a blog category block. */
export function BlogCategoryFormModal({ category, onClose, onSave }: Props) {
  const [name, setName] = useState(category?.name ?? "");
  const [headline, setHeadline] = useState(category?.headline ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [order, setOrder] = useState(category?.order ?? 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim() || !headline.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await onSave({ name: name.trim(), headline: headline.trim(), description: description.trim(), order });
    } catch (err) {
      setError((err as ApiError).message ?? "Failed to save the category.");
      setLoading(false);
    }
  }

  return (
    <ModalShell
      onClose={onClose}
      title={category ? "Edit Category" : "Add Category"}
      width="clamp(320px, 32vw, 480px)"
      padding="clamp(20px, 2.08vw, 30px) clamp(20px, 2.08vw, 32px)"
      shadow="var(--shadow-modal)"
    >
      <form onSubmit={handleSubmit}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label htmlFor="category-name" style={labelSt}>Name*</label>
            <input id="category-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required style={inputSt} />
          </div>
          <div>
            <label htmlFor="category-headline" style={labelSt}>Headline*</label>
            <input id="category-headline" type="text" value={headline} onChange={(e) => setHeadline(e.target.value)} required style={inputSt} />
          </div>
          <div>
            <label htmlFor="category-description" style={labelSt}>Description</label>
            <textarea
              id="category-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{ ...inputSt, resize: "vertical" as const }}
            />
          </div>
          <div>
            <label htmlFor="category-order" style={labelSt}>Display order</label>
            <input
              id="category-order"
              type="number"
              min="0"
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
              style={inputSt}
            />
          </div>
        </div>

        <ModalFooter
          onCancel={onClose}
          submitLabel={category ? "Save" : "Create"}
          loading={loading}
          disabled={!name.trim() || !headline.trim() || loading}
          error={error}
        />
      </form>
    </ModalShell>
  );
}
