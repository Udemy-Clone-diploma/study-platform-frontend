"use client";

import { useTranslations } from "next-intl";
import { updateArticle } from "@/entities/blog";
import type { BlogCategory } from "@/entities/blog";
import { ConfirmActionModal } from "@/shared/ui/ConfirmActionModal";
import type { useArticleActions } from "../model/useArticleActions";
import { ArticleFormModal } from "./ArticleFormModal";
import { ArticleRejectModal } from "./ArticleRejectModal";

type Props = {
  categories: BlogCategory[];
  state: ReturnType<typeof useArticleActions>;
};

/** Renders whichever article modal (edit / reject / delete) is currently active in the shared action state. */
export function ArticleActionModals({ categories, state }: Props) {
  const t = useTranslations("ArticleActionModals");
  const tCommon = useTranslations("Common");
  const {
    editingArticle,
    setEditingArticle,
    rejectingArticle,
    setRejectingArticle,
    deletingArticle,
    setDeletingArticle,
    deleteLoading,
    confirmReject,
    confirmDelete,
    refresh,
  } = state;

  return (
    <>
      {editingArticle && (
        <ArticleFormModal
          categories={categories}
          initialValues={{
            title: editingArticle.title,
            subtitle: editingArticle.subtitle,
            body_html: editingArticle.body_html,
            category: editingArticle.category?.id ?? null,
          }}
          existingCoverImageUrl={editingArticle.cover_image}
          submitLabel={t("saveChangesLabel")}
          moderatorComment={editingArticle.status === "rejected" ? editingArticle.moderator_comment : null}
          onClose={() => setEditingArticle(null)}
          onSave={async (values) => {
            await updateArticle(editingArticle.slug, values);
            setEditingArticle(null);
            refresh();
          }}
        />
      )}

      {rejectingArticle && (
        <ArticleRejectModal onCancel={() => setRejectingArticle(null)} onConfirm={confirmReject} />
      )}

      {deletingArticle && (
        <ConfirmActionModal
          title={t("deleteArticleTitle")}
          description={t("deleteArticleDescription", { title: deletingArticle.title })}
          confirmLabel={tCommon("delete")}
          loading={deleteLoading}
          error={null}
          onConfirm={confirmDelete}
          onCancel={() => setDeletingArticle(null)}
        />
      )}
    </>
  );
}
