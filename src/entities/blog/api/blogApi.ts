import { api } from "@/shared/api/base";
import type {
  ArticleDetail,
  ArticleListItem,
  ArticleModerationSnapshot,
  ArticleStatus,
  BlogCategory,
} from "../model/types";

const CATEGORIES = "blog/categories/";
const ARTICLES = "blog/articles/";
const MODERATION_SNAPSHOTS = "blog/moderation-snapshots/";

export async function getBlogCategories(): Promise<BlogCategory[]> {
  const { data } = await api.get<BlogCategory[]>(CATEGORIES);
  return data;
}

export type BlogCategoryFormValues = {
  name: string;
  slug?: string;
  headline: string;
  description: string;
  order: number;
};

/** Administrator-only: create a new category block shown on /blog. */
export async function createBlogCategory(values: BlogCategoryFormValues): Promise<BlogCategory> {
  const { data } = await api.post<BlogCategory>(CATEGORIES, values);
  return data;
}

/** Administrator-only: edit a category block's name/slug/description/order. */
export async function updateBlogCategory(
  slug: string,
  values: Partial<BlogCategoryFormValues>,
): Promise<BlogCategory> {
  const { data } = await api.patch<BlogCategory>(`${CATEGORIES}${slug}/`, values);
  return data;
}

/** Administrator-only: remove a category block (fails with 409 if articles still use it). */
export type BlogCategoryDeleteResolution =
  | { type: "archive" }
  | { type: "move"; targetCategorySlug: string };

export async function deleteBlogCategory(
  slug: string,
  resolution?: BlogCategoryDeleteResolution,
): Promise<void> {
  const data = !resolution
    ? undefined
    : resolution.type === "archive"
      ? { resolution: "archive" }
      : { resolution: "move", target_category: resolution.targetCategorySlug };
  await api.delete(`${CATEGORIES}${slug}/`, { data });
}

export type GetArticlesParams = {
  category?: string;
  mine?: boolean;
  status?: ArticleStatus;
  assigned?: "unassigned" | "mine";
  search?: string;
};

export async function getArticles(params: GetArticlesParams = {}, accessToken?: string): Promise<ArticleListItem[]> {
  const { data } = await api.get<ArticleListItem[]>(ARTICLES, {
    params: {
      category: params.category,
      mine: params.mine ? "true" : undefined,
      status: params.status,
      assigned: params.assigned,
      search: params.search,
    },
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });
  return data;
}

export async function getArticleBySlug(slug: string, accessToken?: string): Promise<ArticleDetail> {
  const { data } = await api.get<ArticleDetail>(`${ARTICLES}${slug}/`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });
  return data;
}

export type ArticleFormValues = {
  title: string;
  subtitle: string;
  body_html: string;
  category: number | null;
  cover_image?: File | null;
};

function buildArticleFormData(values: ArticleFormValues): FormData {
  const formData = new FormData();
  formData.append("title", values.title);
  formData.append("subtitle", values.subtitle);
  formData.append("body_html", values.body_html);
  if (values.category != null) formData.append("category", String(values.category));
  if (values.cover_image) formData.append("cover_image", values.cover_image);
  return formData;
}

export async function createArticle(values: ArticleFormValues): Promise<ArticleDetail> {
  const { data } = await api.post<ArticleDetail>(ARTICLES, buildArticleFormData(values));
  return data;
}

export async function updateArticle(slug: string, values: ArticleFormValues): Promise<ArticleDetail> {
  const { data } = await api.patch<ArticleDetail>(`${ARTICLES}${slug}/`, buildArticleFormData(values));
  return data;
}

export async function deleteArticle(slug: string): Promise<void> {
  await api.delete(`${ARTICLES}${slug}/`);
}

export async function submitArticleForReview(slug: string): Promise<ArticleDetail> {
  const { data } = await api.post<ArticleDetail>(`${ARTICLES}${slug}/submit/`);
  return data;
}

export async function publishOwnArticle(slug: string): Promise<ArticleDetail> {
  const { data } = await api.post<ArticleDetail>(`${ARTICLES}${slug}/publish/`);
  return data;
}

export async function withdrawArticleToDraft(slug: string): Promise<ArticleDetail> {
  const { data } = await api.post<ArticleDetail>(`${ARTICLES}${slug}/withdraw/`);
  return data;
}

export async function archiveArticle(slug: string): Promise<ArticleDetail> {
  const { data } = await api.post<ArticleDetail>(`${ARTICLES}${slug}/archive/`);
  return data;
}

export async function restoreArticleFromArchive(slug: string): Promise<ArticleDetail> {
  const { data } = await api.post<ArticleDetail>(`${ARTICLES}${slug}/restore/`);
  return data;
}

export async function assignArticleModeratorSelf(slug: string): Promise<void> {
  await api.post(`${ARTICLES}${slug}/assign-moderator/`);
}

export async function approveArticle(slug: string): Promise<ArticleDetail> {
  const { data } = await api.post<ArticleDetail>(`${ARTICLES}${slug}/approve/`);
  return data;
}

export async function rejectArticle(slug: string, comment: string): Promise<ArticleDetail> {
  const { data } = await api.post<ArticleDetail>(`${ARTICLES}${slug}/reject/`, { comment });
  return data;
}

/** Moderator/admin only: the shared team's permanent reject/publish decision history. */
export async function getModerationSnapshots(
  decision: "rejected" | "published",
): Promise<ArticleModerationSnapshot[]> {
  const { data } = await api.get<ArticleModerationSnapshot[]>(MODERATION_SNAPSHOTS, {
    params: { decision },
  });
  return data;
}
