export type ArticleStatus = "draft" | "review" | "rejected" | "published" | "archived";

export type BlogCategory = {
  id: number;
  name: string;
  slug: string;
  description: string;
  order: number;
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
