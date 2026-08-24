"use client";

import { SectionContainer } from "@/shared/ui/SectionContainer";
import { useDragScroll } from "@/shared/lib/useDragScroll";
import { StudentStoryCard } from "@/features/users";
import type { ArticleListItem, BlogCategory } from "@/entities/blog";

type Props = { articles: ArticleListItem[]; category: BlogCategory | null };

export function StudentStoriesSection({ articles, category }: Props) {
  const { scrollRef, onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onDragStart } =
    useDragScroll<HTMLDivElement>();

  if (articles.length === 0 || !category) return null;

  return (
    <section>
      {/* Header */}
      <SectionContainer>
        <div
          className="w-full lg:w-auto min-[1024px]:max-[1439px]:max-w-[max(420px,36.46vw)] min-[1440px]:max-w-[max(600px,36.46vw)]"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "clamp(12px, 1.46vw, 21px)",
            paddingTop: "7.19vw",
            paddingBottom: "3.125vw",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignSelf: "flex-start",
              alignItems: "center",
              justifyContent: "center",
              padding: "3px clamp(6px, 0.52vw, 8px)",
              background: "var(--color-badge-lavender)",
              borderRadius: 4,
            }}
          >
            <span
              className="text-[11px] leading-[14px] md:text-[13px] md:leading-[16px] lg:text-[1.04vw] lg:leading-[1.3vw]"
              style={{
                fontFamily: "var(--font-accent)",
                fontWeight: 500,
                color: "var(--color-blue)",
              }}
            >
              {category.name.toUpperCase()}
            </span>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "clamp(8px, 1.04vw, 15px)" }}
          >
            <h2
              className="text-[26px] leading-[32px] md:text-[34px] md:leading-[40px] lg:text-[2.5vw] lg:leading-[3.125vw]"
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
                className="text-[15px] leading-[19px] md:text-[17px] md:leading-[21px] lg:text-[1.25vw] lg:leading-[1.5625vw]"
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

      {/* Drag-scroll cards — starts at left padding, overflows right */}
      <div
        ref={scrollRef}
        className="drag-scroll"
        style={{
          paddingLeft: "clamp(16px, 13vw, 187px)",
          paddingBottom: "7.19vw",
          overflowX: "scroll",
          cursor: "grab",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onDragStart={onDragStart}
      >
        <div
          style={{
            display: "flex",
            gap: "1.04vw",
            width: "max-content",
            paddingRight: "clamp(16px, 13vw, 187px)",
          }}
        >
          {articles.map((article) => (
            <StudentStoryCard key={article.id} article={article} />
          ))}
        </div>
      </div>
    </section>
  );
}
