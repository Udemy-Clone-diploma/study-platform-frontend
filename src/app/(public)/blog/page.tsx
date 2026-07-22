import { getBlogCategories, getArticles } from "@/entities/blog";
import { getMe } from "@/entities/user";
import { getAccessToken } from "@/shared/api/authCookies";
import { BlogArticles } from "@/widgets/blog/BlogArticles";

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const accessToken = await getAccessToken();
  const [categories, articles, user] = await Promise.all([
    getBlogCategories(),
    getArticles(),
    accessToken ? getMe(accessToken).catch(() => null) : Promise.resolve(null),
  ]);

  return (
    <div className="relative isolate overflow-x-clip bg-(--color-bg)">
      {/* Blog_Background.svg is a tall pre-composited image with its own white-fade gradient
          baked in -- sized to the page width and painted at the top; the rest of the (much
          taller) page below it just shows the plain white page background. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage: "url('/backgrounds/Blog_Background.svg')",
          backgroundSize: "100% auto",
          backgroundPosition: "top center",
          backgroundRepeat: "no-repeat",
        }}
      />

      <BlogArticles categories={categories} articles={articles} role={user?.role ?? null} />
    </div>
  );
}
