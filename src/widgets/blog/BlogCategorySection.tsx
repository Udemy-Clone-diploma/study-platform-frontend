"use client";

import { SectionContainer } from "@/shared/ui/SectionContainer";
import { useDragScroll } from "@/shared/lib/useDragScroll";
import { ArticleCard } from "@/features/blog";
import type { ArticleListItem, BlogCategory } from "@/entities/blog";

type Props = {
  category: BlogCategory;
  articles: ArticleListItem[];
};

/** One category row on /blog — badge + heading + a drag-scrollable row of article cards. */
export function BlogCategorySection({ category, articles }: Props) {
  const { scrollRef, onPointerDown, onPointerMove, onPointerUp } = useDragScroll<HTMLDivElement>();

  if (articles.length === 0) return null;

  return (
    <section>
      <SectionContainer>
        <div className="flex w-full flex-col gap-3 pt-12 pb-4 lg:w-auto lg:gap-[clamp(12px,1.46vw,21px)] lg:pt-[3.6vw] lg:pb-[1.56vw] min-[1024px]:max-[1439px]:max-w-[max(420px,36.46vw)] min-[1440px]:max-w-[max(600px,36.46vw)]">
          <div
            style={{
              display: "inline-flex",
              alignSelf: "flex-start",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 0.52vw",
              background: "var(--color-badge-lavender)",
              borderRadius: 4,
            }}
          >
            <span
              className="text-[10px] leading-[13px] md:text-[13px] md:leading-[16px] lg:text-[clamp(11px,1.04vw,15px)] lg:leading-[clamp(14px,1.3vw,18.7px)]"
              style={{
                fontFamily: "var(--font-accent)",
                fontWeight: 500,
                color: "var(--color-blue)",
                textTransform: "uppercase",
              }}
            >
              {category.name}
            </span>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "clamp(8px, 1.04vw, 15px)" }}
          >
            <h2
              className="text-[22px] leading-[28px] md:text-[30px] md:leading-[36px] lg:text-[clamp(22px,2.5vw,36px)] lg:leading-[clamp(28px,3.125vw,45px)]"
              style={{
                fontFamily: "var(--font-base)",
                fontWeight: 400,
                color: "var(--color-text-primary)",
                margin: 0,
              }}
            >
              {category.headline}
            </h2>
            {category.description && (
              <p
                className="text-[13px] leading-[16px] md:text-[17px] md:leading-[21px] lg:text-[clamp(15px,1.25vw,18px)] lg:leading-[clamp(19px,1.5625vw,22.5px)]"
                style={{
                  fontFamily: "var(--font-base)",
                  fontWeight: 400,
                  color: "var(--color-text-secondary)",
                  margin: 0,
                }}
              >
                {category.description}
              </p>
            )}
          </div>
        </div>
      </SectionContainer>

      <div className="pl-4 lg:pl-[clamp(16px,13vw,187px)]">
        <div
          ref={scrollRef}
          className="drag-scroll snap-x snap-proximity overflow-x-scroll pb-8 lg:pb-[2.5vw]"
          style={{ cursor: "grab" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <div className="flex w-max gap-2.5 pr-4 lg:gap-[1.04vw] lg:pr-[clamp(16px,13vw,187px)]">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
