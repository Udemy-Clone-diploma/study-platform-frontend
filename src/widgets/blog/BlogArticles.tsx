import type { ArticleListItem, BlogCategory } from "@/entities/blog";
import type { UserRole } from "@/entities/user";
import { BlogHeroSection } from "./BlogHeroSection";
import { BlogCategorySection } from "./BlogCategorySection";

type Props = {
  categories: BlogCategory[];
  articles: ArticleListItem[];
  role: UserRole | null;
};

/** Public /blog page body: hero + one drag-scroll row per category.
 * Creating a new article happens on its own page (/blog/create); managing an existing one
 * happens on the article's own page (see ArticleDetailView) or the dashboard row cards. */
export function BlogArticles({ categories, articles, role }: Props) {
  const byCategory = new Map<number, ArticleListItem[]>();
  for (const article of articles) {
    if (!article.category) continue;
    const list = byCategory.get(article.category.id) ?? [];
    list.push(article);
    byCategory.set(article.category.id, list);
  }

  return (
    <>
      <BlogHeroSection role={role} />

      {categories.map((category) => (
        <BlogCategorySection key={category.id} category={category} articles={byCategory.get(category.id) ?? []} />
      ))}
    </>
  );
}
