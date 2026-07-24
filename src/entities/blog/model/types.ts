export type ArticleStatus = "draft" | "review" | "rejected" | "published" | "archived";

export type BlogCategory = {
  id: number;
  name: string;
  slug: string;
  headline: string;
  description: string;
  order: number;
  /** Only present when the list endpoint annotates it (see BlogCategoryService.annotate_articles_count) --
   * absent on categories embedded in article payloads. */
  articles_count?: number;
};

export type ArticleAuthor = {
  id: number;
  name: string;
  avatar: string | null;
  role: string;
};

export type ArticleListItem = {
  id: number;
  title: string;
  slug: string;
  subtitle: string;
  cover_image: string | null;
  category: BlogCategory | null;
  author: ArticleAuthor;
  status: ArticleStatus;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  is_assigned_to_me: boolean;
};

export type ArticleDetail = ArticleListItem & {
  body_html: string;
  moderator_comment: string;
};

/** Permanent record of a reject/approve decision, independent of the live article's
 * current status (which keeps changing after the decision -- edited, resubmitted,
 * archived, withdrawn). See ArticleModerationSnapshot on the backend. */
export type ArticleModerationSnapshot = {
  id: number;
  article_id: number;
  article_slug: string;
  article_status: ArticleStatus;
  decision: "rejected" | "published";
  comment: string;
  title: string;
  subtitle: string;
  cover_image: string | null;
  author_name: string;
  moderator_name: string | null;
  created_at: string;
};
