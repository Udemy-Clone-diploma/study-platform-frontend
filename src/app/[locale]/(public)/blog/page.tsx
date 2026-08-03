import { getLocale } from "next-intl/server";
import { getBlogCategories, getArticles } from "@/entities/blog";
import { getMe } from "@/entities/user";
import { getAccessToken } from "@/shared/api/authCookies";
import { BlogArticles } from "@/widgets/blog/BlogArticles";

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const [accessToken, locale] = await Promise.all([getAccessToken(), getLocale()]);
  const [categories, articles, user] = await Promise.all([
    getBlogCategories(locale),
    getArticles({ lang: locale }),
    accessToken ? getMe(accessToken).catch(() => null) : Promise.resolve(null),
  ]);

  return (
    <div className="relative isolate overflow-x-clip bg-(--color-bg)">
      {/* On phones the background covers the full long page and is cropped horizontally;
          desktop keeps the original artwork sized to the page width. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-cover lg:bg-[length:100%_auto]"
        style={{
          backgroundImage: "url('/backgrounds/Blog_Background.svg')",
          backgroundPosition: "top center",
          backgroundRepeat: "no-repeat",
        }}
      />

      <BlogArticles categories={categories} articles={articles} role={user?.role ?? null} />
    </div>
  );
}
