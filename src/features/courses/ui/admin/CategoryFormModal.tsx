"use client";

import { useState } from "react";
import { ModalShell } from "@/shared/ui/ModalShell";
import { ModalFooter } from "@/shared/ui/ModalFooter";
import { Input } from "@/shared/ui/Input";
import { createCategory, updateCategory } from "@/entities/course";
import type { Category } from "@/entities/course";
import type { ApiError } from "@/shared/api/base";
import { mapApiFieldErrors } from "@/shared/lib/apiErrors";

const SLUG_PATTERN = /^[-a-zA-Z0-9_]+$/;

type Props = {
  category?: Category;
  onClose: () => void;
  onSaved: (category: Category) => void;
};

export function CategoryFormModal({ category, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    name: category?.name ?? "",
    slug: category?.slug ?? "",
    description: category?.description ?? "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function setField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): Record<string, string> {
    const errors: Record<string, string> = {};
    const name = form.name.trim();
    const slug = form.slug.trim();
    if (!name) errors.name = "Enter a name";
    else if (name.length > 100) errors.name = "Name must be at most 100 characters";
    if (slug && slug.length > 50) errors.slug = "Slug must be at most 50 characters";
    else if (slug && !SLUG_PATTERN.test(slug))
      errors.slug = "Only letters, numbers, hyphens, and underscores";
    return errors;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    setFormError(null);
    const slug = form.slug.trim();
    const body = {
      name: form.name.trim(),
      ...(category || slug ? { slug } : {}),
      description: form.description.trim(),
    };
    try {
      const saved = category
        ? await updateCategory(category.id, body)
        : await createCategory(body);
      onSaved(saved);
    } catch (err) {
      const apiError = err as ApiError;
      setFieldErrors(mapApiFieldErrors(apiError.fields));
      setFormError(apiError.message ?? "Failed to save the category.");
      setLoading(false);
    }
  }

  return (
    <ModalShell
      onClose={onClose}
      closeOnOverlayClick={false}
      title={category ? "Edit category" : "Add category"}
      width="clamp(360px, 38vw, 560px)"
      padding="clamp(20px, 2.08vw, 32px) clamp(24px, 2.5vw, 40px)"
      shadow="var(--shadow-modal)"
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-4">
          <Input
            id="category-name"
            label="Name"
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            error={fieldErrors.name}
          />
          <Input
            id="category-slug"
            label={category ? "Slug" : "Slug (optional)"}
            placeholder={
              category
                ? "Leave empty to regenerate from the name"
                : "Generated from the name when empty"
            }
            value={form.slug}
            onChange={(e) => setField("slug", e.target.value)}
            error={fieldErrors.slug}
          />
          <div className="flex flex-col gap-1">
            <label
              htmlFor="category-description"
              className="text-sm font-medium font-mono text-gray-400"
            >
              Description (optional)
            </label>
            <textarea
              id="category-description"
              rows={3}
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              className={`w-full resize-y rounded-lg border px-3 py-2 outline-none transition ${
                fieldErrors.description
                  ? "border-red-500 focus:border-red-500"
                  : "border-gray-300 focus:border-black"
              }`}
            />
            {fieldErrors.description && (
              <span className="text-sm text-red-500">{fieldErrors.description}</span>
            )}
          </div>
        </div>
        <ModalFooter
          onCancel={onClose}
          submitLabel={category ? "Save" : "Create"}
          loading={loading}
          disabled={loading}
          error={formError}
        />
      </form>
    </ModalShell>
  );
}
