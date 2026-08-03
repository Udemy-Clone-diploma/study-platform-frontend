"use client";

import { useState } from "react";
import { Bookmark } from "lucide-react";
import { useTranslations } from "next-intl";
import { ModalShell } from "@/shared/ui/ModalShell";
import { ModalFooter } from "@/shared/ui/ModalFooter";
import { ModeratorNoteBanner } from "@/features/courses";
import type { ArticleFormValues, BlogCategory } from "@/entities/blog";
import { ArticleFormFields } from "./ArticleFormFields";

type Props = {
  categories: BlogCategory[];
  initialValues: ArticleFormValues;
  existingCoverImageUrl?: string | null;
  submitLabel: string;
  /** Moderator comment from a previous rejection, shown so the author can address it. */
  moderatorComment?: string | null;
  onClose: () => void;
  onSave: (values: ArticleFormValues) => Promise<void>;
};

/** Modal for editing an existing blog article's content (creation happens on its own page — see /blog/create). */
export function ArticleFormModal({
  categories,
  initialValues,
  existingCoverImageUrl,
  submitLabel,
  moderatorComment,
  onClose,
  onSave,
}: Props) {
  const t = useTranslations("ArticleFormModal");
  const [values, setValues] = useState<ArticleFormValues>(initialValues);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!values.title.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await onSave(values);
    } catch {
      setError(t("error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalShell
      onClose={onClose}
      title={t("title")}
      icon={<Bookmark size={24} style={{ color: "var(--color-text-primary)", flexShrink: 0 }} />}
      width="min(870px, calc(100vw - 32px))"
      padding="clamp(24px, 3.47vw, 50px)"
      maxHeight="calc(100dvh - 32px)"
    >
      <form onSubmit={handleSubmit}>
        {moderatorComment && (
          <div style={{ marginBottom: "clamp(16px, 1.39vw, 20px)" }}>
            <ModeratorNoteBanner comment={moderatorComment} />
          </div>
        )}

        <ArticleFormFields
          values={values}
          onChange={setValues}
          categories={categories}
          existingCoverImageUrl={existingCoverImageUrl}
        />

        <ModalFooter
          onCancel={onClose}
          submitLabel={submitLabel}
          loading={loading}
          disabled={!values.title.trim() || !values.subtitle.trim() || loading}
          error={error}
        />
      </form>
    </ModalShell>
  );
}
