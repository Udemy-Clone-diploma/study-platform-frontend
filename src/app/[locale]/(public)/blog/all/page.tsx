import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";
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

  const locale = await getLocale();
  const [categories, articles, t] = await Promise.all([
    getBlogCategories(locale),
    getArticles({ category, search }),
    getTranslations("BlogHero"),
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
        <div
          className="w-full lg:w-auto min-[1024px]:max-[1439px]:max-w-[max(420px,36.46vw)] min-[1440px]:max-w-[max(600px,36.46vw)]"
          style={{ display: "flex", flexDirection: "column", gap: "clamp(12px, 1.04vw, 15px)", marginBottom: "2.5vw" }}
        >
          <h1
            className="text-[28px] leading-[34px] md:text-[38px] md:leading-[46px] lg:text-[clamp(28px,3.125vw,45px)] lg:leading-[clamp(34px,3.75vw,54px)] lg:whitespace-nowrap"
            style={{
              fontFamily: "var(--font-base)",
              fontWeight: 400,
              color: "var(--color-text-primary)",
              margin: 0,
            }}
          >
            {t.rich("title", {
              highlight: (chunks) => (
                <span className="bg-(--color-catalog-highlight) px-1 py-0.5 text-(--color-blue)">{chunks}</span>
              ),
            })}
          </h1>
          <p
            className="text-[15px] leading-[19px] md:text-[18px] md:leading-[23px] lg:text-[clamp(15px,1.25vw,18px)] lg:leading-[clamp(19px,1.5625vw,22.5px)]"
            style={{
              fontFamily: "var(--font-base)",
              fontWeight: 400,
              color: "var(--color-text-secondary)",
              margin: 0,
            }}
          >
            {t("description")}
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
          <p className="mt-16 text-center text-lg text-(--color-text-secondary)">{t("noArticlesFound")}</p>
        ) : (
          <>
            <div className="flex flex-wrap justify-center lg:justify-start" style={{ gap: "1.04vw" }}>
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
