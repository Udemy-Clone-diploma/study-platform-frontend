import { Suspense } from "react";
import { getArticles, getBlogCategories } from "@/entities/blog";
import { ArticleCard, BlogAllPagination, BlogCategoryFilterBar, BlogSearch } from "@/features/blog";
import { SectionContainer } from "@/shared/ui/SectionContainer";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

export default async function AllArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string; search?: string }>;
}) {
  const { category, page: pageParam, search } = await searchParams;
  const page = Number.isInteger(Number(pageParam)) && Number(pageParam) > 0 ? Number(pageParam) : 1;

  const [categories, articles] = await Promise.all([
    getBlogCategories(),
    getArticles({ category, search }),
  ]);

  const totalPages = Math.max(1, Math.ceil(articles.length / PAGE_SIZE));
  const pageArticles = articles.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="relative isolate overflow-x-clip bg-(--color-bg)">
      {/* Same background as /blog: Blog_Background.svg, painted at the top, not stretched. */}
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

      <SectionContainer style={{ paddingTop: "7.19vw", paddingBottom: "2.5vw" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.04vw", maxWidth: "36.46vw", marginBottom: "2.5vw" }}>
          <h1
            style={{
              fontFamily: "var(--font-base)",
              fontWeight: 400,
              fontSize: "3.125vw",
              lineHeight: "3.75vw",
              color: "var(--color-text-primary)",
              margin: 0,
              whiteSpace: "nowrap",
            }}
          >
            Where <span className="bg-(--color-catalog-highlight) px-1 py-0.5 text-(--color-blue)">creativity</span> meets knowledge.
          </h1>
          <p
            style={{
              fontFamily: "var(--font-base)",
              fontWeight: 400,
              fontSize: "1.25vw",
              lineHeight: "1.5625vw",
              color: "var(--color-text-secondary)",
              margin: 0,
            }}
          >
            Explore articles, insights, and stories designed to inspire learning, innovation, and personal growth.
          </p>
        </div>

        <div
          className="flex w-full flex-col items-stretch gap-6 lg:flex-row lg:items-center"
          style={{ marginBottom: "2vw" }}
        >
          <Suspense>
            <BlogSearch initialQuery={search} />
          </Suspense>

          <Suspense>
            <BlogCategoryFilterBar categories={categories} currentSlug={category} />
          </Suspense>
        </div>

        {pageArticles.length === 0 ? (
          <p className="mt-16 text-center text-lg text-(--color-text-secondary)">No articles found.</p>
        ) : (
          <>
            <div className="flex flex-wrap" style={{ gap: "1.04vw" }}>
              {pageArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>

            {totalPages > 1 && (
              <div style={{ marginTop: "2.5vw" }}>
                <BlogAllPagination currentPage={page} totalPages={totalPages} />
              </div>
            )}
          </>
        )}
      </SectionContainer>
    </div>
  );
}
