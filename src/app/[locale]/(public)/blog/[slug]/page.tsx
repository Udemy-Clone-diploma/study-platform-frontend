import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getArticleBySlug, getBlogCategories } from "@/entities/blog";
import { getMe } from "@/entities/user";
import { getAccessToken } from "@/shared/api/authCookies";
import { ArticleDetailView } from "@/widgets/blog/ArticleDetailView";

export const dynamic = "force-dynamic";

export default async function ArticleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [accessToken, locale] = await Promise.all([getAccessToken(), getLocale()]);

  const [article, categories, user] = await Promise.all([
    getArticleBySlug(slug, accessToken, locale).catch(() => null),
    getBlogCategories(locale),
    accessToken ? getMe(accessToken).catch(() => null) : Promise.resolve(null),
  ]);

  if (!article) notFound();

  return (
    <ArticleDetailView
      article={article}
      categories={categories}
      currentUserId={user?.id ?? null}
      currentUserRole={user?.role ?? null}
    />
  );
}
