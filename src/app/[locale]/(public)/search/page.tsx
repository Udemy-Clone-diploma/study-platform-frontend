import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { getPublicCourses, getWishlistSlugs, type PublicCourseListItem } from "@/entities/course";
import { getArticles } from "@/entities/blog";
import { CourseCard } from "@/features/courses";
import { ArticleCard } from "@/features/blog";
import { SectionContainer } from "@/shared/ui/SectionContainer";
import { GradientButton } from "@/shared/ui/GradientButton";

export const dynamic = "force-dynamic";

const RESULT_LIMIT = 6;

const EMPTY_COURSES: PublicCourseListItem[] = [];

export default async function SiteSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search } = await searchParams;
  const query = search?.trim() ?? "";
  const searchQS = query ? `?search=${encodeURIComponent(query)}` : "";
  const t = await getTranslations("Search");
  const locale = await getLocale();

  const [coursesPage, articles, wishlistedSlugs] = await Promise.all([
    query
      ? getPublicCourses({ search: query, page_size: RESULT_LIMIT, lang: locale })
      : Promise.resolve({ count: 0, next: null, previous: null, results: EMPTY_COURSES }),
    query ? getArticles({ search: query, lang: locale }) : Promise.resolve([]),
    getWishlistSlugs().catch(() => []),
  ]);

  const wishlistSet = new Set(wishlistedSlugs);
  const courses = coursesPage.results;
  const courseCount = coursesPage.count;
  const articleResults = articles.slice(0, RESULT_LIMIT);
  const articleCount = articles.length;
  const totalCount = courseCount + articleCount;

  return (
    <div className="relative isolate overflow-x-clip bg-(--color-bg)">
      {/* Same background as /blog and /blog/all: Blog_Background.svg, painted at the top, not stretched. */}
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

      <SectionContainer style={{ paddingTop: "7.19vw", paddingBottom: "5vw" }}>
        <div style={{ marginBottom: "2.5vw" }}>
          <h1
            style={{
              fontFamily: "var(--font-base)",
              fontWeight: 400,
              fontSize: "3.125vw",
              lineHeight: "3.75vw",
              color: "var(--color-text-primary)",
              margin: 0,
              overflowWrap: "break-word",
            }}
          >
            {query ? (
              t.rich("resultsFor", {
                query,
                highlight: (chunks) => (
                  <span className="bg-(--color-catalog-highlight) px-1 py-0.5 text-(--color-blue)">{chunks}</span>
                ),
              })
            ) : (
              t("searchHeading")
            )}
          </h1>
          {query && (
            <p
              style={{
                fontFamily: "var(--font-base)",
                fontWeight: 400,
                fontSize: "1.25vw",
                lineHeight: "1.5625vw",
                color: "var(--color-text-secondary)",
                margin: "1.04vw 0 0",
              }}
            >
              {t("resultsCount", { count: totalCount })}
            </p>
          )}
        </div>

        {!query ? (
          <p className="text-lg text-(--color-text-secondary)">{t("enterSearchTerm")}</p>
        ) : (
          <>
            <ResultSection
              title={t("courses")}
              foundLabel={t("foundCount", { count: courseCount })}
              viewAllHref={`/catalog${searchQS}`}
              viewAllLabel={t("viewAllCourses")}
            >
              {courses.length === 0 ? (
                <p className="text-(--color-text-secondary)">{t("noCoursesFound")}</p>
              ) : (
                <div className="flex flex-wrap justify-center gap-4">
                  {courses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      isWishlisted={wishlistSet.has(course.slug)}
                    />
                  ))}
                </div>
              )}
            </ResultSection>

            <ResultSection
              title={t("posts")}
              foundLabel={t("foundCount", { count: articleCount })}
              viewAllHref={`/blog/all${searchQS}`}
              viewAllLabel={t("viewAllPosts")}
            >
              {articleResults.length === 0 ? (
                <p className="text-(--color-text-secondary)">{t("noPostsFound")}</p>
              ) : (
                <div className="flex flex-wrap" style={{ gap: "1.04vw" }}>
                  {articleResults.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              )}
            </ResultSection>
          </>
        )}
      </SectionContainer>
    </div>
  );
}

function ResultSection({
  title,
  foundLabel,
  viewAllHref,
  viewAllLabel,
  children,
}: {
  title: string;
  foundLabel: string;
  viewAllHref: string;
  viewAllLabel: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: "3.5vw" }}>
      <div
        className="flex flex-wrap items-center justify-between"
        style={{ marginBottom: "1.5vw", gap: 12 }}
      >
        <div className="flex items-baseline" style={{ gap: 10 }}>
          <h2
            style={{
              fontFamily: "var(--font-base)",
              fontWeight: 600,
              fontSize: "1.67vw",
              color: "var(--color-text-primary)",
              margin: 0,
            }}
          >
            {title}
          </h2>
          <span style={{ fontFamily: "var(--font-base)", fontSize: "0.9vw", color: "var(--color-text-secondary)" }}>
            {foundLabel}
          </span>
        </div>
        <GradientButton href={viewAllHref}>
          {viewAllLabel}
          <Image
            src="/icons/arrow-goto.png"
            alt=""
            width={14}
            height={14}
            style={{ width: "clamp(8px, 1.04vw, 14px)", height: "auto", flexShrink: 0 }}
          />
        </GradientButton>
      </div>
      {children}
    </section>
  );
}
