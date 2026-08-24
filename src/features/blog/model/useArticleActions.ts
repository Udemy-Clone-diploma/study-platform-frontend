"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { apiErrorMessage } from "@/shared/api/lib/apiErrorMessage";
import {
  approveArticle,
  archiveArticle,
  assignArticleModeratorSelf,
  deleteArticle,
  getArticleBySlug,
  publishOwnArticle,
  rejectArticle,
  restoreArticleFromArchive,
  submitArticleForReview,
  withdrawArticleToDraft,
} from "@/entities/blog";
import type { ArticleDetail, ArticleListItem } from "@/entities/blog";
import type { ArticleMenuAction } from "../ui/ArticleCardMenu";

/** Shared article management state (used on /blog, teacher "My Articles", and moderator review pages).
 *
 * Simple status-transition actions (submit/publish/withdraw/archive/restore/assign/approve) fire and
 * refresh, then edit/reject/delete open their respective modal for more input first.
 *
 * @param onRefresh how to reload the article list after a change. Defaults to `router.refresh()`,
 * which is correct for Server Component pages (props re-fetch). Pages that hold articles in local
 * client state (e.g. dashboard tabs fetched client-side) must pass their own re-fetch function.
 */
export function useArticleActions(onRefresh?: () => void) {
  const t = useTranslations("ArticleActionModals");
  const router = useRouter();
  const [editingArticle, setEditingArticle] = useState<ArticleDetail | null>(null);
  const [rejectingArticle, setRejectingArticle] = useState<ArticleListItem | null>(null);
  const [deletingArticle, setDeletingArticle] = useState<ArticleListItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  function refresh() {
    if (onRefresh) onRefresh();
    else router.refresh();
  }

  async function handleAction(action: ArticleMenuAction, article: ArticleListItem) {
    setActionError("");
    switch (action) {
      case "edit": {
        const detail = await getArticleBySlug(article.slug);
        setEditingArticle(detail);
        return;
      }
      case "reject":
        setRejectingArticle(article);
        return;
      case "delete":
        setDeletingArticle(article);
        return;
      case "submit":
        try {
          await submitArticleForReview(article.slug);
        } catch (e) {
          setActionError(apiErrorMessage(e, t("actionFailed")));
          return;
        }
        break;
      case "publish":
        try {
          await publishOwnArticle(article.slug);
        } catch (e) {
          setActionError(apiErrorMessage(e, t("actionFailed")));
          return;
        }
        break;
      case "withdraw":
        try {
          await withdrawArticleToDraft(article.slug);
        } catch (e) {
          setActionError(apiErrorMessage(e, t("actionFailed")));
          return;
        }
        break;
      case "archive":
        try {
          await archiveArticle(article.slug);
        } catch (e) {
          setActionError(apiErrorMessage(e, t("actionFailed")));
          return;
        }
        break;
      case "restore":
        try {
          await restoreArticleFromArchive(article.slug);
        } catch (e) {
          setActionError(apiErrorMessage(e, t("actionFailed")));
          return;
        }
        break;
      case "assign":
        try {
          await assignArticleModeratorSelf(article.slug);
        } catch (e) {
          setActionError(apiErrorMessage(e, t("actionFailed")));
          return;
        }
        break;
      case "approve":
        try {
          await approveArticle(article.slug);
        } catch (e) {
          setActionError(apiErrorMessage(e, t("actionFailed")));
          return;
        }
        break;
    }
    refresh();
  }

  async function confirmReject(comment: string) {
    if (!rejectingArticle) return;
    await rejectArticle(rejectingArticle.slug, comment);
    setRejectingArticle(null);
    refresh();
  }

  async function confirmDelete() {
    if (!deletingArticle) return;
    setDeleteLoading(true);
    try {
      await deleteArticle(deletingArticle.slug);
      setDeletingArticle(null);
      refresh();
    } finally {
      setDeleteLoading(false);
    }
  }

  return {
    editingArticle,
    setEditingArticle,
    rejectingArticle,
    setRejectingArticle,
    deletingArticle,
    setDeletingArticle,
    deleteLoading,
    actionError,
    setActionError,
    handleAction,
    confirmReject,
    confirmDelete,
    refresh,
  };
}
