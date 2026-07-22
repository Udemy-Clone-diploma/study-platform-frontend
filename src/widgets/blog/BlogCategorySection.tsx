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
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1.46vw",
            maxWidth: "36.46vw",
            paddingTop: "3.6vw",
            paddingBottom: "1.56vw",
          }}
        >
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
              style={{
                fontFamily: "var(--font-accent)",
                fontWeight: 500,
                fontSize: "1.04vw",
                lineHeight: "1.3vw",
                color: "var(--color-blue)",
                textTransform: "uppercase",
              }}
            >
              {category.name}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.04vw" }}>
            <h2
              style={{
                fontFamily: "var(--font-base)",
                fontWeight: 400,
                fontSize: "2.5vw",
                lineHeight: "3.125vw",
                color: "var(--color-text-primary)",
                margin: 0,
              }}
            >
              {category.name}
            </h2>
            {category.description && (
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
                {category.description}
              </p>
            )}
          </div>
        </div>
      </SectionContainer>

      <div
        ref={scrollRef}
        className="drag-scroll"
        style={{ paddingLeft: "13vw", paddingBottom: "2.5vw", overflowX: "scroll", cursor: "grab" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div style={{ display: "flex", gap: "1.04vw", width: "max-content", paddingRight: "13vw" }}>
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      </div>
    </section>
  );
}
